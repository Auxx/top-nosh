/**
 * Units an ingredient quantity can be measured in.
 *
 * Mirrors `enum IngredientUnit` in `prisma/schema.prisma`; a spec in
 * `libs/data-access` fails when the two differ.
 */
export const INGREDIENT_UNITS = [ 'GRAMS', 'ITEM_COUNT', 'TSP', 'TBSP' ] as const;

export type IngredientUnit = (typeof INGREDIENT_UNITS)[number];
