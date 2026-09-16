import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Patient } from '../entities/patient.entity';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { QueryPatientDto } from './dto/query-patient.dto';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.query("SELECT pg_advisory_xact_lock(hashtext('pms.patient_id'))");
      const [{ max }] = await queryRunner.query(
        `SELECT COALESCE(MAX(CAST(SUBSTRING(patient_id FROM 5) AS BIGINT)), 0) AS max
         FROM patients
         WHERE patient_id ~ '^PMS-[0-9]+$'`,
      );
      let nextNumber = Number(max) + 1;
      const patients = await queryRunner.query(
        `SELECT id FROM patients
         WHERE patient_id IS NULL OR patient_id = ''
         ORDER BY created_date ASC, id ASC
         FOR UPDATE`,
      );

      for (const patient of patients) {
        await queryRunner.query(
          'UPDATE patients SET patient_id = $1 WHERE id = $2',
          [this.formatPatientId(nextNumber), patient.id],
        );
        nextNumber += 1;
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private formatPatientId(number: number): string {
    return `PMS-${String(number).padStart(6, '0')}`;
  }

  async create(dto: CreatePatientDto): Promise<Patient> {
    return this.dataSource.transaction(async (manager) => {
      await manager.query("SELECT pg_advisory_xact_lock(hashtext('pms.patient_id'))");
      const [{ max }] = await manager.query(
        `SELECT COALESCE(MAX(CAST(SUBSTRING(patient_id FROM 5) AS BIGINT)), 0) AS max
         FROM patients
         WHERE patient_id ~ '^PMS-[0-9]+$'`,
      );

      if (dto.email) {
        const existing = await manager.findOne(Patient, {
          where: { email: dto.email },
        });
        if (existing) {
          throw new ConflictException('A patient with this email already exists');
        }
      }

      const patient = manager.create(Patient, {
        ...dto,
        patientId: this.formatPatientId(Number(max) + 1),
      });
      return manager.save(patient);
    });
  }

  async findAll(query: QueryPatientDto) {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query.limit) > 0 ? Number(query.limit) : 10;

    const qb = this.patientRepo.createQueryBuilder('patient');

    // Search by name (case-insensitive partial match) — runs against DB, not in-memory
    const search = query.search;
    if (search) {
      qb.andWhere(
        '(patient.patientName ILIKE :search OR patient.patientId ILIKE :search OR patient.phoneNumber ILIKE :search)',
        {
          search: `%${search}%`,
        },
      );
    }

    if (query.name) {
      qb.andWhere('patient.patientName ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    // Filter by gender
    if (query.gender) {
      qb.andWhere('patient.gender = :gender', { gender: query.gender });
    }

    qb.orderBy('patient.createdDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(identifier: string): Promise<Patient> {
    const isPublicId = /^PMS-[0-9]+$/.test(identifier);
    const patient = await this.patientRepo.findOne({
      where: isPublicId ? { patientId: identifier } : { id: identifier },
    });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }
    return patient;
  }

  async update(id: string, dto: UpdatePatientDto): Promise<Patient> {
    const patient = await this.findOne(id);

    if (dto.email && dto.email !== patient.email) {
      const existing = await this.patientRepo.findOne({
        where: { email: dto.email },
      });
      if (existing) {
        throw new ConflictException('A patient with this email already exists');
      }
    }

    Object.assign(patient, dto);
    return this.patientRepo.save(patient);
  }

  async remove(id: string): Promise<void> {
    const patient = await this.findOne(id);
    await this.patientRepo.remove(patient);
  }

  async countAll(): Promise<number> {
    return this.patientRepo.count();
  }

  async recentlyAdded(limit = 5): Promise<Patient[]> {
    return this.patientRepo.find({
      order: { createdDate: 'DESC' },
      take: limit,
    });
  }
}
