import { extractUrlFromText, parseQuickSendInput, ParsedQuickSendResult } from './quickSendParser';
import { autoCategorizeUrl, suggestTitleFromUrl } from './autoCategorize';
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
 */
export function extractIncomingShareFromUrl(): IncomingSharedData | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const url = params.get('url') || params.get('share_url') || params.get('saveUrl') || params.get('link');
    const title = params.get('title') || params.get('share_title') || params.get('name');
    const text = params.get('text') || params.get('share_text') || params.get('send');

    // If none of these share parameters are present, no share occurred
    if (!url && !title && !text) {
      return null;
    }

    // Build the most descriptive raw string for our parser
    let rawString = '';

    // If URL is explicitly given
    if (url && url.trim()) {
      const trimmedUrl = url.trim();
      const trimmedTitle = title ? title.trim() : '';
      const trimmedText = text ? text.trim() : '';

      // If text has distinct content not identical to the URL
      if (trimmedText && trimmedText !== trimmedUrl) {
        rawString = trimmedTitle ? `${trimmedTitle} - ${trimmedText} ${trimmedUrl}` : `${trimmedText} ${trimmedUrl}`;
      } else if (trimmedTitle && trimmedTitle !== trimmedUrl) {
        rawString = `${trimmedTitle}: ${trimmedUrl}`;
      } else {
        rawString = trimmedUrl;
      }
    } else if (text && text.trim()) {
      // Often Android apps (Twitter, YouTube, Instagram) put the link directly in 'text'
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
    console.warn('Error parsing incoming share from URL:', err);
    return null;
  }
}

/**
 * Stores shared data in localStorage if the user is unauthenticated,
 * so it can be saved immediately once they log in.
 */
export function storePendingShare(data: IncomingSharedData): void {
  try {
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
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    localStorage.removeItem(STORAGE_KEY);
    const parsed = JSON.parse(raw);
    // Ignore shares older than 24 hours
    if (parsed.timestamp && Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
      return null;
    }
    return {
      url: parsed.url,
      title: parsed.title,
      text: parsed.text,
      rawString: parsed.rawString || parsed.url || parsed.text || '',
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
      window.history.replaceState({}, document.title, url.pathname + (url.search ? url.search : ''));
    }
  } catch (e) {
    console.warn('Could not clean URL params:', e);
  }
}

/**
 * Converts IncomingSharedData into prefilled ResourceFormData
 * so the user can review and edit title, description, category, and tags
 * in the pop-up window before saving to Firestore.
 */
export function convertIncomingShareToFormData(data: IncomingSharedData): ResourceFormData {
  const rawCandidate = data.rawString || data.url || data.text || data.title || '';
  const baseline = parseQuickSendInput(rawCandidate);
  const formData: ResourceFormData = { ...baseline.formData };

  // Prioritize explicit URL if provided
  if (data.url && data.url.trim()) {
    formData.url = data.url.trim();
    formData.category = autoCategorizeUrl(formData.url);
  }

  // Prioritize explicit title if provided and non-trivial
  if (data.title && data.title.trim() && data.title.trim() !== formData.url) {
    formData.title = data.title.trim();
  }

  // Prioritize explicit text for description if non-empty
  if (data.text && data.text.trim()) {
    const textWithoutUrl = data.text.replace(/https?:\/\/[^\s]+/gi, '').trim();
    if (textWithoutUrl) {
      formData.description = textWithoutUrl;
    }
  }

  return formData;
}

