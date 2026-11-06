import type {
  ClassicCategoryId,
  DifficultyId,
  Question,
  QuestionTier,
} from './types';

/**
 * Baralho original do modo Classroom Classic.
 * As perguntas ficam em português (com alguns itens de tecnologia em inglês)
 * e continuam comentadas por tema para facilitar a manutenção.
 */
export const CLASSIC_QUESTIONS: Question[] = [
  // Jogos: Minecraft & Roblox
  {
    id: 'classic-01',
    text: "No Roblox, 'Blox Fruits' é um jogo sobre colecionar animais de estimação em uma cidade moderna.",
    answer: false,
  },
  {
    id: 'classic-02',
    text: 'No Minecraft, você precisa de uma picareta para minerar blocos de pedra.',
    answer: true,
  },
  {
    id: 'classic-03',
    text: 'No Minecraft, é possível encontrar vilas com personagens não jogáveis (NPCs) para trocar itens.',
    answer: true,
  },
  {
    id: 'classic-04',
    text: 'No Roblox, só é possível jogar; não dá para criar seus próprios jogos.',
    answer: false,
  },
  {
    id: 'classic-05',
    text: 'No Minecraft, os diamantes são o material mais fácil de encontrar no jogo.',
    answer: false,
  },

  // Roblox (Difícil)
  {
    id: 'classic-06',
    text: "O avatar padrão clássico do Roblox era conhecido como 'Blocky'.",
    answer: true,
  },
  {
    id: 'classic-07',
    text: "O jogo 'Adopt Me!' foi criado originalmente como um jogo de colecionar animais de estimação.",
    answer: false,
  },
  {
    id: 'classic-08',
    text: "O evento do Roblox 'The Hunt: Mega Edition' aconteceu em 2025.",
    answer: true,
  },
  {
    id: 'classic-09',
    text: 'É possível publicar um jogo no Roblox sem gastar Robux.',
    answer: true,
  },
  {
    id: 'classic-10',
    text: "Em 'Blox Fruits', os jogadores escolhem entre Piratas e Marinheiros ao começar o jogo.",
    answer: true,
  },
  {
    id: 'classic-11',
    text: "A moeda 'Tix' ainda existe no Roblox junto com os Robux.",
    answer: false,
  },
  {
    id: 'classic-12',
    text: "Em uma rodada normal de 'Tower of Hell', não há pontos de salvamento (checkpoints).",
    answer: true,
  },
  {
    id: 'classic-13',
    text: 'Só é possível conseguir Robux comprando-os com dinheiro real.',
    answer: false,
  },
  {
    id: 'classic-14',
    text: "O som clássico de morte 'oof' ainda é usado em todos os jogos novos do Roblox.",
    answer: false,
  },
  {
    id: 'classic-15',
    text: 'O Roblox Studio usa a linguagem de programação Lua para criar scripts de jogos.',
    answer: true,
  },

  // Jogos: outros títulos populares
  {
    id: 'classic-16',
    text: 'Em Brawl Stars, é possível jogar sozinho ou em equipes de três jogadores.',
    answer: true,
  },
  {
    id: 'classic-17',
    text: 'Valorant é um jogo de tiro competitivo.',
    answer: true,
  },
  {
    id: 'classic-18',
    text: 'Free Fire é um jogo do gênero battle royale em que os jogadores saltam de um avião.',
    answer: true,
  },
  {
    id: 'classic-19',
    text: 'Em Brawl Stars, Shelly é a primeira personagem que você desbloqueia.',
    answer: true,
  },
  {
    id: 'classic-20',
    text: 'League of Legends é um jogo de corrida com carros velozes.',
    answer: false,
  },

  // Anime e cultura pop
  {
    id: 'classic-22',
    text: "Em 'Spy x Family', a personagem Anya tem o poder de ler mentes.",
    answer: true,
  },
  {
    id: 'classic-23',
    text: "Em 'My Hero Academia', Izuku Midoriya nasce com um superpoder muito forte.",
    answer: false,
  },
  {
    id: 'classic-24',
    text: 'Goku é o personagem principal do anime Dragon Ball.',
    answer: true,
  },
  {
    id: 'classic-25',
    text: "Em 'Naruto', o protagonista quer se tornar o Hokage de sua vila.",
    answer: true,
  },
  {
    id: 'classic-26',
    text: "'One Piece' é um anime sobre um grupo de alienígenas espaciais.",
    answer: false,
  },
  {
    id: 'classic-27',
    text: 'O Homem de Ferro é um super-herói que usa uma armadura tecnológica para voar.',
    answer: true,
  },

  // Anime (Difícil)
  {
    id: 'classic-28',
    text: "Em 'Fullmetal Alchemist: Brotherhood', a troca equivalente é um princípio central da alquimia.",
    answer: true,
  },
  {
    id: 'classic-29',
    text: "Em 'Hunter x Hunter', o Nen costuma ser dividido em seis categorias principais.",
    answer: true,
  },
  {
    id: 'classic-30',
    text: "Em 'JoJo's Bizarre Adventure', pessoas comuns conseguem ver normalmente todos os Stands.",
    answer: false,
  },
  {
    id: 'classic-31',
    text: "Em 'Demon Slayer', os efeitos visuais das técnicas de respiração são sempre fenômenos elementais literais que todos podem ver.",
    answer: false,
  },
  {
    id: 'classic-32',
    text: "Em 'Neon Genesis Evangelion', as unidades EVA são apenas robôs comuns feitos de metal.",
    answer: false,
  },
  {
    id: 'classic-33',
    text: "Em 'Death Note', o nome verdadeiro de L é Light Yagami.",
    answer: false,
  },
  {
    id: 'classic-34',
    text: "Em 'Naruto', o Sharingan é uma habilidade hereditária associada ao clã Uchiha.",
    answer: true,
  },
  {
    id: 'classic-35',
    text: "Em 'One Piece', Robin consegue ler os Poneglyphs, antigos blocos de pedra com inscrições.",
    answer: true,
  },
  {
    id: 'classic-36',
    text: "Em 'Jujutsu Kaisen', a Expansão de Domínio chamada 'Santuário Malevolente' pertence a Gojo Satoru.",
    answer: false,
  },
  {
    id: 'classic-37',
    text: "Em 'Attack on Titan', Eren Yeager pertence ao clã Ackerman.",
    answer: false,
  },
  {
    id: 'classic-38',
    text: "Em 'Dragon Ball', Gohan recebeu o nome em homenagem ao avô adotivo de Goku, Son Gohan.",
    answer: true,
  },
  {
    id: 'classic-39',
    text: 'Nos jogos principais de Pokémon, é impossível capturar Pokémon lendários durante a jogabilidade normal.',
    answer: false,
  },

  // Cultura pop (Difícil)
  {
    id: 'classic-40',
    text: "Em 'Matrix', a pílula vermelha permite que Neo continue vivendo na realidade simulada.",
    answer: false,
  },
  {
    id: 'classic-41',
    text: "Em 'Star Wars', a Ordem 66 desencadeia a perseguição e a morte de muitos Jedi.",
    answer: true,
  },
  {
    id: 'classic-42',
    text: "No universo de 'Duna', os trajes destiladores (stillsuits) ajudam os Fremen a conservar água no deserto.",
    answer: true,
  },
  {
    id: 'classic-43',
    text: "Em 'O Senhor dos Anéis', Gandalf foi quem forjou o Um Anel.",
    answer: false,
  },
  {
    id: 'classic-44',
    text: "Na série 'Breaking Bad', Walter White usa o nome Heisenberg.",
    answer: true,
  },
  {
    id: 'classic-45',
    text: 'No Universo Cinematográfico Marvel, Thanos usa as seis Joias do Infinito para eliminar metade da vida do universo.',
    answer: true,
  },
  {
    id: 'classic-46',
    text: "Em 'Game of Thrones', a origem do nome Hodor está ligada à frase 'Hold the door'.",
    answer: true,
  },
  {
    id: 'classic-47',
    text: "Em 'Harry Potter', Sirius Black foi quem traiu Lílian e Tiago Potter, entregando-os a Voldemort.",
    answer: false,
  },
  {
    id: 'classic-48',
    text: "Em 'Interestelar', o planeta onde o tempo passa muito mais devagar fica perto do enorme buraco negro Gargantua.",
    answer: true,
  },
  {
    id: 'classic-49',
    text: "Nos livros e jogos de 'The Witcher', Geralt é conhecido pelo apelido de Lobo Branco.",
    answer: true,
  },

  // Animais ameaçados de extinção
  {
    id: 'classic-50',
    text: 'A vaquita, um pequeno cetáceo, é classificada como Criticamente em Perigo de extinção.',
    answer: true,
  },
  {
    id: 'classic-51',
    text: 'A vaquita vive naturalmente no norte do Golfo da Califórnia, no México.',
    answer: true,
  },
  {
    id: 'classic-52',
    text: 'A captura acidental em redes de pesca é uma das principais ameaças à vaquita.',
    answer: true,
  },
  {
    id: 'classic-53',
    text: 'O panda-gigante continua classificado globalmente como Criticamente em Perigo pela Lista Vermelha da IUCN.',
    answer: false,
  },
  {
    id: 'classic-54',
    text: 'A baleia-azul é classificada como Em Perigo de extinção pela IUCN.',
    answer: true,
  },
  {
    id: 'classic-55',
    text: 'O dodô ainda possui populações selvagens vivendo naturalmente nas ilhas Maurício.',
    answer: false,
  },
  {
    id: 'classic-56',
    text: 'O leopardo-de-amur é classificado como Criticamente em Perigo de extinção.',
    answer: true,
  },
  {
    id: 'classic-57',
    text: 'Os orangotangos são animais nativos da África.',
    answer: false,
  },
  {
    id: 'classic-58',
    text: 'A tartaruga-de-pente, uma tartaruga marinha, é classificada como Criticamente em Perigo.',
    answer: true,
  },
  {
    id: 'classic-59',
    text: 'O lixo plástico não representa perigo para tartarugas marinhas, pois elas conseguem sempre distingui-lo de alimento.',
    answer: false,
  },
  {
    id: 'classic-60',
    text: 'O desmatamento pode destruir habitats e aumentar o risco de extinção de espécies animais.',
    answer: true,
  },
  {
    id: 'classic-61',
    text: 'Proteger habitats naturais e criar áreas de conservação pode ajudar a preservar espécies ameaçadas.',
    answer: true,
  },
  {
    id: 'classic-62',
    text: 'A caça furtiva e o comércio ilegal de animais silvestres podem ameaçar a sobrevivência dos pangolins.',
    answer: true,
  },
  {
    id: 'classic-63',
    text: 'Os ursos-polares são nativos da Antártida, no Polo Sul.',
    answer: false,
  },
  {
    id: 'classic-64',
    text: 'Apenas mamíferos podem ser classificados como ameaçados de extinção; aves, répteis e anfíbios não podem.',
    answer: false,
  },

  // Tecnologia básica: hardware e internet
  {
    id: 'classic-65',
    text: "The 'Mouse' is a computer part used to click and move the cursor on the screen.",
    answer: true,
  },
  {
    id: 'classic-66',
    text: "A 'Monitor' has separate power outlet for the CPU.",
    answer: false,
  },
  {
    id: 'classic-67',
    text: "The 'Keyboard' can contain or no numbers, but always letters, and special symbols to type.",
    answer: true,
  },
  {
    id: 'classic-68',
    text: 'Wi-Fi is a technology to connect to the internet without using cables.',
    answer: true,
  },
  {
    id: 'classic-69',
    text: "To turn on a computer, you can press the 'Alt' + 'Delete' button.",
    answer: false,
  },
  {
    id: 'classic-70',
    text: 'Its always safe download a file from the internet to your computer.',
    answer: false,
  },
  {
    id: 'classic-71',
    text: "A good password should be easy to guess, like '123456'.",
    answer: false,
  },
  {
    id: 'classic-72',
    text: 'Google is a famous search engine used to find information on the internet.',
    answer: true,
  },
  {
    id: 'classic-73',
    text: "The CPU is known as the 'brain' of the computer.",
    answer: true,
  },

  // Software básico: Word, PowerPoint e Excel
  {
    id: 'classic-74',
    text: 'Microsoft Word is a program used to type and format text documents.',
    answer: true,
  },
  {
    id: 'classic-75',
    text: 'In Microsoft PowerPoint, you can create slide presentations with images.',
    answer: true,
  },
  {
    id: 'classic-76',
    text: 'Microsoft Excel is a program designed to edit photos and videos.',
    answer: false,
  },
  {
    id: 'classic-77',
    text: "In Word, the 'Bold' option makes the text thicker and darker.",
    answer: true,
  },
  {
    id: 'classic-78',
    text: 'In PowerPoint, you can add animations to make text and images move.',
    answer: true,
  },
  {
    id: 'classic-79',
    text: 'Excel uses rows and columns to organize numbers and information.',
    answer: true,
  },
  {
    id: 'classic-80',
    text: "In Word, the keyboard shortcut 'Ctrl + C' is used to paste the text.",
    answer: false,
  },
  {
    id: 'classic-81',
    text: 'You can insert tables and colorful charts inside an Excel document.',
    answer: true,
  },
  {
    id: 'classic-82',
    text: "In PowerPoint, the 'F5' key is a shortcut to start the presentation.",
    answer: true,
  },
  {
    id: 'classic-83',
    text: 'Microsoft Word cannot save files in PDF format.',
    answer: false,
  },

  // Curiosidades gerais de tecnologia
  {
    id: 'classic-84',
    text: "A 'Browser' is a program used to access the web, like Google Chrome.",
    answer: true,
  },
  {
    id: 'classic-85',
    text: "An 'Emoji' is a small digital image used to express emotions in text messages.",
    answer: true,
  },
  {
    id: 'classic-86',
    text: "To undo a mistake in a document, you can press 'Ctrl + Z' on your keyboard.",
    answer: true,
  },
  {
    id: 'classic-87',
    text: 'Hardware is the part of the computer that you cannot touch, like the programs.',
    answer: false,
  },
  {
    id: 'classic-88',
    text: "A computer 'Virus' is a program that makes your computer run faster.",
    answer: false,
  },
];

