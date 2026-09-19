import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { ImportedRecipeResponse, ImportedRecipeStage } from './dto/recipe-response.dto';
import { RecipeInstructionGroup, WPRMRecipe, wprmRecipePattern } from './recipe-import/wprm.types';

@Injectable()
export class RecipeImportService {
  async fetchRecipe(url: string): Promise<ImportedRecipeResponse> {
    const html = await this.fetchRecipeHtmlFromUrl(url);
    const metadata = this.extractRecipeMetadata(html);
    const instructions = this.extractCookingInstructions(html);

    return this.mapToImportedRecipeResponse(metadata, instructions, url);
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

  private mapToImportedRecipeResponse(
    metadata: WPRMRecipe,
    instructions: RecipeInstructionGroup[],
    sourceUrl: string
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

    return {
      name,
      cuisine: null,
      category: null,
      description: null,
      servings,
      source: sourceUrl,
      stages
    };
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
