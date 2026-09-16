import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bill, PaymentStatus } from '../entities/bill.entity';
import { Patient } from '../entities/patient.entity';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { QueryBillDto } from './dto/query-bill.dto';

@Injectable()
export class BillsService {
  constructor(
    @InjectRepository(Bill)
    private readonly billRepo: Repository<Bill>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
  ) {}

  async create(dto: CreateBillDto): Promise<Bill> {
    const patient = /^PMS-[0-9]+$/.test(dto.patientId)
      ? await this.patientRepo.findOne({ where: { patientId: dto.patientId } })
      : await this.patientRepo.findOne({ where: { id: dto.patientId } });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const totalAmount = Number(dto.amount) + Number(dto.tax);

    const bill = this.billRepo.create({
      patientId: patient.id,
      description: dto.description,
      amount: dto.amount,
      tax: dto.tax,
      totalAmount,
      paymentStatus: PaymentStatus.PENDING, // always starts Pending
    });
    return this.billRepo.save(bill);
  }

  async findAll(query: QueryBillDto) {
    const qb = this.billRepo
      .createQueryBuilder('bill')
      .leftJoinAndSelect('bill.patient', 'patient')
      .orderBy('bill.createdDate', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    if (query.search?.trim()) {
      qb.andWhere(
        '(patient.patientName ILIKE :search OR patient.patientId ILIKE :search)',
        {
        search: `%${query.search.trim()}%`,
        },
      );
    }
    if (query.status) {
      qb.andWhere('bill.paymentStatus = :status', { status: query.status });
    }

    const [items, total] = await qb.getManyAndCount();
    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  async findOne(id: string): Promise<Bill> {
    const bill = await this.billRepo.findOne({
      where: { id },
      relations: ['patient', 'payments'],
    });
    if (!bill) {
      throw new NotFoundException('Bill not found');
    }
    return bill;
  }

  async update(id: string, dto: UpdateBillDto): Promise<Bill> {
    const bill = await this.findOne(id);

    if (dto.amount !== undefined || dto.tax !== undefined) {
      const amount = dto.amount ?? bill.amount;
      const tax = dto.tax ?? bill.tax;
      bill.totalAmount = Number(amount) + Number(tax);
    }

    Object.assign(bill, {
      description: dto.description ?? bill.description,
      amount: dto.amount ?? bill.amount,
      tax: dto.tax ?? bill.tax,
    });

    return this.billRepo.save(bill);
  }

  async remove(id: string): Promise<void> {
    const bill = await this.findOne(id);
    await this.billRepo.remove(bill);
  }

  async markPaid(id: string): Promise<Bill> {
    const bill = await this.findOne(id);
    bill.paymentStatus = PaymentStatus.PAID;
    return this.billRepo.save(bill);
  }

  async markFailed(id: string): Promise<Bill> {
    const bill = await this.findOne(id);
    bill.paymentStatus = PaymentStatus.FAILED;
    return this.billRepo.save(bill);
  }

  // Used by the dashboard
  async summary() {
    const bills = await this.billRepo.find();
    const totalBills = bills.length;
    const totalPaid = bills
      .filter((b) => b.paymentStatus === PaymentStatus.PAID)
      .reduce((sum, b) => sum + Number(b.totalAmount), 0);
    const totalPending = bills
      .filter((b) => b.paymentStatus === PaymentStatus.PENDING)
      .reduce((sum, b) => sum + Number(b.totalAmount), 0);
    return { totalBills, totalPaid, totalPending };
  }
}
