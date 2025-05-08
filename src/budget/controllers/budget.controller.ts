// budget.controller.ts
import { Controller, Post, Body, Param, Put, Get, UseGuards, NotFoundException } from '@nestjs/common';
import { BudgetService } from '../services/budget.service';
import { Role } from 'src/users/types/user-role.enum';
import { CreateBudgetDto, UpdateBudgetDto } from '../dtos/create-budget.dto';

@Controller('budgets')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Post()
  async create(@Body() createBudgetDto: CreateBudgetDto) {
    return this.budgetService.createBudget(createBudgetDto);
  }

  @Put(':projectId')
  async updateRates(
    @Param('projectId') projectId: string,
    @Body() updateDto: UpdateBudgetDto
  ) {
    try {
      return await this.budgetService.updateBudgetRates(projectId, updateDto);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Get(':projectId')
async getBudget(@Param('projectId') projectId: string) {
  try {
    return await this.budgetService.getBudgetByProject(projectId);
  } catch (error) {
    if (error instanceof NotFoundException) {
      throw new NotFoundException(error.message);
    }
    throw error;
  }
}
}