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
      // Remove bold/italic (***text***, **text**, *text*). Markers must hug
      // non-space text, so operators such as `2 * 3 * 4` survive.
      .replace(/(\*{1,3})(?=\S)(.+?)(?<=\S)\1/g, '$2')
      // Remove bold/italic (___text___, __text__, _text_). Markers must also
      // sit on word boundaries, so `snake_case_name` survives.
      .replace(/(?<![\p{L}\p{N}_])(_{1,3})(?=\S)(.+?)(?<=\S)\1(?![\p{L}\p{N}_])/gu, '$2')
      // Remove strikethrough (~~text~~)
      .replace(/~~(.*?)~~/g, '$1')
      // Remove blockquotes (> text)
      .replace(/^\s*>\s+/gm, '')
      // Remove unordered list bullets (- item, * item, + item)
      .replace(/^\s*[-*+]\s+/gm, '')
      // Remove ordered list numbers (1. item)
      .replace(/^\s*\d+\.\s+/gm, '')
      // Remove horizontal rules (---, ***, ___)
      .replace(/^(?:[-*_]\s*){3,}$/gm, '')
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Replace multiple whitespace/newlines with single space
      .replace(/\s+/g, ' ')
      .trim();
  }
}
