import type { Language } from './types';

const EN = {
  menu: 'Menu',
  liveHost: 'Live · Host',
  halloweenLiveHost: 'Halloween Live · Host',
  createRoom: 'Create a live room',
  createRoomHelp:
    'Students join with the room code or the QR code, then answer on their own phones while the question stays on this screen.',
  topics: 'Question topics',
  selectTopic: 'Select at least one topic to open a room.',
  deck: 'Deck',
  rounds: 'Rounds',
  timePerQuestion: 'Time per question',
  autoAdvance: 'Auto-advance next question',
  autoAdvanceHelp:
    'On: the reveal screen jumps to the next question on its own after 7 s. Off: the host drives Next question manually.',
  playerView: 'Student devices',
  playerViewHelp:
    'Choose what students see on their phones while answering. Full text helps large rooms; shapes only keeps the quiz-show look.',
  playerViewFull: 'Question + answers',
  playerViewShapes: 'Shapes only',
  questionLanguage: 'Question language',
  questionLanguageHelp:
    'Only the questions and game feedback change. The interface follows the language selector on the main menu.',
  translateAtHalf: 'Translate after half the time',
  translateAtHalfHelp:
    'On: halfway through the timer, questions that have a translation show the Portuguese version here and on the phones. The original stays on screen.',
  translateAtHalfUnavailable: 'This deck has no Portuguese translations, so this option changes nothing.',
  translationLabel: 'PT',
  on: 'On',
  off: 'Off',
  openRoom: 'Open room',
  openingRoom: 'Opening room…',
  rejoin: (code: string) => `Rejoin room ${code} (after refresh)`,
  questionsReady: (n: number) => `${n} multiple-choice questions ready.`,
  questionCount: (n: number) => `${n} questions`,
  seconds: (n: number) => `${n} s`,
  realtimeTitle: 'Realtime not configured',
  realtimeHelp:
    'Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local, then restart the dev server.',
  backToMenu: 'Back to menu',
  roomCode: 'Room code',
  joinHelp:
    'Students open /join, type the code, pick a nickname and wait for the first question.',
  playersInRoom: (n: number) => `/ ${n} players in the room`,
  start: (n: number) => `Start (${n} questions)`,
  scanToJoin: 'Scan to join',
  lobby: 'Lobby',
  waiting: 'Waiting for the first player… show the QR code to the class.',
  questionOf: (current: number, total: number) => `Question ${current} / ${total}`,
  timeLeft: 'Time left',
  answered: (a: number, b: number | string) => `${a}/${b} answered`,
  studentsRead:
    'Students read the answers here and tap them on the phones until the timer runs out.',
  answers: 'Answers',
  leaderboard: 'Leaderboard',
  nextAuto: (n: number) => `Next question automatically in ${n} s`,
  advancing: 'Advancing…',
  autoOff: 'Auto-advance is off — press Next question when the room is ready.',
  autoAdvanceToggle: (on: boolean) => `Auto-advance: ${on ? 'On' : 'Off'}`,
  finishGame: 'Finish game',
  nextQuestion: 'Next question',
  endGame: 'End game',
  gameOver: 'Game over',
  points: 'pts',
  playAgainSameRoom: 'Play again (same room)',
  closeRoom: 'Close room',
};

type HostCopy = typeof EN;

const PT: HostCopy = {
  menu: 'Menu',
  liveHost: 'Ao vivo · Anfitrião',
  halloweenLiveHost: 'Halloween ao vivo · Anfitrião',
  createRoom: 'Criar uma sala ao vivo',
  createRoomHelp:
    'Os alunos entram com o código ou o QR code e respondem no próprio celular enquanto a pergunta fica nesta tela.',
  topics: 'Tipos de pergunta',
  selectTopic: 'Selecione pelo menos um tema para abrir uma sala.',
  deck: 'Baralho',
  rounds: 'Rodadas',
  timePerQuestion: 'Tempo por pergunta',
  autoAdvance: 'Avançar automaticamente para a próxima pergunta',
  autoAdvanceHelp:
    'Ligado: a tela de revelação avança sozinha após 7 s. Desligado: o host controla a próxima pergunta manualmente.',
  playerView: 'Celulares dos alunos',
  playerViewHelp:
    'Escolha o que os alunos veem no celular enquanto respondem. O texto completo ajuda em salas grandes; somente figuras mantém o visual de quiz show.',
  playerViewFull: 'Pergunta + respostas',
  playerViewShapes: 'Somente figuras',
  questionLanguage: 'Idioma das perguntas',
  questionLanguageHelp:
    'Apenas as perguntas e o feedback do jogo mudam. A interface segue o seletor de idioma no menu principal.',
  translateAtHalf: 'Traduzir após metade do tempo',
  translateAtHalfHelp:
    'Ligado: na metade do tempo, as perguntas que têm tradução mostram a versão em português aqui e nos celulares. A original continua na tela.',
  translateAtHalfUnavailable:
    'Este baralho não tem traduções em português, então esta opção não muda nada.',
  translationLabel: 'PT',
  on: 'Ligado',
  off: 'Desligado',
  openRoom: 'Abrir sala',
  openingRoom: 'Abrindo sala…',
  rejoin: (code: string) => `Reentrar na sala ${code} (após atualizar)`,
  questionsReady: (n: number) => `${n} perguntas de múltipla escolha prontas.`,
  questionCount: (n: number) => `${n} perguntas`,
  seconds: (n: number) => `${n} s`,
  realtimeTitle: 'Realtime não configurado',
  realtimeHelp:
    'Adicione NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY ao seu .env.local e reinicie o servidor de desenvolvimento.',
  backToMenu: 'Voltar ao menu',
  roomCode: 'Código da sala',
  joinHelp:
    'Os alunos abrem /join, digitam o código, escolhem um apelido e esperam a primeira pergunta.',
  playersInRoom: (n: number) => `/ ${n} jogadores na sala`,
  start: (n: number) => `Começar (${n} perguntas)`,
  scanToJoin: 'Escaneie para entrar',
  lobby: 'Sala de espera',
  waiting: 'Esperando o primeiro jogador… mostre o QR code para a turma.',
  questionOf: (current: number, total: number) => `Pergunta ${current} / ${total}`,
  timeLeft: 'Tempo restante',
  answered: (a: number, b: number | string) => `${a}/${b} responderam`,
  studentsRead:
    'Os alunos leem as respostas aqui e tocam no celular até o tempo acabar.',
  answers: 'Respostas',
  leaderboard: 'Placar',
  nextAuto: (n: number) => `Próxima pergunta automaticamente em ${n} s`,
  advancing: 'Avançando…',
  autoOff: 'O avanço automático está desligado — pressione Próxima pergunta quando a sala estiver pronta.',
  autoAdvanceToggle: (on: boolean) => `Avanço automático: ${on ? 'Ligado' : 'Desligado'}`,
  finishGame: 'Encerrar jogo',
  nextQuestion: 'Próxima pergunta',
  endGame: 'Encerrar',
  gameOver: 'Fim de jogo',
  points: 'pts',
  playAgainSameRoom: 'Jogar de novo (mesma sala)',
  closeRoom: 'Fechar sala',
};

export const HOST_COPY: Record<Language, HostCopy> = { en: EN, pt: PT };
