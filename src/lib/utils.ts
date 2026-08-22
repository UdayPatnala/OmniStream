import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow } from 'date-fns';

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
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch (e) {
    return dateString;
  }
}

export function extractYouTubeId(input: string): string | null {
  if (!input) return null;
  const str = input.trim();
  
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
    return str;
  }
  
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = str.match(regExp);
  if (match && match[2] && match[2].length === 11) {
    return match[2];
  }
  
  return null;
}
