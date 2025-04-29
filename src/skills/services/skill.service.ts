import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Skill, SkillDocument } from '../schemas/skill.schema';
import axios from 'axios';
import { HttpService } from '@nestjs/axios';

interface EscoSkill {
  _links: {
    self: { href: string };
  };
  title: string;
  description?: string;
  skillType?: string;
}

@Injectable()
export class SkillsService {
  private readonly logger = new Logger(SkillsService.name);
  private readonly ESCO_API = 'https://ec.europa.eu/esco/api';

  constructor(
    @InjectModel(Skill.name) private readonly skillModel: Model<SkillDocument>,private readonly httpService : HttpService
  ) {}

  async searchESCO(query: string): Promise<Array<{
    uri?: string;
    id?: string;
    name: string;
    description?: string;
    category?: string;
    isCustom?: boolean;
  }>> {
    try {
      // 1. Search ESCO API
      const escoResponse = await axios.get(`${this.ESCO_API}/search`, {
        params: {
          type: 'skill',
          text: query,
          language: 'en'
        }
      });
  
      // Process ESCO results
      const escoPromises = escoResponse.data._embedded?.results?.map(async result => {
        const skill = await this.getOrCreateSkill(result._links.self.href);
        return {
          uri: result._links.self.href,
          name: result.title,
          description: result.description,
          category: result.skillType,
          isCustom: false
        };
      }) || [];
  
      const escoResults = await Promise.all(escoPromises);
  
      // 2. Search local database for custom skills
      const customSkills = await this.skillModel.find({
        $and: [
          { name: new RegExp(query, 'i') },
          { isCustom: true }
        ]
      }).lean();
  
      const customResults = customSkills.map(skill => ({
        id: skill._id.toString(),
        name: skill.name,
        description: skill.description,
        category: skill.category,
        isCustom: true
      }));
  
      // 3. Combine and return results
      return [...escoResults, ...customResults];
    } catch (error) {
      this.logger.error(`Search failed: ${error.message}`);
      throw new Error('Failed to search skills');
    }
  }

  async getOrCreateSkill(escoUri: string): Promise<SkillDocument> {
    const existingSkill = await this.skillModel.findOne({ escoUri });
    if (existingSkill) return existingSkill;
  
    try {
      const skillDetails = await this.fetchSkillDetails(escoUri);
      const newSkill = new this.skillModel({
        escoUri,
        name: skillDetails.name,
        description: skillDetails.description,
        category: skillDetails.category,
        escoId: skillDetails.id,
      });
  
      return newSkill.save();
    } catch (error) {
      throw new BadRequestException('Failed to create ESCO skill');
    }
  }
  
  
  async fetchSkillDetails(uri: string) {
    const response = await this.httpService.get(uri).toPromise();
  
    const data = response?.data;
  
    if (!data) {
      throw new Error('No data returned from ESCO API');
    }
  
    return {
      escoUri: uri,
      name: data?.preferredLabel?.en || 'Unknown',
      description: typeof data?.description?.en === 'object'
        ? data.description.en.literal
        : data?.description?.en || '',
      category: data?.broaderSkillType?.prefLabel?.en || '',
      id: data?.id,
      altLabels: data?.altLabels?.en || [],
      conceptType: data?.conceptType,
    };
  }    
  

async createCustomSkill(name: string, category?: string, description?: string): Promise<SkillDocument> {
  const newSkill = new this.skillModel({
    name,
    category,
    description,
    isCustom: true,
    lastSynced: new Date(),
    escoUri: null 

  });
  return newSkill.save();
}

  async getSkillById(id: string): Promise<SkillDocument> {
    const skill = await this.skillModel.findById(id);
    if (!skill) {
      throw new Error('Skill not found');
    }
    return skill;
  }

  async listSkills(): Promise<SkillDocument[]> {
    return this.skillModel.find().sort({ name: 1 });
  }
}
