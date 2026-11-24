import { Pipe, PipeTransform } from '@angular/core';

const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
const whitespace = /^\s+$/;

@Pipe({
  name: 'truncate'
})
export class TruncatePipe implements PipeTransform {
  /**
   * Shortens `value` to at most `limit` grapheme clusters, cutting back to the
   * last word boundary when one exists, and appends `ellipsis`.
   */
  transform(value?: string | null, limit = 100, ellipsis = '…'): string {
    if (!value) {
      return '';
    }
    const graphemes = Array.from(graphemeSegmenter.segment(value), ({ segment }) => segment);
    if (graphemes.length <= limit) {
      return value;
    }

    let kept = graphemes.slice(0, limit);
    if (!whitespace.test(graphemes[limit])) {
      let lastSpace = kept.length - 1;
      while (lastSpace > 0 && !whitespace.test(kept[lastSpace])) {
        lastSpace--;
      }
      if (lastSpace > 0) {
        kept = kept.slice(0, lastSpace);
      }
    }
    return kept.join('').trimEnd() + ellipsis;
  }
}
