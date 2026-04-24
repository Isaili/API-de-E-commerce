import {
  Controller, Post, Body, UseGuards, Headers, RawBodyRequest, Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, PaymentMethod } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Iniciar pago (checkout_session o payment_intent)' })
  createPayment(
    @Body() dto: CreatePaymentDto,
    @CurrentUser() user: User,
  ) {
    if (dto.method === PaymentMethod.CHECKOUT_SESSION) {
      return this.paymentsService.createCheckoutSession(dto.orderId, user.id, dto.currency);
    }
    return this.paymentsService.createPaymentIntent(dto.orderId, user.id, dto.currency);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Webhook de Stripe (no requiere auth)' })
  handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.paymentsService.handleWebhook(signature, req.rawBody);
  }
}