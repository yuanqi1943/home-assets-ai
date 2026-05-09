import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createObjectCsvStringifier } from 'csv-writer';
import { Item } from '../entities/item.entity';

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(Item)
    private itemRepo: Repository<Item>,
  ) {}

  async exportItems(userId: number) {
    const items = await this.itemRepo.find({
      where: { user_id: userId },
      relations: ['category', 'item_tags', 'item_tags.tag'],
      order: { created_at: 'DESC' },
    });

    const records = items.map((item) => ({
      ID: item.id,
      名称: item.name,
      分类: item.category?.name || '',
      购入日期: item.purchase_date ? item.purchase_date.toISOString().split('T')[0] : '',
      价格: item.price,
      状态: item.status,
      来源: item.source || '',
      过期日期: item.expiry_date ? item.expiry_date.toISOString().split('T')[0] : '',
      位置: item.location || '',
      描述: item.description || '',
      标签: item.item_tags?.map((it) => it.tag.name).join(', ') || '',
      图片URL: item.image_url || '',
      创建时间: item.created_at?.toISOString() || '',
    }));

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'ID', title: 'ID' },
        { id: '名称', title: '名称' },
        { id: '分类', title: '分类' },
        { id: '购入日期', title: '购入日期' },
        { id: '价格', title: '价格' },
        { id: '状态', title: '状态' },
        { id: '来源', title: '来源' },
        { id: '过期日期', title: '过期日期' },
        { id: '位置', title: '位置' },
        { id: '描述', title: '描述' },
        { id: '标签', title: '标签' },
        { id: '图片URL', title: '图片URL' },
        { id: '创建时间', title: '创建时间' },
      ],
    });

    const header = csvStringifier.getHeaderString();
    const rows = csvStringifier.stringifyRecords(records);
    return header + rows;
  }
}
