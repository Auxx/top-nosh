import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { WPRMRecipe, wprmRecipePattern } from './recipe-import/wprm.types';

@Injectable()
export class RecipeImportService {
  async fetchRecipeAsTextFromUrl(url: string): Promise<string> {
    try {
      const response = await fetch(url.trim());

      if (!response.ok) {
        throw new BadRequestException(`Failed to fetch recipe from URL: HTTP ${response.status}`);
      }

      return this.extractWprmJson(await response.text());
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Network error';
      throw new BadRequestException(`Failed to fetch recipe from URL: ${message}`);
    }
  }

  async fetchRecipeFromUrl(url: string): Promise<WPRMRecipe> {
    const jsonText = await this.fetchRecipeAsTextFromUrl(url);

    try {
      const json = JSON.parse(jsonText);

      if (!(json instanceof Object)) {
        throw new BadRequestException(`Recipe is malformed - not a hash map`);
      }

      const values = Object.values(json);

      if (values.length !== 1) {
        throw new BadRequestException(`Recipe is malformed - wrong hash map keys`);
      }

      return values[0] as WPRMRecipe;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Malformed JSON';
      throw new BadRequestException(`Failed to parse extracted recipe JSON: ${message}`);
    }
  }

  async generateTypeScriptInterface(url: string): Promise<string> {
    const recipeData = await this.fetchRecipeFromUrl(url);
    return this.buildTypeScriptInterface(recipeData, 'Recipe');
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

  private buildTypeScriptInterface(data: unknown, interfaceName = 'Recipe'): string {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      throw new BadRequestException('Recipe data must be an object to generate a TypeScript interface');
    }

    const lines: string[] = [];

    lines.push(`export interface ${interfaceName} {`);

    const entries = Object.entries(data);

    for (const [ key, value ] of entries) {
      const formattedKey = this.formatPropertyKey(key);
      const typeStr = this.inferType(value, 1);
      lines.push(`  ${formattedKey}: ${typeStr};`);
    }

    lines.push('}');

    return lines.join('\n');
  }

  private formatPropertyKey(key: string): string {
    if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
      return key;
    }

    return `'${key.replace(/'/g, '\\\'')}'`;
  }

  private inferType(value: unknown, indentLevel: number): string {
    if (value === null) {
      return 'null';
    }

    if (value === undefined) {
      return 'undefined';
    }

    if (typeof value === 'string') {
      return 'string';
    }

    if (typeof value === 'number') {
      return 'number';
    }

    if (typeof value === 'boolean') {
      return 'boolean';
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return 'unknown[]';
      }

      const itemTypes = new Set<string>();
      let hasObjectItem = false;
      let firstObjectItem: Record<string, unknown> | null = null;

      for (const item of value) {
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
          hasObjectItem = true;
          if (!firstObjectItem) {
            firstObjectItem = item as Record<string, unknown>;
          }
        } else {
          itemTypes.add(this.inferType(item, indentLevel));
        }
      }

      if (hasObjectItem && firstObjectItem) {
        const objectType = this.inferType(firstObjectItem, indentLevel);
        return `${objectType}[]`;
      }

      if (itemTypes.size === 1) {
        return `${Array.from(itemTypes)[0]}[]`;
      }

      if (itemTypes.size > 1) {
        return `(${Array.from(itemTypes).join(' | ')})[]`;
      }

      return 'unknown[]';
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value);
      if (entries.length === 0) {
        return 'Record<string, unknown>';
      }

      const innerIndent = '  '.repeat(indentLevel + 1);
      const closeIndent = '  '.repeat(indentLevel);

      const propLines = entries.map(([ k, v ]) => {
        const propKey = this.formatPropertyKey(k);
        const propType = this.inferType(v, indentLevel + 1);
        return `${innerIndent}${propKey}: ${propType};`;
      });

      return `{\n${propLines.join('\n')}\n${closeIndent}}`;
    }

    return 'unknown';
  }
}
