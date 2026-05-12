import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';

@Injectable()
export class AiService {
  constructor(
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
  ) {}

  async recognize(userId: number, imageBase64: string, mimeType: string) {
    const DASHSCOPE_API_KEY = 'sk-c2ce0b89ec4442bf89ff6a05897b470e'; // 请替换为您的真实 API Key
    const QWEN_MODEL = 'qwen3-vl-plus';
    const DASHSCOPE_URL =
      'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
    const categories = await this.categoryRepo.find({
      where: { user_id: userId },
    });
    const categoryNames = categories.map((c) => c.name).join(', ');

      const prompt = `You are an expert at identifying household items from images. Please analyze this image and return ONLY a valid JSON object with no markdown formatting, no code blocks, just raw JSON. The JSON must have these exact keys:
{
  "name": "The common Chinese name of the item (keep it concise, under 10 characters)",
  "categoryName": "The most appropriate category from these options: ${categoryNames}. If none match well, suggest a new concise Chinese category name.",
  "description": "A brief Chinese description of the item (under 100 characters) including brand/model if visible, color, and key features.",
  "price": "Estimated price in Chinese Yuan (CNY). Return a number only, no currency symbol. If you cannot estimate, return 0."
}

Rules:
1. Return ONLY the JSON object, nothing else.
2. Do not wrap in markdown code blocks.
3. Ensure valid JSON syntax with double quotes.
4. Price must be a number, not a string.`;
    const dataUrl = `data:${mimeType};base64,${imageBase64}`;
    const requestBody = {
      model: QWEN_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: dataUrl,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
      max_tokens: 500,
    };
    try {
      const response = await axios.post(DASHSCOPE_URL, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        },
      });
      const content = response.data?.choices?.[0]?.message?.content || '';
      const jsonStr = this.extractJson(content);
      const result = JSON.parse(jsonStr);

      const matchedCategory = categories.find(
        (c) => c.name === result.categoryName || c.name.includes(result.categoryName) || result.categoryName.includes(c.name),
      );

      return {
        name: result.name || '未知物品',
        categoryName: matchedCategory?.name || result.categoryName || '其他',
        categoryId: matchedCategory?.id || null,
        description: result.description || '',
        price: Number(result.price) || 0,
      };
    } catch (err: any) {
      return {
        name: '未知物品',
        categoryName: '其他',
        categoryId: null,
        description: '',
        price: 0,
      };
    }
  }

  private extractJson(content: string): string {
    const codeBlock = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (codeBlock) return codeBlock[1].trim();
    const braces = content.match(/\{[\s\S]*\}/);
    if (braces) return braces[0];
    return content.trim();
  }
}
