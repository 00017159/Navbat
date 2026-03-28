import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Roles('PATIENT')
  @Get('export/my-history')
  exportHistory(@Request() req: any) {
    return this.reportsService.generatePatientReport(req.user.userId);
  }

  @Roles('DOCTOR', 'ADMIN')
  @Get('export/patient/:id')
  exportPatientHistory(@Param('id') id: string) {
    return this.reportsService.generatePatientReport(+id);
  }
}
