import { INGREDIENT_UNITS } from './ingredient-units';

describe('ingredient units', () => {
  it('lists the ingredient units', () => {
    expect(INGREDIENT_UNITS).toEqual([ 'GRAMS', 'ITEM_COUNT', 'TSP', 'TBSP' ]);
  });
});
