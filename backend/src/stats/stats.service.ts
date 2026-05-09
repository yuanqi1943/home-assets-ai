import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Item } from '../entities/item.entity';
import { Category } from '../entities/category.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Item)
    private itemRepo: Repository<Item>,
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
  ) {}

  async getOverview(userId: number, targetCurrency?: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const totalItems = await this.itemRepo.count({ where: { user_id: userId } });

    const newItemsThisMonth = await this.itemRepo.count({
      where: { user_id: userId, created_at: Between(startOfMonth, now) },
    });

    const totalCategories = await this.categoryRepo.count({ where: { user_id: userId } });

    const newCategoriesThisMonth = await this.categoryRepo.count({
      where: { user_id: userId, created_at: Between(startOfMonth, now) },
    });

    const allItems = await this.itemRepo.find({ where: { user_id: userId }, select: ['price'] });
    const totalValue = allItems.reduce((sum, item) => sum + Number(item.price || 0), 0);

    const lastMonthItems = await this.itemRepo.find({
      where: { user_id: userId, created_at: Between(startOfLastMonth, endOfLastMonth) },
      select: ['price'],
    });
    const lastMonthValue = lastMonthItems.reduce((sum, item) => sum + Number(item.price || 0), 0);

    const prevItems = await this.itemRepo.find({
      where: { user_id: userId, created_at: Between(new Date(0), startOfLastMonth) },
      select: ['price'],
    });
    const prevValue = prevItems.reduce((sum, item) => sum + Number(item.price || 0), 0);

    let valueChangePercent = 0;
    if (prevValue > 0) {
      valueChangePercent = ((lastMonthValue - prevValue) / prevValue) * 100;
    }

    return {
      totalItems,
      newItemsThisMonth,
      totalCategories,
      newCategoriesThisMonth,
      totalValue: Number(totalValue.toFixed(2)),
      valueChangePercent: Number(valueChangePercent.toFixed(2)),
      targetCurrency: targetCurrency || 'CNY',
    };
  }

  async getCategoryCount(userId: number) {
    const items = await this.itemRepo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category')
      .where('item.user_id = :userId', { userId })
      .getMany();

    const map = new Map<string, number>();
    for (const item of items) {
      const name = item.category?.name || '未分类';
      map.set(name, (map.get(name) || 0) + 1);
    }
    return Array.from(map.entries()).map(([categoryName, count]) => ({ categoryName, count }));
  }

  async getCategoryValue(userId: number) {
    const items = await this.itemRepo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category')
      .where('item.user_id = :userId', { userId })
      .getMany();

    const map = new Map<string, number>();
    for (const item of items) {
      const name = item.category?.name || '未分类';
      map.set(name, (map.get(name) || 0) + Number(item.price || 0));
    }
    return Array.from(map.entries()).map(([categoryName, totalValue]) => ({
      categoryName,
      totalValue: Number(totalValue.toFixed(2)),
    }));
  }

  async getMonthlyTrend(userId: number) {
    const now = new Date();
    const result: { month: string; itemCount: number; totalValue: number }[] = [];

    for (let i = 11; i >= 0; i--) {
      const year = now.getFullYear();
      const month = now.getMonth() - i;
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59);
      const label = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;

      const items = await this.itemRepo.find({
        where: { user_id: userId, created_at: Between(start, end) },
        select: ['price'],
      });

      result.push({
        month: label,
        itemCount: items.length,
        totalValue: Number(items.reduce((s, it) => s + Number(it.price || 0), 0).toFixed(2)),
      });
    }

    return result;
  }

  async getTopExpensive(userId: number, limit = 5) {
    return this.itemRepo.find({
      where: { user_id: userId },
      order: { price: 'DESC' },
      take: limit,
      relations: ['category'],
    });
  }
}
