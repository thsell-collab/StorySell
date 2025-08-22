// Prisma Stores model CRUD operations
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const StoresModel = {
  findMany: (args = {}) => prisma.stores.findMany(args),
  findUnique: (args) => prisma.stores.findUnique(args),
  findByShop: (shop) => prisma.stores.findUnique({ where: { shop } }),
  create: (args) => prisma.stores.create(args),
  update: (args) => prisma.stores.update(args),
  upsert: (args) => prisma.stores.upsert(args),
  delete: (args) => prisma.stores.delete(args),
};

// Usage examples in routes:

// import { StoresModel } from '../models/stores';

// Find all stores
// const stores = await StoresModel.findMany();

// Find specific store
// const store = await StoresModel.findByShop('example.myshopify.com');

// Update only plan status (if store exists)
// await StoresModel.update({
//   where: { shop: 'example.myshopify.com' },
//   data: { plan_status: 'cancelled' }
// });
