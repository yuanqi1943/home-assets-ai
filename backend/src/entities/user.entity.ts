import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Category } from './category.entity';
import { Tag } from './tag.entity';
import { Item } from './item.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password_hash: string;

  @Column({ default: 'CNY' })
  preferred_currency: string;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => Category, (category) => category.user)
  categories: Category[];

  @OneToMany(() => Tag, (tag) => tag.user)
  tags: Tag[];

  @OneToMany(() => Item, (item) => item.user)
  items: Item[];
}