export const CLASSIC_CATEGORIES: {
  id: ClassicCategoryId;
  label: string;
  description: string;
}[] = [
  {
    id: 'games',
    label: 'Games',
    description: 'Minecraft, Roblox, Brawl Stars and other favorites.',
  },
  {
    id: 'anime',
    label: 'Anime',
    description: 'Dragon Ball, Naruto, One Piece and more.',
  },
  {
    id: 'pop-culture',
    label: 'Pop culture',
    description: 'Movies, series and superheroes.',
  },
  {
    id: 'animals',
    label: 'Endangered animals',
    description: 'Wildlife, habitats and conservation.',
  },
  {
    id: 'tech',
    label: 'Technology',
    description: 'Hardware, internet, Word, Excel and PowerPoint.',
  },
];

export const CLASSIC_ALL_CATEGORIES: ClassicCategoryId[] = CLASSIC_CATEGORIES.map(
  (category) => category.id
);

function classicNumber(id: string): number {
  const parsed = Number.parseInt(id.replace('classic-', ''), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function categoryForClassicQuestion(id: string): ClassicCategoryId {
  const number = classicNumber(id);

  if (number <= 20) return 'games';
  if (number <= 39) return 'anime';
  if (number <= 49) return 'pop-culture';
  if (number <= 64) return 'animals';
  return 'tech';
}

/**
 * Difficulty split chosen to balance the deck while keeping each topic at a
 * sensible age level:
 * - Easy: first games, simple anime and most of the technology deck.
 * - Medium: Roblox/Minecraft deep cuts, conservation and Office software.
 * - Hard: competitive games, advanced anime, pop-culture lore and harder facts.
 */
function difficultyForClassicQuestion(id: string): DifficultyId {
  const number = classicNumber(id);

  if (number <= 5) return 'easy';
  if (number <= 15) return 'medium';
  if (number <= 20) return 'hard';
  if (number <= 27) return 'easy';
  if (number <= 49) return 'hard';
  if (number <= 59) return 'medium';
  if (number <= 64) return 'hard';
  if (number <= 73) return 'easy';
  if (number <= 83) return 'medium';
  return 'easy';
}

function buildClassicDecks(): Record<DifficultyId, Question[]> {
  const decks: Record<DifficultyId, Question[]> = {
    easy: [],
    medium: [],
    hard: [],
  };

  for (const question of CLASSIC_QUESTIONS) {
    const difficulty = difficultyForClassicQuestion(question.id);
    decks[difficulty].push({
      ...question,
      difficulty,
      category: categoryForClassicQuestion(question.id),
    });
  }

  for (const difficulty of ['easy', 'medium', 'hard'] as DifficultyId[]) {
    const deck = decks[difficulty].sort(
      (a, b) => classicNumber(a.id) - classicNumber(b.id)
    );
    const tierSize = Math.ceil(deck.length / 3);

    deck.forEach((question, index) => {
      question.tier = Math.min(3, Math.floor(index / tierSize) + 1) as QuestionTier;
    });
  }

  return decks;
}

/** The classic deck split into Easy, Medium and Hard, with tiers for competition. */
export const CLASSIC_DECKS = buildClassicDecks();

/**
 * Returns the classic deck for a difficulty, optionally filtered by topics.
 * An empty selection falls back to every topic so a round never starts empty.
 */
export function getClassicDeck(
  difficulty: DifficultyId,
  categories: ClassicCategoryId[] = CLASSIC_ALL_CATEGORIES
): Question[] {
  const selected = new Set(
    categories.length > 0 ? categories : CLASSIC_ALL_CATEGORIES
  );

  return CLASSIC_DECKS[difficulty].filter(
    (question) => question.category && selected.has(question.category)
  );
}
