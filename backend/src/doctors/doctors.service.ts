import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DoctorsService {
  constructor(private prisma: PrismaService) {}

  async findAll(specialty?: string) {
    const where = specialty ? { doctorProfile: { specialty } } : {};
    return this.prisma.user.findMany({
      where: {
        role: 'DOCTOR',
        ...where,
      },
      include: {
        doctorProfile: true,
        reviewsReceived: { select: { rating: true } },
      },
    });
  }

  async findOne(id: number) {
    const doctor = await this.prisma.user.findFirst({
      where: { id, role: 'DOCTOR' },
      include: {
        doctorProfile: true,
        reviewsReceived: true,
      },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');
    return doctor;
  }
}
