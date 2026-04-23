import {
  Entity, PrimaryGeneratedColumn, OneToOne, JoinColumn,
  OneToMany, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CartItem } from './cart-item.entity';

@Entity('carts')
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.cart)
  @JoinColumn()
  user: User;

  @OneToMany(() => CartItem, (item) => item.cart, { cascade: true, eager: true })
  items: CartItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  get total(): number {
    return this.items?.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    ) ?? 0;
  }
}