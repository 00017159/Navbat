import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { RecordsService } from './records.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('records')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Roles('DOCTOR')
  @Post()
  create(@Request() req: any, @Body() data: any) {
    return this.recordsService.createRecord(req.user.userId, data);
  }

  @Roles('PATIENT', 'DOCTOR')
  @Get()
  mine(@Request() req: any) {
    if (req.user.role === 'PATIENT') {
      return this.recordsService.getPatientRecords(req.user.userId);
    }
    throw new ForbiddenException(
      'Doctors must query specific patient records via patients endpoint',
    );
  }
}
