import type { LiveQuestionTranslation } from './types';

/**
 * Brazilian Portuguese translations for the Classic Live deck.
 * `options` follow the same order as the English deck so `correctIndex`
 * stays valid.
 */
export const CLASSIC_LIVE_PT: Record<string, LiveQuestionTranslation> = {
  // ---------- Easy ----------
  'clq-easy-01': {
    text: 'No Minecraft, qual ferramenta você precisa para minerar blocos de pedra?',
    options: ['Uma pá', 'Uma picareta', 'Um balde', 'Uma vara de pescar'],
    explanation: 'A picareta é a ferramenta certa para quebrar pedra e minérios.',
  },
  'clq-easy-02': {
    text: "Em 'Dragon Ball', quem é o personagem principal?",
    options: ['Naruto', 'Goku', 'Luffy', 'Ichigo'],
    explanation: 'Goku é o herói de Dragon Ball.',
  },
  'clq-easy-03': {
    text: "Em 'Matrix', qual pílula Neo toma?",
    options: ['Azul', 'Verde', 'Vermelha', 'Amarela'],
    explanation: 'A pílula vermelha mostra a Neo o mundo real.',
  },
  'clq-easy-04': {
    text: 'Qual animal é conhecido como o rei da selva?',
    options: ['O tigre', 'O elefante', 'O leão', 'O urso'],
    explanation: 'Os leões costumam ser chamados de reis da selva.',
  },
  'clq-easy-05': {
    text: 'Qual parte do computador é conhecida como o "cérebro"?',
    options: ['A CPU', 'O monitor', 'O mouse', 'O teclado'],
    explanation: 'A CPU processa as instruções que fazem o computador funcionar.',
  },
  'clq-easy-06': {
    text: 'No Roblox, o que você pode fazer além de jogar?',
    options: [
      'Criar seus próprios jogos',
      'Pilotar aviões de verdade',
      'Imprimir dinheiro',
      'Cozinhar comida de verdade',
    ],
    explanation: 'O Roblox Studio permite criar e publicar seus próprios jogos.',
  },
  'clq-easy-07': {
    text: "Em 'Spy x Family', qual poder a Anya tem?",
    options: ['Superforça', 'Ler mentes', 'Invisibilidade', 'Viagem no tempo'],
    explanation: 'A Anya consegue ler os pensamentos das outras pessoas.',
  },
  'clq-easy-08': {
    text: "Em 'Star Wars', qual é o nome do pequeno Mestre Jedi verde?",
    options: ['Chewbacca', 'Han Solo', 'R2-D2', 'Yoda'],
    explanation: 'Yoda é o sábio Mestre Jedi verde.',
  },
  'clq-easy-09': {
    text: 'Qual destes animais é um mamífero?',
    options: ['Golfinho', 'Tubarão', 'Sapo', 'Cobra'],
    explanation: 'Os golfinhos respiram ar e alimentam os filhotes com leite.',
  },
  'clq-easy-10': {
    text: 'Para que serve o Wi-Fi?',
    options: [
      'Cozinhar comida',
      'Conectar à internet sem cabos',
      'Imprimir fotos',
      'Limpar a tela',
    ],
    explanation: 'O Wi-Fi conecta aparelhos à internet sem fio.',
  },
  'clq-easy-11': {
    text: 'Em Brawl Stars, que tipo de jogo é?',
    options: ['Um jogo de corrida', 'Um jogo de batalha em equipe', 'Um jogo de culinária', 'Um jogo de fazenda'],
    explanation: 'Brawl Stars é um jogo de batalha em equipe rápido.',
  },
  'clq-easy-12': {
    text: "Em 'Naruto', o que Naruto quer se tornar?",
    options: ['Um pirata', 'Um chef', 'Um professor', 'Hokage'],
    explanation: 'Naruto sonha em se tornar Hokage, o líder de sua vila.',
  },
  'clq-easy-13': {
    text: "Em 'Harry Potter', que animal é a Hedwig?",
    options: ['Um gato', 'Um sapo', 'Uma coruja', 'Um rato'],
    explanation: 'Hedwig é a coruja branca do Harry.',
  },
  'clq-easy-14': {
    text: 'Do que os pandas se alimentam principalmente?',
    options: ['Bambu', 'Peixe', 'Carne', 'Insetos'],
    explanation: 'Os pandas-gigantes passam quase o dia todo comendo bambu.',
  },
  'clq-easy-15': {
    text: 'Qual programa é usado para escrever e formatar documentos de texto?',
    options: ['Microsoft Excel', 'Microsoft Paint', 'Microsoft Word', 'Spotify'],
    explanation: 'O Word serve para escrever e formatar textos.',
  },
  'clq-easy-16': {
    text: 'No Free Fire, de onde os jogadores saltam no começo da partida?',
    options: ['Um trem', 'Um barco', 'Um avião', 'Um carro'],
    explanation: 'Os jogadores saltam de um avião para a ilha do battle royale.',
  },
  'clq-easy-17': {
    text: "Em 'One Piece', o que Luffy está procurando?",
    options: ['Uma espada mágica', 'Uma cidade perdida', 'O tesouro One Piece', 'Uma coroa de ouro'],
    explanation: 'Luffy navega os mares para encontrar o lendário One Piece.',
  },
  'clq-easy-18': {
    text: 'Nos filmes da Marvel, quem é o herói bilionário de armadura metálica?',
    options: ['Thor', 'Hulk', 'Homem de Ferro', 'Capitão América'],
    explanation: 'Tony Stark constrói uma armadura tecnológica e se torna o Homem de Ferro.',
  },
  'clq-easy-19': {
    text: 'Por que os ursos-polares estão em perigo com o derretimento do gelo?',
    options: [
      'Eles não sabem nadar',
      'Eles precisam do gelo para caçar focas',
      'Eles têm medo de água',
      'Eles só comem plantas',
    ],
    explanation: 'Os ursos-polares caçam focas no gelo marinho; com menos gelo, há menos comida.',
  },
  'clq-easy-20': {
    text: "O que o atalho 'Ctrl + Z' faz?",
    options: ['Salva o arquivo', 'Fecha o programa', 'Imprime a página', 'Desfaz a última ação'],
    explanation: 'Ctrl + Z desfaz a sua última alteração.',
  },

  // ---------- Medium ----------
  'clq-medium-01': {
    text: 'No Minecraft, o que você precisa para fazer uma mesa de trabalho?',
    options: ['Três blocos de pedra', 'Dois lingotes de ferro', 'Quatro tábuas de madeira', 'Um diamante'],
    explanation: 'Quatro tábuas de madeira formam uma mesa de trabalho.',
  },
  'clq-medium-02': {
    text: "Em 'My Hero Academia', qual é o nome de herói de Izuku Midoriya?",
    options: ['Deku', 'Bakugo', 'All Might', 'Todoroki'],
    explanation: 'Izuku escolhe o nome de herói Deku.',
  },
  'clq-medium-03': {
    text: "Em 'Breaking Bad', qual apelido Walter White usa?",
    options: ['Scarface', 'O Químico', 'Heisenberg', 'Sr. White'],
    explanation: 'Walter usa o nome Heisenberg.',
  },
  'clq-medium-04': {
    text: 'Qual é o animal mais rápido em terra?',
    options: ['O leão', 'O guepardo', 'O cavalo', 'O galgo'],
    explanation: 'Os guepardos correm mais rápido que qualquer outro animal terrestre.',
  },
  'clq-medium-05': {
    text: 'No Excel, para que servem linhas e colunas?',
    options: ['Editar vídeos', 'Desenhar modelos 3D', 'Enviar e-mails', 'Organizar dados em células'],
    explanation: 'O Excel organiza números e textos em células.',
  },
  'clq-medium-06': {
    text: 'Em Valorant, que tipo de jogo é?',
    options: ['Um jogo de quebra-cabeça', 'Um jogo de futebol', 'Um jogo de tiro tático', 'Um jogo de música'],
    explanation: 'Valorant é um jogo de tiro tático em primeira pessoa.',
  },
  'clq-medium-07': {
    text: "Em 'Fullmetal Alchemist', qual é a regra central da alquimia?",
    options: ['A troca equivalente', 'A regra dos três', 'A lei dourada', 'O poder absoluto'],
    explanation: 'A alquimia segue a troca equivalente: é preciso algo de valor igual.',
  },
  'clq-medium-08': {
    text: "Em 'O Senhor dos Anéis', quem forjou o Um Anel?",
    options: ['Gandalf', 'Sauron', 'Frodo', 'Elrond'],
    explanation: 'Sauron forjou o Um Anel na Montanha da Perdição.',
  },
  'clq-medium-09': {
    text: 'Qual destes animais é um réptil?',
    options: ['Sapo', 'Tartaruga', 'Golfinho', 'Morcego'],
    explanation: 'As tartarugas são répteis; os sapos são anfíbios.',
  },
  'clq-medium-10': {
    text: 'No PowerPoint, qual tecla inicia a apresentação de slides?',
    options: ['F1', 'F5', 'F9', 'F12'],
    explanation: 'A tecla F5 inicia a apresentação do começo.',
  },
  'clq-medium-11': {
    text: 'Em League of Legends, qual é o objetivo principal de uma partida?',
    options: [
      'Coletar o máximo de moedas',
      'Destruir o Nexus inimigo',
      'Chegar primeiro na linha de chegada',
      'Construir a torre mais alta',
    ],
    explanation: 'As equipes tentam destruir o Nexus inimigo para vencer.',
  },
  'clq-medium-12': {
    text: "Em 'Naruto', qual clã é famoso pelo Sharingan?",
    options: ['Hyuga', 'Nara', 'Uchiha', 'Inuzuka'],
    explanation: 'O Sharingan é a habilidade especial do clã Uchiha.',
  },
  'clq-medium-13': {
    text: "Em 'Duna', o que os trajes destiladores ajudam as pessoas a fazer?",
    options: ['Voar', 'Economizar água', "Respirar debaixo d'água", 'Ver no escuro'],
    explanation: 'Os trajes reciclam a água do corpo no deserto.',
  },
  'clq-medium-14': {
    text: 'Qual é o maior animal da Terra?',
    options: ['O elefante', 'A baleia-azul', 'A girafa', 'O tubarão-branco'],
    explanation: 'A baleia-azul é o maior animal vivo.',
  },
  'clq-medium-15': {
    text: 'O que um navegador de internet faz?',
    options: [
      'Permite visitar sites',
      'Limpa o teclado',
      'Carrega a bateria',
      'Resfria o computador',
    ],
    explanation: 'Navegadores como o Chrome abrem e mostram páginas da web.',
  },
  'clq-medium-16': {
    text: 'No Roblox, qual linguagem o Roblox Studio usa para scripts?',
    options: ['Python', 'Lua', 'Java', 'C++'],
    explanation: 'O Roblox Studio usa Lua em seus scripts.',
  },
  'clq-medium-17': {
    text: "Em 'Attack on Titan', como são chamados os humanoides gigantes?",
    options: ['Gigantes', 'Colossos', 'Ogres', 'Titãs'],
    explanation: 'As criaturas enormes da série são chamadas de Titãs.',
  },
  'clq-medium-18': {
    text: 'Nos filmes da Marvel, o que Thanos coleciona?',
    options: ['As seis Joias do Infinito', 'As sete espadas', 'As quatro coroas', 'As três chaves'],
    explanation: 'Thanos quer reunir todas as seis Joias do Infinito.',
  },
  'clq-medium-19': {
    text: 'Qual destes é uma grande ameaça para as tartarugas marinhas?',
    options: ['Sacolas plásticas no oceano', 'Muita chuva', 'Areia fria', 'Música alta'],
    explanation: 'As tartarugas confundem sacolas plásticas com comida, como águas-vivas.',
  },
  'clq-medium-20': {
    text: 'O que é hardware?',
    options: [
      'As partes físicas que você pode tocar',
      'Apenas os programas',
      'Um tipo de internet',
      'Um tipo de senha',
    ],
    explanation: 'Hardware é o equipamento físico, como o teclado e a tela.',
  },

  // ---------- Hard ----------
  'clq-hard-01': {
    text: 'No Minecraft, qual material você precisa para minerar minério de diamante?',
    options: ['Uma picareta de ferro', 'Uma picareta de pedra', 'Uma picareta de ouro', 'Uma picareta de madeira'],
    explanation: 'O minério de diamante precisa de pelo menos uma picareta de ferro.',
  },
  'clq-hard-02': {
    text: "Em 'Death Note', qual é o apelido de Light Yagami?",
    options: ['L', 'Near', 'Mello', 'Kira'],
    explanation: 'Light é conhecido como Kira, o misterioso assassino.',
  },
  'clq-hard-03': {
    text: "Em 'Matrix', qual é o nome verdadeiro de Neo?",
    options: ['John Smith', 'Thomas Anderson', 'Morpheus', 'Cypher'],
    explanation: 'O nome verdadeiro de Neo é Thomas Anderson.',
  },
  'clq-hard-04': {
    text: 'A vaquita, a menor toninha do mundo, vive em qual país?',
    options: ['Brasil', 'México', 'Japão', 'Austrália'],
    explanation: 'As vaquitas vivem apenas no norte do Golfo da Califórnia, no México.',
  },
  'clq-hard-05': {
    text: "O que significa 'CPU'?",
    options: [
      'Unidade de Energia do Computador',
      'Utilitário Central de Programas',
      'Unidade Central de Processamento',
      'Unidade Central de Impressão',
    ],
    explanation: 'CPU significa Unidade Central de Processamento.',
  },
  'clq-hard-06': {
    text: 'Em Brawl Stars, quem é o primeiro brawler que a maioria dos jogadores desbloqueia?',
    options: ['Colt', 'Spike', 'Shelly', 'Poco'],
    explanation: 'Shelly é a brawler inicial de Brawl Stars.',
  },
  'clq-hard-07': {
    text: "Em 'Hunter x Hunter', qual é o nome do sistema de poder?",
    options: ['Chakra', 'Ki', 'Reiatsu', 'Nen'],
    explanation: 'Os hunters usam o Nen, uma técnica para controlar a energia vital.',
  },
  'clq-hard-08': {
    text: "Em 'Star Wars', o que é a Ordem 66?",
    options: [
      'Um tratado de paz',
      'Um tipo de nave espacial',
      'Um comando para se voltar contra os Jedi',
      'Um nome de planeta',
    ],
    explanation: 'A Ordem 66 mandou os clones atacarem os Jedi.',
  },
  'clq-hard-09': {
    text: 'Por que o dodô foi extinto?',
    options: [
      'Um meteoro gigante',
      'A caça e os animais invasores trazidos por marinheiros',
      'Uma longa seca',
      'Predadores demais na Antártida',
    ],
    explanation: 'Marinheiros e os animais que trouxeram eliminaram o dodô na ilha Maurício.',
  },
  'clq-hard-10': {
    text: 'No Word, qual atalho copia um texto?',
    options: ['Ctrl + V', 'Ctrl + X', 'Ctrl + C', 'Ctrl + P'],
    explanation: 'Ctrl + C copia o texto selecionado.',
  },
  'clq-hard-11': {
    text: "Em 'Blox Fruits', os jogadores escolhem entre quais dois lados?",
    options: ['Ninjas e Samurais', 'Cavaleiros e Magos', 'Aliens e Robôs', 'Piratas e Marines'],
    explanation: 'Os jogadores escolhem o lado dos Piratas ou dos Marines.',
  },
  'clq-hard-12': {
    text: "Em 'Jujutsu Kaisen', quem usa a expansão de domínio 'Santuário Malevolente'?",
    options: ['Satoru Gojo', 'Ryomen Sukuna', 'Yuji Itadori', 'Megumi Fushiguro'],
    explanation: 'O domínio de Sukuna é o Santuário Malevolente.',
  },
  'clq-hard-13': {
    text: "Em 'Harry Potter', quem traiu James e Lily Potter?",
    options: ['Sirius Black', 'Peter Pettigrew', 'Remus Lupin', 'Severus Snape'],
    explanation: 'Peter Pettigrew era o guardião do segredo e os traiu.',
  },
  'clq-hard-14': {
    text: 'O leopardo-de-amur é conhecido por ser um dos...',
    options: [
      'Felinos mais comuns do mundo',
      'Felinos de grande porte mais raros do mundo',
      'Aves mais rápidas do mundo',
      'Peixes mais gigantes do mundo',
    ],
    explanation: 'O leopardo-de-amur é um dos grandes felinos mais raros do mundo.',
  },
  'clq-hard-15': {
    text: 'Qual é a principal função de um sistema operacional?',
    options: [
      'Imprimir documentos',
      'Gerenciar o hardware e executar programas',
      'Criar sites',
      'Armazenar arquivos apenas na nuvem',
    ],
    explanation: 'O sistema operacional gerencia o hardware e os programas.',
  },
  'clq-hard-16': {
    text: 'No Minecraft, o que você usa para domesticar um lobo?',
    options: ['Trigo', 'Sementes', 'Peixe', 'Ossos'],
    explanation: 'Os lobos viram cães quando você os alimenta com ossos.',
  },
  'clq-hard-17': {
    text: "Em 'Demon Slayer', qual é o primeiro estilo de respiração do Tanjiro?",
    options: ['Respiração da Chama', 'Respiração do Trovão', 'Respiração do Vento', 'Respiração da Água'],
    explanation: 'Tanjiro aprende primeiro a Respiração da Água.',
  },
  'clq-hard-18': {
    text: "Em 'Interestelar', por que o tempo passa mais devagar no planeta de Miller?",
    options: [
      'Ele não tem luz do sol',
      'Ele gira muito rápido',
      'Ele fica perto de um enorme buraco negro',
      'Ele fica longe da Terra',
    ],
    explanation: 'O planeta fica perto do buraco negro Gargantua, que curva o tempo.',
  },
  'clq-hard-19': {
    text: 'Qual afirmação sobre os orangotangos é verdadeira?',
    options: [
      'Eles vivem apenas na África',
      'Eles são aves',
      'Eles não conseguem escalar',
      'Eles vivem apenas na Ásia',
    ],
    explanation: 'Os orangotangos vivem nas florestas tropicais da Ásia, principalmente em Bornéu e Sumatra.',
  },
  'clq-hard-20': {
    text: 'O que é um vírus de computador?',
    options: [
      'Um pedaço de hardware',
      'Um tipo de tela',
      'Uma atualização segura',
      'Um programa prejudicial que se espalha',
    ],
    explanation: 'Um vírus é um software prejudicial que pode se espalhar e danificar computadores.',
  },
};
