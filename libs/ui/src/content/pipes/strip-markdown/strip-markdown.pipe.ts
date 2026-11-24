import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'stripMarkdown'
})
export class StripMarkdownPipe implements PipeTransform {
  transform(value?: string | null): string {
    if (!value) {
      return '';
    }

    return value
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      // Remove inline code
      .replace(/`([^`]+)`/g, '$1')
      // Remove images ![alt](url)
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      // Remove links [text](url)
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      // Remove headers (# Header)
      .replace(/^#{1,6}\s+/gm, '')
      // Remove blockquotes (> text)
      .replace(/^\s*>\s+/gm, '')
      // Remove horizontal rules (---, ***, ___) and list bullets before
      // emphasis, which would otherwise eat their markers.
      .replace(/^(?:[-*_]\s*){3,}$/gm, '')
      .replace(/^\s*[-*+]\s+/gm, '')
      // Remove bold/italic (***text***, **text**, *text*). Markers must hug
      // non-space text and sit on word boundaries, so operators such as
      // `2 * 3 * 4`, `2*3*4` and ratings such as `4*/5*` survive.
      .replace(/(?<![\p{L}\p{N}*])(\*{1,3})(?=\S)(.+?)(?<=\S)\1(?![\p{L}\p{N}*])/gu, '$2')
      // Remove bold/italic (___text___, __text__, _text_). Markers must also
      // sit on word boundaries, so `snake_case_name` survives.
      .replace(/(?<![\p{L}\p{N}_])(_{1,3})(?=\S)(.+?)(?<=\S)\1(?![\p{L}\p{N}_])/gu, '$2')
      // Remove strikethrough (~~text~~)
      .replace(/~~(.*?)~~/g, '$1')
      // Remove ordered list numbers (1. item)
      .replace(/^\s*\d+\.\s+/gm, '')
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Replace multiple whitespace/newlines with single space
      .replace(/\s+/g, ' ')
      .trim();
  }
}
