import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async create(patientId: number, data: any) {
    if (!data.doctorId || !data.dateTime) {
      throw new BadRequestException('Doctor ID and DateTime are required');
    }

    // Example of an ACID Transaction
    return this.prisma.$transaction(async (tx) => {
      // 1. Validate Doctor exists and is really a doctor
      const doctor = await tx.user.findFirst({
        where: { id: data.doctorId, role: 'DOCTOR' },
        include: { doctorProfile: true },
      });
      if (!doctor) throw new NotFoundException('Doctor not found');

      // 2. Prevent Double Booking
      const existing = await tx.appointment.findFirst({
        where: {
          doctorId: data.doctorId,
          dateTime: new Date(data.dateTime),
          status: { not: 'CANCELLED' },
        },
      });
      if (existing) {
        throw new BadRequestException(
          'Doctor is already booked at this time slot',
        );
      }

      // 3. Create Appointment
      return tx.appointment.create({
        data: {
          patientId,
          doctorId: data.doctorId,
          dateTime: new Date(data.dateTime),
          type: data.type || 'IN_PERSON',
          notes: data.notes,
          price: doctor.doctorProfile?.priceAmount?.toString() || '0',
        },
      });
    });
  }

  async findAllForUser(userId: number, role: string) {
    return this.prisma.appointment.findMany({
      where: role === 'PATIENT' ? { patientId: userId } : { doctorId: userId },
      include: {
        doctor: { include: { doctorProfile: true } },
        patient: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { dateTime: 'desc' },
    });
  }
}
