import { IsEnum, IsNotEmpty, MinLength, Matches, IsDate, IsDateString, IsPositive, MinDate, Allow } from 'class-validator';
import { status } from '../types/status.enum';
import { Date, Number } from 'mongoose';
import { IsEndDateAfterStartDate } from 'src/config/IsEndDateAfterStartDate';



export class CreateProjectDto {
  @IsNotEmpty()
  projectName: string;
  
  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  @IsDateString()
  startDate : Date;
 

  @IsEndDateAfterStartDate({ message: 'End date must be after start date.' })
  @IsNotEmpty()
  @IsDateString()  
  endDate : Date;

  @IsPositive()
  @IsNotEmpty()
  initialBudget:Number;

  @IsEnum(status,{message:'Invalid Status'})
  status = status;


}
