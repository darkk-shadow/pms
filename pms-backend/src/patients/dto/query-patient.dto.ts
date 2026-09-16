import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Gender } from '../../entities/patient.entity';

export class QueryPatientDto {
  @IsOptional()
  @IsString()
  name?: string; // partial match on patientName

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  limit?: number = 10;
}
