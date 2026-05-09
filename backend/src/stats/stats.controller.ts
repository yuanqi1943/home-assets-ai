import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('stats')
export class StatsController {
  constructor(private service: StatsService) {}

  @Get('overview')
  overview(@Request() req, @Query('currency') currency?: string) {
    return this.service.getOverview(req.user.userId, currency);
  }

  @Get('category-count')
  categoryCount(@Request() req) {
    return this.service.getCategoryCount(req.user.userId);
  }

  @Get('category-value')
  categoryValue(@Request() req) {
    return this.service.getCategoryValue(req.user.userId);
  }

  @Get('monthly-trend')
  monthlyTrend(@Request() req) {
    return this.service.getMonthlyTrend(req.user.userId);
  }

  @Get('top-expensive')
  topExpensive(@Request() req, @Query('limit') limit?: string) {
    return this.service.getTopExpensive(req.user.userId, limit ? +limit : 5);
  }
}
