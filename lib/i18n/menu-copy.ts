import type { Language } from './types';

const EN = {
  specialEvents: 'Special events',
  gameModes: 'Game modes',
  roundConfig: 'Round configuration',
  availableEvents: 'Available events',
  chooseMode: 'Choose how to play',
  step1: 'Step 1 · pick a mode',
  topics: 'Question topics',
  selected: 'selected',
  selectTopic: 'Select at least one topic to start.',
  competitionLevel: 'Competition level',
  roundsPerDifficulty: 'Rounds per difficulty',
  rounds: 'rounds',
  difficulty: 'Difficulty',
  questionLanguage: 'Question language',
  questionLanguageHelp:
    'Only the questions and game feedback change. The interface follows the language selector at the top.',
  joinRoom: 'Join a live room',
  chooseModeToStart: 'Choose a mode to start',
  createLiveRoom: 'Create live room',
  setupCompetition: 'Set up competition',
  startSpooky: 'Start the spooky round',
  startGame: 'Start game',
  liveNext:
    'The next screen creates the room, shows the QR code and lets you choose rounds and time.',
  pickMode: 'Pick a mode above to see the options.',
  phasesWord: 'phases',
  topicsWord: 'topics',
  questionsWord: 'questions',
  randomOrder: 'Random order',
  inOrder: 'In order',
  tip: 'Tip: press T or F to answer · Esc closes the question',
  modes: {
    d20: {
      label: 'D20 Roll',
      tagline: 'One question at a time',
      description: 'Roll a real D20 and tap the number you rolled.',
    },
    competition: {
      label: 'Competition',
      tagline: 'Knockout tournament',
      description: 'Register students and run the phase ladder.',
    },
    live: {
      label: 'Live',
      tagline: 'Phones and QR code',
      description: 'Create a room and let students answer on their phones.',
    },
  },
  titles: {
    d20: ['Can you', 'guess?'],
    competition: ['Competition'],
    live: ['Live', 'room'],
    halloweenD20: ['Halloween', 'Trivia'],
    halloweenCompetition: ['Halloween', 'Competition'],
    halloweenLive: ['Halloween', 'Live'],
  },
  subtitles: {
    d20: 'Pick a mode, choose your topics and difficulty, then let the D20 decide.',
    competition: 'Register your students and run a knockout with the topics you selected.',
    live: 'Create a live room and let students answer on their phones with a code or QR.',
    halloweenD20:
      'Trick or treat! Pick a difficulty, roll a real D20 and answer the spooky true-or-false questions.',
    halloweenCompetition:
      'Register your students and run a Halloween knockout. Each phase asks one question per student.',
    halloweenLive:
      'Create a live room and let students answer on their phones with a code or QR.',
  },
  events: {
    back: 'Back to games',
    badge: 'Supp · Special events',
    title: ['Special', 'events'],
    subtitle:
      'Seasonal decks and limited-time game modes. The default games are always available from the main menu.',
    liveNow: 'Live now',
    comingSoon: 'Coming soon',
    openEvent: 'Open event',
    halloween: 'Halloween',
    halloweenDescription:
      'Spooky true-or-false, knockout competition and a live room with QR codes.',
    christmas: 'Christmas',
    christmasDescription: 'Festive questions, holiday movies and a Christmas knockout.',
    easter: 'Easter',
    easterDescription: 'Spring trivia, chocolate facts and an Easter egg hunt quiz.',
    more: 'More seasonal events will appear here as they are released.',
  },
  playing: {
    menu: 'Menu',
    halloweenTitle: 'Halloween Trivia',
    title: 'Trivia',
    newRound: 'New round',
    roundProgress: 'Round progress',
    bestStreak: 'Best streak',
    roundDone: '20 questions done! Ready for another round?',
    openQuestion: 'Open a question for roll',
    scoreLabel: 'Score',
    streakLabel: 'Streak',
  },
};

type MenuCopy = typeof EN;

