import {
  Entity, PrimaryGeneratedColumn, ManyToOne, Column, JoinColumn,
} from 'typeorm';
import { Cart } from './cart.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn()
  cart: Cart;

  @ManyToOne(() => Product, (product) => product.cartItems, { eager: true })
  @JoinColumn()
  product: Product;

  @Column({ default: 1 })
  quantity: number;
}