import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { Category } from '../entities/category.entity';
import { Item } from '../entities/item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Item])],
  controllers: [CategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
