import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { CreateRecipeDto, IngredientUnit } from '../../models/create-recipe.types';
import { ImportedRecipeResponse } from '../../models/imported-recipe.types';
import { RecipeDetails } from '../../models/recipe-details.types';

export function createStepGroup(
  step?: { id?: string | null; name?: string | null; description?: string | null; } | null
): FormGroup {
  return new FormGroup({
    id: new FormControl<string | null>(step?.id ?? null),
    name: new FormControl<string>(step?.name ?? '', [ Validators.required ]),
    description: new FormControl<string>(step?.description ?? '')
  });
}

export function createIngredientGroup(
  ingredient?:
    | { id?: string | null; name?: string | null; quantity?: number | null; unit?: IngredientUnit | null; }
    | null
): FormGroup {
  return new FormGroup({
    id: new FormControl<string | null>(ingredient?.id ?? null),
    name: new FormControl<string>(ingredient?.name ?? '', [ Validators.required ]),
    quantity: new FormControl<number | null>(ingredient?.quantity ?? null, [ Validators.required, Validators.min(0) ]),
    unit: new FormControl<IngredientUnit>(ingredient?.unit ?? 'GRAMS', [ Validators.required ])
  });
}

export function createStageGroup(
  stage?: {
    id?: string | null;
    name?: string | null;
    steps?: Array<{ id?: string | null; name?: string | null; description?: string | null; }> | null;
    ingredients?:
      | Array<{ id?: string | null; name?: string | null; quantity?: number | null; unit?: IngredientUnit | null; }>
      | null;
  } | null
): FormGroup {
  return new FormGroup({
    id: new FormControl<string | null>(stage?.id ?? null),
    name: new FormControl<string>(stage?.name ?? '', [ Validators.required ]),
    steps: new FormArray<FormGroup>((stage?.steps || []).map(step => createStepGroup(step))),
    ingredients: new FormArray<FormGroup>((stage?.ingredients || []).map(ing => createIngredientGroup(ing)))
  });
}

export function createRecipeForm(
  recipe?: RecipeDetails | ImportedRecipeResponse | null
): FormGroup {
  const isShared = recipe && 'isShared' in recipe ? Boolean(recipe.isShared) : false;

  return new FormGroup({
    name: new FormControl<string>(recipe?.name ?? '', [ Validators.required ]),
    cuisine: new FormControl<string>(recipe?.cuisine ?? '', [ Validators.required ]),
    category: new FormControl<string>(recipe?.category ?? '', [ Validators.required ]),
    description: new FormControl<string>(recipe?.description ?? ''),
    servings: new FormControl<number | null>(recipe?.servings ?? null, [ Validators.required, Validators.min(1) ]),
    source: new FormControl<string>(recipe?.source ?? ''),
    isShared: new FormControl<boolean>(isShared),
    galleryId: new FormControl<string | null>(recipe?.galleryId ?? null),
    stages: new FormArray<FormGroup>((recipe?.stages || []).map(stage => createStageGroup(stage)))
  });
}

export function formToCreateRecipeDto(formValue: unknown): CreateRecipeDto {
  const value = (formValue ?? {}) as {
    name?: string | null;
    cuisine?: string | null;
    category?: string | null;
    description?: string | null;
    servings?: number | string | null;
    source?: string | null;
    isShared?: boolean | null;
    galleryId?: string | null;
    stages?:
      | Array<{
        name?: string | null;
        steps?: Array<{ name?: string | null; description?: string | null; }> | null;
        ingredients?:
          | Array<{ name?: string | null; quantity?: number | string | null; unit?: IngredientUnit | null; }>
          | null;
      }>
      | null;
  };

  const rawStages = value.stages ?? [];

  return {
    name: (value.name || '').trim(),
    cuisine: (value.cuisine || '').trim(),
    category: (value.category || '').trim(),
    description: (value.description || '').trim(),
    servings: Number(value.servings),
    source: (value.source || '').trim() || undefined,
    isShared: value.isShared ?? false,
    galleryId: value.galleryId || undefined,
    stages: rawStages.map((stage, stageIdx) => ({
      name: (stage.name || '').trim(),
      order: stageIdx,
      steps: (stage.steps || []).map((step, stepIdx) => ({
        name: (step.name || '').trim(),
        description: (step.description || '').trim(),
        order: stepIdx
      })),
      ingredients: (stage.ingredients || []).map((ing, ingIdx) => ({
        name: (ing.name || '').trim(),
        quantity: Number(ing.quantity),
        unit: (ing.unit || 'GRAMS') as IngredientUnit,
        order: ingIdx
      }))
    }))
  };
}
