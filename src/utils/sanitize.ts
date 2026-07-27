/**
 * HTML Sanitization Utility
 * Provides secure HTML sanitization using DOMPurify to prevent XSS attacks.
 *
 * @module utils/sanitize
 */
import DOMPurify from 'dompurify';

/**
 * Configuration for DOMPurify sanitization
 */
const SANITIZE_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [
    // Text formatting
    'p',
    'br',
    'span',
    'div',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'strike',
    'del',
    'ins',
    'sub',
    'sup',
    'small',
    'mark',
    // Headings
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    // Lists
    'ul',
    'ol',
    'li',
    'dl',
    'dt',
    'dd',
    // Links and media
    'a',
    'img',
    'figure',
    'figcaption',
    // Tables
    'table',
    'thead',
    'tbody',
    'tfoot',
    'tr',
    'th',
    'td',
    'caption',
    'colgroup',
    'col',
    // Block elements
    'blockquote',
    'pre',
    'code',
    'hr',
    // Form elements (read-only display)
    'label',
  ],
  ALLOWED_ATTR: [
    'href',
    'target',
    'rel',
    'title',
    'src',
    'alt',
    'width',
    'height',
    'loading',
    'class',
    'id',
    'style',
    'colspan',
    'rowspan',
    'scope',
    'data-*',
  ],
  ALLOW_DATA_ATTR: true,
  // Security settings
  ADD_TAGS: [],
  ADD_ATTR: ['target'],
  FORBID_TAGS: [
    'script',
    'iframe',
    'object',
    'embed',
    'form',
    'input',
    'button',
    'select',
    'textarea',
  ],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  // Ensure links open safely
  ADD_URI_SAFE_ATTR: ['href', 'src'],
};

/**
 * Sanitizes HTML content to prevent XSS attacks.
 *
 * @param dirty - The potentially unsafe HTML string
 * @param config - Optional custom DOMPurify configuration
 * @returns Sanitized HTML string safe for rendering
 *
 * @example
 * ```tsx
 * import { sanitizeHtml } from '@/utils/sanitize';
 *
 * <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(userContent) }} />
 * ```
 */
export function sanitizeHtml(dirty: string, config?: DOMPurify.Config): string {
  if (!dirty) return '';

  const finalConfig = config ? { ...SANITIZE_CONFIG, ...config } : SANITIZE_CONFIG;

  // Add target="_blank" rel="noopener noreferrer" to external links
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      const href = node.getAttribute('href');
      if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      }
    }
    // Add loading="lazy" to images
    if (node.tagName === 'IMG') {
      node.setAttribute('loading', 'lazy');
    }
  });

  const clean = DOMPurify.sanitize(dirty, finalConfig);

  // Remove the hook after use to prevent memory leaks
  DOMPurify.removeHook('afterSanitizeAttributes');

  return clean;
}

/**
 * Sanitizes HTML with a more restrictive configuration for user-generated content.
 * Only allows basic text formatting, no links or images.
 *
 * @param dirty - The potentially unsafe HTML string
 * @returns Sanitized HTML string
 */
export function sanitizeUserContent(dirty: string): string {
  if (!dirty) return '';

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'span'],
    ALLOWED_ATTR: ['class'],
  });
}

/**
 * Sanitizes HTML for rich text editors with full formatting support.
 *
 * @param dirty - The potentially unsafe HTML string
 * @returns Sanitized HTML string
 */
export function sanitizeRichText(dirty: string): string {
  return sanitizeHtml(dirty);
}

/**
 * Strips all HTML tags and returns plain text.
 * Useful for previews and search indexing.
 *
 * @param html - HTML string to strip
 * @returns Plain text without HTML tags
 */
export function stripHtml(html: string): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
}

/**
 * Checks if a string contains potentially dangerous HTML.
 *
 * @param html - HTML string to check
 * @returns true if the string contains potentially dangerous content
 */
export function containsUnsafeHtml(html: string): boolean {
  if (!html) return false;

  const sanitized = sanitizeHtml(html);
  // If sanitization changed the content significantly, it contained unsafe HTML
  return sanitized.length < html.length * 0.9;
}

export default {
  sanitizeHtml,
  sanitizeUserContent,
  sanitizeRichText,
  stripHtml,
  containsUnsafeHtml,
};
