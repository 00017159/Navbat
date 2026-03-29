import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecordsService {
  constructor(private prisma: PrismaService) {}

  async createRecord(doctorId: number, data: any) {
    if (!data.patientId || !data.diagnosis) {
      throw new Error('Missing critical medical record fields');
    }
    return this.prisma.patientMedicalRecord.create({
      data: {
        doctorId,
        patientId: data.patientId,
        diagnosis: data.diagnosis,
        prescriptions: data.prescriptions || [],
        notes: data.notes,
        attachments: data.attachments || [],
      },
    });
  }

  async getPatientRecords(patientId: number) {
    return this.prisma.patientMedicalRecord.findMany({
      where: { patientId },
      include: {
        doctor: {
          select: { firstName: true, lastName: true, doctorProfile: true },
        },
      },
      orderBy: { date: 'desc' },
    });
  }
}
