import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';
import { Payment, PaymentTxnStatus } from '../entities/payment.entity';
import { Bill, PaymentStatus } from '../entities/bill.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { QueryPaymentDto } from './dto/query-payment.dto';

@Injectable()
export class PaymentsService {
  private razorpay: Razorpay;

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Bill)
    private readonly billRepo: Repository<Bill>,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {
    // Secret key NEVER goes to the frontend — only used here, server-side
    this.razorpay = new Razorpay({
      key_id: this.configService.get<string>('RAZORPAY_KEY_ID') ?? '',
      key_secret: this.configService.get<string>('RAZORPAY_KEY_SECRET') ?? '',
    });
  }

  async createOrder(dto: CreateOrderDto) {
    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID')?.trim();
    const keySecret = this.configService
      .get<string>('RAZORPAY_KEY_SECRET')
      ?.trim();
    if (
      !keyId ||
      !keySecret ||
      !/^rzp_test_[A-Za-z0-9]+$/.test(keyId) ||
      keySecret.length < 10 ||
      keyId.toLowerCase().includes('xxxx') ||
      keySecret.toLowerCase().includes('xxxx')
    ) {
      throw new ServiceUnavailableException(
        'Razorpay is not configured. Add valid TEST keys to pms-backend/.env and restart the backend.',
      );
    }

    const bill = await this.billRepo.findOne({ where: { id: dto.billId } });
    if (!bill) {
      throw new NotFoundException('Bill not found');
    }
    if (bill.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('This bill is already paid');
    }

    // Razorpay expects amount in the smallest currency unit (paise for INR)
    const amountInPaise = Math.round(Number(bill.totalAmount) * 100);
    if (!Number.isSafeInteger(amountInPaise) || amountInPaise <= 0) {
      throw new BadRequestException('Bill total amount is invalid');
    }

    let order;
    try {
      order = await this.razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `bill_${bill.id.replace(/-/g, '').slice(0, 32)}`,
      });
    } catch (err) {
      throw new InternalServerErrorException(
        'Razorpay rejected the order request. Verify the TEST credentials and bill amount.',
      );
    }

    const payment = this.paymentRepo.create({
      billId: bill.id,
      razorpayOrderId: order.id,
      amount: bill.totalAmount,
      paymentStatus: PaymentTxnStatus.CREATED,
    });
    await this.paymentRepo.save(payment);

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: this.configService.get<string>('RAZORPAY_KEY_ID'), // public key, safe to expose
      billId: bill.id,
    };
  }

  async verifyPayment(dto: VerifyPaymentDto) {
    const payment = await this.paymentRepo.findOne({
      where: { razorpayOrderId: dto.razorpayOrderId },
    });
    if (!payment) {
      throw new NotFoundException('Payment order not found');
    }

    const secret = this.configService.get<string>('RAZORPAY_KEY_SECRET') ?? '';
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${dto.razorpayOrderId}|${dto.razorpayPaymentId}`)
      .digest('hex');

    const isValid = expectedSignature === dto.razorpaySignature;

    // Use a transaction: payment + bill status must update together or not at all
    return this.dataSource.transaction(async (manager) => {
      if (!isValid) {
        payment.paymentStatus = PaymentTxnStatus.FAILED;
        payment.razorpayPaymentId = dto.razorpayPaymentId;
        await manager.save(payment);
        throw new BadRequestException('Invalid payment signature');
      }

      payment.paymentStatus = PaymentTxnStatus.SUCCESS;
      payment.razorpayPaymentId = dto.razorpayPaymentId;
      payment.razorpaySignature = dto.razorpaySignature;
      await manager.save(payment);

      const bill = await manager.findOne(Bill, { where: { id: payment.billId } });
      if (bill) {
        bill.paymentStatus = PaymentStatus.PAID;
        await manager.save(bill);
      }

      return { verified: true, billId: payment.billId };
    });
  }

  async getPaymentDetails(billId: string) {
    const bill = await this.billRepo.findOne({ where: { id: billId } });
    if (!bill) {
      throw new NotFoundException('Bill not found');
    }
    const payments = await this.paymentRepo.find({
      where: { billId },
      order: { createdDate: 'DESC' },
    });
    return payments;
  }

  async getPaymentHistory(query: QueryPaymentDto) {
    const qb = this.paymentRepo
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.bill', 'bill')
      .leftJoinAndSelect('bill.patient', 'patient')
      .orderBy('payment.createdDate', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    if (query.search?.trim()) {
      qb.andWhere('patient.patientName ILIKE :search', {
        search: `%${query.search.trim()}%`,
      });
    }
    if (query.status) {
      qb.andWhere('payment.paymentStatus = :status', { status: query.status });
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
}
