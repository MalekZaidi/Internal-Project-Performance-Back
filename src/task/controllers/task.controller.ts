import { Controller, Post, Body, Get, Param, Delete, Put,UseGuards,Req, Request, Query, BadRequestException, } from '@nestjs/common';
import { TaskService } from '../services/task.service';
import { CreateTaskDto } from '../dtos/create-task.dto';
import { UpdateTaskDTO } from '../dtos/update-task.dto';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/middlewares/jwt-auth.guard';
import { UserDocument } from 'src/users/schemas/users.schema';
@ApiTags('Tasks')
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService,

  ) {}
  @Get('getall')
@UseGuards(AuthGuard)
async getAll(
  @Query('projectId') projectId: string,
  @Req() req: Request & { user: UserDocument }
) {
  if (!projectId) {
    throw new BadRequestException('Project ID is required');
  }
  return this.taskService.findAll2(projectId, req.user);
}
  @Post()
  @UseGuards(AuthGuard)
  create(@Body() dto: CreateTaskDto, @Req() req) {
    return this.taskService.create(dto, req.user);
  }

  // @Get()
  // findAll() {
  //   return this.taskService.findAll();
  // }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taskService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taskService.remove(id);
  }

  @Put(':id')
update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDTO) {
  return this.taskService.update(id, updateTaskDto);
}


}
