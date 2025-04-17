import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { status } from '../types/status.enum';
import { priority } from '../types/priority.enum';

export type ProjectDocument = Document & Project;

@Schema()
export class Project {
  @Prop({ required: true, unique: true })
  projectName: string;

  @Prop({ required: true, type: [String] })
  goal: string[];
  
  @Prop({required:true, enum : priority, default : priority.HIGH})
  priority: priority; 

  @Prop({ required: true})
  description: string;

  @Prop({ required: true })
  startDate: Date;
 
  @Prop({ required: true })
  endDate: Date;

  @Prop({ required: true })
  initialBudget: number;

  @Prop({ required: true, enum: status, default: status.STARTED })
  status: status;
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
assignedProjectManager: mongoose.Types.ObjectId;

@Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] })
assignedTeamMembers: mongoose.Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Skill' }] })
  skills: Types.ObjectId[]; 
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

export const ProjectModel = mongoose.models.Project || mongoose.model<Project>('Project', ProjectSchema);