const PT: MenuCopy = {
  specialEvents: 'Eventos especiais',
  gameModes: 'Modos de jogo',
  roundConfig: 'Configuração da rodada',
  availableEvents: 'Eventos disponíveis',
  chooseMode: 'Escolha como jogar',
  step1: 'Passo 1 · escolha um modo',
  topics: 'Tipos de pergunta',
  selected: 'selecionados',
  selectTopic: 'Selecione pelo menos um tema para começar.',
  competitionLevel: 'Nível da competição',
  roundsPerDifficulty: 'Rodadas por dificuldade',
  rounds: 'rodadas',
  difficulty: 'Dificuldade',
  questionLanguage: 'Idioma das perguntas',
  questionLanguageHelp:
    'Apenas as perguntas e o feedback do jogo mudam. A interface segue o seletor de idioma no topo.',
  joinRoom: 'Entrar em uma sala',
  chooseModeToStart: 'Escolha um modo para começar',
  createLiveRoom: 'Criar sala ao vivo',
  setupCompetition: 'Configurar competição',
  startSpooky: 'Começar a rodada assustadora',
  startGame: 'Começar jogo',
  liveNext:
    'A próxima tela cria a sala, mostra o QR code e permite escolher rodadas e tempo.',
  pickMode: 'Escolha um modo acima para ver as opções.',
  phasesWord: 'fases',
  topicsWord: 'temas',
  questionsWord: 'perguntas',
  randomOrder: 'Ordem aleatória',
  inOrder: 'Em ordem',
  tip: 'Dica: pressione T ou F para responder · Esc fecha a pergunta',
  modes: {
    d20: {
      label: 'Rolar D20',
      tagline: 'Uma pergunta por vez',
      description: 'Role um D20 de verdade e toque no número sorteado.',
    },
    competition: {
      label: 'Competição',
      tagline: 'Torneio eliminatório',
      description: 'Cadastre os alunos e siga a escada de fases.',
    },
    live: {
      label: 'Ao vivo',
      tagline: 'Celulares e QR code',
      description: 'Crie uma sala e deixe os alunos responderem no celular.',
    },
  },
  titles: {
    d20: ['Você consegue', 'adivinhar?'],
    competition: ['Competição'],
    live: ['Sala', 'ao vivo'],
    halloweenD20: ['Halloween', 'Trivia'],
    halloweenCompetition: ['Halloween', 'Competição'],
    halloweenLive: ['Halloween', 'Ao vivo'],
  },
  subtitles: {
    d20: 'Escolha um modo, os temas e a dificuldade, e deixe o D20 decidir.',
    competition: 'Cadastre os alunos e rode um torneio eliminatório com os temas escolhidos.',
    live: 'Crie uma sala e deixe os alunos responderem no celular com código ou QR.',
    halloweenD20:
      'Doces ou travessuras! Escolha a dificuldade, role um D20 de verdade e responda às perguntas assustadoras.',
    halloweenCompetition:
      'Cadastre os alunos e rode um torneio de Halloween. Cada fase faz uma pergunta por aluno.',
    halloweenLive:
      'Crie uma sala e deixe os alunos responderem no celular com código ou QR.',
  },
  events: {
    back: 'Voltar aos jogos',
    badge: 'Supp · Eventos especiais',
    title: ['Eventos', 'especiais'],
    subtitle:
      'Baralhos sazonais e modos de tempo limitado. Os jogos padrão estão sempre disponíveis no menu principal.',
    liveNow: 'Disponível',
    comingSoon: 'Em breve',
    openEvent: 'Abrir evento',
    halloween: 'Halloween',
    halloweenDescription:
      'Verdadeiro ou falso assustador, competição eliminatória e sala ao vivo com QR code.',
    christmas: 'Natal',
    christmasDescription: 'Perguntas festivas, filmes de Natal e uma competição natalina.',
    easter: 'Páscoa',
    easterDescription: 'Trivia de primavera, curiosidades sobre chocolate e caça aos ovos.',
    more: 'Mais eventos sazonais aparecerão aqui conforme forem lançados.',
  },
  playing: {
    menu: 'Menu',
    halloweenTitle: 'Halloween Trivia',
    title: 'Trivia',
    newRound: 'Nova rodada',
    roundProgress: 'Progresso da rodada',
    bestStreak: 'Melhor sequência',
    roundDone: '20 perguntas concluídas! Pronto para outra rodada?',
    openQuestion: 'Abrir uma pergunta para a rolagem',
    scoreLabel: 'Pontuação',
    streakLabel: 'Sequência',
  },
};

export const MENU_COPY: Record<Language, MenuCopy> = { en: EN, pt: PT };
