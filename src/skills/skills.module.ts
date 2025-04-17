import { Module } from '@nestjs/common';
import { SkillsService } from './services/skill.service';
import { SkillsController } from './controllers/skill.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Skill, SkillSchema } from './schemas/skill.schema';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports:  [MongooseModule.forFeature([{name:Skill.name, schema:SkillSchema}]),HttpModule],
  providers: [SkillsService],
  controllers: [SkillsController],
  exports : [SkillsService,MongooseModule]
})
export class SkillsModule {}
