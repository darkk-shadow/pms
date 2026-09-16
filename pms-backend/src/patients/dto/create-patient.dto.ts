import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { Gender } from '../../entities/patient.entity';

export class CreatePatientDto {
  @IsNotEmpty({ message: 'Patient name is required' })
  @IsString()
  patientName: string;

  @IsInt({ message: 'Age must be a whole number' })
  @Min(0, { message: 'Age cannot be negative' })
  @Max(150, { message: 'Age is invalid' })
  age: number;

  @IsEnum(Gender, { message: 'Gender must be MALE, FEMALE, or OTHER' })
  gender: Gender;

  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString()
  @Matches(/^[0-9]{10}$/, {
    message: 'Phone number must be exactly 10 digits.',
  })
  phoneNumber: string;

  @IsEmail({}, { message: 'A valid email is required' })
  @IsOptional()
  email: string;

  @IsNotEmpty({ message: 'Address is required' })
  @IsString()
  address: string;
}
