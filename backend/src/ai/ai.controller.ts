import { Controller, Post, UseGuards, Request, UseInterceptors, UploadedFile, UploadedFiles } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import * as fs from 'fs';

const uploadsDir = join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('recognize')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: uploadsDir,
        filename: (req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, unique + extname(file.originalname));
        },
      }),
    }),
  )
  async recognize(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return { name: '', categoryName: '', categoryId: null, description: '' };
    }
    const base64 = fs.readFileSync(file.path).toString('base64');
    const result = await this.aiService.recognize(req.user.userId, base64, file.mimetype);
    fs.unlinkSync(file.path);
    return result;
  }

  @Post('recognize-batch')
  @UseInterceptors(
    FilesInterceptor('images', 9, {
      storage: diskStorage({
        destination: uploadsDir,
        filename: (req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, unique + extname(file.originalname));
        },
      }),
    }),
  )
  async recognizeBatch(@Request() req, @UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      return [];
    }
    const results: Array<{ name: string; categoryName: string; categoryId: number | null; description: string; price: number }> = [];
    for (const file of files) {
      try {
        const base64 = fs.readFileSync(file.path).toString('base64');
        const result = await this.aiService.recognize(req.user.userId, base64, file.mimetype);
        results.push(result);
      } catch {
        results.push({ name: '未知物品', categoryName: '其他', categoryId: null, description: '', price: 0 });
      } finally {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }
    return results;
  }
}
