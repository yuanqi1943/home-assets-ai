import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { TagsService } from './tags.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

class TagDto {
  name: string;
}

@UseGuards(JwtAuthGuard)
@Controller('tags')
export class TagsController {
  constructor(private service: TagsService) {}

  @Get()
  findAll(@Request() req) {
    return this.service.findAll(req.user.userId);
  }

  @Post()
  create(@Request() req, @Body() dto: TagDto) {
    return this.service.create(req.user.userId, dto.name);
  }

  @Put(':id')
  update(@Request() req, @Param('id') id: string, @Body() dto: TagDto) {
    return this.service.update(req.user.userId, +id, dto.name);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.service.remove(req.user.userId, +id);
  }
}
