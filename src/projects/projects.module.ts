import { forwardRef, Module } from '@nestjs/common';
import { ProjectService } from './services/project.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from './schemas/projects.schema';
import { ProjectsController } from './controllers/projects.controller';
import { AuthModule } from 'src/auth/auth.module';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UsersModule } from 'src/users/users.module';

@Module({
    imports : [MongooseModule.forFeature([{name:Project.name, schema:ProjectSchema}]), 
    AuthModule,
    JwtModule,
    UsersModule 
 
      ],
    providers : [ProjectService,JwtService ],
    controllers: [ProjectsController],
      
})
export class ProjectsModule {}
