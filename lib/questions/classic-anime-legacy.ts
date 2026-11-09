import type { ClassicLiveSeed, ClassicTfSeed } from './types';

/**
 * Older anime questions that were already in the classic deck.
 *
 * They are kept here and merged with the newer anime bank so expanding the
 * category adds content instead of replacing what teachers already used.
 */

export const TF: ClassicTfSeed[] = [
  {
    id: 'classic-anime-legacy-01',
    category: 'anime',
    difficulty: 'medium',
    pt: 'Em My Hero Academia, Izuku Midoriya nasce com um superpoder muito forte.',
    en: 'In My Hero Academia, Izuku Midoriya is born with a very strong superpower.',
    answer: false,
    explanationPt: 'Deku nasce sem poder; ele recebe o One For All do All Might.',
    explanationEn: 'Deku is born powerless; he receives One For All from All Might.',
  },
  {
    id: 'classic-anime-legacy-02',
    category: 'anime',
    difficulty: 'medium',
    pt: 'Em Hunter x Hunter, o Nen costuma ser dividido em seis categorias principais.',
    en: 'In Hunter x Hunter, Nen is usually divided into six main categories.',
    answer: true,
    explanationPt: 'As categorias incluem Reforço, Emissão, Manipulação e outras.',
    explanationEn: 'The categories include Enhancement, Emission, Manipulation and others.',
  },
  {
    id: 'classic-anime-legacy-03',
    category: 'anime',
    difficulty: 'hard',
    pt: 'Em Demon Slayer, os efeitos visuais das técnicas de respiração são sempre fenômenos elementais literais que todos podem ver.',
    en: 'In Demon Slayer, the visual effects of the breathing techniques are always literal elemental phenomena that everyone can see.',
    answer: false,
    explanationPt: 'Os efeitos são uma representação visual; nem todo mundo vê fogo ou água de verdade.',
    explanationEn: 'The effects are a visual representation; not everyone sees real fire or water.',
  },
  {
    id: 'classic-anime-legacy-04',
    category: 'anime',
    difficulty: 'hard',
    pt: 'Em Death Note, o nome verdadeiro de L é Light Yagami.',
    en: 'In Death Note, L\'s real name is Light Yagami.',
    answer: false,
    explanationPt: 'Light é o Kira; L é outro personagem e tem outro nome.',
    explanationEn: 'Light is Kira; L is another character with a different name.',
  },
  {
    id: 'classic-anime-legacy-05',
    category: 'anime',
    difficulty: 'hard',
    pt: 'Em Attack on Titan, Eren Yeager pertence ao clã Ackerman.',
    en: 'In Attack on Titan, Eren Yeager belongs to the Ackerman clan.',
    answer: false,
    explanationPt: 'Eren é Yeager; Levi e Mikasa são os Ackerman.',
    explanationEn: 'Eren is a Yeager; Levi and Mikasa are the Ackermans.',
  },
  {
    id: 'classic-anime-legacy-06',
    category: 'anime',
    difficulty: 'medium',
    pt: 'Nos jogos principais de Pokémon, é impossível capturar Pokémon lendários durante a jogabilidade normal.',
    en: 'In the main Pokémon games, it is impossible to catch Legendary Pokémon during normal gameplay.',
    answer: false,
    explanationPt: 'Muitos lendários podem ser capturados em encontros especiais ou após a história.',
    explanationEn: 'Many Legendaries can be caught in special encounters or after the story.',
  },
  {
    id: 'classic-anime-legacy-07',
    category: 'anime',
    difficulty: 'hard',
    pt: 'Em Jujutsu Kaisen, a Expansão de Domínio "Santuário Malevolente" pertence ao Gojo Satoru.',
    en: 'In Jujutsu Kaisen, the Domain Expansion "Malevolent Shrine" belongs to Gojo Satoru.',
    answer: false,
    explanationPt: 'O Santuário Malevolente é do Sukuna; o domínio do Gojo é o Vazio Infinito.',
    explanationEn: 'Malevolent Shrine belongs to Sukuna; Gojo\'s domain is Unlimited Void.',
  },
  {
    id: 'classic-anime-legacy-08',
    category: 'anime',
    difficulty: 'hard',
    pt: 'Em JoJo\'s Bizarre Adventure, pessoas comuns conseguem ver normalmente todos os Stands.',
    en: 'In JoJo\'s Bizarre Adventure, ordinary people can normally see every Stand.',
    answer: false,
    explanationPt: 'Normalmente só usuários de Stand conseguem vê-los.',
    explanationEn: 'Normally only Stand users can see them.',
  },
];

export const LIVE: ClassicLiveSeed[] = [
  {
    id: 'clq-anime-legacy-01',
    category: 'anime',
    difficulty: 'hard',
    en: 'In Death Note, what is Light Yagami\'s alias?',
    pt: 'Em Death Note, qual é o pseudônimo de Light Yagami?',
    optionsEn: ['L', 'Near', 'Mello', 'Kira'],
    optionsPt: ['L', 'Near', 'Mello', 'Kira'],
    correctIndex: 3,
    explanationEn: 'Light is known as Kira, the mysterious killer.',
    explanationPt: 'Light é conhecido como Kira, o assassino misterioso.',
  },
];
