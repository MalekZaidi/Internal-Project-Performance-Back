import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model,Types } from 'mongoose';
import { User, UserDocument } from '../schemas/users.schema';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import * as bcrypt from 'bcrypt';
import { Skill, SkillDocument } from 'src/skills/schemas/skill.schema';
import { SkillsService } from 'src/skills/services/skill.service';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>,@InjectModel(Skill.name) private readonly skillModel: Model<SkillDocument>,private readonly skillsService:SkillsService) {}


  async create(createUserDto: CreateUserDto): Promise<User> {
    const newUser = new this.userModel({ ...createUserDto });
    return newUser.save();
  }

 
  async findAll(): Promise<User[]> {
    return this.userModel.find().populate({
      path: 'skills',
      select: '_id name description', // Explicitly select fields
      model: 'Skill'
    }).lean().exec();
  }

  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).populate({
      path: 'skills',
      select: '_id name description', // Explicitly select fields
      model: 'Skill'
    }).lean().exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }


  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    
    const updatedUser = await this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true, runValidators: true }).exec();
    
    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    return updatedUser;
  }

  
  async delete(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }
  async searchAndAssignSkill(
    userId: string,
    escoUri: string
  ): Promise<UserDocument> {
    // 1. Verify user exists
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 2. Get or create the skill from ESCO URI
    const skill = await this.skillsService.getOrCreateSkill(escoUri);
    const skillId = (skill as any)._id; // More type-safe

    // 3. Check if skill is already assigned
    if (user.skills.some(s => s.toString() === skillId.toString())) {
      throw new BadRequestException('Skill already assigned to user');
    }

    // 4. Assign the skill
    user.skills.push(skillId);
    await user.save();

    // 5. Return populated user
    return this.userModel.findById(userId)
      .populate('skills', 'name description category')
      .exec();
  }
    // In users.service.ts
async removeSkillFromUser(userId: string, skillId: string): Promise<UserDocument> {
  // 1. Verify user exists
  const user = await this.userModel.findById(userId);
  if (!user) {
    throw new NotFoundException('User not found');
  }

  // 2. Verify skill exists (optional - remove if you don't need this check)
  const skillExists = await this.skillModel.exists({ _id: skillId });
  if (!skillExists) {
    throw new NotFoundException('Skill not found');
  }

  // 3. Remove the skill from user's skills array
  user.skills = user.skills.filter(skill => skill.toString() !== skillId);
  await user.save();

  // 4. Return populated user
  return this.userModel.findById(userId)
    .populate('skills', 'name description category')
    .exec();
}
}
