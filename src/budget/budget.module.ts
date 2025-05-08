import { Module } from '@nestjs/common';
import { BudgetService } from './services/budget.service';
import { BudgetController } from './controllers/budget.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Budget, BudgetSchema } from './schemas/budget.schema';

@Module({ imports : [MongooseModule.forFeature([{ name: Budget.name, schema: BudgetSchema }])],
  providers: [BudgetService],
  controllers: [BudgetController],
  exports: [MongooseModule, BudgetService] 
})
export class BudgetModule {}
