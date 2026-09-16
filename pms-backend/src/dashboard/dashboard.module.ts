import { Module } from '@nestjs/common';
import { PatientsModule } from '../patients/patients.module';
import { BillsModule } from '../bills/bills.module';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [PatientsModule, BillsModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
