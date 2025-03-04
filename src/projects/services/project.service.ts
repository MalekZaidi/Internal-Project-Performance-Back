import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Project, ProjectDocument } from '../schemas/projects.schema';
import { Model } from 'mongoose';
import { CreateProjectDto } from '../dtos/create-project.dto';
import { UpdateProjectDto } from '../dtos/update-project.dtop';

@Injectable()
export class ProjectService {

        constructor(@InjectModel(Project.name) private readonly projectModel: Model <ProjectDocument>)
        {}

    async create(createProjectDto:CreateProjectDto): Promise<Project>{
            const project = new this.projectModel({...createProjectDto});
            return project.save();

    }


    async findAllProjects (): Promise<Project[]> 
    {
        return this.projectModel.find().lean().exec();

    }

    async findById (id:string): Promise<Project>{

            return this.projectModel.findById(id).lean().exec()

    }

    async deleteProject(id:string): Promise<void>{
       const result= this.projectModel.findByIdAndDelete(id).lean().exec();
        
       if (!result){

        throw new NotFoundException('User Not found');


       }


    }


    async updateProject(id:string,updateProject:UpdateProjectDto) : Promise <Project> {
    
        const updatedProject = await this.projectModel.findByIdAndUpdate(id,updateProject,{ new: true, runValidators: true }).lean().exec();

        if (!updatedProject)
            {
                   throw new NotFoundException('Project Not Found'); 
        }
        return updatedProject;
    }
}
