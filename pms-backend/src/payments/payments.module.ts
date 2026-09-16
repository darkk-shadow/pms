import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../entities/payment.entity';
import { Bill } from '../entities/bill.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Bill])],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
