import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'stripMarkdown',
  standalone: true
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
      // Remove bold/italic (***text***, **text**, *text*, ___text___, __text__, _text_)
      .replace(/(\*{1,3}|_{1,3})(.*?)\1/g, '$2')
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
