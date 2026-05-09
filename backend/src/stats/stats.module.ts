import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { Item } from '../entities/item.entity';
import { Category } from '../entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Item, Category])],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
