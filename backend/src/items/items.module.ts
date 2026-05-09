import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { Item } from '../entities/item.entity';
import { ItemTag } from '../entities/item-tag.entity';
import { Tag } from '../entities/tag.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Item, ItemTag, Tag])],
  controllers: [ItemsController],
  providers: [ItemsService],
})
export class ItemsModule {}
