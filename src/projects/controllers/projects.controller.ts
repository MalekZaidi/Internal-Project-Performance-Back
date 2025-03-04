import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ProjectService } from '../services/project.service';
import { CreateProjectDto } from '../dtos/create-project.dto';
import { Project } from '../schemas/projects.schema';
import { ApiTags } from '@nestjs/swagger';
import { UpdateProjectDto } from '../dtos/update-project.dtop';





@ApiTags("Projects")

@Controller('projects')
export class ProjectsController {
    constructor(private readonly projectService:ProjectService){}


    @Post()
    async create(@Body() createProjectDto:CreateProjectDto):Promise<Project>{

        return this.projectService.create(createProjectDto);
    }

    @Get()
    async findAll(): Promise<Project[]>{
        return this.projectService.findAllProjects();
    }


    @Get(':id')
    async findById(@Param('id')id:string): Promise<Project>{
        return this.projectService.findById(id);

    }

    @Delete(':id')
    async delete(@Param(':id')id:string) : Promise <{message : string}>{
        await this.projectService.deleteProject(id);
        return{message : 'Project deleted successfully'};

    }


    @Put(':id')
    async update(@Param('id') id: string,@Body()updateProjectDto:UpdateProjectDto): Promise <Project>{
        return this.projectService.updateProject(id,updateProjectDto);


    }

    











}

