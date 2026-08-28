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

export function formatViews(views?: string) {
  if (!views) return '';
  const num = parseInt(views);
  if (isNaN(num)) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export function formatTimeAgo(dateString?: string) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
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
  
  // 1. Direct ID (alphanumeric, underscores, hyphens) with no URL schemes
  if (/^[a-zA-Z0-9_-]{5,32}$/.test(str) && !str.includes('/') && !str.includes('.') && !str.includes('?')) {
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
