
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Task extends Document {
  @Prop({ required: true })
  taskName: string;

  @Prop()
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  project: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  assignedTo: Types.ObjectId;

  @Prop({ type: Date })
  startDate: Date;

  @Prop({ type: Date })
  dueDate: Date;

  @Prop({ default: 'pending', enum: ['pending', 'in-progress', 'completed'] })
  status: string;
  
  @Prop ( { enum : [ 'high', 'low', 'medium'] })  
  priority : string;
  @Prop({ type: Date, default: Date.now })
  assignedAt: Date;

  @Prop({ type: Date })
  completedAt?: Date;

  /** in hours */
  @Prop({ default: 0 })
  actualWorkedHours: number;

  /** in business hours (24h days minus weekends) */
  @Prop({ default: 0 })
  workingHours: number;
  
    @Prop({ default: 0 })
    order: number;
}
export type TaskDocument= Task & Document;
export const TaskSchema = SchemaFactory.createForClass(Task);
