import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  // Generate a 6-digit OTP code
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async requestOtp(email: string) {
    const code = this.generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store OTP in database
    await this.prisma.otpCode.create({
      data: { email, code, expiresAt },
    });

    // Log the OTP for development (in production, send via email service)
    console.log(`\n📧 OTP for ${email}: ${code}\n`);

    return {
      message: `Verification code sent to ${email}`,
      // Include code in dev mode for easy testing
      ...(process.env.NODE_ENV !== 'production' && { dev_code: code }),
    };
  }

  async verifyOtp(email: string, code: string) {
    // Find valid OTP
    const otpRecord = await this.prisma.otpCode.findFirst({
      where: {
        email,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new UnauthorizedException('Invalid or expired verification code');
    }

    // Mark OTP as used
    await this.prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    // Find or create user
    let user = await this.usersService.findOneByEmail(email);
    if (!user) {
      user = await this.usersService.createUser({
        email,
        firstName: '',
        lastName: '',
      });
    }

    // Generate JWT
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }
}
