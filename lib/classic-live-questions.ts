import { CLASSIC_LIVE_SEEDS } from './questions';
import type { LiveQuestion, QuestionTier } from './types';

/**
 * Classic Live question bank — multiple choice, used by the Live room mode.
 *
 * The English text is canonical and every question carries the Portuguese
 * translation inline. That keeps the real-time translation option available
 * on the projector and on the player devices.
 *
 * Tiers are assigned per topic and difficulty so a run always mixes gentle,
 * core and challenge questions. Correct answers are shuffled at runtime.
 */

function buildClassicLiveQuestions(): LiveQuestion[] {
  const groups = new Map<string, LiveQuestion[]>();

  for (const seed of CLASSIC_LIVE_SEEDS) {
    const question: LiveQuestion = {
      id: seed.id,
      tier: 1,
      difficulty: seed.difficulty,
      category: seed.category,
      text: seed.en,
      options: seed.optionsEn,
      correctIndex: seed.correctIndex,
      explanation: seed.explanationEn,
      textPt: seed.pt,
      optionsPt: seed.optionsPt,
    };

    const key = `${seed.category}:${seed.difficulty}`;
    const group = groups.get(key);
    if (group) group.push(question);
    else groups.set(key, [question]);
  }

  for (const group of groups.values()) {
    const tierSize = Math.ceil(group.length / 3);
    group.forEach((question, index) => {
      question.tier = Math.min(3, Math.floor(index / tierSize) + 1) as QuestionTier;
    });
  }

  return [...groups.values()].flat();
}

export const CLASSIC_LIVE_QUESTIONS: LiveQuestion[] =
  buildClassicLiveQuestions();
