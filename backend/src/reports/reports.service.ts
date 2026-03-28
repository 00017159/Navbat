import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async generatePatientReport(patientId: number) {
    const records = await this.prisma.patientMedicalRecord.findMany({
      where: { patientId },
      include: {
        doctor: {
          select: { firstName: true, lastName: true, doctorProfile: true },
        },
      },
    });
    if (!records.length)
      throw new NotFoundException('No records found to generate a report');

    // MOCK PDF Generation via Template Engine
    const reportData = {
      title: 'Medical History Report',
      date: new Date().toISOString(),
      patientId,
      recordsCount: records.length,
      status: 'GENERATED_PDF_BASE64_MOCK',
      // In a real application, we would compile an EJS/Handlebars template here
      // and pipe it into a PDF Engine like Puppeteer or PDFKit.
      filePreview: Buffer.from(JSON.stringify(records)).toString('base64'),
    };
    return reportData;
  }
}
