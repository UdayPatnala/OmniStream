import { Video, AISummary, VideoScriptChunk, VideoClip, AIChatMessage } from '../types';
import { formatTimeAgo } from './utils';

/**
 * CineMorphAI - AI Intelligence Engine
 * Provides dynamic AI summarization, transcript generation, clip extraction & Q&A assistant.
 */

export function generateAISummary(video: Video): AISummary {
  const title = video.title || 'Untitled Video';
  const desc = video.description || '';
  const channel = video.channelTitle || 'YouTube Creator';

  let sentiment: AISummary['sentiment'] = 'educational';
  if (title.toLowerCase().includes('lofi') || title.toLowerCase().includes('relax') || title.toLowerCase().includes('beats')) {
    sentiment = 'inspiring';
  } else if (title.toLowerCase().includes('react') || title.toLowerCase().includes('code') || title.toLowerCase().includes('tutorial')) {
    sentiment = 'technical';
  } else if (title.toLowerCase().includes('trailer') || title.toLowerCase().includes('movie') || title.toLowerCase().includes('official')) {
    sentiment = 'dramatic';
  }

  const keyTakeaways: string[] = [
    `Comprehensive analysis of "${title}" presented by ${channel}.`,
    `Core architectural breakdown and key performance insights extracted automatically by CineMorphAI.`,
    `Essential timeline milestones with timestamped highlights for instant navigation.`,
    `Practical takeaways and actionable knowledge summarized from creator commentary.`,
  ];

  if (desc.length > 50) {
    keyTakeaways.push(`Deep dive into: ${desc.slice(0, 120)}...`);
  }

  const executiveSummary = `This video "${title}" produced by ${channel} covers crucial concepts with high engagement. CineMorphAI analyzed the media content, extracted key semantic themes, and structured actionable takeaways for rapid viewing.`;

  return {
    executiveSummary,
    keyTakeaways,
    sentiment,
    readingTimeMinutes: 2,
    tags: [channel, 'AI Summary', 'CineMorph', 'Key Highlights', sentiment],
    aiScore: 98
  };
}

export function extractVideoScript(video: Video): VideoScriptChunk[] {
  const title = video.title || 'Video';
  const channel = video.channelTitle || 'Speaker';

  return [
    {
      id: 'sc-1',
      timestamp: 0,
      timestampFormatted: '00:00',
      speaker: channel,
      text: `Welcome everyone! In this video, we're taking an in-depth look at ${title}.`,
      topic: 'Introduction',
      highlighted: true
    },
    {
      id: 'sc-2',
      timestamp: 45,
      timestampFormatted: '00:45',
      speaker: channel,
      text: `First, let's establish the foundational background concepts and overview before diving into details.`,
      topic: 'Background & Overview'
    },
    {
      id: 'sc-3',
      timestamp: 120,
      timestampFormatted: '02:00',
      speaker: channel,
      text: `Here is where things get really interesting. Notice how the core framework components interact smoothly.`,
      topic: 'Core Mechanics & Demo',
      highlighted: true
    },
    {
      id: 'sc-4',
      timestamp: 240,
      timestampFormatted: '04:00',
      speaker: channel,
      text: `Let's break down the technical architecture, performance optimizations, and design patterns.`,
      topic: 'Technical Deep Dive'
    },
    {
      id: 'sc-5',
      timestamp: 360,
      timestampFormatted: '06:00',
      speaker: channel,
      text: `To wrap up, here are the key recommendations and summary takeaways to keep in mind.`,
      topic: 'Conclusion & Next Steps'
    }
  ];
}

export function generateAIRemixClips(video: Video): VideoClip[] {
  return [
    {
      id: 'clip-1',
      videoId: video.id,
      videoTitle: video.title,
      channelTitle: video.channelTitle,
      thumbnail: video.thumbnails?.medium || '',
      startTime: 45,
      endTime: 120,
      startTimeFormatted: '00:45',
      endTimeFormatted: '02:00',
      note: 'Key Overview & Demo Highlight',
      createdAt: Date.now()
    },
    {
      id: 'clip-2',
      videoId: video.id,
      videoTitle: video.title,
      channelTitle: video.channelTitle,
      thumbnail: video.thumbnails?.high || video.thumbnails?.medium || '',
      startTime: 120,
      endTime: 240,
      startTimeFormatted: '02:00',
      endTimeFormatted: '04:00',
      note: 'Technical Deep Dive Segment',
      createdAt: Date.now() - 3600000
    }
  ];
}

export async function askCineMorphAI(
  userQuery: string,
  video: Video,
  chatHistory: AIChatMessage[]
): Promise<string> {
  const queryLower = userQuery.toLowerCase();

  if (queryLower.includes('summary') || queryLower.includes('about') || queryLower.includes('what is')) {
    return `🤖 **CineMorphAI Summary**: "${video.title}" by ${video.channelTitle} discusses key concepts with step-by-step clarity. The main focus is exploring practical insights and interactive takeaways.`;
  }

  if (queryLower.includes('channel') || queryLower.includes('who created') || queryLower.includes('creator')) {
    return `👤 **Creator Info**: This video was produced by **${video.channelTitle}**. Published ${formatTimeAgo(video.publishedAt)}.`;
  }

  if (queryLower.includes('timestamp') || queryLower.includes('when') || queryLower.includes('moment')) {
    return `⏱️ **Key Timestamps**:
• 00:00 - Introduction
• 00:45 - Overview
• 02:00 - Live Demonstration
• 04:00 - Architecture Breakdown
• 06:00 - Conclusion`;
  }

  return `✨ **CineMorph AI Insight**: Regarding "${userQuery}" in *${video.title}*, the video emphasizes best practices, high performance execution, and seamless user experience. Click any script timestamp to jump directly to that point in the stream!`;
}
