import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import * as path from 'path';

function getDatabaseUrl(): string {
  const envUrl = process.env['DATABASE_URL'] || 'file:./dev.db';
  if (envUrl.startsWith('file:')) {
    const rawPath = envUrl.slice('file:'.length);
    if (!path.isAbsolute(rawPath)) {
      const workspaceRoot = process.cwd().includes('apps') || process.cwd().includes('libs')
        ? path.resolve(process.cwd(), '../..')
        : process.cwd();
      const absolutePath = path.resolve(workspaceRoot, rawPath);
      return `file:${absolutePath}`;
    }
  }
  return envUrl;
}

const adapter = new PrismaBetterSqlite3({
  url: getDatabaseUrl()
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await argon2.hash('Pass1234!!!!');

  const user = await prisma.user.upsert({
    where: { email: 'aux@hexmode.org' },
    update: {
      fullName: 'Aux',
      passwordHash,
      forcePasswordChange: false
    },
    create: {
      fullName: 'Aux',
      email: 'aux@hexmode.org',
      passwordHash,
      forcePasswordChange: false
    }
  });

  console.log('Seeded user:', user);

  const seedItems = [
    'Milk',
    'Eggs',
    'Bread',
    'Butter',
    'Cheese',
    'Apples',
    'Bananas'
  ];

  let shoppingList = await prisma.shoppingList.findFirst({
    where: { name: 'Groceries', deletedAt: null },
    include: { items: true }
  });

  if (!shoppingList) {
    shoppingList = await prisma.shoppingList.create({
      data: {
        name: 'Groceries',
        description: 'Weekly groceries',
        items: {
          create: seedItems.map((name, index) => ({
            name,
            quantity: 1,
            isBought: false,
            order: index
          }))
        }
      },
      include: { items: true }
    });
  } else {
    await prisma.shoppingListItem.deleteMany({
      where: { shoppingListId: shoppingList.id }
    });
    await prisma.shoppingListItem.createMany({
      data: seedItems.map((name, index) => ({
        shoppingListId: shoppingList.id,
        name,
        quantity: 1,
        isBought: false,
        order: index
      }))
    });
    shoppingList = await prisma.shoppingList.findFirst({
      where: { id: shoppingList.id },
      include: { items: true }
    });
  }

  console.log('Seeded shopping list:', shoppingList);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async e => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
