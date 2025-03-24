import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('resource')
@Controller('resource')
export class ResourceController {}
