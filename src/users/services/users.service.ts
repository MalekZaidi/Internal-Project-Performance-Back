import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model,Types } from 'mongoose';
import { User, UserDocument } from '../schemas/users.schema';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import * as bcrypt from 'bcrypt';
import { Skill, SkillDocument } from 'src/skills/schemas/skill.schema';
import { SkillsService } from 'src/skills/services/skill.service';
import * as pdf from 'pdf-parse';
import * as mammoth from 'mammoth';
import * as mailjet from 'node-mailjet'; 

@Injectable()
export class UsersService {
   private readonly mailjetClient;


  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>,@InjectModel(Skill.name) private readonly skillModel: Model<SkillDocument>,private readonly skillsService:SkillsService,

) { this.mailjetClient = mailjet.Client.apiConnect('f0d1f00135c86c5beb143f0052226895', '991d774ee912ba9666bfac369724ba27', {
});}


async create(createUserDto: CreateUserDto): Promise<User> {
  // 1) Build and save
  const newUser = new this.userModel({ ...createUserDto });
  const userPassword = newUser.password;
  const savedUser = await newUser.save();

  // 2) Send credentials email (fire-and-forget if you prefer)
  try {
    await this.sendCredentialsEmail({
      toEmail:    savedUser.login,
      fullName:   savedUser.fullName,
      role:       savedUser.role,
      password:   userPassword,
    });
  } catch (err) {
    // Log but don’t crash user creation
    console.error('Failed to send welcome email:', err);
  }

  return savedUser;
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


async processCV(
  userId: string,
  file: Express.Multer.File
): Promise<SkillDocument[]>  {
  const text = await this.extactTextFromCV(file);
  const skills = await this.identifySkills(text);
  return this.processSkillsForUser(userId, skills);
}

private async extactTextFromCV(file: Express.Multer.File): Promise<string> {
  try {
    if (file.mimetype === 'application/pdf') {
      const data = await pdf(file.buffer);
      return data.text;
    }
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      return result.value;
    }
    throw new Error('Unsupported file type');
  } catch (error) {
    throw new BadRequestException('Failed to parse CV file');
  }
}

private async identifySkills(text: string): Promise<string[]> {
  // Basic keyword matching - you might want to enhance this with NLP
  const normalizedText = text.toLowerCase();
  const allSkills = await this.skillModel.find().select('name').lean();
  
  return allSkills
    .filter(skill => normalizedText.includes(skill.name.toLowerCase()))
    .map(skill => skill.name);
}


private async processSkillsForUser(
  userId: string,
  skillNames: string[]
): Promise<SkillDocument[]> {
  const user = await this.userModel.findById(userId);
  if (!user) throw new NotFoundException('User not found');

  const newSkills: SkillDocument[] = [];
  const existingSkillIds = user.skills.map(s => s.toString());
  
  for (const name of skillNames) {
    const normalizedName = name.trim().toLowerCase();
    
    // Case-insensitive search with exact match
    let skill: SkillDocument | null = await this.skillModel.findOne({ name }).exec();

    // Create new skill if not found
    if (!skill) {
      skill = await this.skillsService
        .createCustomSkill(name, 'Imported from CV')
        .then(s => s as SkillDocument);
    }

    // Check if skill is already assigned
    if (!existingSkillIds.includes(skill._id.toString())) {
      newSkills.push(skill);
    }
  }

  return newSkills;
}
async addSelectedSkills(userId: string, skillIds: string[]): Promise<UserDocument> {
  const user = await this.userModel.findById(userId);
  if (!user) throw new NotFoundException('User not found');

  const validSkills = await this.skillModel.find({
    _id: { $in: skillIds }
  });

  const newSkillIds = validSkills.map(s => s._id);
  const uniqueIds = [...new Set([...user.skills, ...newSkillIds])];
  
  user.skills = uniqueIds as Types.ObjectId[];
  await user.save();
  
  return this.userModel.findById(userId)
    .populate('skills', 'name description category')
    .exec();
}

private async processSkillsForUser3(
  userId: string,
  skillNames: string[]
): Promise<SkillDocument[]> {
  const user = await this.userModel.findById(userId);
  if (!user) throw new NotFoundException('User not found');

  const newSkills: SkillDocument[] = [];
  const existingSkillIds = user.skills.map(s => s.toString());

  // Normalize and deduplicate skill names
  const uniqueNames = [...new Set(skillNames
    .map(name => name.trim().toLowerCase()) // Normalize to lowercase
    .filter(name => name.length >= 3)
  )];

  for (const rawName of skillNames) { // Use original casing for display
    const normalizedName = rawName.trim().toLowerCase();
    
    // Case-insensitive search with exact match
    let skill: SkillDocument | null = await this.skillModel.findOne({ rawName }).exec();


    // Create new skill if not found
    if (!skill) {
      skill = await this.skillsService
        .createCustomSkill(rawName, 'Imported from CV')
        .then(s => s as SkillDocument);
    }
    const skillId = skill._id as Types.ObjectId;

    if (!user.skills.some(s => s.equals(skillId))) {
      user.skills.push(skillId);
      newSkills.push(skill);
    }
  }

  await user.save();
  return newSkills;
}

