import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SkillDocument = Skill & Document;

@Schema({ timestamps: true })
export class Skill {

  
  @Prop({  unique: true,sparse: true  })
  escoUri: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop()
  category?: string;

  @Prop({ default: false })
  isCustom: boolean;

  @Prop({ default: Date.now })
  lastSynced: Date;

  @Prop()
  escoId?: string;

  @Prop()
  altLabels?: string[]; 

  @Prop()
  conceptType?: string; 
}

export const SkillSchema = SchemaFactory.createForClass(Skill);