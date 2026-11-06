import type { Language } from './types';

const EN = {
  setup: {
    menu: 'Menu',
    competition: 'Competition',
    halloweenCompetition: 'Halloween competition',
    title: 'Competition setup',
    description:
      'Register the students, choose the ladder and how the next student is picked. Each phase asks one question per student: correct answers move on, wrong answers are out.',
    students: 'Students',
    clear: 'Clear',
    studentName: 'Student name',
    namePlaceholder: 'Type a name, or paste several separated by commas',
    add: 'Add',
    remove: 'Remove',
    tip: 'Tip: paste a whole class list at once, separated by commas or line breaks.',
    noStudents: 'No students yet',
    addTwo: 'Add at least 2 students to start the competition.',
    topics: 'Question topics',
    selectTopic: 'Select at least one topic to start.',
    level: 'Competition level',
    roundsPerDifficulty: 'Rounds per difficulty',
    twoRounds: '2 rounds',
    threeRounds: '3 rounds',
    nextStudent: 'Next student',
    inOrder: 'In order',
    followList: 'Follow the list',
    random: 'Random',
    shuffle: 'Shuffle each phase',
    howItWorks: 'How it works',
    rule1: 'One question per student in each phase.',
    rule2: 'Correct answer: the student advances to the next phase.',
    rule3: 'Wrong answer: the student is eliminated.',
    rule4: 'The last surviving student wins.',
    rule5:
      'If 2 or more students remain after the final phase, sudden-death tiebreak rounds decide the champion.',
    start: 'Start competition',
    summary: (students: number, phases: number, order: string) =>
      `${students} student${students === 1 ? '' : 's'} · ${phases} phases · ${order}`,
    firstLast: (first: string, last: string) =>
      `First phase: ${first}. Last phase: ${last}.`,
    addTwoStart: 'Add at least 2 students to unlock the start button.',
    maxStudents: (n: number) => `You can register up to ${n} students.`,
    typeName: 'Type a student name first.',
    duplicates: 'Those names are already on the list or are too long.',
    added: (n: number) => `Added ${n} student(s).`,
    skipped: (added: number, skipped: number) =>
      `Added ${added}. Skipped ${skipped} duplicate, long or extra name(s).`,
    cleared: 'Student list cleared.',
  },
  game: {
    menu: 'Menu',
    competition: 'Competition',
    halloweenCompetition: 'Halloween Competition',
    inPhase: 'in phase',
    randomOrder: 'Random order',
    inOrder: 'In order',
    seePhaseResults: 'See phase results',
    nextStudent: 'Next student',
    finalPhaseComplete: 'Final phase complete',
    tiebreakRoundComplete: (round: number) =>
      `Tiebreak round ${round} complete`,
    phaseComplete: (current: number) => `Phase ${current} complete`,
    restart: 'Restart',
    phaseProgress: 'Phase progress',
    correct: 'correct',
    tiebreaker: 'Tiebreaker',
    phase: 'Phase',
    competitionOver: 'Competition over',
    noChampion: 'No champion this time',
    noChampionText:
      'Everyone was eliminated in this phase. That is a tough ladder! Run a rematch or go back to setup and try a different level.',
    playAgain: 'Play again',
    newCompetition: 'New competition',
    champion: 'Champion!',
    wonAfter: (rounds: number) =>
      `Won after ${rounds} tiebreak round${rounds === 1 ? '' : 's'}`,
    survived: (current: number, total: number) =>
      `Survived ${current} of ${total} phases`,
    withCorrect: 'with',
    correctAnswers: 'correct answers.',
    tiebreakNeeded: 'Tiebreaker needed',
    stillTied: 'Still tied',
    advanced: (n: number) => `${n} advanced`,
    tiebreakNeededText: (n: number) =>
      `${n} students survived the final phase. Start sudden death: one question each until one champion remains.`,
    stillTiedText: (n: number, round: number) =>
      `${n} students are still tied after round ${round}. Another sudden-death round will decide it.`,
    eliminatedText: (n: number) =>
      `${n} student${n === 1 ? '' : 's'} eliminated in this phase.`,
    stillInContention: 'Still in contention',
    advancedLabel: 'Advanced',
    startTiebreaker: 'Start tiebreaker',
    nextTiebreak: (round: number) => `Next tiebreak: Round ${round}`,
    nextPhase: (label: string) => `Next phase: ${label}`,
    noOneAdvanced: 'No one advanced.',
    noOneEliminated: 'No one was eliminated.',
    eliminated: 'Eliminated',
    advancedShort: 'Advanced',
    turn: (current: number, total: number) => `Turn ${current} of ${total}`,
    yourTurn: "It's your turn",
    teacherReads:
      'The teacher reads the question aloud. Answer true or false to try to reach the next phase.',
    revealQuestion: 'Reveal question',
    tip: 'Tip: press T or F to answer · Esc closes the question',
    phaseLineup: 'Phase lineup',
    correctOverall: (correct: number, total: number) =>
      `${correct}/${total} correct overall`,
    status: {
      advanced: 'Advanced',
      eliminated: 'Eliminated',
      current: 'Now playing',
      pending: 'Waiting',
    },
  },
};

type SetupCopy = typeof EN.setup;
type GameCopy = typeof EN.game;

