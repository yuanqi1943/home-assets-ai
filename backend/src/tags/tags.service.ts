import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from '../entities/tag.entity';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private tagRepo: Repository<Tag>,
  ) {}

  async findAll(userId: number) {
    return this.tagRepo.find({
      where: { user_id: userId },
      order: { id: 'ASC' },
    });
  }

  async create(userId: number, name: string) {
    const tag = this.tagRepo.create({ name, user_id: userId });
    return this.tagRepo.save(tag);
  }

  async update(userId: number, id: number, name: string) {
    const tag = await this.tagRepo.findOne({ where: { id, user_id: userId } });
    if (!tag) throw new NotFoundException('Tag not found');
    tag.name = name;
    return this.tagRepo.save(tag);
  }

  async remove(userId: number, id: number) {
    const tag = await this.tagRepo.findOne({ where: { id, user_id: userId } });
    if (!tag) throw new NotFoundException('Tag not found');
    await this.tagRepo.remove(tag);
    return { success: true };
  }
}
