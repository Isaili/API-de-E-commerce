import {
  IsString,
  IsNumber,
  IsPositive,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'iPhone 15 Pro' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'El último iPhone con chip A17 Pro' })
  @IsString()
  description: string;

  @ApiProperty({ example: 999.99 })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiProperty({ example: 'Electronics', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ example: 'IPH-15-PRO', required: false })
  @IsOptional()
  @IsString()
  sku?: string;
}