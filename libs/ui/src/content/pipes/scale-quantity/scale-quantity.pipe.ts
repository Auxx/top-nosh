import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'scaleQuantity' })
export class ScaleQuantityPipe implements PipeTransform {
  transform(quantity: number, base: number, servings: number): string {
    if (base <= 0) {
      return quantity.toString();
    }

    const scaled = (quantity * servings) / base;

    return (Math.round(scaled * 100) / 100).toString();
  }
}
