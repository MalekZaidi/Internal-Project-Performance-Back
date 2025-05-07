import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task } from '../schemas/task.schema';
import { CreateTaskDto } from '../dtos/create-task.dto';
import { UpdateTaskDTO } from '../dtos/update-task.dto';
import { ProjectDocument } from 'src/projects/schemas/projects.schema';
import { NotificationsGateway } from 'src/notifications/gateway/notifications.gateway';
import { User, UserDocument } from 'src/users/schemas/users.schema';
import { Role } from 'src/users/types/user-role.enum';
import { eachDayOfInterval, isWeekend } from 'date-fns'

@Injectable()
export class TaskService {
  constructor(@InjectModel(Task.name) private taskModel: Model<Task>,
  private readonly notificationsGateway:NotificationsGateway,
) {}

async create(createDto: CreateTaskDto, currentUser: UserDocument): Promise<Task> {
  // Enforce TM → self assignment
  if (
    currentUser.role === Role.TEAM_MEMBER &&
    createDto.assignedTo !== currentUser._id.toString()
  ) {
    createDto.assignedTo = currentUser._id.toString();
  }

  // Compute workingHours = business days between startDate & dueDate
  const interval = eachDayOfInterval({
    start: new Date(createDto.startDate),
    end:   new Date(createDto.endDate),
  });
  const businessDays = interval.filter(d => !isWeekend(d)).length;
  const workingHours = businessDays * 24;

  const task = new this.taskModel({
    ...createDto,
    assignedAt: new Date(),
    workingHours,
  });
  await task.save();
    return task;
    
  }

  async findAll(Project?:ProjectDocument): Promise<Task[]> {
       return await this.taskModel.find().lean().exec();
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskModel.findById(id).populate('assignedTo project');
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async remove(id: string): Promise<void> {
    const result = await this.taskModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) throw new NotFoundException('Task not found');
  }

  async update(id: string, updateTaskDto: UpdateTaskDTO): Promise<Task> {
    const updatedTask = await this.taskModel
      .findByIdAndUpdate(id, updateTaskDto, { new: true })
      .populate('assignedTo project');
  
    if (!updatedTask) throw new NotFoundException('Task not found');
  
    return updatedTask;
  }
  // In TaskService's findAll2 method

  async findAll2(
    projectId: string,
    currentUser: UserDocument
  ): Promise<Task[]> {
    const filter: any = {};
    console.log('Querying tasks for project:', projectId);
    console.log('Current user role:', currentUser.role);
    // Always filter by project if provided
    if (projectId && Types.ObjectId.isValid(projectId)) {
      filter.project = new Types.ObjectId(projectId);
    }
  
    // For TMs, filter by their ID only if project is selected
    if (currentUser.role === Role.TEAM_MEMBER && projectId) {
      filter.assignedTo = currentUser._id;
    }
  
    return this.taskModel.find(filter)
      .populate('assignedTo project')
      .sort({ order: 1 }) // Add sorting by order
      .lean()
      .exec();
  }
  
}
