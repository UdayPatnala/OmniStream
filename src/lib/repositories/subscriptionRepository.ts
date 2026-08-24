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
    return useAppStore.getState().subscriptions.some((c) => c.id === channelId);
  }

  public static getById(channelId: string): Channel | undefined {
    return useAppStore.getState().subscriptions.find((c) => c.id === channelId);
  }

  public static subscribe(channel: Channel): void {
    const cleanChannel: Channel = {
      ...channel,
      pinned: false,
      isFavorite: false,
    };
    useAppStore.getState().subscribe(cleanChannel);
  }

  public static unsubscribe(channelId: string): void {
    useAppStore.getState().unsubscribe(channelId);
  }

  public static clear(): void {
    useAppStore.setState({ subscriptions: [] });
  }

  public static togglePin(channelId: string): void {
    const subs = useAppStore.getState().subscriptions;
    useAppStore.setState({
      subscriptions: subs.map((c) =>
        c.id === channelId ? { ...c, pinned: !(c as any).pinned } : c
      ),
    });
  }

  public static toggleFavorite(channelId: string): void {
    const subs = useAppStore.getState().subscriptions;
    useAppStore.setState({
      subscriptions: subs.map((c) =>
        c.id === channelId ? { ...c, isFavorite: !(c as any).isFavorite } : c
      ),
    });
  }
}

export const subscriptionRepository = SubscriptionRepository;
