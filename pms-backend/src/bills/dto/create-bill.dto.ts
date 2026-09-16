import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateBillDto {
  @IsNotEmpty({ message: 'A patient ID is required' })
  @IsString()
  patientId: string;

  @IsNotEmpty({ message: 'Description is required' })
  @IsString()
  description: string;

  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(0.01, { message: 'Amount must be greater than 0' })
  amount: number;

  @IsNumber()
  @Min(0)
  tax: number;
}
