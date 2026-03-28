import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  getProfile(@Request() req: any) {
    return this.profilesService.getProfile(req.user.userId, req.user.role);
  }

  @Put('me')
  updateProfile(@Request() req: any, @Body() data: any) {
    return this.profilesService.updateProfile(
      req.user.userId,
      req.user.role,
      data,
    );
  }
}
