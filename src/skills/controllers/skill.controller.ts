import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { SkillsService } from '../services/skill.service';
import { ApiTags, ApiOperation,ApiBody } from '@nestjs/swagger';

@ApiTags('Skills')
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search skills in ESCO database' })
  async searchSkills(@Query('q') query: string) {
    if (!query || query.length < 2) {
      throw new HttpException(
        'Query must be at least 2 characters',
        HttpStatus.BAD_REQUEST
      );
    }

    // This now calls getOrCreateSkill behind the scenes
    return this.skillsService.searchESCO(query);
  }

  @Get()
  @ApiOperation({ summary: 'List all skills in the local system' })
  async listAllSkills() {
    return this.skillsService.listSkills();
  }

  @Post('custom')
  @ApiOperation({ summary: 'Create a custom skill manually' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        category: { type: 'string' },
        description: { type: 'string' }
      },
      required: ['name']
    }
  })
  async createCustomSkill(
    @Body() body: { name: string; category?: string; description?: string }
  ) {
    return this.skillsService.createCustomSkill(body.name, body.category, body.description);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get skill by ID' })
  async getSkillById(@Param('id') id: string) {
    return this.skillsService.getSkillById(id);
  }
}
