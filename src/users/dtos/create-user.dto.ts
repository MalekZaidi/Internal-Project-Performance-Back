import { IsEmail, IsEnum, IsNotEmpty, MinLength, Matches, Length,IsOptional, IsString, IsArray, IsMongoId  } from 'class-validator';
import { Role } from '../types/user-role.enum';

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

}
