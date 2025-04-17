import { IsOptional,IsEnum, IsNotEmpty, IsDateString, IsPositive, MinLength, Length,  IsMongoId,IsString,  IsArray,  ArrayNotEmpty, } from 'class-validator';
import { status } from '../types/status.enum';
import { IsEndDateAfterStartDate } from 'src/config/IsEndDateAfterStartDate';
import { priority } from '../types/priority.enum';

export class CreateProjectDto {
  
  @IsNotEmpty({ message: 'Project name is required.' })

  @Length(10,50, {message:'Project Name must be between 100 and 300 characters'})
  projectName: string;

  
  @Length(100,300, {message:'Description must be between 100 and 300 characters'})
  @IsNotEmpty({ message: 'Description is required.' })
  description: string;

  @IsNotEmpty({message:'Priority Must not be Empty'})
  @IsEnum(priority,{message:'Invalid Priority'})
  priority:string;

  @IsNotEmpty({ message: 'Goals must not be empty.' })
  @MinLength(1, { message: 'At least one goal is required.' })
  goal: string[];
  
  @IsNotEmpty({ message: 'Start date is required.' })
  @IsDateString({}, { message: 'Start date must be a valid ISO 8601 date string.' })
  startDate: string; 

  @IsNotEmpty({ message: 'End date is required.' })
  @IsDateString({}, { message: 'End date must be a valid ISO 8601 date string.' })
  @IsEndDateAfterStartDate({ message: 'End date must be after start date.' })
  endDate: string; 

  @IsPositive({ message: 'Initial budget must be a positive number.' })
  @IsNotEmpty({ message: 'Initial budget is required.' })
  initialBudget: number; 

  @IsEnum(status, { message: 'Status must be a valid enum value.' })
  @IsNotEmpty({ message: 'Status is required.' })
  status: status;

  @IsNotEmpty({ message: 'Project manager must be assigned.' })
  @IsMongoId({ message: 'Invalid project manager ID.' })
  assignedProjectManager: string;

  @IsArray({ message: 'Team members must be an array of IDs.' })
  @IsOptional()
  @IsMongoId({ each: true, message: 'Each team member must have a valid ID.' })
  assignedTeamMembers: string[];

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  skillIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  escoUris?: string[];
}
