import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In, Between } from 'typeorm';
import { Item } from '../entities/item.entity';
import { ItemTag } from '../entities/item-tag.entity';
import { Tag } from '../entities/tag.entity';
import * as fs from 'fs';
import { join } from 'path';

export interface ItemFilter {
  search?: string;
  categoryId?: number;
  tagId?: number;
  page?: number;
  limit?: number;
}

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private itemRepo: Repository<Item>,
    @InjectRepository(ItemTag)
    private itemTagRepo: Repository<ItemTag>,
    @InjectRepository(Tag)
    private tagRepo: Repository<Tag>,
  ) {}

  async findAll(userId: number, filter: ItemFilter) {
    const { search, categoryId, tagId, page = 1, limit = 20 } = filter;
    const qb = this.itemRepo.createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category')
      .leftJoinAndSelect('item.item_tags', 'item_tags')
      .leftJoinAndSelect('item_tags.tag', 'tag')
      .where('item.user_id = :userId', { userId });

    if (search) {
      qb.andWhere(
        '(item.name LIKE :search OR item.location LIKE :search OR tag.name LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (categoryId) {
      qb.andWhere('item.category_id = :categoryId', { categoryId });
    }

    if (tagId) {
      qb.andWhere('item_tags.tag_id = :tagId', { tagId });
    }

    qb.orderBy('item.created_at', 'DESC');

    const total = await qb.getCount();
    qb.skip((page - 1) * limit).take(limit);
    const items = await qb.getMany();

    return {
      data: items.map((item) => this.mapItem(item)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(userId: number, id: number) {
    const item = await this.itemRepo.findOne({
      where: { id, user_id: userId },
      relations: ['category', 'item_tags', 'item_tags.tag'],
    });
    if (!item) throw new NotFoundException('Item not found');
    return this.mapItem(item);
  }

  async create(userId: number, dto: any, imageUrl?: string) {
    const item = this.itemRepo.create({
      user_id: userId,
      name: dto.name,
      category_id: dto.category_id,
      purchase_date: dto.purchase_date || null,
      price: dto.price || 0,
      status: dto.status || '全新',
      source: dto.source || null,
      expiry_date: dto.expiry_date || null,
      description: dto.description || null,
      location: dto.location || null,
      image_url: imageUrl || null,
    });
    const saved = (await this.itemRepo.save(item)) as unknown as Item;

    if (dto.tag_ids && dto.tag_ids.length > 0) {
      const itemTags = dto.tag_ids.map((tagId: number) => ({
        item_id: saved.id,
        tag_id: tagId,
      }));
      await this.itemTagRepo.save(itemTags);
    }

    return this.findOne(userId, saved.id);
  }

  async update(userId: number, id: number, dto: any, imageUrl?: string) {
    const item = await this.itemRepo.findOne({ where: { id, user_id: userId } });
    if (!item) throw new NotFoundException('Item not found');

    const oldImageUrl = item.image_url;

    Object.assign(item, {
      name: dto.name ?? item.name,
      category_id: dto.category_id ?? item.category_id,
      purchase_date: dto.purchase_date ?? item.purchase_date,
      price: dto.price ?? item.price,
      status: dto.status ?? item.status,
      source: dto.source ?? item.source,
      expiry_date: dto.expiry_date ?? item.expiry_date,
      description: dto.description ?? item.description,
      location: dto.location ?? item.location,
      image_url: imageUrl ?? item.image_url,
    });

    await this.itemRepo.save(item);

    if (imageUrl && oldImageUrl && oldImageUrl !== imageUrl) {
      this.deleteImageFile(oldImageUrl);
    }

    if (dto.tag_ids !== undefined) {
      await this.itemTagRepo.delete({ item_id: id });
      if (dto.tag_ids.length > 0) {
        const itemTags = dto.tag_ids.map((tagId: number) => ({
          item_id: id,
          tag_id: tagId,
        }));
        await this.itemTagRepo.save(itemTags);
      }
    }

    return this.findOne(userId, id);
  }

  private deleteImageFile(imageUrl?: string | null) {
    if (!imageUrl) return;
    const filename = imageUrl.replace('/uploads/', '');
    const filepath = join(process.cwd(), 'uploads', filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }

  async remove(userId: number, id: number) {
    const item = await this.itemRepo.findOne({ where: { id, user_id: userId } });
    if (!item) throw new NotFoundException('Item not found');
    this.deleteImageFile(item.image_url);
    await this.itemRepo.remove(item);
    return { success: true };
  }

  async batchDelete(userId: number, ids: number[]) {
    const items = await this.itemRepo.find({
      where: { user_id: userId, id: In(ids) },
      select: ['image_url'],
    });
    for (const item of items) {
      this.deleteImageFile(item.image_url);
    }
    await this.itemRepo.delete({ user_id: userId, id: In(ids) });
    return { success: true };
  }

  async batchUpdateCategory(userId: number, ids: number[], categoryId: number) {
    await this.itemRepo.update(
      { user_id: userId, id: In(ids) },
      { category_id: categoryId },
    );
    return { success: true };
  }

  async batchUpdateTags(userId: number, ids: number[], tagIds: number[]) {
    for (const itemId of ids) {
      await this.itemTagRepo.delete({ item_id: itemId });
      if (tagIds.length > 0) {
        const itemTags = tagIds.map((tagId) => ({ item_id: itemId, tag_id: tagId }));
        await this.itemTagRepo.save(itemTags);
      }
    }
    return { success: true };
  }

  async batchCreate(userId: number, payloads: Array<{ dto: any; imageUrl?: string }>) {
    let count = 0;
    for (const { dto, imageUrl } of payloads) {
      await this.create(userId, dto, imageUrl);
      count++;
    }
    return { success: true, count };
  }

  private mapItem(item: Item) {
    return {
      ...item,
      tags: item.item_tags?.map((it) => it.tag) || [],
    };
  }
}
