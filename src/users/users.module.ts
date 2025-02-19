import { Module } from '@nestjs/common';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserModel, UserSchema } from './schemas/users.schema';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]), JwtModule, AuthModule],
  controllers: [UsersController],
  providers: [UsersService,JwtService   
],   exports: [MongooseModule], 

})
export class UsersModule {}
