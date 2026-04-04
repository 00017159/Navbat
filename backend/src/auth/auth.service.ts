import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AuthService {
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {
    this.initMail();
  }

  private async initMail() {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      console.log('✅ SMTP configured for real emails.');
    } else {
      console.warn('⚠️ No SMTP credentials found. Using Ethereal for testing.');
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }
  }

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

    console.log(`\n📧 OTP for ${email}: ${code}\n`);

    if (this.transporter) {
      const info = await this.transporter.sendMail({
        from: '"NavbatUz" <noreply@navbat.uz>',
        to: email,
        subject: 'Your Verification Code',
        text: `Your NavbatUz verification code is: ${code}\nIt will expire in 5 minutes.`,
        html: `<b>Your NavbatUz verification code is:</b> <h2>${code}</h2><p>It will expire in 5 minutes.</p>`,
      });
      
      if (!process.env.SMTP_USER) {
        console.log('📫 Mock Email Preview URL: %s', nodemailer.getTestMessageUrl(info));
      }
    }

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
