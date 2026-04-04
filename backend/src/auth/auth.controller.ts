import {
  Controller,
  Request,
  Post,
  UseGuards,
  Body,
  Get,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('request-otp')
  async requestOtp(@Body() body: { email: string }) {
    if (!body.email) {
      throw new BadRequestException('Email is required');
    }
    return this.authService.requestOtp(body.email);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() body: { email: string; code: string }) {
    if (!body.email || !body.code) {
      throw new BadRequestException('Email and code are required');
    }
    return this.authService.verifyOtp(body.email, body.code);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: any) {
    return req.user;
  }
}
