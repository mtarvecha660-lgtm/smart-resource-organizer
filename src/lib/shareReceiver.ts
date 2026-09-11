// File: src/lib/shareReceiver.ts
import { parseQuickSendInput } from './quickSendParser';
import { autoCategorizeUrl } from './autoCategorize';
import { ResourceFormData } from '../types/resource';

export interface IncomingSharedData {
  url?: string | null;
  title?: string | null;
  text?: string | null;
  rawString: string;
}

const STORAGE_KEY = 'sro_pending_mobile_share';

/**
 * Checks current window.location.search for incoming share parameters
 * sent by Android Share Sheet / Web Share Target or external bookmarklets.
 * Wrapped in defensive try/catch to ensure it never throws.
 */
export function extractIncomingShareFromUrl(): IncomingSharedData | null {
  try {
    if (typeof window === 'undefined' || !window.location || !window.location.search) {
      return null;
    }

    const params = new URLSearchParams(window.location.search);
    const url = params.get('url') || params.get('share_url') || params.get('saveUrl') || params.get('link');
    const title = params.get('title') || params.get('share_title') || params.get('name');
    const text = params.get('text') || params.get('share_text') || params.get('send');

    if (!url && !title && !text) {
      return null;
    }

    let rawString = '';

    if (url && url.trim()) {
      const trimmedUrl = url.trim();
      const trimmedTitle = title ? title.trim() : '';
      const trimmedText = text ? text.trim() : '';

      if (trimmedText && trimmedText !== trimmedUrl) {
        rawString = trimmedTitle ? `${trimmedTitle} - ${trimmedText} ${trimmedUrl}` : `${trimmedText} ${trimmedUrl}`;
      } else if (trimmedTitle && trimmedTitle !== trimmedUrl) {
        rawString = `${trimmedTitle}: ${trimmedUrl}`;
      } else {
        rawString = trimmedUrl;
      }
    } else if (text && text.trim()) {
      const trimmedText = text.trim();
      const trimmedTitle = title ? title.trim() : '';
      if (trimmedTitle && !trimmedText.includes(trimmedTitle)) {
        rawString = `${trimmedTitle}: ${trimmedText}`;
      } else {
        rawString = trimmedText;
      }
    } else if (title && title.trim()) {
      rawString = title.trim();
    }

    return {
      url: url ? url.trim() : null,
      title: title ? title.trim() : null,
      text: text ? text.trim() : null,
      rawString: rawString.trim(),
    };
  } catch (err) {
    console.warn('Error extracting incoming share from URL:', err);
    return null;
  }
}

/**
 * Stores shared data in localStorage if the user is unauthenticated.
 */
export function storePendingShare(data: IncomingSharedData): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...data,
        timestamp: Date.now(),
      })
    );
  } catch (e) {
    console.warn('Could not store pending share in localStorage:', e);
  }
}

/**
 * Retrieves and clears any pending share data from localStorage.
 */
export function popPendingShare(): IncomingSharedData | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    localStorage.removeItem(STORAGE_KEY);

    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      parsed.timestamp &&
      Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000
    ) {
      return null;
    }

    return {
      url: typeof parsed.url === 'string' ? parsed.url : null,
      title: typeof parsed.title === 'string' ? parsed.title : null,
      text: typeof parsed.text === 'string' ? parsed.text : null,
      rawString:
        typeof parsed.rawString === 'string'
          ? parsed.rawString
          : typeof parsed.url === 'string'
          ? parsed.url
          : '',
    };
  } catch (e) {
    console.warn('Could not retrieve pending share:', e);
    return null;
  }
}

/**
 * Clears share query parameters from browser URL without reloading page.
 */
export function cleanShareUrlParams(): void {
  try {
    if (typeof window === 'undefined' || !window.location || !window.history) return;
    const url = new URL(window.location.href);
    const shareKeys = [
      'url',
      'share_url',
      'saveUrl',
      'link',
      'title',
      'share_title',
      'name',
      'text',
      'share_text',
      'send',
    ];
    let changed = false;
    for (const key of shareKeys) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        changed = true;
      }
    }
    if (changed) {
      window.history.replaceState(
        {},
        document.title,
        url.pathname + (url.search ? url.search : '')
      );
    }
  } catch (e) {
    console.warn('Could not clean URL params:', e);
  }
}

/**
 * Converts IncomingSharedData into prefilled ResourceFormData.
 * Guarantees a valid ResourceFormData object even with corrupted or partial input.
 */
export function convertIncomingShareToFormData(data: IncomingSharedData): ResourceFormData {
  try {
    const rawCandidate = data.rawString || data.url || data.text || data.title || '';
    const baseline = parseQuickSendInput(rawCandidate);
    const formData: ResourceFormData = { ...baseline.formData };

    if (data.url && data.url.trim()) {
      formData.url = data.url.trim();
      formData.category = autoCategorizeUrl(formData.url);
    }

    if (data.title && data.title.trim() && data.title.trim() !== formData.url) {
      formData.title = data.title.trim();
    }

    if (data.text && data.text.trim()) {
      const textWithoutUrl = data.text.replace(/https?:\/\/[^\s]+/gi, '').trim();
      if (textWithoutUrl) {
        formData.description = textWithoutUrl;
      }
    }

    return formData;
  } catch (err) {
    console.error('convertIncomingShareToFormData error fallback:', err);
    return {
      title: data.title || 'Shared Resource',
      url: data.url || `https://smart-resource.local/notes/${Date.now().toString(36)}`,
      category: 'Document',
      description: data.text || data.rawString || 'Captured share',
      tags: ['share', 'mobile'],
    };
  }
}
