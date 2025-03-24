import { Module } from '@nestjs/common';
import { BudgetService } from './services/budget.service';
import { BudgetController } from './controllers/budget.controller';

@Module({
  providers: [BudgetService],
  controllers: [BudgetController]
})
export class BudgetModule {}
