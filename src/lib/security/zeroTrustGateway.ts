/**
 * Zero-Trust Security Gateway & Defense-In-Depth Policy Engine
 * Validates untrusted input, sanitizes data boundaries, and enforces rate limits.
 */

export interface ValidationResult<T> {
  isValid: boolean;
  sanitizedValue?: T;
  error?: string;
}

export class ZeroTrustGateway {
  private static rateLimitBuckets: Map<string, { tokens: number; lastRefill: number }> = new Map();
  private static BUCKET_CAPACITY = 20;
  private static REFILL_RATE_PER_SEC = 5;

  /**
   * Sanitizes generic string inputs to prevent XSS, HTML injection, and control code exploits
   */
  public static sanitizeString(input: string, maxLength: number = 500): string {
    if (!input || typeof input !== 'string') return '';
    return input
      .trim()
      .slice(0, maxLength)
      .replace(/[<>]/g, '') // Strip angle brackets
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, ''); // Strip control characters
  }

  /**
   * Validates YouTube video ID against strict 11-char alphanumeric pattern
   */
  public static validateVideoId(id: string): ValidationResult<string> {
    if (!id || typeof id !== 'string') {
      return { isValid: false, error: 'Video ID must be a non-empty string' };
    }
    const cleanId = id.trim();
    const isValid = /^[a-zA-Z0-9_-]{11}$/.test(cleanId);
    return isValid
      ? { isValid: true, sanitizedValue: cleanId }
      : { isValid: false, error: 'Invalid YouTube Video ID format' };
  }

  /**
   * Validates channel ID format
   */
  public static validateChannelId(id: string): ValidationResult<string> {
    if (!id || typeof id !== 'string') {
      return { isValid: false, error: 'Channel ID must be a non-empty string' };
    }
    const cleanId = id.trim();
    const isValid = /^[a-zA-Z0-9_-]{1,64}$/.test(cleanId);
    return isValid
      ? { isValid: true, sanitizedValue: cleanId }
      : { isValid: false, error: 'Invalid Channel ID format' };
  }

  /**
   * Validates search queries
   */
  public static validateSearchQuery(query: string): ValidationResult<string> {
    const sanitized = this.sanitizeString(query, 256);
    if (sanitized.length === 0) {
      return { isValid: false, error: 'Search query is empty or invalid' };
    }
    return { isValid: true, sanitizedValue: sanitized };
  }

  /**
   * Sliding Token Bucket Rate Limiter
   * Returns true if request is allowed, false if rate limited.
   */
  public static checkRateLimit(clientId: string = 'global'): boolean {
    const now = Date.now();
    let bucket = this.rateLimitBuckets.get(clientId);

    if (!bucket) {
      bucket = { tokens: this.BUCKET_CAPACITY, lastRefill: now };
      this.rateLimitBuckets.set(clientId, bucket);
    }

    // Refill tokens based on elapsed time
    const elapsedSec = (now - bucket.lastRefill) / 1000;
    bucket.tokens = Math.min(this.BUCKET_CAPACITY, bucket.tokens + elapsedSec * this.REFILL_RATE_PER_SEC);
    bucket.lastRefill = now;

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }
    return false;
  }

  /**
   * Validates imported backup JSON before applying to state
   */
  public static validateBackupSchema(data: any): boolean {
    if (!data || typeof data !== 'object') return false;
    if (typeof data.version !== 'number') return false;
    if (data.history && typeof data.history !== 'object') return false;
    if (data.subscriptions && !Array.isArray(data.subscriptions)) return false;
    if (data.collections && !Array.isArray(data.collections)) return false;
    return true;
  }

  /**
   * Authorizes Tool Executions
   * Enforces that destructive tools cannot execute without explicit confirmation
   */
  public static authorizeTool(
    toolName: string,
    isConfirmedByUser: boolean = false
  ): { authorized: boolean; reason?: string } {
    const destructiveTools = ['deleteHistory', 'clearAllHistory', 'deleteCollection', 'resetSettings'];
    
    if (destructiveTools.includes(toolName)) {
      if (!isConfirmedByUser) {
        return {
          authorized: false,
          reason: `Destructive action [${toolName}] requires explicit user authorization.`,
        };
      }
    }

    return { authorized: true };
  }
}
