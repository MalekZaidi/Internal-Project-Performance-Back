import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { Role } from '../types/user-role.enum';
import * as bcrypt from 'bcrypt';
import { Skill } from 'src/skills/schemas/skill.schema';
import { Job } from '../types/user-job.enum';

export type UserDocument = Document & User;

@Schema()
export class User {

  
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true, unique: true })
  login: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, enum: Role, default: Role.ADMIN })
  role: Role;

  @Prop({ default: true })
  
  isActive: boolean;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Skill' }] })
  skills: Types.ObjectId[]; 

  @Prop([{ 
    institution: String,
    degree: String,
    fieldOfStudy: String,
    startYear: Number,
    endYear: Number
  }])
  educations: {
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    startYear?: number;
    endYear?: number;
  }[];

  @Prop([{
    name: String,
    issuer: String,
    year: Number
  }])
  certifications: {
    name: string;
    issuer?: string;
    year?: number;
  }[];

}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function (next) {
  const user = this as UserDocument;
  if (!user.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSaltSync(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

export const UserModel = mongoose.models.User || mongoose.model<User>('User', UserSchema);
