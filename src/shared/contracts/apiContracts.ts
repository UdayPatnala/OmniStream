/**
 * OmniStream / CineMorph — Authoritative Shared API Contracts & Error Schemas
 *
 * Defines canonical API payloads between Frontend, Backend Services, and Serverless Edge.
 * Runtime independent: shared by server.ts, api/*.ts, and client services.
 */

export type ApiErrorCode =
  | 'INVALID_REQUEST'
  | 'UPSTREAM_TIMEOUT'
  | 'UPSTREAM_UNAVAILABLE'
  | 'UPSTREAM_INVALID_RESPONSE'
  | 'INTERNAL_ERROR'
  | 'RATE_LIMITED'
  | 'UNSUPPORTED_OPERATION';

export interface ApiErrorResponse {
  readonly success: false;
  readonly error: string;
  readonly code: ApiErrorCode;
  readonly message: string;
  readonly timestamp: string;
  readonly generation?: number;
}

export interface HealthResponse {
  readonly status: 'healthy' | 'degraded' | 'unavailable';
  readonly service: string;
  readonly timestamp: string;
  readonly uptime: number;
  readonly version: string;
}

export interface SuggestRequest {
  readonly query: string;
}

export type SuggestResponse = readonly string[];

export interface OembedRequest {
  readonly id: string;
}

export interface OembedResponse {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly channelId: string;
  readonly channelTitle: string;
  readonly publishedAt: string;
  readonly thumbnails: {
    readonly medium: string;
    readonly high: string;
  };
  readonly duration: string;
  readonly viewCount: string;
}

export interface SearchResultItem {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly channelId: string;
  readonly channelTitle: string;
  readonly publishedAt: string;
  readonly thumbnails: {
    readonly medium: string;
    readonly high: string;
  };
  readonly duration: string;
  readonly viewCount: string;
}

export interface SearchResponse {
  readonly results: readonly SearchResultItem[];
  readonly totalResults?: number;
  readonly query: string;
  readonly cached?: boolean;
}
