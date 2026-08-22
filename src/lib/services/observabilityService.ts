/**
 * Observability & Diagnostic Telemetry Logger for YouTube Discovery Pipeline.
 */

export interface TelemetryDiagnosticRecord {
  id: string;
  query: string;
  searchStartedAt: number;
  searchLatencyMs: number;
  candidateCount: number;
  selectedVideoId: string;
  selectedVideoTitle: string;
  validationResult: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  playerLoadTimeMs: number;
  retryCount: number;
  fallbackCount: number;
  finalStatus: 'PLAYING' | 'RECOVERED' | 'FAILED';
  detectedLanguage: string;
  strategyUsed: string;
}

class ObservabilityService {
  private records: TelemetryDiagnosticRecord[] = [];
  private listeners: Set<(records: TelemetryDiagnosticRecord[]) => void> = new Set();

  public logDiagnostic(record: Omit<TelemetryDiagnosticRecord, 'id'>): void {
    const fullRecord: TelemetryDiagnosticRecord = {
      ...record,
      id: Math.random().toString(36).substring(2, 9),
    };

    console.log('[CineMorph Telemetry]:', fullRecord);
    this.records = [fullRecord, ...this.records.slice(0, 49)];
    this.notify();
  }

  public getRecords(): TelemetryDiagnosticRecord[] {
    return this.records;
  }

  public getLatestRecord(): TelemetryDiagnosticRecord | null {
    return this.records[0] || null;
  }

  public subscribe(listener: (records: TelemetryDiagnosticRecord[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.records);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach(l => l(this.records));
  }
}

export const observabilityService = new ObservabilityService();
