import { ScaleQuantityPipe } from './scale-quantity.pipe';

describe('ScaleQuantityPipe', () => {
  let pipe: ScaleQuantityPipe;

  beforeEach(() => {
    pipe = new ScaleQuantityPipe();
  });

  it('returns the quantity unchanged for a non-positive base', () => {
    expect(pipe.transform(200, 0, 4)).toBe(200);
    expect(pipe.transform(200, -1, 4)).toBe(200);
  });

  it('scales proportionally', () => {
    expect(pipe.transform(200, 4, 2)).toBe(100);
    expect(pipe.transform(1, 2, 3)).toBe(1.5);
  });

  it('rounds to two decimals', () => {
    expect(pipe.transform(1, 3, 1)).toBe(0.33);
  });
});
