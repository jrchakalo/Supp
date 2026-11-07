import type { LiveQuestion } from './types';

/**
 * Baralhos do projeto Passaporte (conteúdo de aula).
 *
 * São carregados pelo `/host` via `?deck=<id>` e substituem o baralho padrão
 * do modo clássico/Halloween naquela sala. As perguntas ficam na ordem autoral
 * da aula; `prepareQuestion` continua embaralhando as opções em runtime.
 */
export type PassaporteDeck = {
  id: string;
  title: string;
  questions: LiveQuestion[];
};

export const PASSAPORTE_DECKS: Record<string, PassaporteDeck> = {
  'm5c2-p5-a2': {
    id: 'm5c2-p5-a2',
    title: 'Do Lixo ao Luxo — Aula 2: Raízes do Desperdício',
    questions: [
      {
        id: 'p5a2-01',
        tier: 1,
        text: 'O que é desperdício?',
        options: [
          'Comprar coisas novas',
          'Jogar fora o que ainda serve',
          'Economizar água',
          'Reciclar papel',
        ],
        correctIndex: 1,
        explanation: 'Desperdício é jogar fora algo que ainda poderia ser usado.',
      },
      {
        id: 'p5a2-02',
        tier: 1,
        text: 'Em média, quantos kg de lixo uma pessoa produz por dia?',
        options: ['5 kg', '100 g', 'Pouco mais de 1 kg', '50 kg'],
        correctIndex: 2,
        explanation: 'No Brasil, cerca de 1,3 kg por pessoa por dia.',
      },
      {
        id: 'p5a2-03',
        tier: 2,
        text: 'O que é a causa raiz de um problema?',
        options: [
          'A consequência',
          'A causa mais profunda',
          'O sintoma visível',
          'Quem aparenta culpa',
        ],
        correctIndex: 1,
        explanation: 'É a origem do problema: atacando a raiz, a solução dura.',
      },
      {
        id: 'p5a2-04',
        tier: 2,
        text: 'Qual pergunta ajuda a encontrar a causa raiz?',
        options: [
          'Quem é o culpado?',
          'Por que isso acontece?',
          'Quando começou?',
          'O que os outros acham?',
        ],
        correctIndex: 1,
        explanation: "Perguntar 'por quê?' várias vezes revela as camadas do problema.",
      },
      {
        id: 'p5a2-05',
        tier: 1,
        text: 'O script de hoje faz o quê ao tocar o objeto?',
        options: ['Muda a cor', 'Destrói o objeto', 'Fecha o jogo', 'Ganha pontos'],
        correctIndex: 1,
        explanation: 'part:Destroy() remove o objeto do jogo.',
      },
      {
        id: 'p5a2-06',
        tier: 2,
        text: 'Onde o Script precisa estar para script.Parent funcionar?',
        options: [
          'No Workspace direto',
          'Dentro da Parte',
          'No StarterGui',
          'No Lighting',
        ],
        correctIndex: 1,
        explanation: 'script.Parent é o objeto que contém o script.',
      },
      {
        id: 'p5a2-07',
        tier: 3,
        text: 'Qual linha conecta a função ao toque?',
        options: [
          'part.Touch = onTouch',
          'Connect(part.Touched)',
          'part.Touched:Connect(onTouch)',
          'part.onTouch:Connect()',
        ],
        correctIndex: 2,
        explanation: 'Touched é o evento; Connect liga ele à função.',
      },
      {
        id: 'p5a2-08',
        tier: 2,
        text: "Por que checamos FindFirstChild('Humanoid')?",
        options: [
          'Para dar pontos',
          'Para saber que quem tocou é um personagem',
          'Para mudar a cor',
          'Para reiniciar',
        ],
        correctIndex: 1,
        explanation:
          'O Humanoid existe só em personagens — evita erro quando outra peça toca.',
      },
      {
        id: 'p5a2-09',
        tier: 1,
        text: 'Exemplo de desperdício de alimentos:',
        options: [
          'Congelar comida',
          'Doar frutas maduras',
          'Comprar demais e deixar estragar',
          'Usar sobras',
        ],
        correctIndex: 2,
        explanation: 'Comprar além do consumo é a causa mais comum em casa.',
      },
      {
        id: 'p5a2-10',
        tier: 2,
        text: 'ODS 12 é sobre...',
        options: [
          'Vida na Água',
          'Consumo e Produção Responsáveis',
          'Energia Limpa',
          'Educação de Qualidade',
        ],
        correctIndex: 1,
        explanation: 'ODS 12: produzir e consumir de forma sustentável.',
      },
      {
        id: 'p5a2-11',
        tier: 1,
        text: 'Para enviar o jogo ao professor:',
        options: [
          'Tirar print',
          'Salvar, tornar público e copiar o link',
          'Fechar o Studio',
          'Apagar o projeto',
        ],
        correctIndex: 1,
        explanation: 'Tornar público gera o link que o professor acessa.',
      },
      {
        id: 'p5a2-12',
        tier: 3,
        text: 'Script não funciona — 1º passo?',
        options: [
          'Começar outro jogo',
          'Mudar a cor da parte',
          'Pedir pro colega fazer',
          'Conferir se o Script está na Parte e ler o Output',
        ],
        correctIndex: 3,
        explanation:
          '90% dos erros são script no lugar errado ou erro de digitação — o Output mostra.',
      },
    ],
  },
  'ib-word-1': {
    id: 'ib-word-1',
    title: 'Info Bilíngue — Word I: Interface, Save & Cloud',
    questions: [
      {
        id: 'ibw1-01',
        tier: 1,
        text: "What does 'Save' mean?",
        options: ['Salvar', 'Apagar', 'Imprimir', 'Compartilhar'],
        correctIndex: 0,
        explanation: "Save = salvar. No Word, o atalho é Ctrl+S.",
      },
      {
        id: 'ibw1-02',
        tier: 1,
        text: 'Qual atalho salva o documento no Word?',
        options: ['Ctrl+P', 'Ctrl+V', 'Ctrl+S', 'Ctrl+Z'],
        correctIndex: 2,
        explanation: 'Ctrl+S = Save. Ctrl+P imprime, Ctrl+V cola, Ctrl+Z desfaz.',
      },
      {
        id: 'ibw1-03',
        tier: 2,
        text: "'Save As' serve para...",
        options: [
          'Apagar o arquivo',
          'Salvar pela primeira vez, com outro nome ou em outro lugar',
          'Imprimir em PDF',
          'Fechar o Word',
        ],
        correctIndex: 1,
        explanation:
          'Save grava no arquivo atual; Save As cria uma nova cópia (primeiro salvamento, outro nome/local).',
      },
      {
        id: 'ibw1-04',
        tier: 1,
        text: 'A barrinha piscando onde o texto é digitado chama-se...',
        options: ['Ribbon', 'Status Bar', 'Cursor', 'File'],
        correctIndex: 2,
        explanation: 'Cursor: a barra vertical que mostra onde o próximo caractere vai aparecer.',
      },
      {
        id: 'ibw1-05',
        tier: 1,
        text: 'A faixa superior com abas (Home, Insert, Design) é a...',
        options: ['Ribbon', 'Cursor', 'Document Area', 'Lixeira'],
        correctIndex: 0,
        explanation: 'Ribbon: a faixa de comandos organizada em abas.',
      },
      {
        id: 'ibw1-06',
        tier: 2,
        text: 'A barra inferior que mostra a página e o número de palavras é a...',
        options: ['Ribbon', 'Status Bar', 'File Menu', 'Cursor'],
        correctIndex: 1,
        explanation: 'Status Bar: mostra página, idioma e word count (contagem de palavras).',
      },
      {
        id: 'ibw1-07',
        tier: 2,
        text: "O 'Document Area' é onde...",
        options: [
          'o texto é digitado',
          'ficam os atalhos',
          'aparecem as abas',
          'fica a lixeira',
        ],
        correctIndex: 0,
        explanation: 'Document Area: a área branca onde você digita o documento.',
      },
      {
        id: 'ibw1-08',
        tier: 2,
        text: 'Alt+F abre o menu...',
        options: ['Home', 'Insert', 'File (Arquivo)', 'Design'],
        correctIndex: 2,
        explanation: 'Alt+F abre o File Menu, com Save, Print, Close e outros.',
      },
      {
        id: 'ibw1-09',
        tier: 1,
        text: 'No Google Docs, o trabalho é salvo...',
        options: [
          'só com Ctrl+S',
          'automaticamente na nuvem',
          'só ao imprimir',
          'nunca',
        ],
        correctIndex: 1,
        explanation: 'Docs salva automaticamente na nuvem (autosave) enquanto você digita.',
      },
      {
        id: 'ibw1-10',
        tier: 1,
        text: "Cloud significa...",
        options: ['Lixeira', 'Documento', 'Nuvem (internet)', 'Teclado'],
        correctIndex: 2,
        explanation: 'Cloud = nuvem: seus arquivos ficam na internet, acessíveis de qualquer lugar.',
      },
      {
        id: 'ibw1-11',
        tier: 2,
        text: 'Word count é a...',
        options: ['fonte', 'margem', 'senha', 'contagem de palavras'],
        correctIndex: 3,
        explanation: 'Word count = número de palavras do documento (aparece na Status Bar).',
      },
      {
        id: 'ibw1-12',
        tier: 3,
        text: 'Se você fechar o navegador sem salvar no Google Docs, o texto...',
        options: [
          'é perdido',
          'vira PDF',
          'continua salvo (autosave)',
          'apaga a conta',
        ],
        correctIndex: 2,
        explanation:
          'No Docs o autosave já gravou tudo: fechar o navegador não apaga o documento.',
      },
    ],
  },
};
