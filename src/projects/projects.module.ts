import { Module } from '@nestjs/common';
import { ProjectService } from './services/project.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from './schemas/projects.schema';
import { ProjectsController } from './controllers/projects.controller';

@Module({
    imports : [MongooseModule.forFeature([{name:Project.name, schema:ProjectSchema}])],
    providers : [ProjectService],
    controllers: [ProjectsController],

})
export class ProjectsModule {}
