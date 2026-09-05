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
    expect(pipe.transform(1, 'TSP')).toBe('1 teaspoon');
    expect(pipe.transform(2, 'TSP')).toBe('2 teaspoons');
    expect(pipe.transform(0.5, 'TSP')).toBe('0.5 teaspoons');
  });

  it('should format TBSP correctly', () => {
    expect(pipe.transform(1, 'TBSP')).toBe('1 table spoon');
    expect(pipe.transform(3, 'TBSP')).toBe('3 table spoons');
  });

  it('should fallback to unit string for unknown units', () => {
    expect(pipe.transform(5, 'UNKNOWN')).toBe('5UNKNOWN');
  });
});
