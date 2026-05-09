import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Request,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { ItemsService } from './items.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import * as fs from 'fs';

const uploadsDir = join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

@UseGuards(JwtAuthGuard)
@Controller('items')
export class ItemsController {
  constructor(private service: ItemsService) {}

  @Get()
  findAll(
    @Request() req,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('tagId') tagId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll(req.user.userId, {
      search,
      categoryId: categoryId ? +categoryId : undefined,
      tagId: tagId ? +tagId : undefined,
      page: page ? +page : 1,
      limit: limit ? +limit : 20,
    });
  }

  @Get(':id')
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(req.user.userId, id);
  }

  @Post()
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
  create(
    @Request() req,
    @Body() dto: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const imageUrl = file ? `/uploads/${file.filename}` : undefined;
    return this.service.create(req.user.userId, dto, imageUrl);
  }

  @Put(':id')
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
  update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const imageUrl = file ? `/uploads/${file.filename}` : undefined;
    return this.service.update(req.user.userId, id, dto, imageUrl);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(req.user.userId, id);
  }

  @Delete('batch')
  batchDelete(@Request() req, @Body('ids') ids: number[]) {
    return this.service.batchDelete(req.user.userId, ids);
  }

  @Put('batch/category')
  batchUpdateCategory(
    @Request() req,
    @Body('ids') ids: number[],
    @Body('categoryId') categoryId: number,
  ) {
    return this.service.batchUpdateCategory(req.user.userId, ids, categoryId);
  }

  @Put('batch/tags')
  batchUpdateTags(
    @Request() req,
    @Body('ids') ids: number[],
    @Body('tagIds') tagIds: number[],
  ) {
    return this.service.batchUpdateTags(req.user.userId, ids, tagIds);
  }
}
