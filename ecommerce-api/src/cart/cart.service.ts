import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { ProductsService } from '../products/products.service';
import { AddItemDto } from './dto/add-item.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    private productsService: ProductsService,
  ) {}

  async getCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product'],
    });

    if (!cart) {
      cart = this.cartRepository.create({ user: { id: userId } as any, items: [] });
      cart = await this.cartRepository.save(cart);
    }

    return cart;
  }

  async addItem(userId: string, addItemDto: AddItemDto): Promise<Cart> {
    const cart = await this.getCart(userId);
    const product = await this.productsService.findOne(addItemDto.productId);

    const existingItem = cart.items.find(
      (item) => item.product.id === product.id,
    );

    if (existingItem) {
      existingItem.quantity += addItemDto.quantity;
      await this.cartItemRepository.save(existingItem);
    } else {
      const cartItem = this.cartItemRepository.create({
        cart,
        product,
        quantity: addItemDto.quantity,
      });
      await this.cartItemRepository.save(cartItem);
    }

    return this.getCart(userId);
  }

  async updateItem(userId: string, itemId: string, quantity: number): Promise<Cart> {
    const cart = await this.getCart(userId);
    const item = cart.items.find((i) => i.id === itemId);

    if (!item) throw new NotFoundException('Item no encontrado en el carrito');

    if (quantity <= 0) {
      await this.cartItemRepository.remove(item);
    } else {
      item.quantity = quantity;
      await this.cartItemRepository.save(item);
    }

    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string): Promise<Cart> {
    const cart = await this.getCart(userId);
    const item = cart.items.find((i) => i.id === itemId);

    if (!item) throw new NotFoundException('Item no encontrado en el carrito');

    await this.cartItemRepository.remove(item);
    return this.getCart(userId);
  }

  async clearCart(userId: string): Promise<void> {
    const cart = await this.getCart(userId);
    await this.cartItemRepository.remove(cart.items);
  }
}