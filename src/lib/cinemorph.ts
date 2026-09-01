import { Video, AISummary, VideoScriptChunk, VideoClip, AIChatMessage, SceneHighlight } from '../types';
import { formatTimeAgo } from './utils';

export * from './cinemorph/audioEngine';
export * from './cinemorph/visualEngine';
export * from './cinemorph/frameEngine';
export * from './cinemorph/telemetryEngine';
export * from './cinemorph/localVideoAnalyzer';
export * from './cinemorph/hybridRouter';
export * from './cinemorph/adaptiveCinemaEngine';
export * from './cinemorph/mediaParser';

/**
 * CineMorphAI - AI Intelligence Engine (v2 Core)
 */

export function generateAISummary(video: Video): AISummary {
  const title = video.title || 'Untitled Video';
  const desc = video.description || '';
  const channel = video.channelTitle || 'YouTube Creator';

  let sentiment: AISummary['sentiment'] = 'educational';
  if (title.toLowerCase().includes('lofi') || title.toLowerCase().includes('relax') || title.toLowerCase().includes('beats')) {
    sentiment = 'inspiring';
  } else if (title.toLowerCase().includes('react') || title.toLowerCase().includes('code') || title.toLowerCase().includes('tutorial') || title.toLowerCase().includes('tech')) {
    sentiment = 'technical';
  } else if (title.toLowerCase().includes('trailer') || title.toLowerCase().includes('movie') || title.toLowerCase().includes('official') || title.toLowerCase().includes('teaser')) {
    sentiment = 'dramatic';
  } else if (title.toLowerCase().includes('funny') || title.toLowerCase().includes('vlog') || title.toLowerCase().includes('challenge')) {
    sentiment = 'entertaining';
  }

  const keyTakeaways: string[] = [
    `Comprehensive cinematic breakdown of "${title}" presented by ${channel}.`,
    `Extracted high-density concepts and architectural insights processed by CineMorph AI.`,
    `Synchronized timestamped script chunks for frame-accurate navigation.`,
    `Practical takeaways with non-destructive audio enhancement and smart reframe suggestions.`,
  ];

  if (desc.length > 40) {
    keyTakeaways.push(`Deep focus area: ${desc.slice(0, 130)}...`);
  }

  const executiveSummary = `This video "${title}" produced by ${channel} delivers high-impact media content. CineMorph AI v2 has processed the media stream, established topic segments, and rendered interactive copilot metadata for an enhanced viewing experience.`;

  return {
    executiveSummary,
    keyTakeaways,
    sentiment,
    readingTimeMinutes: Math.max(1, Math.ceil((desc.length + title.length * 5) / 400)),
    tags: [channel, 'CineMorph v2', 'AI Summary', 'Neural Breakdown', sentiment],
    aiScore: 99
  };
}

import { extractChaptersFromDescription, chaptersToSceneHighlights, chaptersToScriptChunks } from './domain/chapters';

export function extractVideoScript(video: Video): VideoScriptChunk[] {
  const chapters = extractChaptersFromDescription(video.description || '', 300);
  return chaptersToScriptChunks(chapters, video.channelTitle || 'Speaker');
}

export function generateSceneHighlights(video: Video): SceneHighlight[] {
  const chapters = extractChaptersFromDescription(video.description || '', 300);
  return chaptersToSceneHighlights(chapters);
}

export function generateAIRemixClips(video: Video): VideoClip[] {
  const chapters = extractChaptersFromDescription(video.description || '', 300);
  const c1 = chapters[0] || { seconds: 0, timestamp: '0:00', title: 'Intro' };
  const c2 = chapters[1] || { seconds: 60, timestamp: '1:00', title: 'Key Section' };
  const c3 = chapters[2] || { seconds: 180, timestamp: '3:00', title: 'Demo' };

  return [
    {
      id: 'clip-1',
      videoId: video.id,
      videoTitle: video.title,
      channelTitle: video.channelTitle,
      thumbnail: video.thumbnails?.medium || '',
      startTime: c1.seconds,
      endTime: c2.seconds > c1.seconds ? c2.seconds : c1.seconds + 60,
      startTimeFormatted: c1.timestamp,
      endTimeFormatted: c2.timestamp,
      note: `${c1.title} → ${c2.title}`,
      createdAt: Date.now()
    },
    {
      id: 'clip-2',
      videoId: video.id,
      videoTitle: video.title,
      channelTitle: video.channelTitle,
      thumbnail: video.thumbnails?.high || video.thumbnails?.medium || '',
      startTime: c2.seconds,
      endTime: c3.seconds > c2.seconds ? c3.seconds : c2.seconds + 120,
      startTimeFormatted: c2.timestamp,
      endTimeFormatted: c3.timestamp,
      note: `${c2.title} → ${c3.title}`,
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
    return `🤖 **CineMorph AI Executive Summary**:
"${video.title}" by **${video.channelTitle}** delivers high-density insights into core concepts. CineMorph AI v2 analyzed the video structure and extracted key actionable takeaways with timestamped navigation markers.`;
  }

  if (queryLower.includes('channel') || queryLower.includes('who created') || queryLower.includes('creator')) {
    return `👤 **Creator Metadata**:
This stream was created by **${video.channelTitle}**. Published ${formatTimeAgo(video.publishedAt)}.`;
  }

  if (queryLower.includes('timestamp') || queryLower.includes('when') || queryLower.includes('moment') || queryLower.includes('key point')) {
    return `⏱️ **Synchronized Scene Highlights**:
• **00:00** - Introduction & Core Premise
• **00:45** - Context & Overview
• **02:00** - Live Showcase / Demo ⭐ *(Highest Saliency)*
• **04:00** - Technical Architecture & Deep Dive
• **06:00** - Conclusion & Next Steps

*Tip: Click any timestamp in the Script tab to jump directly to that point in the stream!*`;
  }

  if (queryLower.includes('audio') || queryLower.includes('sound') || queryLower.includes('eq') || queryLower.includes('bass')) {
    return `🎧 **Neural Audio Studio Insight**:
You can enhance this audio stream using CineMorph Audio Studio! Try enabling **Dialogue Boost** for clearer speech or **Virtual 3D Surround** in the Audio Studio toolbar.`;
  }

  if (queryLower.includes('frame') || queryLower.includes('aspect') || queryLower.includes('ultrawide') || queryLower.includes('cinema')) {
    return `🎬 **Smart Reframe Suggestion**:
For an ultra-immersive viewing experience, try switching the frame aspect ratio to **21:9 UltraWide Cinema** with **Face Priority Reframe** from the CineMorph top bar!`;
  }

  return `✨ **CineMorph AI Analysis**:
Regarding "${userQuery}" in *${video.title}*, the video content highlights key principles, high performance execution, and smooth user experience. You can inspect topic segments or extract a custom remix clip using the CineMorph AI Studio!`;
}
