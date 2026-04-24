import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ example: 'Calle Insurgentes 123, CDMX', required: false })
  @IsOptional()
  @IsString()
  shippingAddress?: string;
}