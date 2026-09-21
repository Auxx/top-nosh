export function buildRecipeShareUrl(recipeId?: string | null): string {
  if (!recipeId) {
    return '';
  }

  const protocol = window.location.protocol;
  const host = window.location.host;
  return `${protocol}//${host}/share/recipe/${recipeId}`;
}
