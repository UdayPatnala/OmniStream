import { useAppStore } from '../../store';
import { Video, HistoryItem, Collection, Channel } from '../../types';

export type IntentType = 
  | 'STANDARD_SEARCH'
  | 'FIND_UNFINISHED'
  | 'FIND_HISTORY_TOPIC'
  | 'FIND_SUBSCRIPTION_CONTENT'
  | 'CREATE_COLLECTION'
  | 'CLEAR_HISTORY_REQUEST'
  | 'GET_DIAGNOSTICS';

export interface IntentResult {
  type: IntentType;
  query: string;
  matchedVideos?: Video[];
  message: string;
  actionExecuted?: boolean;
  requiresConfirmation?: boolean;
}

/**
 * Local-First Productivity Intent Router & Natural Query Interpreter
 * 100% Free, Zero External API dependencies, Instant <1ms Local Resolution
 */
export class IntentRouter {
  /**
   * Classifies user natural language input into typed actionable intents
   */
  public static classifyIntent(input: string): { type: IntentType; params: Record<string, any> } {
    const text = input.trim().toLowerCase();

    // 1. Unfinished / In-Progress Videos
    if (
      text.includes('unfinished') || 
      text.includes('continue watching') || 
      text.includes('in progress') || 
      text.includes('resume') || 
      text.includes('half watched')
    ) {
      return { type: 'FIND_UNFINISHED', params: {} };
    }

    // 2. Subscribed channel content
    if (
      text.includes('from my subscriptions') || 
      text.includes('subscribed channels') || 
      text.includes('my channels') ||
      text.includes('sub channels')
    ) {
      const topic = text.replace(/(from my subscriptions|subscribed channels|my channels|sub channels|about|videos)/gi, '').trim();
      return { type: 'FIND_SUBSCRIPTION_CONTENT', params: { topic } };
    }

    // 3. Create Collection (matches on original input to preserve casing)
    const createMatch = input.trim().match(/(?:create|make|new)\s+(?:collection|playlist)\s+(?:named|called)?\s*["']?([^"']+)["']?/i);
    if (createMatch && createMatch[1]) {
      return { type: 'CREATE_COLLECTION', params: { name: createMatch[1].trim() } };
    }

    // 4. Clear history request
    if (text === 'clear history' || text === 'delete my history' || text === 'reset history') {
      return { type: 'CLEAR_HISTORY_REQUEST', params: {} };
    }

    // 5. Diagnostics
    if (text.includes('diagnostics') || text.includes('telemetry') || text.includes('player stats') || text.includes('audio status')) {
      return { type: 'GET_DIAGNOSTICS', params: {} };
    }

    // 6. History by Topic
    const historyTopicMatch = input.trim().match(/(?:history for|watched about|find past|my past)\s+(.+)/i);
    if (historyTopicMatch && historyTopicMatch[1]) {
      return { type: 'FIND_HISTORY_TOPIC', params: { topic: historyTopicMatch[1].trim() } };
    }

    return { type: 'STANDARD_SEARCH', params: { query: input.trim() } };
  }

  /**
   * Executes the classified intent against local store state
   */
  public static async executeIntent(input: string): Promise<IntentResult> {
    const { type, params } = this.classifyIntent(input);
    const store = useAppStore.getState();

    switch (type) {
      case 'FIND_UNFINISHED': {
        const historyList = Object.values(store.history);
        const unfinished = historyList
          .filter(h => h.progress > 10 && h.duration > 0 && h.progress < h.duration * 0.9)
          .sort((a, b) => b.watchedAt - a.watchedAt)
          .map(h => h.video);

        return {
          type,
          query: input,
          matchedVideos: unfinished,
          message: unfinished.length > 0
            ? `Found ${unfinished.length} in-progress video${unfinished.length > 1 ? 's' : ''} to resume.`
            : 'No unfinished videos found in your history.',
        };
      }

      case 'FIND_SUBSCRIPTION_CONTENT': {
        const subIds = new Set(store.subscriptions.map(s => s.id));
        const historyList = Object.values(store.history);
        const topic = (params.topic || '').toLowerCase();

        const fromSubs = historyList
          .filter(h => subIds.has(h.video.channelId))
          .filter(h => !topic || h.video.title.toLowerCase().includes(topic) || h.video.description.toLowerCase().includes(topic))
          .map(h => h.video);

        return {
          type,
          query: input,
          matchedVideos: fromSubs,
          message: fromSubs.length > 0
            ? `Found ${fromSubs.length} video${fromSubs.length > 1 ? 's' : ''} from your subscribed channels.`
            : `No matching videos found from your subscribed channels${topic ? ` for "${topic}"` : ''}.`,
        };
      }

      case 'FIND_HISTORY_TOPIC': {
        const topic = (params.topic || '').toLowerCase();
        const historyList = Object.values(store.history);
        const matched = historyList
          .filter(h => h.video.title.toLowerCase().includes(topic) || h.video.description.toLowerCase().includes(topic))
          .sort((a, b) => b.watchedAt - a.watchedAt)
          .map(h => h.video);

        return {
          type,
          query: input,
          matchedVideos: matched,
          message: matched.length > 0
            ? `Found ${matched.length} video${matched.length > 1 ? 's' : ''} in your history matching "${topic}".`
            : `No history records found matching "${topic}".`,
        };
      }

      case 'CREATE_COLLECTION': {
        const name = params.name;
        if (!name) {
          return { type, query: input, message: 'Please specify a name for the collection.' };
        }
        store.createCollection(name);
        return {
          type,
          query: input,
          message: `Collection "${name}" created successfully.`,
          actionExecuted: true,
        };
      }

      case 'CLEAR_HISTORY_REQUEST': {
        return {
          type,
          query: input,
          message: 'Clearing your history is a permanent action. Please confirm in Settings.',
          requiresConfirmation: true,
        };
      }

      case 'GET_DIAGNOSTICS': {
        const ranking = store.rankingProfile;
        const theme = store.cinemorphTheme;
        const audioPreset = store.audioEQ.preset;
        return {
          type,
          query: input,
          message: `Diagnostics: Ranking Profile [${ranking.toUpperCase()}], Cinema Theme [${theme}], Audio DSP [${audioPreset.toUpperCase()}].`,
        };
      }

      default:
        return {
          type: 'STANDARD_SEARCH',
          query: input,
          message: `Executing standard search for "${input}".`,
        };
    }
  }
}
