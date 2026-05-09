import { Controller, Get, Request, UseGuards, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('export')
export class ExportController {
  constructor(private service: ExportService) {}

  @Get('items')
  async exportItems(@Request() req, @Res() res: Response) {
    const csv = await this.service.exportItems(req.user.userId);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="items.csv"');
    res.send('\uFEFF' + csv);
  }
}
