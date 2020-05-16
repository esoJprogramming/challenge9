import { getRepository, Repository } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import AppError from '@shared/errors/AppError';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({ name, price, quantity });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const foundProduct = await this.ormRepository.findOne({
      where: {
        name,
      },
    });

    return foundProduct;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const productsFoundById = await Promise.all(
      products.map(async product => {
        const productFound = await this.ormRepository.findOne({
          where: { id: product.id },
        });

        if (!productFound) {
          throw new AppError('Product not found');
        }

        return productFound;
      }),
    );

    return productsFoundById;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const updatedProducts = await Promise.all(
      products.map(async product => {
        const productFound = await this.ormRepository.findOne({
          where: { id: product.id },
        });

        if (!productFound) {
          throw new AppError('Product not found');
        }

        productFound.quantity -= product.quantity;

        const updatedProduct = await this.ormRepository.save(productFound);

        return updatedProduct;
      }),
    );

    return updatedProducts;
  }
}

export default ProductsRepository;
