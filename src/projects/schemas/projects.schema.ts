import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Date, Document, Number } from 'mongoose';
import { status } from '../types/status.enum';
export type ProjectDocument = Document & Project;

@Schema()
export class Project {
  @Prop({ required: true, unique: true })
  projectName: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true , type:Date })
  startDate: Date;
 
  @Prop({required: true , type:Date})
  endDate: Date;

   
  @Prop({required: true , type:Number })
  initialBudget: Number;

  @Prop ({required: true, enum:status, default :status.STARTED})
   status : status;

}

export const ProjectSchema = SchemaFactory.createForClass(Project);


export const ProjectModel = mongoose.models.Project || mongoose.model<Project>('Project', ProjectSchema);
