import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Project, ProjectDocument } from '../schemas/projects.schema';
import mongoose, { Model, Types } from 'mongoose';
import { CreateProjectDto } from '../dtos/create-project.dto';
import { UpdateProjectDto } from '../dtos/update-project.dtop';
import { User, UserDocument } from 'src/users/schemas/users.schema';
import { Role } from 'src/users/types/user-role.enum';
import { Skill, SkillDocument } from 'src/skills/schemas/skill.schema';
import { SkillsService } from 'src/skills/services/skill.service';
import { NotificationsGateway } from 'src/notifications/gateway/notifications.gateway';

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,     
    @InjectModel(Skill.name) private readonly skillModel: Model<SkillDocument>,
    private readonly skillsService:SkillsService,
    private notificationsGateway: NotificationsGateway,


  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    const { assignedProjectManager, assignedTeamMembers, skillIds, escoUris, ...projectData } = createProjectDto;  
    // Validate project manager
    const manager = await this.userModel.findById(assignedProjectManager);
    if (!manager || manager.role !== Role.PROJECT_MANAGER) {
      throw new BadRequestException('Invalid project manager');
    }
  
   
  
    // Process skills
    const skillObjectIds: Types.ObjectId[] = [];
  
    // Handle existing skills
    if (skillIds?.length) {
      const existingSkills = await this.skillModel.find({ 
        _id: { $in: skillIds.map(id => new Types.ObjectId(id)) }
      });
      
      if (existingSkills.length !== skillIds.length) {
        throw new BadRequestException('One or more skills not found');
      }
      
      skillObjectIds.push(...existingSkills.map(s => s._id as Types.ObjectId));
    }
  
  
    // Handle ESCO skills
    if (escoUris?.length) {
      const escoSkills = await Promise.all(
        escoUris.map(uri => this.skillsService.getOrCreateSkill(uri))
      );
      
      skillObjectIds.push(...escoSkills.map(s => {
        // Use Mongoose's Document type assertion
        const skillDoc = s as unknown as mongoose.Document;
        
        if (!skillDoc._id || !(skillDoc._id instanceof Types.ObjectId)) {
          throw new BadRequestException('Invalid skill ID format');
        }
        return skillDoc._id;
      }));
    }
  
    // Create project
    const project = new this.projectModel({
      ...projectData,
      assignedProjectManager: new Types.ObjectId(assignedProjectManager),
      skills: [...new Set(skillObjectIds)]
    });

    this.notificationsGateway.sendNotification(
      project.assignedProjectManager.toString(),
      {
        type: 'project_assigned',
        message: `You've been assigned as manager for "${project.projectName}"`,
        data: { 
          projectId: project._id.toString(),
          projectName: project.projectName
        }
      }
    );
  
    return project.save();
  }


 // Update findAllProjects for all user roles
async findAllProjects(user?: UserDocument): Promise<Project[]> {
  const baseQuery = this.projectModel.find()
    .populate('assignedProjectManager')
    .populate('assignedTeamMembers')
    .populate({
      path: 'skills',
      select: '_id name description', // Explicitly select fields
      model: 'Skill' // Ensure correct model reference
    });

  if (user?.role === Role.ADMIN) return baseQuery.lean().exec();
  if (user?.role === Role.PROJECT_MANAGER) {
    return baseQuery.find({ assignedProjectManager: user._id }).lean().exec();
  }
  if (user?.role === Role.TEAM_MEMBER) {
    return baseQuery.find({ assignedTeamMembers: user._id }).lean().exec();
  }
  return [];
}
  async findById(id: string, user?: UserDocument): Promise<Project> {
    const project = await this.projectModel.findById(id)
    .populate('assignedProjectManager')
    .populate('assignedTeamMembers')
    .populate({
      path: 'skills',
      select: '_id name description', // Explicitly select fields
      model: 'Skill'
    }) // Ensure skills are populated
    .lean()
    .exec();
  
    if (!project) {
      throw new NotFoundException('Project not found');
    }
  
    // Type assertion for populated fields
    const populatedProject = project as Project & {
      assignedProjectManager: { _id: any } | null;
      assignedTeamMembers: { _id: any }[] | null;
    };
  
    // Check access
    if (user?.role === Role.ADMIN) {
      return project;
    }
  
    if (user?.role === Role.PROJECT_MANAGER && 
        populatedProject.assignedProjectManager && 
        populatedProject.assignedProjectManager._id.toString() === user._id.toString()) {
      return project;
    }
  
    if (user?.role === Role.TEAM_MEMBER && 
        populatedProject.assignedTeamMembers && 
        populatedProject.assignedTeamMembers.some(m => m._id.toString() === user._id.toString())) {
      return project;
    }
  
    throw new NotFoundException('Project not found');
  }


  async deleteProject(id: string): Promise<void> {
    const result = await this.projectModel.findByIdAndDelete(id).lean().exec();
    if (!result) {
      throw new NotFoundException('Project not found');
    }
  }

  async updateProject(id: string, updateProject: UpdateProjectDto): Promise<Project> {
    const updatedProject = await this.projectModel
      .findByIdAndUpdate(id, updateProject, { new: true, runValidators: true })
      .lean()
      .exec();

    if (!updatedProject) {
      throw new NotFoundException('Project not found');
    }

    return updatedProject;
  }
// In project.service.ts
async addTeamMembers(projectId: string, userId: string, memberIds: string[]): Promise<Project> {
  const project = await this.projectModel.findById(projectId);
  if (!project) throw new NotFoundException('Project not found');
  
  // Verify requesting user is the project manager
 

  const validMembers = await this.userModel.find({
      _id: { $in: memberIds },
      role: Role.TEAM_MEMBER
  });

  if (validMembers.length !== memberIds.length) {
      throw new BadRequestException('Invalid team members');
  }

  // Convert existing members to strings for comparison
  const existingMembers = project.assignedTeamMembers.map(m => m.toString());
  
  // Filter out duplicates and already assigned members
  const newMembers = memberIds.filter(id => 
      !existingMembers.includes(id) && 
      !memberIds.slice(0, memberIds.indexOf(id)).includes(id)
  );

  if (newMembers.length === 0) {
      throw new BadRequestException('No new valid members to add');
  }

  // Add only new unique members
  project.assignedTeamMembers = [
      ...project.assignedTeamMembers,
      ...newMembers.map(m => new Types.ObjectId(m))
  ];

  newMembers.forEach(memberId => {
    this.notificationsGateway.sendNotification(
      memberId,
      {
        type: 'team_assigned',
        message: `You've been added to project "${project.projectName}"`,
        data: {
          projectId: project._id.toString(),
          projectName: project.projectName
        }
      }
    );
  });


  return project.save();

}
  }
