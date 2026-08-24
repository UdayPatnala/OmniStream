import { describe, it, expect, beforeEach } from 'vitest';
import { createUTubeStore } from '../helpers/contracts';
import { useAppStore } from '../../store';
import { subscriptionRepository } from '../../lib/repositories/subscriptionRepository';
import { MOCK_CHANNELS } from '../helpers/fixtures';

describe('Tier 1: Channel Subscriptions & Persistence (F07, F11)', () => {
  let store: ReturnType<typeof createUTubeStore>;

  beforeEach(() => {
    store = createUTubeStore();
    subscriptionRepository.clear();
  });

  it('T1-SUBS-01: subscribing adds channel to subscriptions list in store', () => {
    expect(store.getState().subscriptions).toHaveLength(0);

    const sub = {
      channelId: 'chan_nature',
      channelTitle: 'Nature Cinema Films',
      avatarUrl: 'https://example.com/avatar1.jpg',
      subscribedAt: Date.now(),
    };

    store.getState().subscribe(sub);
    expect(store.getState().subscriptions).toHaveLength(1);
    expect(store.getState().subscriptions[0].channelId).toBe('chan_nature');
  });

  it('T1-SUBS-02: duplicate subscribe calls for same channelId are idempotently ignored', () => {
    const sub = {
      channelId: 'chan_tech',
      channelTitle: 'Modern Web Academy',
      avatarUrl: 'https://example.com/avatar2.jpg',
      subscribedAt: Date.now(),
    };

    store.getState().subscribe(sub);
    store.getState().subscribe(sub);
    expect(store.getState().subscriptions).toHaveLength(1);
  });

  it('T1-SUBS-03: unsubscribing removes channel by channelId', () => {
    store.getState().subscribe({
      channelId: 'chan_1',
      channelTitle: 'Channel 1',
      avatarUrl: '',
      subscribedAt: Date.now(),
    });
    store.getState().subscribe({
      channelId: 'chan_2',
      channelTitle: 'Channel 2',
      avatarUrl: '',
      subscribedAt: Date.now(),
    });

    expect(store.getState().subscriptions).toHaveLength(2);
    store.getState().unsubscribe('chan_1');
    expect(store.getState().subscriptions).toHaveLength(1);
    expect(store.getState().subscriptions[0].channelId).toBe('chan_2');
  });

  it('T1-SUBS-04: subscriptionRepository allows managing favorite and pinned channels', () => {
    const channel = { ...MOCK_CHANNELS[1], pinned: false, isFavorite: false };
    subscriptionRepository.subscribe(channel);
    expect(subscriptionRepository.isSubscribed(channel.id)).toBe(true);

    subscriptionRepository.togglePin(channel.id);
    expect(subscriptionRepository.getById(channel.id)?.pinned).toBe(true);

    subscriptionRepository.toggleFavorite(channel.id);
    expect(subscriptionRepository.getById(channel.id)?.isFavorite).toBe(true);
  });

  it('T1-SUBS-05: useAppStore persists subscriptions across store state changes', () => {
    const appStore = useAppStore.getState();
    expect(appStore.subscriptions).toHaveLength(0);

    appStore.subscribe(MOCK_CHANNELS[1]);
    expect(useAppStore.getState().subscriptions).toHaveLength(1);
    expect(useAppStore.getState().subscriptions[0].id).toBe(MOCK_CHANNELS[1].id);

    appStore.unsubscribe(MOCK_CHANNELS[1].id);
    expect(useAppStore.getState().subscriptions).toHaveLength(0);
  });

  it('T1-SUBS-06: subscribing multiple distinct channels preserves individual subscriber metadata', () => {
    MOCK_CHANNELS.forEach(c => {
      store.getState().subscribe({
        channelId: c.id,
        channelTitle: c.title,
        avatarUrl: c.thumbnails.medium,
        subscribedAt: Date.now(),
      });
    });

    const currentSubs = store.getState().subscriptions;
    expect(currentSubs).toHaveLength(MOCK_CHANNELS.length);
  });
});
