import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiService {
  constructor(private prisma: PrismaService) {}

  async checkSymptoms(symptomsList: string[]) {
    // Simulated AI response logic
    const input = symptomsList.join(' ').toLowerCase();
    let recommendedSpecialty = 'General Practitioner';
    let severity = 'LOW';

    if (input.includes('chest pain') || input.includes('heart')) {
      recommendedSpecialty = 'Cardiologist';
      severity = 'HIGH';
    } else if (input.includes('headache') || input.includes('spine')) {
      recommendedSpecialty = 'Neurologist';
    } else if (input.includes('tooth') || input.includes('gum')) {
      recommendedSpecialty = 'Dentist';
    }

    const doctors = await this.prisma.user.findMany({
      where: {
        role: 'DOCTOR',
        doctorProfile: { specialty: recommendedSpecialty },
      },
      include: { doctorProfile: true },
    });

    return {
      analysis: `Detected possible symptoms requiring a ${recommendedSpecialty}. Severity: ${severity}`,
      recommendedSpecialty,
      suggestedDoctors: doctors,
    };
  }
}
