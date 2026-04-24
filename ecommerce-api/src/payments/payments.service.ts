import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { OrdersService } from '../orders/orders.service';
import { Order } from '../orders/entities/order.entity';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private ordersService: OrdersService,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY'),
      { apiVersion: '2023-10-16' },
    );
  }

  /**
   * Crear un Checkout Session de Stripe para una orden
   */
  async createCheckoutSession(orderId: string, userId: string) {
    const order = await this.ordersService.findOne(orderId, userId);

    const lineItems = order.items.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.product.name,
          description: item.product.description,
          images: item.product.imageUrl ? [item.product.imageUrl] : [],
        },
        unit_amount: Math.round(item.priceAtPurchase * 100), // Stripe usa centavos
      },
      quantity: item.quantity,
    }));

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${this.configService.get('FRONTEND_URL')}/orders/${orderId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.configService.get('FRONTEND_URL')}/orders/${orderId}/cancel`,
      metadata: {
        orderId: order.id,
        userId,
      },
    });

    return { url: session.url, sessionId: session.id };
  }

  /**
   * Crear un PaymentIntent para pagos personalizados
   */
  async createPaymentIntent(orderId: string, userId: string) {
    const order = await this.ordersService.findOne(orderId, userId);

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(order.total * 100),
      currency: 'usd',
      metadata: { orderId: order.id, userId },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }

  /**
   * Manejar webhooks de Stripe
   */
  async handleWebhook(signature: string, rawBody: Buffer) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      throw new BadRequestException(`Webhook inválido: ${err.message}`);
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { orderId } = session.metadata;

        await this.ordersService.updatePaymentIntent(
          orderId,
          session.payment_intent as string,
        );
        console.log(`✅ Pago completado para orden: ${orderId}`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const { orderId } = paymentIntent.metadata;
        console.log(`❌ Pago fallido para orden: ${orderId}`);
        break;
      }

      default:
        console.log(`Evento no manejado: ${event.type}`);
    }

    return { received: true };
  }
}