import { Controller, Get, Post, Body, Param, Put, Delete, NotFoundException, UseGuards } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { User } from '../schemas/users.schema';
import { AuthGuard } from 'src/auth/middlewares/jwt-auth.guard';
import { RoleGuard } from 'src/auth/middlewares/role.guard';
import { Roles } from 'src/auth/middlewares/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  
  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(AuthGuard, RoleGuard)
  @Roles('admin') 
  @Get()
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  
  @Get(':id')
  async findById(@Param('id') id: string): Promise<User> {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }

  
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.usersService.delete(id);
    return { message: 'User deleted successfully' };
  }
}
