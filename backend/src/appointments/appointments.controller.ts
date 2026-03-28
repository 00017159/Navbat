import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  create(@Request() req: any, @Body() data: any) {
    return this.appointmentsService.create(req.user.userId, data);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.appointmentsService.findAllForUser(
      req.user.userId,
      req.user.role,
    );
  }
}
