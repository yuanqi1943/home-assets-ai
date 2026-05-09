import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Item } from './item.entity';
import { Tag } from './tag.entity';

@Entity('item_tags')
export class ItemTag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  item_id: number;

  @Column()
  tag_id: number;

  @ManyToOne(() => Item, (item) => item.item_tags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @ManyToOne(() => Tag, (tag) => tag.item_tags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag: Tag;
}
