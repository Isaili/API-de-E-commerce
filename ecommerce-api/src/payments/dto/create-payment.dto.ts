import { IsUUID, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PaymentMethod {
  CHECKOUT_SESSION = 'checkout_session', // Redirige a la página de Stripe
  PAYMENT_INTENT = 'payment_intent',     // UI de pago personalizada
}

export class CreatePaymentDto {
  @ApiProperty({
    example: 'uuid-de-la-orden',
    description: 'ID de la orden a pagar',
  })
  @IsUUID()
  orderId: string;

  @ApiProperty({
    enum: PaymentMethod,
    default: PaymentMethod.CHECKOUT_SESSION,
    description: 'Método de pago: checkout_session redirige a Stripe, payment_intent es para UI propia',
  })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({
    example: 'usd',
    required: false,
    description: 'Moneda del pago (default: usd)',
  })
  @IsOptional()
  @IsString()
  currency?: string = 'usd';
}