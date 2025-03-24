import { Module } from '@nestjs/common';
import { RiskService } from './services/risk.service';
import {RiskController} from './controllers/risk.controller'
@Module({
  controllers: [RiskController],
  providers: [RiskService]
})
export class RiskModule {}
