import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bill } from '../entities/bill.entity';
import { Patient } from '../entities/patient.entity';
import { BillsService } from './bills.service';
import { BillsController } from './bills.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Bill, Patient])],
  controllers: [BillsController],
  providers: [BillsService],
  exports: [BillsService],
})
export class BillsModule {}
