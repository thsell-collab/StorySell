// Prisma Session model CRUD operations
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const SessionModel = {
  findMany: (args = {}) => prisma.session.findMany(args),
  findUnique: (args) => prisma.session.findUnique(args),
  create: (args) => prisma.session.create(args),
  update: (args) => prisma.session.update(args),
  delete: (args) => prisma.session.delete(args),
};

// Usage example in a route:

// import { SessionModel } from '../models/session';
// const sessions = await SessionModel.findMany();
