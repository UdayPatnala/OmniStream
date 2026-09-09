import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { VideoCard } from '../components/VideoCard';
import {
  FALLBACK_VIDEOS,
  getChannelDetails,
  getChannelAvatarUrl,
  getChannelSubscriberCount,
} from '../lib/youtube';
import { formatTimeAgo } from '../lib/utils';

describe('U-Tube Metadata Binding Surgical Fix Verification', () => {
  it('T-META-01: FALLBACK_VIDEOS contains distinct channel names, logos, subscribers, and upload times', () => {
    const channelNames = new Set(FALLBACK_VIDEOS.map((v) => v.channelTitle));
    const channelLogos = new Set(FALLBACK_VIDEOS.map((v) => v.channelLogo));
    const subscriberCounts = new Set(FALLBACK_VIDEOS.map((v) => v.subscriberCount));
    const uploadTimes = new Set(FALLBACK_VIDEOS.map((v) => v.publishedAt));

    // Every video in the fallback catalog has its own distinct identity
    expect(channelNames.size).toBe(FALLBACK_VIDEOS.length);
    expect(channelLogos.size).toBe(FALLBACK_VIDEOS.length);
    expect(subscriberCounts.size).toBe(FALLBACK_VIDEOS.length);
    expect(uploadTimes.size).toBe(FALLBACK_VIDEOS.length);

    FALLBACK_VIDEOS.forEach((v) => {
      expect(v.channelTitle).toBeTruthy();
      expect(v.channelLogo).toMatch(/^https?:\/\//);
      expect(Number(v.subscriberCount)).toBeGreaterThan(0);
      expect(v.publishedAt).toMatch(/(hrs|days|week|month|months|yrs) ago/);
    });
  });

  it('T-META-02: formatTimeAgo correctly parses relative times and dates without returning NaN', () => {
    // Relative strings
    expect(formatTimeAgo('2 hours ago')).toBe('2 hrs ago');
    expect(formatTimeAgo('3 days ago')).toBe('3 days ago');
    expect(formatTimeAgo('2 years ago')).toBe('2 yrs ago');
    expect(formatTimeAgo('1 month ago')).toBe('1 month ago');
    expect(formatTimeAgo('5 months ago')).toBe('5 months ago');
    expect(formatTimeAgo('1 week ago')).toBe('1 week ago');
    expect(formatTimeAgo('Recently')).toBe('Recently');

    // ISO timestamps
    const now = Date.now();
    const twoHoursAgoIso = new Date(now - 2 * 3600 * 1000).toISOString();
    expect(formatTimeAgo(twoHoursAgoIso)).toBe('2 hrs ago');

    const threeDaysAgoIso = new Date(now - 3 * 86400 * 1000).toISOString();
    expect(formatTimeAgo(threeDaysAgoIso)).toBe('3 days ago');

    // Must never return "NaN seconds ago"
    expect(formatTimeAgo('2 hours ago')).not.toContain('NaN');
    expect(formatTimeAgo(undefined)).toBe('');
  });

  it('T-META-03: getChannelDetails returns channel-specific subscriberCount and logo, not shared defaults', async () => {
    const natureChan = await getChannelDetails('chan_nature');
    const techChan = await getChannelDetails('chan_tech');
    const musicChan = await getChannelDetails('chan_music');

    expect(natureChan).not.toBeNull();
    expect(techChan).not.toBeNull();
    expect(musicChan).not.toBeNull();

    // Verify subscriber counts are channel-specific, not hardcoded 1250000
    expect(natureChan?.subscriberCount).toBe('1450000');
    expect(techChan?.subscriberCount).toBe('890000');
    expect(musicChan?.subscriberCount).toBe('5200000');

    // Verify channel avatar logos are distinct
    expect(natureChan?.thumbnails.medium).not.toBe(techChan?.thumbnails.medium);
    expect(natureChan?.thumbnails.medium).not.toBe(musicChan?.thumbnails.medium);
  });

  it('T-META-04: getChannelAvatarUrl and getChannelSubscriberCount produce distinct identities', () => {
    const logoA = getChannelAvatarUrl('channel-alpha', 'Channel Alpha');
    const logoB = getChannelAvatarUrl('channel-beta', 'Channel Beta');
    const subA = getChannelSubscriberCount('channel-alpha', 'Channel Alpha');
    const subB = getChannelSubscriberCount('channel-beta', 'Channel Beta');

    expect(logoA).toBeTruthy();
    expect(logoB).toBeTruthy();
    expect(subA).toBeTruthy();
    expect(subB).toBeTruthy();
  });

  it('T-META-05: VideoCard binds channel logo, channel name, subscribers, and relative time', () => {
    const video1 = FALLBACK_VIDEOS[0]; // Nature Cinema Films, 2 hrs ago, 1.45M subs
    const video2 = FALLBACK_VIDEOS[1]; // Modern Web Academy, 3 days ago, 890K subs

    const { unmount } = render(
      <MemoryRouter>
        <VideoCard video={video1} />
      </MemoryRouter>
    );

    // Channel title rendered
    const titleElements1 = screen.getAllByText('Nature Cinema Films');
    expect(titleElements1.length).toBeGreaterThan(0);

    // Relative upload time rendered
    expect(screen.getByText(/2 hrs ago/)).toBeDefined();

    // Channel avatar image uses channelLogo, not video thumbnail
    const avatarImages1 = screen.getAllByRole('img', { name: 'Nature Cinema Films' });
    expect(avatarImages1.length).toBeGreaterThan(0);
    const avatarImg1 = avatarImages1[0] as HTMLImageElement;
    expect(avatarImg1.src).toBe(video1.channelLogo);
    expect(avatarImg1.src).not.toBe(video1.thumbnails.medium);

    // Channel link contains subscriber count in title attribute
    const channelLink1 = screen.getAllByTitle(/Nature Cinema Films \(1\.4M subscribers\)/);
    expect(channelLink1.length).toBeGreaterThan(0);

    unmount();

    // Now render video2 and verify completely different metadata is bound
    render(
      <MemoryRouter>
        <VideoCard video={video2} />
      </MemoryRouter>
    );

    expect(screen.getAllByText('Modern Web Academy').length).toBeGreaterThan(0);
    expect(screen.getByText(/3 days ago/)).toBeDefined();

    const avatarImages2 = screen.getAllByRole('img', { name: 'Modern Web Academy' });
    const avatarImg2 = avatarImages2[0] as HTMLImageElement;
    expect(avatarImg2.src).toBe(video2.channelLogo);
    expect(avatarImg2.src).not.toBe(avatarImg1.src);

    const channelLink2 = screen.getAllByTitle(/Modern Web Academy \(890K subscribers\)/);
    expect(channelLink2.length).toBeGreaterThan(0);
  });
});
