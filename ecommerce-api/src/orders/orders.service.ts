import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CartService } from '../cart/cart.service';
import { ProductsService } from '../products/products.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '../common/enums/order-status.enum';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,
    private cartService: CartService,
    private productsService: ProductsService,
  ) {}

  async createFromCart(userId: string, dto: CreateOrderDto): Promise<Order> {
    const cart = await this.cartService.getCart(userId);

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('El carrito está vacío');
    }

    let total = 0;
    const orderItems: OrderItem[] = [];

    for (const cartItem of cart.items) {
      // Verificar stock
      await this.productsService.updateStock(cartItem.product.id, cartItem.quantity);

      const orderItem = this.orderItemsRepository.create({
        product: cartItem.product,
        quantity: cartItem.quantity,
        priceAtPurchase: cartItem.product.price,
      });

      total += cartItem.product.price * cartItem.quantity;
      orderItems.push(orderItem);
    }

    const order = this.ordersRepository.create({
      user: { id: userId } as any,
      items: orderItems,
      total,
      shippingAddress: dto.shippingAddress,
      status: OrderStatus.PENDING,
    });

    const savedOrder = await this.ordersRepository.save(order);

    // Limpiar carrito
    await this.cartService.clearCart(userId);

    return savedOrder;
  }

  async findUserOrders(userId: string): Promise<Order[]> {
    return this.ordersRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId?: string): Promise<Order> {
    const where: any = { id };
    if (userId) where.user = { id: userId };

    const order = await this.ordersRepository.findOne({ where });
    if (!order) throw new NotFoundException('Orden no encontrada');
    return order;
  }

  async findAll(): Promise<Order[]> {
    return this.ordersRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.findOne(id);
    order.status = status;
    return this.ordersRepository.save(order);
  }

  async updatePaymentIntent(id: string, paymentIntentId: string): Promise<void> {
    await this.ordersRepository.update(id, {
      stripePaymentIntentId: paymentIntentId,
      status: OrderStatus.PAID,
    });
  }
}