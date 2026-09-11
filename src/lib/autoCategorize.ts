// File: src/lib/autoCategorize.ts
/**
 * @file autoCategorize.ts
 * Robust, deterministic offline categorizer and URL analyzer.
 * 
 * DESIGN PRINCIPLES:
 * 1. Zero external network dependency: 100% deterministic local execution.
 * 2. Strict input validation and sanitization.
 * 3. Never throws: all failure modes yield safe, deterministic fallbacks.
 * 4. Strict TypeScript typing with no `any`.
 */

import { ResourceCategory } from '../types/resource';

export interface UrlValidationResult {
  isValid: boolean;
  normalizedUrl?: string;
  error?: string;
}

export interface SuggestedResourceMetadata {
  category: ResourceCategory;
  suggestedTitle: string;
  suggestedTags: string[];
  hostname: string;
}

/**
 * Validates whether a given string is a strictly valid HTTP/HTTPS URL.
 */
export function validateUrl(urlString: unknown): UrlValidationResult {
  if (typeof urlString !== 'string') {
    return { isValid: false, error: 'URL must be a string.' };
  }

  const trimmed = urlString.trim();
  if (!trimmed) {
    return { isValid: false, error: 'URL is required.' };
  }

  // Strict protocol check: MUST begin with http:// or https://
  if (!/^https?:\/\//i.test(trimmed)) {
    return {
      isValid: false,
      error: 'Invalid protocol. URL must start with http:// or https://',
    };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        isValid: false,
        error: 'Only http:// and https:// protocols are permitted.',
      };
    }

    if (!parsed.hostname || (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost')) {
      return {
        isValid: false,
        error: 'Please enter a valid domain name (e.g., https://example.com).',
      };
    }

    return {
      isValid: true,
      normalizedUrl: parsed.toString(),
    };
  } catch {
    return {
      isValid: false,
      error: 'Malformed URL format. Please check syntax.',
    };
  }
}

/**
 * Deterministic offline rule matching for resource classification.
 * Matches with highest precedence:
 * 1. GitHub repositories and gists
 * 2. Short-form & long-form video reels
 * 3. Documents, specifications, papers, and tech markdown
 * 4. General web links
 */
export function autoCategorizeUrl(rawUrl: unknown): ResourceCategory {
  if (typeof rawUrl !== 'string') return 'Link';
  const url = rawUrl.trim();
  if (!url) return 'Link';

  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const pathname = parsed.pathname.toLowerCase();

    // 1. GitHub
    if (
      host === 'github.com' ||
      host.endsWith('.github.com') ||
      host === 'gist.github.com' ||
      host === 'raw.githubusercontent.com' ||
      host === 'gitlab.com' ||
      host === 'bitbucket.org'
    ) {
      return 'GitHub';
    }

    // 2. Video / Reel Platforms
    if (
      host === 'youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'youtu.be' ||
      host === 'instagram.com' ||
      host === 'tiktok.com' ||
      host === 'vimeo.com' ||
      host === 'twitch.tv' ||
      (host === 'x.com' && pathname.includes('/status/')) ||
      (host === 'twitter.com' && pathname.includes('/status/'))
    ) {
      return 'Reel';
    }

    // 3. Document extensions
    const docExtensions = [
      '.pdf',
      '.docx',
      '.doc',
      '.md',
      '.markdown',
      '.txt',
      '.rtf',
      '.epub',
      '.odt',
      '.csv',
      '.tsv',
      '.xlsx',
      '.ppt',
      '.pptx',
      '.json',
      '.yaml',
      '.yml',
    ];

    if (docExtensions.some((ext) => pathname.endsWith(ext))) {
      return 'Document';
    }

    // Document & Spec directory paths
    if (
      host.includes('arxiv.org') ||
      host.includes('notion.site') ||
      host.includes('notion.so') ||
      pathname.includes('/docs/') ||
      pathname.includes('/documentation/') ||
      pathname.includes('/spec/') ||
      pathname.includes('/rfc/') ||
      pathname.includes('/manual/') ||
      pathname.includes('/wiki/')
    ) {
      return 'Document';
    }

    return 'Link';
  } catch {
    return 'Link';
  }
}

/**
 * Generates a clean, deterministic title suggested from the URL path or domain.
 */
export function suggestTitleFromUrl(rawUrl: unknown): string {
  if (typeof rawUrl !== 'string') return '';
  const url = rawUrl.trim();
  if (!url) return '';

  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    const host = parsed.hostname.replace(/^www\./, '');
    const cleanPath = parsed.pathname.replace(/^\/|\/$/g, '');

    // GitHub repository pattern: owner/repo
    if (host.includes('github.com') && cleanPath) {
      const parts = cleanPath.split('/');
      if (parts.length >= 2) {
        return `${parts[0]}/${parts[1]}`;
      }
      return cleanPath;
    }

    if (cleanPath) {
      const segments = cleanPath.split('/').filter(Boolean);
      const lastSegment = segments[segments.length - 1];
      if (lastSegment && lastSegment.length > 1) {
        // Strip common file extensions
        const withoutExt = lastSegment.replace(/\.[a-z0-9]+$/i, '');
        const decoded = decodeURIComponent(withoutExt).replace(/[-_+]/g, ' ').trim();
        if (decoded.length > 1) {
          return decoded.charAt(0).toUpperCase() + decoded.slice(1);
        }
      }
    }

    // Fallback to capitalized domain name
    const domainName = host.split('.')[0] || host;
    return domainName.charAt(0).toUpperCase() + domainName.slice(1);
  } catch {
    return '';
  }
}

/**
 * Extracts suggested deterministic tags based on hostname and category.
 */
export function extractDeterministicTags(rawUrl: string, category: ResourceCategory): string[] {
  const tags: string[] = [];

  try {
    const parsed = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    const primaryDomain = host.split('.')[0];

    if (category === 'GitHub') {
      tags.push('github', 'repository');
    } else if (category === 'Reel') {
      tags.push('media', 'video');
    } else if (category === 'Document') {
      tags.push('doc', 'reference');
    } else {
      tags.push('link');
    }

    if (primaryDomain && primaryDomain.length > 2 && !tags.includes(primaryDomain)) {
      tags.push(primaryDomain);
    }
  } catch {
    tags.push('resource');
  }

  return tags;
}

/**
 * Comprehensive analysis for offline resource intake.
 */
export function analyzeResourceInput(rawUrl: string): SuggestedResourceMetadata {
  const category = autoCategorizeUrl(rawUrl);
  const suggestedTitle = suggestTitleFromUrl(rawUrl);
  const suggestedTags = extractDeterministicTags(rawUrl, category);

  let hostname = '';
  try {
    hostname = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`).hostname.replace(
      /^www\./,
      ''
    );
  } catch {
    hostname = rawUrl;
  }

  return {
    category,
    suggestedTitle: suggestedTitle || hostname,
    suggestedTags,
    hostname,
  };
}
