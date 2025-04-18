import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SkillDocument = Skill & Document;

@Schema({ timestamps: true })
export class Skill {

  
  @Prop({  unique: true })
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
  escoId?: string; // Added to store ESCO identifier separately

  @Prop()
  altLabels?: string[]; // Alternative names for the skill

  @Prop()
  conceptType?: string; // ESCO concept type (skill/competence/knowledge)
}

export const SkillSchema = SchemaFactory.createForClass(Skill);