import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { QueryPaymentDto } from './dto/query-payment.dto';

@UseGuards(JwtAuthGuard)
@Controller('api/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-order')
  createOrder(@Body() dto: CreateOrderDto) {
    return this.paymentsService.createOrder(dto);
  }

  @Post('verify')
  verify(@Body() dto: VerifyPaymentDto) {
    return this.paymentsService.verifyPayment(dto);
  }

  @Get('bill/:billId')
  getPaymentDetails(@Param('billId') billId: string) {
    return this.paymentsService.getPaymentDetails(billId);
  }

  @Get()
  getPaymentHistory(@Query() query: QueryPaymentDto) {
    return this.paymentsService.getPaymentHistory(query);
  }
}
