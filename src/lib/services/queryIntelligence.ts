/**
 * Query Intelligence - Query normalization, multi-language awareness, and multi-strategy query variation generator.
 */

export interface QueryAnalysis {
  originalQuery: string;
  normalizedQuery: string;
  detectedLanguage: string;
  strategies: string[];
}

export function detectLanguage(query: string): string {
  // Unicode range checks for scripts
  if (/[\u0C00-\u0C7F]/.test(query)) return 'Telugu';
  if (/[\u0900-\u097F]/.test(query)) return 'Hindi';
  if (/[\u0B80-\u0BFF]/.test(query)) return 'Tamil';
  if (/[\u0600-\u06FF]/.test(query)) return 'Arabic';
  if (/[\u4E00-\u9FFF]/.test(query)) return 'Chinese';
  if (/[\u3040-\u30FF]/.test(query)) return 'Japanese';
  return 'English';
}

export function normalizeQuery(query: string): string {
  return query
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\u0C00-\u0C7F\u0900-\u097F\u0B80-\u0BFF]/gi, '');
}

export function generateSearchStrategies(query: string): QueryAnalysis {
  const original = query.trim();
  const normalized = normalizeQuery(original);
  const language = detectLanguage(original);

  const strategies: string[] = [normalized || original];

  const lower = normalized.toLowerCase();
  
  // Strategy 2: Topic + tutorial / course suffix if not present
  if (!lower.includes('tutorial') && !lower.includes('course')) {
    strategies.push(`${normalized} tutorial`);
  }

  // Strategy 3: Topic + explained
  if (!lower.includes('explained') && !lower.includes('guide')) {
    strategies.push(`${normalized} explained`);
  }

  // Strategy 4: Topic + beginner / complete
  if (!lower.includes('beginner') && !lower.includes('full')) {
    strategies.push(`${normalized} beginner complete course`);
  }

  // Strategy 5: Core keywords (first 3 main words)
  const coreWords = normalized.split(/\s+/).filter(w => w.length > 2).slice(0, 3).join(' ');
  if (coreWords && coreWords !== normalized) {
    strategies.push(coreWords);
  }

  return {
    originalQuery: original,
    normalizedQuery: normalized,
    detectedLanguage: language,
    strategies: Array.from(new Set(strategies)),
  };
}
