import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { Item } from '../entities/item.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
    @InjectRepository(Item)
    private itemRepo: Repository<Item>,
  ) {}

  async findAll(userId: number) {
    return this.categoryRepo.find({
      where: { user_id: userId },
      order: { sort_order: 'ASC', id: 'ASC' },
    });
  }

  async create(userId: number, name: string, showOnHome: boolean, sortOrder: number) {
    const cat = this.categoryRepo.create({
      name,
      user_id: userId,
      show_on_home: showOnHome ?? true,
      sort_order: sortOrder ?? 0,
      is_default: false,
    });
    return this.categoryRepo.save(cat);
  }

  async update(userId: number, id: number, updates: Partial<Category>) {
    const cat = await this.categoryRepo.findOne({ where: { id, user_id: userId } });
    if (!cat) throw new NotFoundException('Category not found');
    Object.assign(cat, updates);
    return this.categoryRepo.save(cat);
  }

  async remove(userId: number, id: number) {
    const cat = await this.categoryRepo.findOne({ where: { id, user_id: userId } });
    if (!cat) throw new NotFoundException('Category not found');

    const items = await this.itemRepo.count({ where: { category_id: id, user_id: userId } });
    if (items > 0) {
      throw new BadRequestException('Cannot delete category with existing items');
    }

    await this.categoryRepo.remove(cat);
    return { success: true };
  }
}
