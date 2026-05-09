import { Controller, Post, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
}
