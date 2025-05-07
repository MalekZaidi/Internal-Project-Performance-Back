import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Task, TaskSchema } from './schemas/task.schema';
import { HttpModule } from '@nestjs/axios';
import { TaskService } from './services/task.service';
import { TaskController } from './controllers/task.controller';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { AuthModule } from 'src/auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/users/users.module';
@Module({

imports : [MongooseModule.forFeature([{name:Task.name,schema:TaskSchema}]),
HttpModule,
NotificationsModule,
AuthModule,
JwtModule,
UsersModule],
providers : [TaskService],
controllers :[TaskController],
exports : [MongooseModule]


})
export class TaskModule {}
