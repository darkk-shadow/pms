import { IsUUID } from 'class-validator';

export class CreateOrderDto {
  @IsUUID('4', { message: 'A valid bill ID is required' })
  billId: string;
}
