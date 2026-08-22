import { Video } from '../../types';
import { searchAndRankVideos } from './searchService';

/**
 * Smart Learning Mode Engine - Generates curriculum learning sequences for complex topics.
 */

export interface LearningModule {
  id: string;
  topic: string;
  query: string;
  video: Video | null;
  durationMinutes: number;
}

export interface LearningCurriculum {
  goal: string;
  totalModules: number;
  estimatedHours: number;
  modules: LearningModule[];
}

export async function generateLearningCurriculum(goalQuery: string): Promise<LearningCurriculum> {
  const normalized = goalQuery.trim().replace(/^learn\s+/i, '');
  
  // Default curriculum topics breakdown for common subjects
  const subtopics = [
    `${normalized} fundamentals and core concepts`,
    `${normalized} practical demonstration tutorial`,
    `${normalized} advanced deep dive`,
    `${normalized} real world project hands on`,
  ];

  const modules: LearningModule[] = [];

  for (let i = 0; i < subtopics.length; i++) {
    const topicQuery = subtopics[i];
    const candidates = await searchAndRankVideos(topicQuery);
    const selectedVideo = candidates.length > 0 ? candidates[0] : null;

    modules.push({
      id: `mod-${i + 1}`,
      topic: `Module ${i + 1}: ${topicQuery.replace(normalized, '').trim() || normalized}`,
      query: topicQuery,
      video: selectedVideo,
      durationMinutes: 15 + i * 10,
    });
  }

  return {
    goal: goalQuery,
    totalModules: modules.length,
    estimatedHours: 1.5,
    modules,
  };
}
