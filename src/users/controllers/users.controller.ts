import { Controller, Get, Post, Body, Param, Put, Delete, NotFoundException, UseGuards, Query, UploadedFile, BadRequestException, UseInterceptors } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { User } from '../schemas/users.schema';
import { AuthGuard } from 'src/auth/middlewares/jwt-auth.guard';
import { RoleGuard } from 'src/auth/middlewares/role.guard';
import { Roles } from 'src/auth/middlewares/roles.decorator';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkillsService } from 'src/skills/services/skill.service';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Users') 

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService, private readonly skillsService: SkillsService) {}

  @UseGuards(AuthGuard,RoleGuard)
  @Roles('admin')
  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  // @UseGuards(AuthGuard, RoleGuard)
  // @Roles('admin')
  @ApiBearerAuth() 
  @Get()
  
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  // @UseGuards(AuthGuard,RoleGuard)
  // @Roles('project_manager','admin')
  @Get(':id')
  async findById(@Param('id') id: string): Promise<User> {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  @UseGuards(AuthGuard,RoleGuard)
  @Roles('admin','project_manager')
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }

  @UseGuards(AuthGuard,RoleGuard)
  @Roles('admin')
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.usersService.delete(id);
    return { message: 'User deleted successfully' };
  }
  // @UseGuards(AuthGuard)
  // @ApiBearerAuth()
  @Post(':userId/skills/assign-from-search')
  @ApiOperation({ 
    summary: 'Assign a skill from search results to user',
    description: 'First search for skills using /skills/search, then use the uri from results to assign'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        escoUri: { type: 'string', example: 'user@example.com' },
            },
     
    },
  })
  async assignSkillFromSearch(
    @Param('userId') userId: string,
    @Body('escoUri') escoUri: string
  ) {
    return this.usersService.searchAndAssignSkill(userId, escoUri);
  }
// In users.controller.ts
@Delete(':userId/skills/:skillId')
@ApiOperation({ 
  summary: 'Remove a skill from user',
  description: 'Removes the specified skill from the user\'s profile'
})
@ApiParam({ name: 'userId', description: 'ID of the user' })
@ApiParam({ name: 'skillId', description: 'ID of the skill to remove' })
@ApiResponse({ status: 200, description: 'Skill successfully removed' })
@ApiResponse({ status: 404, description: 'User or skill not found' })
async removeSkillFromUser(
  @Param('userId') userId: string,
  @Param('skillId') skillId: string
) {
  return this.usersService.removeSkillFromUser(userId, skillId);
}

@Post(':id/upload-cv')
@UseInterceptors(FileInterceptor('file'))
@ApiOperation({ summary: 'Upload CV and extract skills' })
@ApiBody({
  description: 'CV file (PDF or DOCX)',
  schema: {
    type: 'object',
    properties: {
      file: { type: 'string', format: 'binary' },
    },
  },
})
async uploadCV(
  @Param('id') id: string,
  @UploadedFile() file: Express.Multer.File,
) {
  if (!file) throw new BadRequestException('No file uploaded');
  const newSkills = await this.usersService.processCV(id, file);
  return {
    message: `Added ${newSkills.length} new skills from CV`,
    skills: newSkills
  };
}

@Post(':id/confirm-cv-skills')
@ApiOperation({ summary: 'Confirm skills extracted from CV' })
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      skillIds: { type: 'array', items: { type: 'string' } }
    }
  }
})
async confirmCVSkills(
  @Param('id') id: string,
  @Body() body: { skillIds: string[] }
) {
  const user = await this.usersService.addSelectedSkills(id, body.skillIds);
  return {
    message: `Added ${body.skillIds.length} skills successfully`,
    user
  };
}
// @Post(':id/upload-cv2')
// @UseInterceptors(FileInterceptor('file'))
// @ApiOperation({ summary: 'Upload CV and parse using Affinda' })
// @ApiBody({
//   description: 'CV file (PDF or DOCX)',
//   schema: {
//     type: 'object',
//     properties: {
//       file: { type: 'string', format: 'binary' },
//     },
//   },
// })
// async uploadCV2(
//   @Param('id') id: string,
//   @UploadedFile() file: Express.Multer.File,
// ) {
//   if (!file) throw new BadRequestException('No file uploaded');
//   const { skills, educations, certifications } = await this.usersService.processCV(id, file);
  
//   return {
//     message: 'CV parsed successfully',
//     data: {
//       newSkills: skills,
//       education: educations,
//       certifications: certifications
//     }
//   };
// }
@Post(':id/confirm-cv-data2')
@ApiOperation({ summary: 'Confirm parsed CV data' })
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      skillIds: { type: 'array', items: { type: 'string' } },
      educations: { 
        type: 'array',
        items: {
          type: 'object',
          properties: {
            institution: { type: 'string' },
            degree: { type: 'string' },
            fieldOfStudy: { type: 'string' },
            startYear: { type: 'number' },
            endYear: { type: 'number' }
          }
        }
      },
      certifications: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            issuer: { type: 'string' },
            year: { type: 'number' }
          }
        }
      }
    }
  }
})
async confirmCVData2(
  @Param('id') id: string,
  @Body() body: { 
    skillIds: string[],
    educations: any[],
    certifications: any[]
  }
) {
  const user = await this.usersService.confirmCVData(
    id,
    body.skillIds,
    body.educations,
    body.certifications
  );
  
  return {
    message: 'CV data confirmed successfully',
    user
  };
}
}
