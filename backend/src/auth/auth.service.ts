import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from '../entities/user.entity';
import { Category } from '../entities/category.entity';
import { Tag } from '../entities/tag.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
    @InjectRepository(Tag)
    private tagRepo: Repository<Tag>,
    private jwtService: JwtService,
  ) {}

  async register(email: string, password: string) {
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({ email, password_hash });
    const saved = await this.userRepo.save(user);

    const defaultCategories = ['食品', '药品', '电器', '服装', '书籍', '3C'];
    for (let i = 0; i < defaultCategories.length; i++) {
      const cat = this.categoryRepo.create({
        name: defaultCategories[i],
        user_id: saved.id,
        show_on_home: true,
        sort_order: i,
        is_default: true,
      });
      await this.categoryRepo.save(cat);
    }

    const defaultTags = ['常用', '备用', '礼品', '二手'];
    for (const tagName of defaultTags) {
      const tag = this.tagRepo.create({
        name: tagName,
        user_id: saved.id,
      });
      await this.tagRepo.save(tag);
    }

    return this.buildTokenResponse(saved);
  }

  async login(email: string, password: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildTokenResponse(user);
  }

  async me(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'email', 'preferred_currency', 'created_at'],
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  private buildTokenResponse(user: User) {
    const payload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET || 'family-inventory-secret-key-2024',
        expiresIn: '7d',
      }),
      user: {
        id: user.id,
        email: user.email,
        preferred_currency: user.preferred_currency,
      },
    };
  }
}
