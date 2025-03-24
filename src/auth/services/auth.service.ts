import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/users/schemas/users.schema';
import { ConfigService } from '@nestjs/config';


const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>, 
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService, 
  ) {}

  private async findAndValidateUser(login: string, password: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ login }).lean();
    if (!user ) {
      throw new UnauthorizedException('Invalid email');
    }
    
    if ( ! await bcrypt.compare(password, user.password)){
        throw new UnauthorizedException('Invalid Password');

    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is not active');
    }
  
    return user;
  }

    

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = await this.userModel.findById(userId).lean(); 
      
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid current password');
      }

      if (!PASSWORD_REGEX.test(newPassword)) {
        throw new UnauthorizedException(
          'The password must be at least 8 characters long and contain at least one letter and one number',
        );
      }
      const sameAsCurrent = await bcrypt.compare(newPassword,user.password);

      if (  sameAsCurrent) {
        throw new UnauthorizedException("You can't use the same password");
      }

      const salt = await bcrypt.genSalt(10); 
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      await this.userModel.updateOne({ _id: userId }, { password: hashedPassword }, { validateBeforeSave: false });

      console.log('Password changed successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      throw new UnauthorizedException('Failed to change password');
    }
  }

  async login(login: string, password: string): Promise<{ token: string }> {
    const user  = await this.findAndValidateUser(login,password);
    console.log('User Found Testing decoding  : ', user );

    const secret   = await this.configService.get<string>('JWT_SECRET');
    const token  = await this.jwtService.signAsync({userId:user._id, userRole:user.role},{secret});
    return { token };
  }

}