const PT: { setup: SetupCopy; game: GameCopy } = {
  setup: {
    menu: 'Menu',
    competition: 'Competição',
    halloweenCompetition: 'Competição de Halloween',
    title: 'Configurar competição',
    description:
      'Cadastre os alunos, escolha a escada e como o próximo aluno é sorteado. Cada fase faz uma pergunta por aluno: quem acerta avança, quem erra sai.',
    students: 'Alunos',
    clear: 'Limpar',
    studentName: 'Nome do aluno',
    namePlaceholder: 'Digite um nome ou cole vários separados por vírgulas',
    add: 'Adicionar',
    remove: 'Remover',
    tip: 'Dica: cole a lista inteira da turma de uma vez, separada por vírgulas ou quebras de linha.',
    noStudents: 'Nenhum aluno ainda',
    addTwo: 'Adicione pelo menos 2 alunos para começar a competição.',
    topics: 'Tipos de pergunta',
    selectTopic: 'Selecione pelo menos um tema para começar.',
    level: 'Nível da competição',
    roundsPerDifficulty: 'Rodadas por dificuldade',
    twoRounds: '2 rodadas',
    threeRounds: '3 rodadas',
    nextStudent: 'Próximo aluno',
    inOrder: 'Em ordem',
    followList: 'Seguir a lista',
    random: 'Aleatório',
    shuffle: 'Embaralhar a cada fase',
    howItWorks: 'Como funciona',
    rule1: 'Uma pergunta por aluno em cada fase.',
    rule2: 'Resposta certa: o aluno avança para a próxima fase.',
    rule3: 'Resposta errada: o aluno é eliminado.',
    rule4: 'O último aluno sobrevivente vence.',
    rule5:
      'Se 2 ou mais alunos chegarem ao fim das fases, rodadas de morte súbita decidem o campeão.',
    start: 'Começar competição',
    summary: (students: number, phases: number, order: string) =>
      `${students} aluno${students === 1 ? '' : 's'} · ${phases} fases · ${order}`,
    firstLast: (first: string, last: string) =>
      `Primeira fase: ${first}. Última fase: ${last}.`,
    addTwoStart: 'Adicione pelo menos 2 alunos para liberar o botão de início.',
    maxStudents: (n: number) => `Você pode cadastrar até ${n} alunos.`,
    typeName: 'Digite o nome de um aluno primeiro.',
    duplicates: 'Esses nomes já estão na lista ou são longos demais.',
    added: (n: number) => `Adicionado(s) ${n} aluno(s).`,
    skipped: (added: number, skipped: number) =>
      `Adicionado(s) ${added}. Ignorado(s) ${skipped} nome(s) duplicado(s), longo(s) ou excedente(s).`,
    cleared: 'Lista de alunos limpa.',
  },
  game: {
    menu: 'Menu',
    competition: 'Competição',
    halloweenCompetition: 'Competição de Halloween',
    inPhase: 'na fase',
    randomOrder: 'Ordem aleatória',
    inOrder: 'Em ordem',
    seePhaseResults: 'Ver resultado da fase',
    nextStudent: 'Próximo aluno',
    finalPhaseComplete: 'Fase final concluída',
    tiebreakRoundComplete: (round: number) =>
      `Rodada de desempate ${round} concluída`,
    phaseComplete: (current: number) => `Fase ${current} concluída`,
    restart: 'Reiniciar',
    phaseProgress: 'Progresso da fase',
    correct: 'acertos',
    tiebreaker: 'Desempate',
    phase: 'Fase',
    competitionOver: 'Competição encerrada',
    noChampion: 'Nenhum campeão desta vez',
    noChampionText:
      'Todos foram eliminados nesta fase. Que escada difícil! Faça uma revanche ou volte para a configuração e tente outro nível.',
    playAgain: 'Jogar de novo',
    newCompetition: 'Nova competição',
    champion: 'Campeão!',
    wonAfter: (rounds: number) =>
      `Venceu após ${rounds} rodada${rounds === 1 ? '' : 's'} de desempate`,
    survived: (current: number, total: number) =>
      `Sobreviveu a ${current} de ${total} fases`,
    withCorrect: 'com',
    correctAnswers: 'respostas certas.',
    tiebreakNeeded: 'Desempate necessário',
    stillTied: 'Ainda empatados',
    advanced: (n: number) => `${n} avançaram`,
    tiebreakNeededText: (n: number) =>
      `${n} alunos sobreviveram à fase final. Comece a morte súbita: uma pergunta para cada um até restar um campeão.`,
    stillTiedText: (n: number, round: number) =>
      `${n} alunos ainda estão empatados após a rodada ${round}. Outra rodada de morte súbita vai decidir.`,
    eliminatedText: (n: number) =>
      `${n} aluno${n === 1 ? '' : 's'} eliminado${n === 1 ? '' : 's'} nesta fase.`,
    stillInContention: 'Ainda na disputa',
    advancedLabel: 'Avançaram',
    startTiebreaker: 'Começar desempate',
    nextTiebreak: (round: number) => `Próximo desempate: rodada ${round}`,
    nextPhase: (label: string) => `Próxima fase: ${label}`,
    noOneAdvanced: 'Ninguém avançou.',
    noOneEliminated: 'Ninguém foi eliminado.',
    eliminated: 'Eliminados',
    advancedShort: 'Avançaram',
    turn: (current: number, total: number) => `Vez ${current} de ${total}`,
    yourTurn: 'É a sua vez',
    teacherReads:
      'O professor lê a pergunta em voz alta. Responda verdadeiro ou falso para tentar chegar à próxima fase.',
    revealQuestion: 'Revelar pergunta',
    tip: 'Dica: pressione T ou F para responder · Esc fecha a pergunta',
    phaseLineup: 'Ordem da fase',
    correctOverall: (correct: number, total: number) =>
      `${correct}/${total} acertos no total`,
    status: {
      advanced: 'Avançou',
      eliminated: 'Eliminado',
      current: 'Jogando agora',
      pending: 'Aguardando',
    },
  },
};

export const COMPETITION_COPY: Record<
  Language,
  { setup: SetupCopy; game: GameCopy }
> = { en: EN, pt: PT };
