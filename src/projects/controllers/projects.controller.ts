import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { ProjectService } from '../services/project.service';
import { CreateProjectDto } from '../dtos/create-project.dto';
import { Project } from '../schemas/projects.schema';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UpdateProjectDto } from '../dtos/update-project.dtop';
import { AuthGuard } from 'src/auth/middlewares/jwt-auth.guard';
import { RoleGuard } from 'src/auth/middlewares/role.guard';
import { Roles } from 'src/auth/middlewares/roles.decorator';

@ApiTags("Projects")

@Controller('projects')
export class ProjectsController {
    constructor(private readonly projectService:ProjectService){}

    @UseGuards(AuthGuard,RoleGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @Post()
    async create(@Body() createProjectDto:CreateProjectDto):Promise<Project>{

        return this.projectService.create(createProjectDto);
    }
    @UseGuards(AuthGuard)

    @UseGuards(AuthGuard)
    @ApiBearerAuth()
    @Get()
    async findAll(@Request() req): Promise<Project[]> {
        return this.projectService.findAllProjects(req.user);
    }

    @UseGuards(AuthGuard)
    @Get(':id')
    async findById(@Param('id') id: string, @Request() req): Promise<Project> {
      return this.projectService.findById(id, req.user);
    }
    @UseGuards(AuthGuard, RoleGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @Delete(':id')
    async delete(@Param('id')id:string) : Promise <{message : string}>{
        await this.projectService.deleteProject(id);
        return{message : 'Project deleted successfully'};

    }

    @UseGuards(AuthGuard, RoleGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @Put(':id')
    async update(@Param('id') id: string,@Body()updateProjectDto:UpdateProjectDto): Promise <Project>{
        return this.projectService.updateProject(id,updateProjectDto);


    }

        @UseGuards(AuthGuard, RoleGuard)
        @Roles('project_manager')
        @Post(':id/team-members')
        async addTeamMembers(
        @Param('id') id: string,
        @Body() body: { members: string[] },
        @Request() req
        ): Promise<Project> {
        return this.projectService.addTeamMembers(id, req.user._id, body.members);
        }
   }

