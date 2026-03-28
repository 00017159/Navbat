import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardMetrics() {
    const totalDoctors = await this.prisma.user.count({
      where: { role: 'DOCTOR' },
    });
    const totalPatients = await this.prisma.user.count({
      where: { role: 'PATIENT' },
    });
    const totalAppointments = await this.prisma.appointment.count();

    // Aggregate appointments by status
    const statusAgg = await this.prisma.appointment.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    return {
      overview: { totalDoctors, totalPatients, totalAppointments },
      appointmentStatuses: statusAgg,
      timestamp: new Date().toISOString(),
    };
  }
}
