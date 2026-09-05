import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'unit' })
export class UnitPipe implements PipeTransform {
  transform(quantity: number | string, unit: string): string {
    return `${quantity}${this.getUnitName(quantity, unit)}`;
  }

  private readonly getUnitName = (quantity: number | string, unit: string): string => {
    switch (unit) {
      case 'GRAMS':
        return 'g';
      case 'ITEM_COUNT':
        return Number(quantity) === 1 ? ' item' : ' items';
      case 'TSP':
        return ' Teaspoons';
      case 'TBSP':
        return ' Table spoons';
    }

    return unit;
  };
}
