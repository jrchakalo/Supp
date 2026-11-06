import type {
  ClassicCategoryId,
  CompetitionLevelId,
  CompetitionLevelMeta,
  CompetitionPhase,
  DifficultyId,
  QuestionTier,
} from '../types';
import type { Language } from './types';

type CategoryCopy = { label: string; description: string };
type DifficultyCopy = {
  label: string;
  tagline: string;
  description: string;
  audience: string;
};
type LevelCopy = {
  label: string;
  tagline: string;
  description: string;
  phasesLabel: string;
};

type GameCopy = {
  categories: Record<ClassicCategoryId, CategoryCopy>;
  difficulties: Record<DifficultyId, DifficultyCopy>;
  levels: Record<CompetitionLevelId, LevelCopy>;
  tiers: Record<QuestionTier, string>;
};

const EN: GameCopy = {
  categories: {
    games: {
      label: 'Games',
      description: 'Minecraft, Roblox, Brawl Stars and other favorites.',
    },
    anime: {
      label: 'Anime',
      description: 'Dragon Ball, Naruto, One Piece and more.',
    },
    'pop-culture': {
      label: 'Pop culture',
      description: 'Movies, series and superheroes.',
    },
    animals: {
      label: 'Endangered animals',
      description: 'Wildlife, habitats and conservation.',
    },
    tech: {
      label: 'Technology',
      description: 'Hardware, internet, Word, Excel and PowerPoint.',
    },
  },
  difficulties: {
    easy: {
      label: 'Easy',
      tagline: 'Warm-up',
      description: 'Short, friendly questions for the youngest players.',
      audience: 'Ages 7–9',
    },
    medium: {
      label: 'Medium',
      tagline: 'Steady climb',
      description: 'A mix of topics for confident players.',
      audience: 'Ages 9–12',
    },
    hard: {
      label: 'Hard',
      tagline: 'Deep dive',
      description: 'Trickier details for teens and trivia experts.',
      audience: 'Ages 12+',
    },
  },
  levels: {
    easy: {
      label: 'Easy',
      tagline: 'Gentle start',
      description: 'Three easy rounds, then three medium rounds.',
      phasesLabel: '6 phases',
    },
    medium: {
      label: 'Medium',
      tagline: 'Balanced climb',
      description: 'Three medium rounds, then three hard rounds.',
      phasesLabel: '6 phases',
    },
    hard: {
      label: 'Hard',
      tagline: 'No mercy',
      description: 'Six hard rounds, from starter to championship.',
      phasesLabel: '6 phases',
    },
    progressive: {
      label: 'Progressive',
      tagline: 'Full journey',
      description: 'Two or three rounds at every difficulty. The ultimate marathon.',
      phasesLabel: '6 or 9 phases',
    },
  },
  tiers: { 1: 'Starter', 2: 'Core', 3: 'Challenge' },
};

const PT: GameCopy = {
  categories: {
    games: {
      label: 'Jogos',
      description: 'Minecraft, Roblox, Brawl Stars e outros favoritos.',
    },
    anime: {
      label: 'Anime',
      description: 'Dragon Ball, Naruto, One Piece e mais.',
    },
    'pop-culture': {
      label: 'Cultura pop',
      description: 'Filmes, séries e super-heróis.',
    },
    animals: {
      label: 'Animais ameaçados',
      description: 'Vida selvagem, habitats e conservação.',
    },
    tech: {
      label: 'Tecnologia',
      description: 'Hardware, internet, Word, Excel e PowerPoint.',
    },
  },
  difficulties: {
    easy: {
      label: 'Fácil',
      tagline: 'Aquecimento',
      description: 'Perguntas curtas e amigáveis para os mais novos.',
      audience: '7–9 anos',
    },
    medium: {
      label: 'Médio',
      tagline: 'Subida constante',
      description: 'Uma mistura de temas para quem já tem confiança.',
      audience: '9–12 anos',
    },
    hard: {
      label: 'Difícil',
      tagline: 'Mergulho fundo',
      description: 'Detalhes mais complicados para teens e especialistas.',
      audience: '12+ anos',
    },
  },
  levels: {
    easy: {
      label: 'Fácil',
      tagline: 'Começo tranquilo',
      description: 'Três rodadas fáceis, depois três rodadas médias.',
      phasesLabel: '6 fases',
    },
    medium: {
      label: 'Médio',
      tagline: 'Subida equilibrada',
      description: 'Três rodadas médias, depois três rodadas difíceis.',
      phasesLabel: '6 fases',
    },
    hard: {
      label: 'Difícil',
      tagline: 'Sem piedade',
      description: 'Seis rodadas difíceis, do iniciante ao campeonato.',
      phasesLabel: '6 fases',
    },
    progressive: {
      label: 'Progressivo',
      tagline: 'Jornada completa',
      description: 'Duas ou três rodadas em cada dificuldade. A maratona definitiva.',
      phasesLabel: '6 ou 9 fases',
    },
  },
  tiers: { 1: 'Iniciante', 2: 'Principal', 3: 'Desafio' },
};

const COPY: Record<Language, GameCopy> = { en: EN, pt: PT };

const PT_PHASE_WORDS: Array<[RegExp, string]> = [
  [/Progressive/gi, 'Progressivo'],
  [/Easy/gi, 'Fácil'],
  [/Medium/gi, 'Médio'],
  [/Hard/gi, 'Difícil'],
  [/Starter/gi, 'Iniciante'],
  [/Core/gi, 'Principal'],
  [/Challenge/gi, 'Desafio'],
  [/Expert/gi, 'Especialista'],
  [/Championship/gi, 'Campeonato'],
  [/Tiebreaker/gi, 'Desempate'],
  [/Rounds/gi, 'Rodadas'],
  [/Round/gi, 'Rodada'],
  [/Final/gi, 'Final'],
];

function translatePhaseText(text: string): string {
  return PT_PHASE_WORDS.reduce(
    (result, [pattern, replacement]) => result.replace(pattern, replacement),
    text
  );
}

export function categoryCopy(
  id: ClassicCategoryId,
  language: Language
): CategoryCopy {
  return COPY[language].categories[id];
}

export function difficultyCopy(
  id: DifficultyId,
  language: Language
): DifficultyCopy {
  return COPY[language].difficulties[id];
}

export function competitionLevels(language: Language): CompetitionLevelMeta[] {
  const levels = COPY[language].levels;
  return (Object.keys(levels) as CompetitionLevelId[]).map((id) => ({
    id,
    ...levels[id],
  }));
}

export function competitionLevelCopy(
  id: CompetitionLevelId,
  language: Language
): LevelCopy {
  return COPY[language].levels[id];
}

export function tierLabel(tier: QuestionTier, language: Language): string {
  return COPY[language].tiers[tier];
}

export function localizePhase(
  phase: CompetitionPhase,
  language: Language
): CompetitionPhase {
  if (language === 'en') return phase;

  return {
    ...phase,
    label: translatePhaseText(phase.label),
    shortLabel: translatePhaseText(phase.shortLabel),
  };
}

export { COPY as GAME_COPY };
