import { buildRecipeShareUrl } from './share-recipe-button.helpers';

describe('ShareRecipeButtonHelpers', () => {
  describe('buildRecipeShareUrl', () => {
    it('should return an empty string when recipeId is undefined', () => {
      expect(buildRecipeShareUrl(undefined)).toBe('');
    });

    it('should return an empty string when recipeId is null', () => {
      expect(buildRecipeShareUrl(null)).toBe('');
    });

    it('should return an empty string when recipeId is an empty string', () => {
      expect(buildRecipeShareUrl('')).toBe('');
    });

    it('should build the correct share URL when recipeId is provided', () => {
      const expectedUrl = `${window.location.protocol}//${window.location.host}/share/recipe/recipe-abc-123`;
      expect(buildRecipeShareUrl('recipe-abc-123')).toBe(expectedUrl);
    });
  });
});