private async identifySkills3(text: string): Promise<string[]> {
  try {
    // First try AI extraction
    const aiSkills = await this.extractSkillsWithAI(text);
    if (aiSkills.length > 0) return aiSkills;
  } catch (error) {
    console.error('AI extraction failed, falling back to regex:', error);
  }
  
  // Fallback to regex extraction
  return this.extractSkillsWithRegex(text);
}

private async extractSkillsWithAI(text: string): Promise<string[]> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'mixtral-8x7b-32768',
      messages: [{
        role: 'system',
        content: `Extract ONLY technical skills from the CV text. Ignore personal information, job titles, and non-technical terms.
          Focus on:
          - Programming languages
          - Frameworks
          - Tools
          - Databases
          - DevOps tools
          - Technical methodologies
          Return ONLY a comma-separated list of specific technical skills.`
      }, {
        role: 'user',
        content: `CV TEXT: ${text}`
      }],
      temperature: 0.3,
      max_tokens: 500
    })
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.statusText}`);
  }

  const result = await response.json();
  const skillsString = result.choices[0].message.content;
  
  // Clean and normalize the skills
  return this.processAiSkills(skillsString);
}

private processAiSkills(skillsString: string): string[] {
  return skillsString
    .split(/[,;\/]|and|•/)
    .map(skill => skill
      .trim()
      .replace(/^\W+|\W+$/g, '')
      .replace(/\s{2,}/g, ' ')
    )
    .filter(skill => 
      skill.length >= 3 && 
      skill.length <= 50 &&
      !/\d{4,}/.test(skill) // Exclude years like "2019-2023"
    );
}

// Helper function to escape regex special characters
  private async escapeRegex(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

private extractSkillsWithRegex(text: string): string[] {
  // 1. Remove personal information patterns
  const cleanedText = text
    .replace(/(name|email|phone|address):.*?\n/gi, '')
    .replace(/[A-Z][a-z]+\s[A-Z][a-z]+(?=\s)/g, '') // Remove full names
    .replace(/\b\d{4}\b/g, ''); // Remove years

  // 2. Find technical skills section with strict patterns
  const sectionRegex = /(?:technical\s+(?:skills|expertise)|programming\s+languages|tools\s+&\s+technologies|frameworks)\s*[:\-\n]*([\s\S]*?)(?=\n\s*\n|$)/i;
  const sectionMatch = cleanedText.match(sectionRegex);
  const content = sectionMatch ? sectionMatch[1] : cleanedText;

  // 3. Technical skill patterns
  const techPatterns = [
    // Programming languages and frameworks
    /\b(?:react\.js|node\.js|angular|vue\.js|spring\s*boot|django|laravel|\.net)\b/gi,
    // DevOps tools
    /\b(?:docker|kubernetes|jenkins|ansible|terraform|grafana|prometheus)\b/gi,
    // Databases
    /\b(?:mysql|postgresql|mongodb|redis|oracle|sql\s*server)\b/gi,
    // Languages with version numbers
    /\b(?:python|java|c\+\+|c#|javascript|typescript|ruby|go|rust|swift)\b(?:\s*\d+\.?\d*)?/gi,
    // Tools and platforms
    /\b(?:git|aws|azure|gcp|jenkins|ansible|terraform|kafka)\b/gi,
    // Technical acronyms
    /\b(?:HTML5?|CSS3?|REST|API|JSON|XML|SOAP|OAuth|JWT)\b/gi,
    // Cloud technologies
    /\b(?:AWS\s*(?:EC2|S3|Lambda)|Azure\s*(?:Functions|DevOps)|GCP\s*(?:Cloud\s*Functions|BigQuery))\b/gi
  ];

  const matches = new Set<string>();

  // Match specific technical patterns
  techPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content))) {
      const skill = match[0]
        .trim()
        .replace(/[•\-*]/g, '')
        .replace(/\s{2,}/g, ' ');
      matches.add(this.capitalizeSkill(skill));
    }
  });

  // Filter and validate results
  const technicalKeywords = new Set([
    'python', 'java', 'javascript', 'react', 'node', 'sql', 
    'docker', 'aws', 'git', 'html', 'css', 'angular'
  ]);

  return Array.from(matches).filter(skill => {
    const lowerSkill = skill.toLowerCase();
    return (
      technicalKeywords.has(lowerSkill) ||
      /\.js$/.test(lowerSkill) || // Framework suffixes
      /[+#]/.test(skill) || // C++, C#
      /\d/.test(skill) || // Version numbers
      /(aws|azure|gcp)/i.test(skill) // Cloud providers
    );
  });
}

private capitalizeSkill(skill: string): string {
  // Properly capitalize skill names
  return skill.toLowerCase()
    .split(' ')
    .map(word => {
      if (word === 'js') return 'JS';
      if (word.includes('.')) return word.toUpperCase(); // .NET, etc.
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

private async processSkillsForUser2(
  userId: string,
  skillNames: string[]
): Promise<SkillDocument[]> {
  const user = await this.userModel.findById(userId);
  if (!user) throw new NotFoundException('User not found');

  const newSkills: SkillDocument[] = [];
  
  for (const name of skillNames) {
    let skill: SkillDocument | null =
      await this.skillModel.findOne({ name }).exec();
  
    if (!skill) {
      skill = await this.skillsService
        .createCustomSkill(name, 'Imported from CV')
        .then(s => s as SkillDocument);
    }
    const skillId = skill._id as Types.ObjectId;

    if (!user.skills.some(s => s.equals(skillId))) {
      user.skills.push(skillId);
      newSkills.push(skill);
    }
  }

  await user.save();
  return newSkills;
}



private async sendCredentialsEmail({
  toEmail,
  fullName,
  role,
  password,
}: {
  toEmail: string;
  fullName: string;
  role: string;
  password: string;
}): Promise<void> {
  await this.mailjetClient
    .post('send', { version: 'v3.1' })
    .request({
      Messages: [{
        From: { Email: 'malek.zaidi@esprit.tn' },
        To:   [{ Email: toEmail }],
        TemplateID:       6941014,
        TemplateLanguage: true,
        Variables: {
          userName:     fullName,
          userRole:     role,
          userLogin:    toEmail,
          userPassword: password,
        }
      }]
    });
}
// Add to UsersService class
private async parseCVWithAffinda(file: Express.Multer.File): Promise<any> {
  const FormData = require('form-data');
  const fetch = require('node-fetch');

  const form = new FormData();
  form.append('file', file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype
  });

  try {
    const response = await fetch('https://api.affinda.com/v2/resumes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer aff_7bc5444ef12dea9d5b92fdbd3d84931785068373`,
        ...form.getHeaders()
      },
      body: form
    });

    

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Affinda API Error:', errorBody);
      throw new Error(`Affinda API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    console.log('Affinda Response:', JSON.stringify(data, null, 2)); // Add debug logging
    return data;
  } catch (error) {
   console.error('Affinda Parsing Error:', error);
    throw new BadRequestException(`CV parsing failed: ${error.message}`);
  }
}

async processCV2(
  userId: string,
  file: Express.Multer.File
): Promise<{ skills: SkillDocument[], educations: any[], certifications: any[] }> {
  const affindaData = await this.parseCVWithAffinda(file);

  // Extract skills from both 'skills' and 'customSkills' arrays
  const skillNames = [
    ...(affindaData.skills?.map(s => s.name) || []),
    ...(affindaData.customSkills?.map(s => s.name) || [])
  ];
  
  // Process education with proper date handling
  const educations = affindaData.education?.map(edu => ({
    institution: edu.organization,
    degree: edu.accreditation?.inputStr || 'Degree not specified',
    fieldOfStudy: edu.accreditation?.education || '',
    startYear: edu.dates?.startDate?.year || null,
    endYear: edu.dates?.endDate?.year || null
  })) || [];

  // Process certifications with improved field mapping
  const certifications = affindaData.certifications?.map(cert => ({
    name: cert.name,
    issuer: cert.issuer,
    year: cert.date?.year || null
  })) || [];

  // Process skills and get full skill documents
  const skills = await this.processSkillsForUser(userId, skillNames);

  return {
    skills,
    educations: educations.filter(e => e.institution && e.degree),
    certifications: certifications.filter(c => c.name)
  };
}

async confirmCVData(
  userId: string,
  skillIds: string[],
  educations: any[],
  certifications: any[]
): Promise<UserDocument> {
  // Add skills
  const user = await this.addSelectedSkills(userId, skillIds);
  
  // Update education and certifications
  return this.userModel.findByIdAndUpdate(
    userId,
    {
      $addToSet: {
        educations: { $each: educations },
        certifications: { $each: certifications }
      }
    },
    { new: true }
  ).populate('skills', 'name description category').exec();
}
   }
