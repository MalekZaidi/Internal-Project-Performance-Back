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
import { differenceInMilliseconds, eachDayOfInterval, isBefore, isWeekend, max, min, setSeconds, startOfDay } from 'date-fns'
import { differenceInHours, addDays,  setHours, setMinutes } from 'date-fns';
import { BudgetService } from 'src/budget/services/budget.service';

@Injectable()
export class TaskService {
  constructor(@InjectModel(Task.name) private taskModel: Model<Task>,
  private readonly notificationsGateway:NotificationsGateway,
  private readonly budgetService: BudgetService,

) {}
private async handleBudgetUpdate(task: Task, isCompleted: boolean): Promise<void> {
  if (!task.project || !task.actualWorkedHours) return;

  try {
    const populatedTask = await this.taskModel.findById(task._id)
      .populate('assignedTo')
      .populate('project');
    
    if (!populatedTask) return;

    const user = populatedTask.assignedTo as unknown as UserDocument;
    const project = populatedTask.project as unknown as ProjectDocument;
    
    if (!project.initialBudget) {
      throw new Error('Project has no initial budget set');
    }

    const position = user.position;
    const hourlyRate = await this.budgetService.getHourlyRate(project._id.toString(), position);
    const amount = hourlyRate * task.actualWorkedHours;

    // Ensure we don't double-count hours
    const amountToApply = isCompleted ? amount : -amount;
    
    await this.budgetService.updateCurrentBudget(
      project._id.toString(),
      amountToApply
    );

  } catch (error) {
    console.error('Error updating budget:', error);
    throw new Error(`Budget update failed: ${error.message}`);
  }
}
async create(createDto: CreateTaskDto, currentUser: UserDocument): Promise<Task> {
  // Enforce TM → self assignment
  if (
    currentUser.role === Role.TEAM_MEMBER &&
    createDto.assignedTo !== currentUser._id.toString()
  ) {
    createDto.assignedTo = currentUser._id.toString();
  }
  const workDays = eachDayOfInterval({
    start: new Date(createDto.startDate),
    end: new Date(createDto.endDate),
  }).filter(d => !isWeekend(d)).length;
  // Compute workingHours = business days between startDate & dueDate

  const workingHours = workDays * 8;

  const task = new this.taskModel({
    ...createDto,
    assignedAt: new Date(),
    workingHours,
    actualWorkedHours: 0, 
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

  private calculateActualHours(start: Date, end: Date): number {
    let totalMs = 0;
    const WORK_START_HOUR = 8;
    const WORK_END_HOUR = 18;
  
    let current = new Date(startOfDay(start));
  
    while (current <= end) {
      if (isWeekend(current)) {
        current = addDays(current, 1);
        continue;
      }
  
      const workStart = setMinutes(setHours(current, WORK_START_HOUR), 0);
      const workEnd = setMinutes(setHours(current, WORK_END_HOUR), 0);
  
      // Clamp the interval to actual start/end
      const intervalStart = max([workStart, start]);
      const intervalEnd = min([workEnd, end]);
  
      if (isBefore(intervalStart, intervalEnd)) {
        const dayMs = differenceInMilliseconds(intervalEnd, intervalStart);
        totalMs += dayMs;
      }
  
      current = addDays(current, 1);
    }
  
    // Convert ms → hours with decimal
    return +(totalMs / (1000 * 60 * 60)).toFixed(2);
  }

  async update(id: string, updateTaskDto: UpdateTaskDTO): Promise<Task> {
    const existingTask = await this.taskModel.findById(id);
    if (!existingTask) throw new NotFoundException('Task not found');

    // Calculate actual worked hours when completing task
    if (updateTaskDto.status === 'completed' && existingTask.status !== 'completed') {
      updateTaskDto.completedAt = new Date();
      updateTaskDto.actualWorkedHours = this.calculateActualHours(
        existingTask.assignedAt,
        updateTaskDto.completedAt
      );
    }
    const isCompleting = existingTask.status !== 'completed' && updateTaskDto.status === 'completed';
    const isReopening = existingTask.status === 'completed' && updateTaskDto.status !== 'completed';
    // Reset actual hours if reopening task
    if (updateTaskDto.status !== 'completed' && existingTask.status === 'completed') {
      updateTaskDto.actualWorkedHours = 0;
      updateTaskDto.completedAt = null;
    }

    const updatedTask = await this.taskModel
  .findByIdAndUpdate(id, updateTaskDto, { new: true })
  .populate('assignedTo project');

if (isCompleting) {
  await this.handleBudgetUpdate(updatedTask, true);
} else if (isReopening) {
  await this.handleBudgetUpdate(updatedTask, false);
}
  
      return updatedTask;
    }

  async findAll2(projectId?: string): Promise<Task[]> {
    const query = projectId ? { project: projectId } : {};
    return this.taskModel.find(query)
      .populate('assignedTo project')
      .exec();
  }
}
