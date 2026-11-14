import { Video, HistoryItem, Collection, Channel } from '../../types';

export interface IIntentRouterStateProvider {
  getHistory?: () => HistoryItem[];
  getSubscriptions?: () => Channel[];
  createCollection?: (name: string) => void;
  getRankingProfile?: () => string;
  getCineMorphTheme?: () => string;
  getAudioPreset?: () => string;
}

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

  private static stateProvider: IIntentRouterStateProvider | null = null;

  public static setStateProvider(provider: IIntentRouterStateProvider | null): void {
    this.stateProvider = provider;
  }

  public static getStateProvider(): IIntentRouterStateProvider | null {
    return this.stateProvider;
  }

  /**
   * Executes the classified intent against state provider
   */
  public static async executeIntent(input: string, customProvider?: IIntentRouterStateProvider): Promise<IntentResult> {
    const { type, params } = this.classifyIntent(input);
    const provider = customProvider || this.stateProvider;

    switch (type) {
      case 'FIND_UNFINISHED': {
        const historyList = provider?.getHistory?.() || [];
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
        const subscriptions = provider?.getSubscriptions?.() || [];
        const subIds = new Set(subscriptions.map(s => s.id));
        const historyList = provider?.getHistory?.() || [];
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
        const historyList = provider?.getHistory?.() || [];
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
        provider?.createCollection?.(name);
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
        const ranking = provider?.getRankingProfile?.() || 'balanced';
        const theme = provider?.getCineMorphTheme?.() || 'classic-dark';
        const audioPreset = provider?.getAudioPreset?.() || 'flat';
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
