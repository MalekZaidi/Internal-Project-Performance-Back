import { Body, Controller, Get, Post, Query, Req, Request, Res, UnauthorizedException, UseGuards} from '@nestjs/common';
  import { AuthService } from '../services/auth.service';
import { AuthGuard } from '../middlewares/jwt-auth.guard';
import {User, UserDocument } from 'src/users/schemas/users.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
    
  @Controller('auth')
  export class AuthController {
    constructor(private readonly authService: AuthService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>
    ) {}

    @Post('login')
async login(@Body('login') login: string, @Body('password') password: string, @Res() res) {
  const result = await this.authService.login(login, password);

  if (!result) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  res.status(200).json({ message: 'Login successful', token: result.token });
}
  
  @UseGuards(AuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    console.log('User ID:', req.user.userId); // Log the user ID
    const user = await this.userModel.findById(req.user.userId);
    console.log('User:', user); 
    return user; 
  }
  @UseGuards(AuthGuard) 
@Post('change-password')
async changePassword(@Request() req, @Body() body: { currentPassword: string, newPassword: string }): Promise<void> {
    try {
        const userId = req.user.userId; 
        await this.authService.changePassword(userId, body.currentPassword, body.newPassword);
    } catch (error) {
        throw new UnauthorizedException('Failed to change password');
    }

}


 
}