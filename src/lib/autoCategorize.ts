import { ResourceCategory } from '../types/resource';

/**
 * Validates whether a given string is a strictly valid HTTP/HTTPS URL.
 */
export function validateUrl(urlString: string): { isValid: boolean; error?: string } {
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
        error: 'Only http:// and https:// web protocols are allowed.',
      };
    }
    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      if (parsed.hostname !== 'localhost') {
        return {
          isValid: false,
          error: 'Please enter a valid domain name (e.g., https://example.com).',
        };
      }
    }
    return { isValid: true };
  } catch {
    return {
      isValid: false,
      error: 'Malformed URL. Please check formatting and syntax.',
    };
  }
}

/**
 * Lightweight regex pattern matching to categorize a URL.
 * Specification:
 * - Contains 'github.com' -> 'GitHub'
 * - Contains '://instagram.com', 'tiktok.com', or '://youtube.com' -> 'Reel'
 * - Ends with '.pdf', '.docx', '.md' -> 'Document'
 * - Default fallback -> 'Link'
 */
export function autoCategorizeUrl(rawUrl: string): ResourceCategory {
  const url = rawUrl.trim();
  if (!url) return 'Link';

  const cleanUrl = url.toLowerCase();

  // Check for GitHub
  if (cleanUrl.includes('github.com')) {
    return 'GitHub';
  }

  // Check for Reels/Video platforms: instagram.com, tiktok.com, youtube.com
  if (
    cleanUrl.includes('://instagram.com') ||
    cleanUrl.includes('tiktok.com') ||
    cleanUrl.includes('://youtube.com') ||
    cleanUrl.includes('youtu.be')
  ) {
    return 'Reel';
  }

  // Check for document file extensions (ignoring trailing query params or hashes)
  const pathWithoutQuery = cleanUrl.split('?')[0].split('#')[0];
  if (
    pathWithoutQuery.endsWith('.pdf') ||
    pathWithoutQuery.endsWith('.docx') ||
    pathWithoutQuery.endsWith('.md') ||
    pathWithoutQuery.endsWith('.doc') ||
    pathWithoutQuery.endsWith('.txt')
  ) {
    return 'Document';
  }

  return 'Link';
}

/**
 * Generates a sensible fallback title based on URL host or path
 */
export function suggestTitleFromUrl(url: string): string {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^www\./, '');
    const pathname = parsed.pathname.replace(/^\/|\/$/g, '');

    if (host.includes('github.com') && pathname) {
      return pathname; // e.g. "facebook/react"
    }

    if (pathname) {
      const parts = pathname.split('/');
      const last = parts[parts.length - 1];
      if (last && last.length > 2) {
        const decoded = decodeURIComponent(last).replace(/[-_]/g, ' ');
        return decoded.charAt(0).toUpperCase() + decoded.slice(1);
      }
    }

    return host.charAt(0).toUpperCase() + host.slice(1);
  } catch {
    return '';
  }
}
