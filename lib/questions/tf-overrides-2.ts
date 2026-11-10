import type { TfOverride } from './tf-overrides-1';

/** True/false rebalancing — part 2: technology, safety, science and nature. */
export const OVERRIDES_2: Record<string, TfOverride> = {
  // ---------- Technology ----------
  'classic-tech-easy-01': {
    pt: 'O mouse é usado para digitar letras e números.',
    en: 'The mouse is used to type letters and numbers.',
    explanationPt: 'Quem digita é o teclado; o mouse move o cursor e clica.',
    explanationEn: 'The keyboard types; the mouse moves the cursor and clicks.',
  },
  'classic-tech-easy-02': {
    pt: 'O teclado serve para mostrar imagens e vídeos.',
    en: 'The keyboard is used to show images and videos.',
    explanationPt: 'Quem mostra imagens é o monitor; o teclado serve para digitar.',
    explanationEn: 'The monitor shows images; the keyboard is for typing.',
  },
  'classic-tech-medium-01': {
    pt: 'O Microsoft Word é usado para editar fotos e vídeos.',
    en: 'Microsoft Word is used to edit photos and videos.',
    explanationPt: 'Word é para textos; fotos e vídeos usam outros programas.',
    explanationEn: 'Word is for text; photos and videos use other programs.',
  },
  'classic-tech-medium-02': {
    pt: 'No PowerPoint, só é possível criar planilhas de números.',
    en: 'In PowerPoint, you can only create number spreadsheets.',
    explanationPt: 'PowerPoint cria apresentações; planilhas são do Excel.',
    explanationEn: 'PowerPoint makes presentations; spreadsheets are Excel.',
  },
  'classic-tech-medium-03': {
    pt: 'O Excel organiza informações apenas em parágrafos de texto.',
    en: 'Excel organizes information only in text paragraphs.',
    explanationPt: 'O Excel usa linhas, colunas e células.',
    explanationEn: 'Excel uses rows, columns and cells.',
  },
  'classic-tech-hard-01': {
    pt: 'CPU significa Computer Power Unit.',
    en: 'CPU stands for Computer Power Unit.',
    explanationPt: 'CPU significa Central Processing Unit.',
    explanationEn: 'CPU means Central Processing Unit.',
  },
  'classic-tech-hard-02': {
    pt: 'Hardware é a parte do computador que você não consegue tocar.',
    en: 'Hardware is the part of the computer you cannot touch.',
    explanationPt: 'Hardware é físico; software é que não se toca.',
    explanationEn: 'Hardware is physical; software is what you cannot touch.',
  },
  'classic-tech-hard-03': {
    pt: 'Software é a parte física do computador.',
    en: 'Software is the physical part of the computer.',
    explanationPt: 'Software são programas; hardware é a parte física.',
    explanationEn: 'Software is programs; hardware is the physical part.',
  },
  'classic-tech-hard-04': {
    pt: 'A memória RAM guarda arquivos permanentemente, mesmo com o computador desligado.',
    en: 'RAM stores files permanently, even when the computer is off.',
    explanationPt: 'A RAM é temporária; ao desligar, o conteúdo se perde.',
    explanationEn: 'RAM is temporary; its contents are lost when powered off.',
  },

  // ---------- Digital safety ----------
  'classic-digital-safety-easy-01': {
    pt: 'Você deve compartilhar sua senha com os amigos mais próximos.',
    en: 'You should share your password with your closest friends.',
    explanationPt: 'A senha é pessoal; compartilhar coloca a conta em risco.',
    explanationEn: 'A password is personal; sharing it puts your account at risk.',
  },
  'classic-digital-safety-easy-02': {
    pt: 'Uma senha forte deve ter apenas números fáceis de lembrar.',
    en: 'A strong password should only have easy-to-remember numbers.',
    explanationPt: 'Uma senha forte mistura letras, números e símbolos.',
    explanationEn: 'A strong password mixes letters, numbers and symbols.',
  },
  'classic-digital-safety-hard-01': {
    pt: 'O código de verificação em duas etapas pode ser compartilhado com quem pedir.',
    en: 'The two-step verification code can be shared with anyone who asks.',
    explanationPt: 'Nunca compartilhe; golpistas pedem justamente esse código.',
    explanationEn: 'Never share it; scammers ask for exactly that code.',
  },
  'classic-digital-safety-hard-02': {
    pt: 'O cadeado e o "https" indicam que o site é sempre honesto.',
    en: 'The padlock and "https" mean the site is always honest.',
    explanationPt: 'Indica conexão criptografada; não garante que o site seja honesto.',
    explanationEn: 'It means an encrypted connection; it does not prove the site is honest.',
  },
  'classic-digital-safety-hard-03': {
    pt: 'Antes de compartilhar uma notícia, não é preciso conferir a fonte.',
    en: 'Before sharing news, you do not need to check the source.',
    explanationPt: 'Conferir a fonte evita espalhar notícias falsas.',
    explanationEn: 'Checking the source helps avoid spreading fake news.',
  },

  // ---------- Science ----------
  'classic-science-easy-01': {
    pt: 'O Sol gira ao redor da Terra.',
    en: 'The Sun orbits Earth.',
    explanationPt: 'É a Terra que orbita o Sol.',
    explanationEn: 'Earth orbits the Sun.',
  },
  'classic-science-easy-02': {
    pt: 'O Sol é um planeta.',
    en: 'The Sun is a planet.',
    explanationPt: 'O Sol é uma estrela.',
    explanationEn: 'The Sun is a star.',
  },
  'classic-science-medium-01': {
    pt: 'Na fotossíntese, as plantas usam apenas areia para produzir alimento.',
    en: 'In photosynthesis, plants use only sand to make food.',
    explanationPt: 'Elas usam gás carbônico, água e luz.',
    explanationEn: 'They use carbon dioxide, water and light.',
  },
  'classic-science-medium-02': {
    pt: 'Saturno é o maior planeta do Sistema Solar.',
    en: 'Saturn is the largest planet in the Solar System.',
    explanationPt: 'Júpiter é o maior planeta.',
    explanationEn: 'Jupiter is the largest planet.',
  },
  'classic-science-medium-03': {
    pt: 'Ao nível do mar, a água ferve a 50 graus Celsius.',
    en: 'At sea level, water boils at 50 degrees Celsius.',
    explanationPt: 'Ferve a 100 graus Celsius.',
    explanationEn: 'It boils at 100 degrees Celsius.',
  },
  'classic-science-hard-01': {
    pt: 'O DNA não tem relação com as informações genéticas.',
    en: 'DNA has nothing to do with genetic information.',
    explanationPt: 'O DNA carrega as informações genéticas.',
    explanationEn: 'DNA carries genetic information.',
  },
  'classic-science-hard-02': {
    pt: 'A luz viaja a cerca de 300 quilômetros por segundo no vácuo.',
    en: 'Light travels at about 300 kilometers per second in a vacuum.',
    explanationPt: 'São cerca de 300 mil quilômetros por segundo.',
    explanationEn: 'It is about 300,000 kilometers per second.',
  },
  'classic-science-hard-03': {
    pt: 'Os átomos são formados apenas por elétrons.',
    en: 'Atoms are made only of electrons.',
    explanationPt: 'Também têm prótons e nêutrons no núcleo.',
    explanationEn: 'They also have protons and neutrons in the nucleus.',
  },
  'classic-science-hard-04': {
    pt: 'A gravidade de um buraco negro é fraca e a luz escapa facilmente.',
    en: 'A black hole\'s gravity is weak and light escapes easily.',
    explanationPt: 'É tão forte que nem a luz consegue escapar.',
    explanationEn: 'It is so strong that even light cannot escape.',
  },

  // ---------- Nature ----------
  'classic-nature-easy-01': {
    pt: 'Os peixes respiram por pulmões, como os humanos.',
    en: 'Fish breathe through lungs, like humans.',
    explanationPt: 'Eles usam brânquias.',
    explanationEn: 'They use gills.',
  },
  'classic-nature-easy-02': {
    pt: 'Os cachorros são répteis.',
    en: 'Dogs are reptiles.',
    explanationPt: 'Cachorros são mamíferos.',
    explanationEn: 'Dogs are mammals.',
  },
  'classic-nature-medium-01': {
    pt: 'O elefante é o maior animal do planeta.',
    en: 'The elephant is the largest animal on the planet.',
    explanationPt: 'A baleia-azul é maior.',
    explanationEn: 'The blue whale is larger.',
  },
  'classic-nature-medium-02': {
    pt: 'O cavalo é o animal terrestre mais rápido.',
    en: 'The horse is the fastest land animal.',
    explanationPt: 'O guepardo é o mais rápido.',
    explanationEn: 'The cheetah is the fastest.',
  },
  'classic-nature-medium-03': {
    pt: 'Os morcegos são aves.',
    en: 'Bats are birds.',
    explanationPt: 'Morcegos são mamíferos, apesar de voarem.',
    explanationEn: 'Bats are mammals, even though they fly.',
  },
  'classic-nature-hard-01': {
    pt: 'Os golfinhos dormem com o cérebro inteiro desligado.',
    en: 'Dolphins sleep with their entire brain turned off.',
    explanationPt: 'Metade do cérebro fica acordada.',
    explanationEn: 'Half of the brain stays awake.',
  },
  'classic-nature-hard-02': {
    pt: 'O bambu é uma árvore de madeira dura.',
    en: 'Bamboo is a hardwood tree.',
    explanationPt: 'O bambu é uma grama.',
    explanationEn: 'Bamboo is a grass.',
  },
  'classic-nature-hard-03': {
    pt: 'Os caracóis não têm dentes.',
    en: 'Snails have no teeth.',
    explanationPt: 'Eles têm milhares de dentinhos na rádula.',
    explanationEn: 'They have thousands of tiny teeth on the radula.',
  },
  'classic-nature-hard-04': {
    pt: 'O esqueleto dos tubarões é feito de ossos duros.',
    en: 'Shark skeletons are made of hard bones.',
    explanationPt: 'É feito de cartilagem.',
    explanationEn: 'It is made of cartilage.',
  },
};
