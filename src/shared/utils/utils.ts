import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(isoDuration?: string) {
  if (!isoDuration) return '';
  const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return '0:00';
  
  const hours = (parseInt(match[1]) || 0);
  const minutes = (parseInt(match[2]) || 0);
  const seconds = (parseInt(match[3]) || 0);
  
  let result = '';
  if (hours > 0) result += hours + ':';
  result += (hours > 0 ? minutes.toString().padStart(2, '0') : minutes) + ':';
  result += seconds.toString().padStart(2, '0');
  return result;
}

export function formatViews(views?: string | number) {
  if (!views && views !== 0) return '';
  const str = String(views).trim();
  if (/[0-9.]+\s*[KMBkmb]/i.test(str)) {
    return str.replace(/\s*(subscribers|views)/i, '').trim();
  }
  const num = parseFloat(str.replace(/,/g, ''));
  if (isNaN(num)) return str;
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
}

export function formatTimeAgo(dateString?: string): string {
  if (!dateString) return '';
  const trimmed = dateString.trim();

  // If already relative format from YouTube scraping or client (e.g. "2 hrs ago", "3 days ago", "2 yrs ago", "Recently")
  if (/ago$/i.test(trimmed) || /^(recently|yesterday|today|just now)/i.test(trimmed)) {
    return trimmed
      .replace(/(\d+)\s+hours?\s+ago/i, (_, n) => `${n} ${n === '1' ? 'hr' : 'hrs'} ago`)
      .replace(/(\d+)\s+years?\s+ago/i, (_, n) => `${n} ${n === '1' ? 'yr' : 'yrs'} ago`)
      .replace(/(\d+)\s+months?\s+ago/i, (_, n) => `${n} ${n === '1' ? 'month' : 'months'} ago`)
      .replace(/(\d+)\s+weeks?\s+ago/i, (_, n) => `${n} ${n === '1' ? 'week' : 'weeks'} ago`)
      .replace(/(\d+)\s+days?\s+ago/i, (_, n) => `${n} ${n === '1' ? 'day' : 'days'} ago`)
      .replace(/(\d+)\s+minutes?\s+ago/i, (_, n) => `${n} ${n === '1' ? 'min' : 'mins'} ago`);
  }

  try {
    const date = new Date(trimmed);
    if (isNaN(date.getTime())) {
      return trimmed;
    }
    const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
    
    let interval = seconds / 31536000;
    if (interval >= 1) {
      const v = Math.floor(interval);
      return `${v} ${v === 1 ? 'yr' : 'yrs'} ago`;
    }
    interval = seconds / 2592000;
    if (interval >= 1) {
      const v = Math.floor(interval);
      return `${v} ${v === 1 ? 'month' : 'months'} ago`;
    }
    interval = seconds / 604800;
    if (interval >= 1) {
      const v = Math.floor(interval);
      return `${v} ${v === 1 ? 'week' : 'weeks'} ago`;
    }
    interval = seconds / 86400;
    if (interval >= 1) {
      const v = Math.floor(interval);
      return `${v} ${v === 1 ? 'day' : 'days'} ago`;
    }
    interval = seconds / 3600;
    if (interval >= 1) {
      const v = Math.floor(interval);
      return `${v} ${v === 1 ? 'hr' : 'hrs'} ago`;
    }
    interval = seconds / 60;
    if (interval >= 1) {
      const v = Math.floor(interval);
      return `${v} ${v === 1 ? 'min' : 'mins'} ago`;
    }
    return 'Just now';
  } catch (e) {
    return dateString;
  }
}

export function extractYouTubeId(input: string): string | null {
  if (!input) return null;
  const str = input.trim();

  // Reject strings containing dangerous XSS characters
  if (/[<>"'`\\{}]/.test(str)) {
    return null;
  }
  
  // 1. Direct YouTube 11-char Video ID or internal test fixture ID (vid_...)
  if ((/^[a-zA-Z0-9_-]{11}$/.test(str) || /^vid_[a-zA-Z0-9_-]+$/.test(str)) && !str.includes('/') && !str.includes('.') && !str.includes('?')) {
    return str;
  }
  
  // 2. YouTube Shorts
  const shortsMatch = str.match(/(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{5,32})/);
  if (shortsMatch && shortsMatch[1]) {
    return shortsMatch[1];
  }
  
  // 3. YouTube standard watch, youtu.be, embed, v
  const regExp = /(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([a-zA-Z0-9_-]{5,32})/;
  const match = str.match(regExp);
  if (match && match[1]) {
    return match[1];
  }
  
  return null;
}
