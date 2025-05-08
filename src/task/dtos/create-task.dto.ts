import { Type } from 'class-transformer';
import { IsDateString, IsMongoId, IsNotEmpty,IsEnum,IsNumber, IsOptional, IsDate } from 'class-validator';

export class CreateTaskDto {
  @IsNotEmpty()
  taskName: string;

  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @IsNotEmpty()
  @IsMongoId()
  project: string;

  @IsNotEmpty()
  @IsMongoId()
  assignedTo: string;

  @IsEnum(['pending', 'in-progress', 'completed'])
  status: string;

  @IsEnum(['low', 'medium', 'high'])
  priority: string;

  @IsNumber()
  @IsOptional()
  order : number;
  
  @IsNumber()
  @IsOptional()
  actualWorkedHours?: number;

  @IsNumber()
  @IsOptional()
  workingHours?: number;


  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  completedAt?: Date;
  
}
