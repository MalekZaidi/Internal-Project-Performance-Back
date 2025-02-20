import { Body, Controller, Get, Post, Query, Req, Request, Res, UnauthorizedException, UseGuards} from '@nestjs/common';
  import { AuthService } from '../services/auth.service';
import { AuthGuard } from '../middlewares/jwt-auth.guard';
import {User, UserDocument } from 'src/users/schemas/users.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

  @ApiTags('auth') 
  
  @Controller('auth')
  export class AuthController {
    constructor(private readonly authService: AuthService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>
    ) {}


    @ApiOperation({ summary: 'User login' })
    @ApiBody({
      schema: {
        type: 'object',
        properties: {
          login: { type: 'string', example: 'user@example.com' },
          password: { type: 'string', example: 'StrongPassword123!' },
        },
        required: ['login', 'password'],
      },
    })
    @ApiResponse({ status: 200, description: 'Login successful' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })

    @Post('login')
async login(@Body('login') login: string, @Body('password') password: string, @Res() res) {
 const result = await this.authService.login(login,password);
  if (!result) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  res.status(200).json({ message: 'Login successful', token: result.token });
}
  
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth() 
  @Get('profile')

  async getProfile(@Request() req) {
    const payload=req.user ;
    const user = await this.userModel.findById(payload);
    console.log('User ID:', user._id); 
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