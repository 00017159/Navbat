import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async createReview(
    patientId: number,
    doctorId: number,
    rating: number,
    comment?: string,
  ) {
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create a review
      const review = await tx.review.create({
        data: {
          patientId,
          doctorId,
          rating,
          comment,
        },
      });

      // 2. Recalculate doctor rating
      const allReviews = await tx.review.findMany({ where: { doctorId } });
      const avg =
        allReviews.reduce((acc, curr) => acc + curr.rating, 0) /
        allReviews.length;

      // 3. Update doctor profile
      await tx.doctorProfile.update({
        where: { userId: doctorId },
        data: {
          rating: avg,
          reviewCount: allReviews.length,
        },
      });

      return review;
    });
  }

  async getReviewsForDoctor(doctorId: number) {
    return this.prisma.review.findMany({
      where: { doctorId },
      include: {
        patient: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
