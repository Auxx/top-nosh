import { IngredientUnit as PrismaIngredientUnit } from '@prisma/client';
import { INGREDIENT_UNITS, IngredientUnit } from '@top-nosh/domain';

type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// Fails type-checking (ts-jest) when the shared union and the Prisma enum differ.
const unitsMatchPrisma: Equals<IngredientUnit, PrismaIngredientUnit> = true;

describe('INGREDIENT_UNITS', () => {
  it('lists exactly the Prisma IngredientUnit values', () => {
    expect(unitsMatchPrisma).toBe(true);
    expect([ ...INGREDIENT_UNITS ].sort()).toEqual(Object.values(PrismaIngredientUnit).sort());
  });
});
