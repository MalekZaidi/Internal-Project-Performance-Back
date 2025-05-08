import { IsEmail, IsEnum, IsNotEmpty, MinLength, Matches, Length,IsOptional, IsString, IsArray, IsMongoId, IsNumber, ValidateNested  } from 'class-validator';
import { Role } from '../types/user-role.enum';
import { Position } from '../types/user-position.enum';
import { Type } from 'class-transformer';

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

export class CreateUserDto {
  @IsNotEmpty({message:'Full Name must be not Empty '})
  @Length(10,25, {message:'Full Name must be between 10 and 25 characters'})
  fullName: string;

  @IsEmail({}, { message: 'Invalid email format' })
  login: string;

  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(PASSWORD_REGEX, { message: 'Password must contain at least one letter and one number' })
  password: string;

  @IsEnum(Role, { message: 'Invalid role' })
  @IsNotEmpty({message:'Role is Required'})
  role: Role;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  skillIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  escoUris?: string[];

  @IsOptional()
  @IsEnum(Position, { message: 'Invalid position' })
  position?: Position;
}
// create-user.dto.ts
export class EducationDto {
  @IsNotEmpty()
  @IsString()
  institution: string;

  @IsNotEmpty()
  @IsString()
  degree: string;

  @IsOptional()
  @IsString()
  fieldOfStudy?: string;

  @IsOptional()
  @IsNumber()
  startYear?: number;

  @IsOptional()
  @IsNumber()
  endYear?: number;
}

export class CertificationDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  issuer?: string;

  @IsOptional()
  @IsNumber()
  year?: number;
}

export class ConfirmCvDataDto {
  @IsArray()
  @IsOptional()
  @IsMongoId({ each: true })
  skillIds?: string[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  educations?: EducationDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CertificationDto)
  certifications?: CertificationDto[];
}