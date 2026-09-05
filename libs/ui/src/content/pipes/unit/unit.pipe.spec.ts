import { UnitPipe } from './unit.pipe';

describe('UnitPipe', () => {
  let pipe: UnitPipe;

  beforeEach(() => {
    pipe = new UnitPipe();
  });

  it('should format GRAMS correctly', () => {
    expect(pipe.transform(200, 'GRAMS')).toBe('200g');
    expect(pipe.transform(0, 'GRAMS')).toBe('0g');
  });

  it('should format ITEM_COUNT correctly for singular and plural', () => {
    expect(pipe.transform(1, 'ITEM_COUNT')).toBe('1 item');
    expect(pipe.transform(2, 'ITEM_COUNT')).toBe('2 items');
    expect(pipe.transform(0, 'ITEM_COUNT')).toBe('0 items');
  });

  it('should format TSP correctly', () => {
    expect(pipe.transform(1, 'TSP')).toBe('1 Teaspoons');
    expect(pipe.transform(2, 'TSP')).toBe('2 Teaspoons');
    expect(pipe.transform(0.5, 'TSP')).toBe('0.5 Teaspoons');
  });

  it('should format TBSP correctly', () => {
    expect(pipe.transform(1, 'TBSP')).toBe('1 Table spoons');
    expect(pipe.transform(3, 'TBSP')).toBe('3 Table spoons');
  });

  it('should fallback to unit string for unknown units', () => {
    expect(pipe.transform(5, 'UNKNOWN')).toBe('5UNKNOWN');
  });
});
