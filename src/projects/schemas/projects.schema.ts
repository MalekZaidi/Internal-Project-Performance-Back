import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Date, Document } from 'mongoose';
import { status } from '../types/status.enum';

export type ProjectDocument = Document & Project;

@Schema()
export class Project {
  @Prop({ required: true })
  projectName: string;

  @Prop({ required: true, unique: true })
  description: string;

  @Prop({ required: true })
  startDate: Date;
 
  @Prop({required: true})
  endDate: Date;

  @Prop ({required: true, enum:status, default :status.Started})
   status : status;




}

export const ProjectSchema = SchemaFactory.createForClass(Project);


export const UserModel = mongoose.models.User || mongoose.model<Project>('Project', ProjectSchema);
