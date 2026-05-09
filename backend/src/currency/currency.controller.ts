import { Controller, Get, Query } from '@nestjs/common';
import { CurrencyService } from './currency.service';

@Controller('currency')
export class CurrencyController {
  constructor(private service: CurrencyService) {}

  @Get('rates')
  rates(@Query('base') base?: string) {
    return this.service.getRates(base || 'CNY');
  }
}
