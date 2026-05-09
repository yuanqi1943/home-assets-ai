import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { IsString, IsBoolean, IsNumber, IsOptional } from 'class-validator';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

class CreateCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  show_on_home?: boolean;

  @IsOptional()
  @IsNumber()
  sort_order?: number;
}

class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  show_on_home?: boolean;

  @IsOptional()
  @IsNumber()
  sort_order?: number;
}

@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private service: CategoriesService) {}

  @Get()
  findAll(@Request() req) {
    return this.service.findAll(req.user.userId);
  }

  @Post()
  create(@Request() req, @Body() dto: CreateCategoryDto) {
    console.log(req.user)
    console.log(dto)
    return this.service.create(req.user.userId, dto.name, dto.show_on_home ?? true, dto.sort_order ?? 0);
  }

  @Put(':id')
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.service.update(req.user.userId, +id, dto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.service.remove(req.user.userId, +id);
  }
}
