import { Pipe, PipeTransform } from '@angular/core';

// Firefox gained Intl.Segmenter only in 125, and Angular's default browserslist
// reaches back to 119. Create it lazily so its absence can never break module
// loading, and fall back to code points (which never split a surrogate pair).
let graphemeSegmenter: Intl.Segmenter | null | undefined;

function splitGraphemes(value: string): string[] {
  if (graphemeSegmenter === undefined) {
    graphemeSegmenter = typeof Intl.Segmenter === 'function'
      ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
      : null;
  }
  return graphemeSegmenter
    ? Array.from(graphemeSegmenter.segment(value), ({ segment }) => segment)
    : Array.from(value);
}
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
    const graphemes = splitGraphemes(value);
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
