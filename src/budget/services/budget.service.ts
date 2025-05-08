import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Budget, BudgetDocument } from '../schemas/budget.schema';
import { Position } from 'src/users/types/user-position.enum';
import { CreateBudgetDto, UpdateBudgetDto } from '../dtos/create-budget.dto';

@Injectable()
export class BudgetService {
  constructor(@InjectModel(Budget.name) private budgetModel: Model<BudgetDocument>) {}

  async createBudget(createBudgetDto: CreateBudgetDto): Promise<BudgetDocument> {
    const createdBudget = new this.budgetModel({
      ...createBudgetDto,
      currentBudget: createBudgetDto.initialBudget
    });
    return createdBudget.save();
  }

  async updateBudgetRates(projectId: string, updateDto: UpdateBudgetDto): Promise<BudgetDocument> {
    return this.budgetModel.findOneAndUpdate(
      { projectId },
      { $set: { rates: updateDto.rates } },
      { new: true, upsert: true }
    ).exec();
  }

  async getBudgetByProject(projectId: string): Promise<BudgetDocument> {
    const budget = await this.budgetModel.findOne({ projectId }).exec();
    
    if (!budget) {
      const newBudget = new this.budgetModel({
        projectId,
        initialBudget: 0,
        currentBudget: 0,
        rates: []
      });
      return newBudget.save();
    }
    
    return budget;
  }

  async calculateCost(projectId: string, hours: number, position: Position): Promise<number> {
    const budget = await this.getBudgetByProject(projectId);
    const positionRate = budget.rates.find(rate => rate.position === position);
    
    if (!positionRate) {
      throw new Error(`No rate found for position: ${position}`);
    }
    
    return hours * positionRate.hourlyRate;
  }

  async updateCurrentBudget(projectId: string, amount: number): Promise<BudgetDocument> {
    const budget = await this.budgetModel.findOne({ projectId });
    
    if (!budget) {
      throw new NotFoundException(`Budget for project ${projectId} not found`);
    }
  
    // Ensure we don't go negative
    const newCurrentBudget = Math.max(budget.currentBudget + amount, 0);
    
    return this.budgetModel.findOneAndUpdate(
      { projectId },
      { $set: { currentBudget: newCurrentBudget } },
      { new: true }
    ).exec();
  }

  async getHourlyRate(projectId: string, position: Position): Promise<number> {
    const budget = await this.getBudgetByProject(projectId);
    const rate = budget.rates.find(r => r.position === position);
    if (!rate) {
      throw new NotFoundException(`Hourly rate for position ${position} not found`);
    }
    return rate.hourlyRate;
  }
}