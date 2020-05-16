import { inject, injectable } from 'tsyringe';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import AppError from '@shared/errors/AppError';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateProductService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer not found');
    }

    const allProducts = await this.productsRepository.findAllById(products);

    const productsI = allProducts.map(productOfDb => {
      const findProductOfRequest = products.find(
        product => product.id === productOfDb.id,
      );

      if (!findProductOfRequest) {
        throw new AppError('Product not found');
      }

      if (findProductOfRequest.quantity > productOfDb.quantity) {
        throw new AppError('Quantity is bigger than stock');
      }

      return {
        product_id: findProductOfRequest.id,
        price: productOfDb.price,
        quantity: findProductOfRequest.quantity,
      };
    });

    const order = this.ordersRepository.create({
      customer,
      products: productsI,
    });

    await this.productsRepository.updateQuantity(
      productsI.map(productI => {
        return {
          id: productI.product_id,
          quantity: productI.quantity,
        };
      }),
    );

    return order;
  }
}

export default CreateProductService;
