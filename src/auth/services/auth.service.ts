import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/users/schemas/users.schema';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>, 
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService, 
  ) {}

  async login(login: string, password: string): Promise<{ token: string }> {
    const user = await this.userModel.findOne({ login });
  
    if (!user) {
      console.log('❌ User not found');
      throw new UnauthorizedException('Invalid email or password');
    }
  
    console.log('✅ User found:', user);
  
    if (!user.isActive) {
      throw new UnauthorizedException('Account is not active');
    }
  
    console.log('🔑 Hashed password in DB:', user.password);
    console.log('📝 Password entered:', password);
  
    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log('✅ Password match:', passwordMatch);
  
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }
  
    const secret = this.configService.get<string>('JWT_SECRET');
    const token = this.jwtService.sign({ userId: user._id }, { secret });
  
    return { token };
  }
  
 
  

  async validateUser(login: string, password: string): Promise<User | null> {
    const user = await this.userModel.findOne({ login }); 

    if (!user) {
      return null;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException();
    }

    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = await this.userModel.findById(userId); 

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid current password');
      }

      if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(newPassword)) {
        throw new UnauthorizedException(
          'The password must be at least 8 characters long and contain at least one letter and one number',
        );
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.userModel.updateOne({ _id: userId }, { password: hashedPassword }, { validateBeforeSave: false });

      console.log('Password changed successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      throw new UnauthorizedException('Failed to change password');
    }
  }
}
