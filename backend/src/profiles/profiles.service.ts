import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfilesService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: number, role: string) {
    if (role === 'DOCTOR') {
      return this.prisma.doctorProfile.findUnique({ where: { userId } });
    }
    return this.prisma.patientProfile.findUnique({ where: { userId } });
  }

  async updateProfile(userId: number, role: string, data: any) {
    if (role === 'DOCTOR') {
      return this.prisma.doctorProfile.upsert({
        where: { userId },
        update: data,
        create: { ...data, userId },
      });
    }
    return this.prisma.patientProfile.upsert({
      where: { userId },
      update: data,
      create: { ...data, userId },
    });
  }
}
