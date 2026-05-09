import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { User } from './entities/user.entity';
import { Category } from './entities/category.entity';
import { Tag } from './entities/tag.entity';
import { Item } from './entities/item.entity';
import { ItemTag } from './entities/item-tag.entity';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { TagsModule } from './tags/tags.module';
import { ItemsModule } from './items/items.module';
import { AiModule } from './ai/ai.module';
import { StatsModule } from './stats/stats.module';
import { CurrencyModule } from './currency/currency.module';
import { ExportModule } from './export/export.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3', // ← 原来写的是 'sqlite'
      database: join(__dirname, '..', 'data.sqlite'),
      entities: [User, Category, Tag, Item, ItemTag],
      synchronize: true,
    }),
    AuthModule,
    CategoriesModule,
    TagsModule,
    ItemsModule,
    AiModule,
    StatsModule,
    CurrencyModule,
    ExportModule,
  ],
})
export class AppModule {}
