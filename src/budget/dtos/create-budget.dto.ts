// create-budget.dto.ts
import { IsArray, IsEnum, IsNumber, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Position } from '../../users/types/user-position.enum';

export class PositionRateDto {
  @IsEnum(Position)
  @IsNotEmpty()
  position: Position;

  @IsNumber()
  @IsNotEmpty()
  hourlyRate: number;
}

export class CreateBudgetDto {
  @IsNotEmpty()
  projectId: string;

  @IsNumber()
  @IsNotEmpty()
  initialBudget: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PositionRateDto)
  rates: PositionRateDto[];
}

export class UpdateBudgetDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PositionRateDto)
  rates: PositionRateDto[];
}