import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('symptoms')
  checkSymptoms(@Body() data: { symptoms: string[] }) {
    if (!data.symptoms || !Array.isArray(data.symptoms)) {
      throw new Error('Symptoms array is required');
    }
    return this.aiService.checkSymptoms(data.symptoms);
  }
}
