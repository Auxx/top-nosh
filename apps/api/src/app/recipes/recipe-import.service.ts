import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { IngredientUnit } from '@prisma/client';
import * as cheerio from 'cheerio';
import { GalleriesService } from '../galleries/galleries.service';
import { ImportedRecipeIngredient, ImportedRecipeResponse, ImportedRecipeStage } from './dto/recipe-response.dto';
import {
  RecipeInstructionGroup,
  WPRMRecipe,
  WPRMRecipeIngredient,
  wprmRecipePattern
} from './recipe-import/wprm.types';

@Injectable()
export class RecipeImportService {
  constructor(private readonly galleriesService: GalleriesService) {}

  async fetchRecipeImage(imageUrl: string): Promise<string | null> {
    if (!this.isValidUrl(imageUrl)) {
      return null;
    }

    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const rawContentType = response.headers?.get ? response.headers.get('content-type') : null;
      const parsedMimetype = rawContentType ? rawContentType.split(';')[0].trim() : '';
      const mimetype = parsedMimetype || 'image/jpeg';

      const gallery = await this.galleriesService.createGallery({
        name: imageUrl
      });

      await this.galleriesService.uploadImage(gallery.id, {
        buffer,
        mimetype,
        size: buffer.length
      });

      return gallery.id;
    } catch {
      return null;
    }
  }

  private isValidUrl(url?: unknown): boolean {
    if (typeof url !== 'string' || url.trim().length === 0) {
      return false;
    }
    try {
      const parsed = new URL(url.trim());
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  async fetchRecipe(url: string): Promise<ImportedRecipeResponse> {
    const html = await this.fetchRecipeHtmlFromUrl(url);
    const metadata = this.extractRecipeMetadata(html);
    const instructions = this.extractCookingInstructions(html);

    let galleryId: string | null = null;
    if (this.isValidUrl(metadata?.image_url)) {
      galleryId = await this.fetchRecipeImage(metadata.image_url);
    }

    return this.mapToImportedRecipeResponse(metadata, instructions, url, galleryId);
  }

  async fetchRecipeHtmlFromUrl(url: string): Promise<string> {
    if (url.trim().length === 0) {
      throw new BadRequestException('Recipe URL is required');
    }

    let response: Response;

    try {
      response = await fetch(url.trim());
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Network error';
      throw new BadRequestException(`Failed to fetch recipe from URL: ${message}`);
    }

    if (!response.ok) {
      throw new BadRequestException(`Failed to fetch recipe from URL: HTTP ${response.status}`);
    }

    return await response.text();
  }

  extractRecipeMetadata(html: string): WPRMRecipe {
    const jsonText = this.extractWprmJson(html);

    try {
      const json = JSON.parse(jsonText);

      if (!(json instanceof Object)) {
        throw new BadRequestException('Recipe is malformed - not a hash map');
      }

      const values = Object.values(json);

      if (values.length !== 1) {
        throw new BadRequestException('Recipe is malformed - wrong hash map keys');
      }

      return values[0] as WPRMRecipe;
    } catch (error: unknown) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Malformed JSON';
      throw new BadRequestException(`Failed to parse extracted recipe JSON: ${message}`);
    }
  }

  extractCookingInstructions(html: string): RecipeInstructionGroup[] {
    const $ = cheerio.load(html);
    const container = $('div.wprm-recipe-instructions-container');

    if (container.length === 0) {
      return [];
    }

    const defaultGroupName = container.find('h3').first().text().trim();
    const groups: RecipeInstructionGroup[] = [];

    container.find('div.wprm-recipe-instruction-group').each((_, groupEl) => {
      const $group = $(groupEl);
      const groupH4 = $group.find('h4').first().text().trim();
      const groupH5 = $group.find('h5').first().text().trim();
      const groupName = groupH4 || groupH5 || defaultGroupName;

      const steps = $group
        .find('li')
        .map((_, li) => $(li).text().trim())
        .get()
        .filter((step: string) => step.length > 0);

      groups.push({ name: groupName, steps });
    });

    return groups;
  }

  extractIngredients(metadata: WPRMRecipe, recipe: ImportedRecipeResponse): void {
    if (!recipe.stages || recipe.stages.length === 0) {
      recipe.stages = [
        {
          name: null,
          steps: [],
          ingredients: []
        }
      ];
    }

    const firstStage = recipe.stages[0];
    if (!firstStage.ingredients) {
      firstStage.ingredients = [];
    }

    if (!metadata || !Array.isArray(metadata.ingredients)) {
      return;
    }

    for (const ingredient of metadata.ingredients) {
      if (ingredient) {
        firstStage.ingredients.push(this.parseWprmIngredient(ingredient));
      }
    }
  }

  private parseWprmIngredient(ingredient: WPRMRecipeIngredient): ImportedRecipeIngredient {
    const name = typeof ingredient?.name === 'string' ? ingredient.name.trim() : '';
    const { quantity, unit } = this.resolveUnitAndQuantity(ingredient);

    return {
      name,
      quantity,
      unit
    };
  }

  private resolveUnitAndQuantity(
    ingredient: WPRMRecipeIngredient
  ): { quantity: number; unit: IngredientUnit; } {
    if (ingredient?.converted && typeof ingredient.converted === 'object') {
      for (const conversion of Object.values(ingredient.converted)) {
        if (conversion && typeof conversion.unit === 'string' && this.isDirectUnit(conversion.unit)) {
          const parsedAmount = this.parseAmount(conversion.amount);
          return this.convertUnit(conversion.unit, parsedAmount);
        }
      }
    }

    const rawUnit = typeof ingredient?.unit === 'string' ? ingredient.unit : '';
    const paren = this.extractParenthesizedUnit(rawUnit);
    if (paren) {
      return this.convertUnit(paren.unit, paren.amount);
    }

    const baseAmount = this.parseAmount(ingredient?.amount);
    return this.convertUnit(rawUnit, baseAmount);
  }

  private extractParenthesizedUnit(rawUnit: string): { amount: number; unit: string; } | null {
    const match = rawUnit.match(/\(([^)]+)\)/);
    if (!match) {
      return null;
    }

    const inside = match[1].trim();
    const parenMatch = inside.match(/^([0-9\s./¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞-]+)\s*(.*)$/);
    if (!parenMatch) {
      return null;
    }

    const amountStr = parenMatch[1].trim();
    const unitStr = parenMatch[2].trim();

    if (!unitStr || !this.isKnownUnit(unitStr)) {
      return null;
    }

    const parsedAmount = this.parseAmount(amountStr);
    if (parsedAmount <= 0) {
      return null;
    }

    return { amount: parsedAmount, unit: unitStr };
  }

  private isKnownUnit(rawUnit: string): boolean {
    const normalized = typeof rawUnit === 'string' ? rawUnit.trim().toLowerCase() : '';
    return (
      this.isDirectUnit(normalized)
      || normalized === 'cup'
      || normalized === 'cups'
      || normalized === 'pound'
      || normalized === 'pounds'
      || normalized === 'lb'
      || normalized === 'lbs'
      || normalized === 'lbs.'
      || normalized === 'oz'
      || normalized === 'oz.'
      || normalized === 'ounce'
      || normalized === 'ounces'
    );
  }

  private isDirectUnit(rawUnit: string): boolean {
    const normalized = typeof rawUnit === 'string' ? rawUnit.trim().toLowerCase() : '';
    return (
      normalized === 'g'
      || normalized === 'gram'
      || normalized === 'grams'
      || normalized === 'ml'
      || normalized === 'tbsp'
      || normalized === 'tbsp.'
      || normalized === 'tablespoon'
      || normalized === 'tablespoons'
      || normalized === 'tsp'
      || normalized === 'tsp.'
      || normalized === 'teaspoon'
      || normalized === 'teaspoons'
    );
  }

  private convertUnit(
    rawUnit: string,
    rawQuantity: number
  ): { quantity: number; unit: IngredientUnit; } {
    const normalized = typeof rawUnit === 'string' ? rawUnit.trim().toLowerCase() : '';

    let unit: IngredientUnit = IngredientUnit.ITEM_COUNT;
    let factor = 1;

    switch (normalized) {
      case 'g':
      case 'gram':
      case 'grams':
      case 'ml':
        unit = IngredientUnit.GRAMS;
        factor = 1;
        break;
      case 'tbsp':
      case 'tbsp.':
      case 'tablespoon':
      case 'tablespoons':
        unit = IngredientUnit.TBSP;
        factor = 1;
        break;
      case 'tsp':
      case 'tsp.':
      case 'teaspoon':
      case 'teaspoons':
        unit = IngredientUnit.TSP;
        factor = 1;
        break;
      case 'cup':
      case 'cups':
        unit = IngredientUnit.GRAMS;
        factor = 237;
        break;
      case 'pound':
      case 'pounds':
      case 'lb':
      case 'lbs':
      case 'lbs.':
        unit = IngredientUnit.GRAMS;
        factor = 454;
        break;
      case 'oz':
      case 'oz.':
      case 'ounce':
      case 'ounces':
        unit = IngredientUnit.GRAMS;
        factor = 28.35;
        break;
      default:
        unit = IngredientUnit.ITEM_COUNT;
        factor = 1;
        break;
    }

    const quantity = Math.round(rawQuantity * factor * 100) / 100;
    return { quantity, unit };
  }

  private parseAmount(amountStr: string | null | undefined): number {
    if (typeof amountStr !== 'string') {
      return 0;
    }

    const trimmed = amountStr.trim();
    if (!trimmed) {
      return 0;
    }

    const vulgarFractions: Record<string, string> = {
      '¼': ' 1/4',
      '½': ' 1/2',
      '¾': ' 3/4',
      '⅐': ' 1/7',
      '⅑': ' 1/9',
      '⅒': ' 1/10',
      '⅓': ' 1/3',
      '⅔': ' 2/3',
      '⅕': ' 1/5',
      '⅖': ' 2/5',
      '⅗': ' 3/5',
      '⅘': ' 4/5',
      '⅙': ' 1/6',
      '⅚': ' 5/6',
      '⅛': ' 1/8',
      '⅜': ' 3/8',
      '⅝': ' 5/8',
      '⅞': ' 7/8'
    };

    let normalized = trimmed;
    for (const [ vulgar, replacement ] of Object.entries(vulgarFractions)) {
      normalized = normalized.replace(new RegExp(vulgar, 'g'), replacement);
    }
    normalized = normalized.trim();

    if (normalized.includes('-')) {
      const parts = normalized.split('-');
      normalized = parts[0].trim();
    }

    const tokens = normalized.split(/\s+/).filter(t => t.length > 0);
    if (tokens.length === 0) {
      return 0;
    }

    let total = 0;
    let parsedAny = false;

    for (const token of tokens) {
      if (token.includes('/')) {
        const [ numStr, denStr ] = token.split('/');
        const num = Number.parseFloat(numStr);
        const den = Number.parseFloat(denStr);
        if (!Number.isNaN(num) && !Number.isNaN(den) && den !== 0) {
          total += num / den;
          parsedAny = true;
        }
      } else {
        const val = Number.parseFloat(token);
        if (!Number.isNaN(val)) {
          total += val;
          parsedAny = true;
        }
      }
    }

    if (!parsedAny || Number.isNaN(total)) {
      return 0;
    }

    return total;
  }

  private mapToImportedRecipeResponse(
    metadata: WPRMRecipe,
    instructions: RecipeInstructionGroup[],
    sourceUrl: string,
    galleryId: string | null = null
  ): ImportedRecipeResponse {
    const name = typeof metadata?.name === 'string' ? metadata.name.trim() : '';

    const parsedServings = Number.parseInt(String(metadata?.originalServings), 10);
    const servings = Number.isInteger(parsedServings) && parsedServings > 0 ? parsedServings : 1;

    const stages: ImportedRecipeStage[] = Array.isArray(instructions)
      ? instructions.map(group => ({
        name: typeof group?.name === 'string' && group.name.trim().length > 0 ? group.name.trim() : null,
        ingredients: [],
        steps: Array.isArray(group?.steps)
          ? group.steps
            .filter((step): step is string => typeof step === 'string' && step.trim().length > 0)
            .map(step => ({
              name: step.trim(),
              description: null
            }))
          : []
      }))
      : [];

    const recipe: ImportedRecipeResponse = {
      name,
      cuisine: null,
      category: null,
      description: null,
      servings,
      source: sourceUrl,
      stages,
      galleryId
    };

    this.extractIngredients(metadata, recipe);

    return recipe;
  }

  private extractWprmJson(html: string): string {
    const pattern = new RegExp(wprmRecipePattern.source, 'g');
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(html)) !== null) {
      const startIndex = match.index + match[0].length;
      const extracted = this.extractBalancedJson(html, startIndex);

      if (extracted !== null) {
        return extracted;
      }
    }

    throw new NotFoundException('window.wprm_recipes assignment not found in the provided URL');
  }

  private extractBalancedJson(html: string, startIndex: number): string | null {
    let charIndex = startIndex;

    while (charIndex < html.length && /\s/.test(html[charIndex])) {
      charIndex++;
    }

    if (charIndex >= html.length) {
      return null;
    }

    const openingChar = html[charIndex];
    if (openingChar !== '{' && openingChar !== '[') {
      return null;
    }

    let depth = 0;
    let inString = false;
    let quoteChar = '';
    let escaped = false;
    const jsonStartIndex = charIndex;

    for (let i = charIndex; i < html.length; i++) {
      const char = html[i];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        continue;
      }

      if (inString) {
        if (char === quoteChar) {
          inString = false;
        }
        continue;
      }

      if (char === '"' || char === '\'' || char === '`') {
        inString = true;
        quoteChar = char;
        continue;
      }

      if (char === '{' || char === '[') {
        depth++;
      } else if (char === '}' || char === ']') {
        depth--;

        if (depth === 0) {
          const candidate = html.substring(jsonStartIndex, i + 1);
          return candidate;
        }
      }
    }

    return null;
  }
}
