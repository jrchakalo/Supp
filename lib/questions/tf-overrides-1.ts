import type { ClassicTfSeed } from './types';

export type TfOverride = Pick<
  ClassicTfSeed,
  'pt' | 'en' | 'explanationPt' | 'explanationEn'
>;

/**
 * True/false rebalancing — part 1.
 *
 * These replace the original true statement with a false version of the same
 * fact, keeping the theme and the question count while removing the "guess
 * true" bias from the deck.
 */
export const OVERRIDES_1: Record<string, TfOverride> = {
  // ---------- Games ----------
  'classic-games-easy-01': {
    pt: 'No Minecraft, você precisa de uma pá para minerar blocos de pedra.',
    en: 'In Minecraft, you need a shovel to mine stone blocks.',
    explanationPt: 'A pá serve para terra e areia; pedra precisa de picareta.',
    explanationEn: 'A shovel is for dirt and sand; stone needs a pickaxe.',
  },
  'classic-games-easy-02': {
    pt: 'No Roblox, você só pode jogar; não é possível criar seus próprios jogos.',
    en: 'In Roblox, you can only play; you cannot create your own games.',
    explanationPt: 'O Roblox Studio permite criar e publicar seus próprios jogos.',
    explanationEn: 'Roblox Studio lets you build and publish your own games.',
  },
  'classic-games-medium-01': {
    pt: 'No Minecraft, são precisos seis blocos de pedra para fazer uma mesa de criação.',
    en: 'In Minecraft, you need six stone blocks to make a crafting table.',
    explanationPt: 'A mesa de criação é feita com quatro tábuas de madeira.',
    explanationEn: 'A crafting table is made with four wooden planks.',
  },
  'classic-games-medium-02': {
    pt: 'O Roblox Studio usa a linguagem Python para criar scripts.',
    en: 'Roblox Studio uses the Python language to create scripts.',
    explanationPt: 'A linguagem usada é Lua.',
    explanationEn: 'The language used is Lua.',
  },
  'classic-games-medium-03': {
    pt: 'Em Free Fire, os jogadores começam a partida dentro de um trem.',
    en: 'In Free Fire, players start the match inside a train.',
    explanationPt: 'Os jogadores saltam de um avião no começo da partida.',
    explanationEn: 'Players jump from a plane at the start of the match.',
  },
  'classic-games-hard-01': {
    pt: 'No Minecraft, uma picareta de madeira já basta para minerar minério de diamante.',
    en: 'In Minecraft, a wooden pickaxe is enough to mine diamond ore.',
    explanationPt: 'É preciso pelo menos uma picareta de ferro.',
    explanationEn: 'You need at least an iron pickaxe.',
  },
  'classic-games-hard-02': {
    pt: 'No Minecraft, você domestica um lobo oferecendo trigo.',
    en: 'In Minecraft, you tame a wolf by giving it wheat.',
    explanationPt: 'Lobos são domesticados com ossos; trigo atrai outros animais.',
    explanationEn: 'Wolves are tamed with bones; wheat attracts other animals.',
  },
  'classic-games-hard-03': {
    pt: 'Em Blox Fruits, os jogadores escolhem entre os lados Ninja e Samurai.',
    en: 'In Blox Fruits, players choose between the Ninja and Samurai sides.',
    explanationPt: 'Os lados são Pirata e Marinha.',
    explanationEn: 'The sides are Pirate and Marine.',
  },
  'classic-games-hard-04': {
    pt: 'Em League of Legends, o objetivo principal é coletar o maior número de moedas.',
    en: 'In League of Legends, the main goal is to collect the most coins.',
    explanationPt: 'O objetivo é destruir o Nexus inimigo.',
    explanationEn: 'The goal is to destroy the enemy Nexus.',
  },

  // ---------- Anime ----------
  'classic-anime-easy-01': {
    pt: 'Vegeta é o personagem principal do anime Dragon Ball.',
    en: 'Vegeta is the main character of the anime Dragon Ball.',
    explanationPt: 'Goku é o protagonista; Vegeta é seu rival e aliado.',
    explanationEn: 'Goku is the protagonist; Vegeta is his rival and ally.',
  },
  'classic-anime-easy-02': {
    pt: 'Em Naruto, o protagonista quer se tornar o Rei dos Piratas.',
    en: 'In Naruto, the protagonist wants to become the Pirate King.',
    explanationPt: 'Esse é o sonho do Luffy, de One Piece; Naruto quer ser Hokage.',
    explanationEn: 'That is Luffy\'s dream in One Piece; Naruto wants to be Hokage.',
  },
  'classic-anime-easy-04': {
    pt: 'Em Pokémon, o primeiro parceiro do Ash é o Charmander.',
    en: 'In Pokémon, Ash\'s first partner is Charmander.',
    explanationPt: 'O primeiro parceiro do Ash é o Pikachu.',
    explanationEn: 'Ash\'s first partner is Pikachu.',
  },
  'classic-anime-medium-01': {
    pt: 'Em Naruto, o Sharingan é uma habilidade ligada ao clã Hyuga.',
    en: 'In Naruto, the Sharingan is an ability linked to the Hyuga clan.',
    explanationPt: 'O Sharingan é do clã Uchiha; o Hyuga tem o Byakugan.',
    explanationEn: 'The Sharingan belongs to the Uchiha; the Hyuga have the Byakugan.',
  },
  'classic-anime-medium-02': {
    pt: 'Em My Hero Academia, o nome de herói de Izuku Midoriya é All Might.',
    en: 'In My Hero Academia, Izuku Midoriya\'s hero name is All Might.',
    explanationPt: 'All Might é o mentor; o nome de herói do Izuku é Deku.',
    explanationEn: 'All Might is the mentor; Izuku\'s hero name is Deku.',
  },
  'classic-anime-medium-03': {
    pt: 'Em Demon Slayer, Tanjiro aprende primeiro a Respiração do Trovão.',
    en: 'In Demon Slayer, Tanjiro first learns Thunder Breathing.',
    explanationPt: 'Ele aprende primeiro a Respiração da Água.',
    explanationEn: 'He first learns Water Breathing.',
  },
  'classic-anime-medium-04': {
    pt: 'Em Naruto, o protagonista carrega dentro de si um dragão de três cabeças.',
    en: 'In Naruto, the protagonist carries a three-headed dragon inside him.',
    explanationPt: 'Ele carrega a raposa de nove caudas, Kurama.',
    explanationEn: 'He carries Kurama, the nine-tailed fox.',
  },
  'classic-anime-hard-01': {
    pt: 'Em Hunter x Hunter, o sistema de poder se chama Chakra.',
    en: 'In Hunter x Hunter, the power system is called Chakra.',
    explanationPt: 'Chakra é de Naruto; em Hunter x Hunter o sistema é o Nen.',
    explanationEn: 'Chakra is from Naruto; Hunter x Hunter uses Nen.',
  },
  'classic-anime-hard-02': {
    pt: 'Em Fullmetal Alchemist, a alquimia não segue nenhuma regra de troca.',
    en: 'In Fullmetal Alchemist, alchemy does not follow any exchange rule.',
    explanationPt: 'A troca equivalente é o princípio central da alquimia.',
    explanationEn: 'Equivalent exchange is the central principle of alchemy.',
  },
  'classic-anime-hard-03': {
    pt: 'Em One Piece, é o Zoro quem consegue ler os Poneglyphs.',
    en: 'In One Piece, Zoro is the one who can read the Poneglyphs.',
    explanationPt: 'Quem lê os Poneglyphs é a Robin, a arqueóloga.',
    explanationEn: 'Robin, the archaeologist, is the one who reads the Poneglyphs.',
  },
  'classic-anime-hard-05': {
    pt: 'Na história de Spy x Family, Anya foi adotada por Yuri.',
    en: 'In the Spy x Family story, Anya was adopted by Yuri.',
    explanationPt: 'Loid adotou Anya; Yuri é o irmão da Yor.',
    explanationEn: 'Loid adopted Anya; Yuri is Yor\'s brother.',
  },
  'classic-anime-hard-06': {
    pt: 'Em Dragon Ball, Goku é um Namekuseijin enviado à Terra quando bebê.',
    en: 'In Dragon Ball, Goku is a Namekian sent to Earth as a baby.',
    explanationPt: 'Goku é um Saiyajin; os Namekuseins vêm de Namek.',
    explanationEn: 'Goku is a Saiyan; Namekians come from Namek.',
  },

  // ---------- Pop culture ----------
  'classic-pop-culture-easy-01': {
    pt: 'Em Harry Potter, a coruja de estimação do Harry se chama Crookshanks.',
    en: 'In Harry Potter, Harry\'s pet owl is named Crookshanks.',
    explanationPt: 'Crookshanks é o gato do Hermione; a coruja é Hedwig.',
    explanationEn: 'Crookshanks is Hermione\'s cat; the owl is Hedwig.',
  },
  'classic-pop-culture-easy-02': {
    pt: 'O Homem de Ferro é um super-herói que usa um anel mágico para voar.',
    en: 'Iron Man is a superhero who uses a magic ring to fly.',
    explanationPt: 'Ele usa uma armadura tecnológica.',
    explanationEn: 'He uses a high-tech armor.',
  },
  'classic-pop-culture-easy-03': {
    pt: 'Em Frozen, a Anna tem o poder de controlar o fogo.',
    en: 'In Frozen, Anna has the power to control fire.',
    explanationPt: 'A Elsa controla gelo e neve; a Anna não tem poderes.',
    explanationEn: 'Elsa controls ice and snow; Anna has no powers.',
  },
  'classic-pop-culture-easy-04': {
    pt: 'Em Toy Story, Woody é um robô espacial.',
    en: 'In Toy Story, Woody is a space robot.',
    explanationPt: 'Woody é um boneco caubói; Buzz é o patrulheiro espacial.',
    explanationEn: 'Woody is a cowboy doll; Buzz is the space ranger.',
  },
  'classic-pop-culture-medium-01': {
    pt: 'Em O Rei Leão, Simba é filho de Scar.',
    en: 'In The Lion King, Simba is Scar\'s son.',
    explanationPt: 'Simba é filho de Mufasa; Scar é o tio vilão.',
    explanationEn: 'Simba is Mufasa\'s son; Scar is the villainous uncle.',
  },
  'classic-pop-culture-medium-02': {
    pt: 'Nos filmes da Marvel, Thanos usa as sete Joias do Infinito.',
    en: 'In the Marvel movies, Thanos uses the seven Infinity Stones.',
    explanationPt: 'São seis Joias do Infinito.',
    explanationEn: 'There are six Infinity Stones.',
  },
  'classic-pop-culture-medium-03': {
    pt: 'Em Harry Potter, os alunos pegam o trem para Hogwarts na plataforma 13.',
    en: 'In Harry Potter, students take the train to Hogwarts from platform 13.',
    explanationPt: 'A plataforma é a 9¾.',
    explanationEn: 'The platform is 9¾.',
  },
  'classic-pop-culture-medium-04': {
    pt: 'Em Jurassic Park, os dinossauros são criados a partir de metal.',
    en: 'In Jurassic Park, the dinosaurs are created from metal.',
    explanationPt: 'Eles são criados a partir de DNA.',
    explanationEn: 'They are created from DNA.',
  },
  'classic-pop-culture-hard-01': {
    pt: 'Em Star Wars, a Ordem 66 é um tratado de paz entre Jedi e clones.',
    en: 'In Star Wars, Order 66 is a peace treaty between Jedi and clones.',
    explanationPt: 'É o comando que faz os clones atacarem os Jedi.',
    explanationEn: 'It is the command that makes clones attack the Jedi.',
  },
  'classic-pop-culture-hard-02': {
    pt: 'Em O Senhor dos Anéis, Gandalf foi quem forjou o Um Anel.',
    en: 'In The Lord of the Rings, Gandalf forged the One Ring.',
    explanationPt: 'Foi Sauron, na Montanha da Perdição.',
    explanationEn: 'Sauron forged it in Mount Doom.',
  },
  'classic-pop-culture-hard-03': {
    pt: 'Em Harry Potter, Sirius Black traiu os pais de Harry.',
    en: 'In Harry Potter, Sirius Black betrayed Harry\'s parents.',
    explanationPt: 'Quem traiu foi Pedro Pettigrew; Sirius foi incriminado.',
    explanationEn: 'Peter Pettigrew betrayed them; Sirius was framed.',
  },
  'classic-pop-culture-hard-04': {
    pt: 'Em Matrix, a pílula azul mostra a Neo o mundo real.',
    en: 'In The Matrix, the blue pill shows Neo the real world.',
    explanationPt: 'A pílula vermelha mostra o mundo real; a azul mantém a ilusão.',
    explanationEn: 'The red pill shows the real world; the blue pill keeps the illusion.',
  },
};
