import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'scaleQuantity' })
export class ScaleQuantityPipe implements PipeTransform {
  transform(quantity: number, base: number, servings: number): number {
    if (base <= 0) {
      return quantity;
    }

    const scaled = (quantity * servings) / base;

    return Math.round(scaled * 100) / 100;
  }
}
