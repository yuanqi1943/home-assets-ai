import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Category } from './category.entity';
import { ItemTag } from './item-tag.entity';

export type ItemStatus = '全新' | '中古' | '待维护';

@Entity('items')
export class Item {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  name: string;

  @Column()
  category_id: number;

  @Column({ nullable: true })
  purchase_date: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  price: number;

  @Column({ default: '全新' })
  status: ItemStatus;

  @Column({ type: 'varchar', nullable: true })
  source: string | null;

  @Column({ type: 'date', nullable: true })
  expiry_date: Date | null;

  @Column({ type: 'varchar', nullable: true, length: 500 })
  description: string | null;

  @Column({ type: 'varchar', nullable: true })
  location: string | null;

  @Column({ type: 'varchar', nullable: true })
  image_url: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User, (user) => user.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Category, (category) => category.items)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => ItemTag, (itemTag) => itemTag.item, { cascade: true })
  item_tags: ItemTag[];
}
