import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Request() req: any,
    @Body() data: { doctorId: number; rating: number; comment?: string },
  ) {
    if (req.user.role !== 'PATIENT') {
      throw new Error('Only patients can leave reviews');
    }
    return this.reviewsService.createReview(
      req.user.userId,
      data.doctorId,
      data.rating,
      data.comment,
    );
  }

  @Get('doctor/:id')
  getForDoctor(@Param('id') doctorId: string) {
    return this.reviewsService.getReviewsForDoctor(+doctorId);
  }
}
