export const wprmRecipePattern = /window\.wprm_recipes(?:\s*\[[^\]]+\])?\s*=\s*/g;

export interface WPRMRecipe {
  type: string;
  name: string;
  slug: string;
  image_url: string;
  rating: WPRMRecipeRating;
  ingredients: WPRMRecipeIngredient[];
  originalServings: string;
  originalServingsParsed: number;
  currentServings: string;
  currentServingsParsed: number;
  currentServingsFormatted: string;
  currentServingsMultiplier: number;
  originalSystem: number;
  currentSystem: number;
  favorite: boolean;
  unitSystems: number[];
  originalAdvancedServings: WPRMRecipeAdvancedServings;
  currentAdvancedServings: WPRMRecipeAdvancedServings;
  collection: WPRMRecipeCollection;
}

export interface WPRMRecipeRating {
  count: number;
  total: number;
  average: number;
  type: {
    comment: number;
    no_comment: number;
    user: number;
  };
  user: number;
}

export interface WPRMRecipeCollection {
  servingsUnit: string;
  servingsUnitRaw: string;
  originalServings: string;
  originalServingsParsed: number;
  type: string;
  recipeId: number;
  name: string;
  image: string;
  servings: number;
  parent_id: string;
  parent_url: string;
  cachedAt: number;
  modifiedAt: number;
}

export interface WPRMRecipeAdvancedServings {
  shape: string;
  unit: string;
  diameter: number;
  width: number;
  length: number;
  height: number;
}

export interface WPRMRecipeIngredient {
  uid: number;
  amount: string;
  unit: string;
  name: string;
  notes: string;
  link: WPRMRecipeLink;
  converted: Record<string, WPRMRecipeUnitConversion>;
  conversion_item_snapshot: WPRMRecipeUnitConversion;
  unit_id: number;
  id: number;
  type: string;
  unit_systems: Record<string, WPRMRecipeUnitSystem>;
}

export interface WPRMRecipeLink {
  url: string;
  nofollow: string;
}

export interface WPRMRecipeUnitConversion {
  amount: string;
  unit: string;
  unit_id: number;
}

export interface WPRMRecipeUnitSystem {
  amount: string;
  unit: string;
  unitParsed: string;
  unit_connector: string;
  unit_connector_spacing: string;
  unit_connector_pluralizes_ingredient: boolean;
}
