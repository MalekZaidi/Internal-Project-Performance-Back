import { IsEmail, IsEnum, IsNotEmpty, MinLength, Matches } from 'class-validator';
import { Role } from '../types/user-role.enum';

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

export class CreateUserDto {
  @IsNotEmpty()
  fullName: string;

  @IsEmail({}, { message: 'Invalid email format' })
  login: string;

  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(PASSWORD_REGEX, { message: 'Password must contain at least one letter and one number' })
  password: string;

  @IsEnum(Role, { message: 'Invalid role' })
  role: Role;


}
