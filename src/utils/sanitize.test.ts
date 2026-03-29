/**
 * Tests for HTML Sanitization Utility
 */
import { describe, it, expect } from 'vitest';
import { sanitizeHtml, sanitizeUserContent, stripHtml, containsUnsafeHtml } from './sanitize';

describe('sanitizeHtml', () => {
  it('should return empty string for empty input', () => {
    expect(sanitizeHtml('')).toBe('');
    expect(sanitizeHtml(null as unknown as string)).toBe('');
    expect(sanitizeHtml(undefined as unknown as string)).toBe('');
  });

  it('should allow safe HTML tags', () => {
    const input = '<p>Hello <strong>World</strong></p>';
    const result = sanitizeHtml(input);
    expect(result).toContain('<p>');
    expect(result).toContain('<strong>');
    expect(result).toContain('Hello');
    expect(result).toContain('World');
  });

  it('should remove script tags', () => {
    const input = '<p>Hello</p><script>alert("XSS")</script>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert');
    expect(result).toContain('<p>Hello</p>');
  });

  it('should remove onclick and other event handlers', () => {
    const input = '<button onclick="alert(\'XSS\')">Click</button>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('onclick');
    expect(result).not.toContain('alert');
  });

  it('should remove iframe tags', () => {
    const input = '<iframe src="https://evil.com"></iframe>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('<iframe');
    expect(result).not.toContain('evil.com');
  });

  it('should allow safe attributes', () => {
    const input = '<a href="https://example.com" class="link">Link</a>';
    const result = sanitizeHtml(input);
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('class="link"');
  });

  it('should allow img tags with safe attributes', () => {
    const input = '<img src="image.jpg" alt="Test" />';
    const result = sanitizeHtml(input);
    expect(result).toContain('<img');
    expect(result).toContain('src="image.jpg"');
    expect(result).toContain('alt="Test"');
  });

  it('should remove onerror from img tags', () => {
    const input = '<img src="x" onerror="alert(1)" />';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('onerror');
    expect(result).not.toContain('alert');
  });

  it('should handle nested malicious content', () => {
    const input = '<div><p onmouseover="evil()">Text<script>bad()</script></p></div>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('onmouseover');
    expect(result).not.toContain('<script>');
    expect(result).toContain('Text');
  });

  it('should allow tables', () => {
    const input = '<table><tr><td>Cell</td></tr></table>';
    const result = sanitizeHtml(input);
    expect(result).toContain('<table>');
    expect(result).toContain('<tr>');
    expect(result).toContain('<td>');
  });

  it('should allow lists', () => {
    const input = '<ul><li>Item 1</li><li>Item 2</li></ul>';
    const result = sanitizeHtml(input);
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>');
  });

  it('should allow headings', () => {
    const input = '<h1>Title</h1><h2>Subtitle</h2>';
    const result = sanitizeHtml(input);
    expect(result).toContain('<h1>');
    expect(result).toContain('<h2>');
  });
});

describe('sanitizeUserContent', () => {
  it('should only allow basic formatting', () => {
    const input = '<p>Hello <strong>World</strong> <a href="http://evil.com">Link</a></p>';
    const result = sanitizeUserContent(input);
    expect(result).toContain('<p>');
    expect(result).toContain('<strong>');
    expect(result).not.toContain('<a');
    expect(result).not.toContain('href');
  });

  it('should remove images', () => {
    const input = '<p>Text</p><img src="image.jpg" />';
    const result = sanitizeUserContent(input);
    expect(result).not.toContain('<img');
  });
});

describe('stripHtml', () => {
  it('should remove all HTML tags', () => {
    const input = '<p>Hello <strong>World</strong></p>';
    const result = stripHtml(input);
    expect(result).toBe('Hello World');
  });

  it('should handle empty input', () => {
    expect(stripHtml('')).toBe('');
  });

  it('should handle plain text', () => {
    expect(stripHtml('Hello World')).toBe('Hello World');
  });
});

describe('containsUnsafeHtml', () => {
  it('should return false for safe HTML', () => {
    expect(containsUnsafeHtml('<p>Hello</p>')).toBe(false);
  });

  it('should return true for script tags', () => {
    expect(containsUnsafeHtml('<script>alert(1)</script>')).toBe(true);
  });

  it('should return false for empty input', () => {
    expect(containsUnsafeHtml('')).toBe(false);
  });
});
