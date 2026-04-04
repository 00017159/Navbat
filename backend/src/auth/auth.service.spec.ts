import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { mockPrisma, resetMockPrisma } from '../prisma/prisma.mock';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<Partial<UsersService>>;
  let jwtService: jest.Mocked<Partial<JwtService>>;

  beforeEach(async () => {
    resetMockPrisma();

    usersService = {
      findOneByEmail: jest.fn(),
      createUser: jest.fn(),
    };

    jwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('requestOtp', () => {
    it('should generate an OTP and store it in the database', async () => {
      const email = 'test@example.com';
      mockPrisma.otpCode.create.mockResolvedValueOnce({} as any);

      const result = await service.requestOtp(email);

      expect(mockPrisma.otpCode.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.otpCode.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email,
          code: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      });
      expect(result.message).toBe(`Verification code sent to ${email}`);
    });
  });

  describe('verifyOtp', () => {
    it('should throw an UnauthorizedException if OTP is invalid', async () => {
      mockPrisma.otpCode.findFirst.mockResolvedValueOnce(null);

      await expect(service.verifyOtp('test@example.com', '123456')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should verify OTP and return a valid access token', async () => {
      const mockEmail = 'patient@navbat.uz';
      const mockCode = '123456';
      
      const mockOtpRecord = { id: 1, email: mockEmail, code: mockCode } as any;
      const mockUser = { id: 1, email: mockEmail, role: 'PATIENT', firstName: 'John', lastName: 'Doe' } as any;
      
      mockPrisma.otpCode.findFirst.mockResolvedValueOnce(mockOtpRecord);
      mockPrisma.otpCode.update.mockResolvedValueOnce(mockOtpRecord);
      
      // Assume user already exists
      (usersService.findOneByEmail as jest.Mock).mockResolvedValueOnce(mockUser);
      (jwtService.sign as jest.Mock).mockReturnValue('mocked.jwt.token');

      const result = await service.verifyOtp(mockEmail, mockCode);

      expect(mockPrisma.otpCode.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ email: mockEmail, code: mockCode }) })
      );
      expect(mockPrisma.otpCode.update).toHaveBeenCalledWith({
        where: { id: mockOtpRecord.id },
        data: { used: true },
      });
      expect(jwtService.sign).toHaveBeenCalled();
      expect(result.access_token).toBe('mocked.jwt.token');
      expect(result.user.email).toBe(mockEmail);
    });
  });
});
