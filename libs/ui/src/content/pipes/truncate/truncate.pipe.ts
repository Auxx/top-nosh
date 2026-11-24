import { Pipe, PipeTransform } from '@angular/core';

// Firefox gained Intl.Segmenter only in 125, and Angular's default browserslist
// reaches back to 119. Create it lazily so its absence can never break module
// loading, and fall back to code points (which never split a surrogate pair).
let graphemeSegmenter: Intl.Segmenter | null | undefined;

function firstGraphemes(value: string, count: number): string[] {
  if (graphemeSegmenter === undefined) {
    graphemeSegmenter = typeof Intl.Segmenter === 'function'
      ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
      : null;
  }
  const graphemes: string[] = [];
  const iterable: Iterable<string | Intl.SegmentData> = graphemeSegmenter ? graphemeSegmenter.segment(value) : value;
  for (const item of iterable) {
    if (graphemes.length >= count) {
      break;
    }
    graphemes.push(typeof item === 'string' ? item : item.segment);
  }
  return graphemes;
}

const whitespace = /^\s+$/;
// Cut back to a word boundary only if that keeps at least this share of the
// limit; otherwise a short word before a long URL would swallow the text.
const minKeptRatio = 0.6;

@Pipe({
  name: 'truncate'
})
export class TruncatePipe implements PipeTransform {
  /**
   * Shortens `value` to at most `limit` grapheme clusters, cutting back to the
   * last word boundary when one is near the limit, and appends `ellipsis`.
   */
  transform(value?: string | null, limit = 100, ellipsis = '…'): string {
    if (!value) {
      return '';
    }
    // A string never has more graphemes than UTF-16 code units.
    if (value.length <= limit) {
      return value;
    }
    const graphemes = firstGraphemes(value, limit + 1);
    if (graphemes.length <= limit) {
      return value;
    }

    let kept = graphemes.slice(0, limit);
    if (!whitespace.test(graphemes[limit])) {
      let lastSpace = kept.length - 1;
      while (lastSpace > 0 && !whitespace.test(kept[lastSpace])) {
        lastSpace--;
      }
      if (lastSpace > 0 && lastSpace >= limit * minKeptRatio) {
        kept = kept.slice(0, lastSpace);
      }
    }
    return kept.join('').trimEnd() + ellipsis;
  }
}
