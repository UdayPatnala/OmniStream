import { Channel } from '../../types';
import { useAppStore } from '../../store';

/**
 * SubscriptionRepository - Encapsulates channel subscriptions and favorites
 */
export class SubscriptionRepository {
  public static getAll(): Channel[] {
    return useAppStore.getState().subscriptions;
  }

  public static isSubscribed(channelId: string): boolean {
    return useAppStore.getState().subscriptions.some(c => c.id === channelId);
  }

  public static subscribe(channel: Channel): void {
    useAppStore.getState().subscribe(channel);
  }

  public static unsubscribe(channelId: string): void {
    useAppStore.getState().unsubscribe(channelId);
  }
}
