<div align="center">
   <p><img src="public/supp-logo.png" alt="Supp logo" width="320" /></p>
   <h1>Supp</h1>
   <p>
      <img src="https://img.shields.io/badge/Next.js-15-black" alt="Next.js" />
      <img src="https://img.shields.io/badge/React-19-61dafb" alt="React" />
      <img src="https://img.shields.io/badge/TypeScript-5-3178c6" alt="TypeScript" />
      <img src="https://img.shields.io/badge/TailwindCSS-4-38bdf8" alt="TailwindCSS" />
   </p>
   <p><strong>Classroom games, competition and live rooms — in Portuguese and English.</strong></p>
</div>

## Sobre

**Supp** é uma plataforma de dinâmicas para sala de aula. O D20 foi o ponto de partida, mas o projeto cresceu: hoje ele reúne cinco formas de jogar, baralhos temáticos, competição eliminatória, salas multiplayer com QR code, interface bilíngue e eventos sazonais.

- O **modo padrão** é o ponto de entrada: a tela inicial mostra os modos (D20, Roleta de temas, Competição, Passa ou Repassa e Ao vivo), o acesso à sala e o botão de iniciar. Cada modo abre sua própria tela de configuração.
- Os **eventos especiais** ficam em uma área separada, acessível pelo botão no topo. Halloween já está disponível; Natal e Páscoa estão preparados para as próximas temporadas. A área de eventos tem um atalho para voltar aos jogos padrão.
- A plataforma é **PT/EN**: a interface e o idioma das perguntas podem ser escolhidos de forma independente.
- O tema **claro/escuro** é uma preferência dos jogos padrão, com claro como padrão. Os eventos especiais mantêm a personalização visual do próprio evento.
- As salas ao vivo sincronizam o tema e o modo do host com os celulares dos alunos.

## Marca

- **Logo principal:** `public/supp-logo.png` (horizontal, usada no README e no topo da página inicial).
- **Ícone/favicon:** `public/supp-icon.png`, `app/icon.png` e `app/apple-icon.png`.
- **Variante de Halloween:** `public/supp-logo-halloween.png` e `public/supp-icon-halloween.png`, aplicadas automaticamente no modo de evento.
- **Comportamento:** o logo muda para a versão temática quando o modo Halloween está ativo, inclusive no favicon da aba.

## Modos de jogo

### D20 Roll

O professor rola um D20 de verdade e toca no número sorteado. O app revela uma pergunta de verdadeiro ou falso e mostra o feedback na hora.

- Tela de configuração própria: temas, dificuldade e idioma das perguntas.
- Grid de 1 a 20, com números que podem se repetir como em uma rolagem real.
- Rodadas de 20 perguntas, com pontuação, sequência e melhor sequência.
- Atalhos `T`/`F` (ou `V`/`F` em português), `Enter` para continuar e `Esc` para fechar.

### Roleta de temas

Uma roleta com os temas escolhidos pelo professor.

- Tela de configuração própria: temas, dificuldade e idioma das perguntas.
- A roleta anima o giro e sorteia um tema; em seguida abre uma pergunta de verdadeiro ou falso daquele tema.
- As perguntas já usadas na rodada não se repetem até o deck do tema acabar.
- Placar de acertos, número da rodada e botão de nova rodada.
- Ótima para warm-up: um giro, uma pergunta, a aula continua.

### Competição

Torneio eliminatório para a turma inteira.

- Tela de configuração própria: alunos, temas, nível da competição e idioma das perguntas.
- Cadastro de alunos por nome, incluindo colar a lista inteira separada por vírgulas ou quebras de linha.
- Ordem **em ordem** ou **aleatória** a cada fase.
- Uma pergunta por aluno por fase: quem acerta avança, quem erra sai.
- Morte súbita quando dois ou mais alunos chegam ao fim das fases.
- Escadas **Fácil**, **Médio**, **Difícil** e **Progressivo**, com 6 ou 9 fases.
- As configurações ficam salvas no navegador; a lista de alunos começa vazia em cada nova sessão.

### Passa ou Repassa

Quiz em equipes, no estilo passa ou repassa.

- Duas equipes com nomes editáveis.
- Meta de **5, 10 ou 15 pontos**.
- As equipes se alternam em perguntas de múltipla escolha, com 20 segundos por turno.
- Quem acerta marca 1 ponto; quem erra ou deixa o tempo acabar passa a pergunta para a outra equipe tentar o repasse.
- O repasse certo também vale 1 ponto.
- Funciona no modo padrão e no Halloween.

### Ao vivo (Live)

Sala multiplayer estilo quiz show, com o professor projetando a pergunta e os alunos respondendo no celular.

- **/host**: cria a sala, mostra código de 5 caracteres e QR code centralizado, controla temas (no modo padrão), baralho, idioma das perguntas, rodadas, tempo, avanço automático e placar. O modo do evento já vem da tela anterior; não há seletor de modo dentro da sala.
- **/join**: o aluno entra com código ou QR, escolhe um apelido e responde com quatro botões coloridos. O tema e o modo do host são sincronizados automaticamente, inclusive no Halloween.
- **Visual dos celulares:** o host escolhe entre **Pergunta + respostas** (texto completo, melhor para salas grandes) ou **Somente figuras** (apenas símbolos e cores).
- **Fechar sala:** encerra a partida e devolve os alunos à tela de entrada do `/join` na hora, sem recarregar a página.
- **Sem repetição:** o host guarda os IDs das perguntas já usadas em salas recentes e sorteia primeiro as que ainda não apareceram. A memória tem limite e pode ser limpa na configuração.
- **Tradução em tempo real:** no modo inglês, a versão em português entra na metade do tempo, no telão e nos celulares.
- Pontuação por velocidade: de 100 a 1.000 pontos conforme o tempo de resposta.
- O host é a autoridade: escolhe as perguntas, calcula a pontuação e emite cada evento.
- Fases `lobby → question → reveal → gameover`, com rejeição de respostas repetidas ou fora de fase.
- Funciona para o modo padrão e para o Halloween.

## Eventos especiais

### Halloween (disponível)

- 180 perguntas de verdadeiro ou falso (60 por dificuldade, 20 por tier).
- 180 perguntas de múltipla escolha para o Live.
- Temas de filmes, jogos, cultura pop e folclore brasileiro.
- Tema visual próprio, com lua, morcegos, estrelas, neblina e abóbora.
- Disponível em D20, Competição e Live.

### Natal e Páscoa (em breve)

Os cartões já estão reservados na área de eventos. A arquitetura de baralhos, temas e fases é reutilizável para as próximas temporadas.

## Idiomas e tema

- **Interface:** seletor PT/EN no topo da plataforma. Padrão: português.
- **Perguntas:** seletor PT/EN separado, na tela de configuração de cada modo e no host do Live. A plataforma pode estar em inglês com perguntas em português, e vice-versa.
- **Tema:** claro/escuro nos jogos padrão, com claro como padrão. Os eventos especiais usam sempre a personalização visual do evento e não exibem o toggle de tema.
- As preferências ficam salvas em `localStorage` (`supp-ui-language`, `supp-language`, `supp-theme`).
- Perguntas, alternativas, explicações, feedback de acerto/erro e textos de jogo acompanham o idioma das perguntas.
- Menus, botões administrativos, tela do host e tela do aluno acompanham o idioma da interface.
- A interface não usa emojis; os ícones são SVGs do Lucide.

## Temas e dificuldades

O baralho padrão tem **258 perguntas de verdadeiro ou falso** em dez temas,
com **24 perguntas por tema** e o **Anime ampliado para 42**:

| Tema | Conteúdo |
| --- | --- |
| **Jogos** | Minecraft, Roblox, Brawl Stars, Free Fire, Mario, Pokémon |
| **Anime** | Dragon Ball, Naruto, One Piece, Demon Slayer, JoJo, Attack on Titan, Jujutsu Kaisen, Nanatsu no Taizai, Haikyuu, Studio Ghibli |
| **Cultura pop** | Marvel, DC, Disney, Star Wars, Harry Potter, filmes família |
| **Tecnologia** | Partes do computador, internet, Word/Excel/PowerPoint, código e IA |
| **Segurança digital** | Senhas, golpes, privacidade, cyberbullying e hábitos saudáveis |
| **Ciência e espaço** | Corpo humano, planetas, experimentos e ciência do dia a dia |
| **Natureza e animais** | Habitats, curiosidades animais e recordes do planeta |
| **Brasil e folclore** | Regiões, cultura, comida, música e lendas brasileiras |
| **Esportes** | Regras, recordes, Olimpíadas e atletas brasileiros |
| **Lógica e enigmas** | Sequências, charadas, padrões e desafios de matemática |

- **Fácil (80 perguntas)**, **Médio (85)** e **Difícil (93)**.
- Cada pergunta tem tema, dificuldade e tier, usados pela competição.
- O Live do modo padrão usa um baralho próprio de **344 perguntas de múltipla
  escolha** (33 por tema, com o Anime em 47), com opções e explicações em
  português e inglês.
- O Live lembra as perguntas já usadas em salas recentes e as evita no próximo
  sorteio. A memória fica no navegador e pode ser limpa na tela do host.
- A opção **traduzir após metade do tempo** funciona no modo Live: a pergunta
  aparece em inglês e a versão em português entra na metade do cronômetro, no
  telão e nos celulares.
- A seleção de temas é múltipla e vale para D20, Roleta, Competição, Passa ou
  Repassa e Live. Temas mais infantis (natureza, ciência, jogos) e mais teens
  (anime, segurança digital, lógica) podem ser ligados ou desligados conforme a
  turma.
- As perguntas de anime mais teens (JoJo, Attack on Titan, Jujutsu Kaisen,
  Nanatsu no Taizai e Haikyuu) ficam no **médio e difícil**; quem trabalha com
  os menores pode desligar o tema Anime ou ficar no fácil.
- Quando um único tema não tem perguntas suficientes para as 20 rolagens do D20,
  o app completa com os outros níveis do mesmo tema antes de repetir.

## Música

- O modo padrão tem uma playlist de **10 faixas royalty-free** do SoundHelix.
- As faixas tocam em **shuffle cíclico**: nenhuma se repete antes de a lista inteira tocar, e a primeira de um novo ciclo nunca repete a última.
- O Halloween mantém a faixa tema “Danse Macabre — Busy Strings”.
- O volume fica salvo no navegador; o mute é por sessão.

## Segurança

- Headers de segurança em `next.config.ts`: CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP e CORP.
- `poweredByHeader: false`.
- `.env.local` é ignorado pelo Git; só `.env.example` contém placeholders.
- A chave anon do Supabase é pública por design. O app usa apenas canais broadcast/presence, sem tabelas e sem service-role no navegador.
- Códigos de sala e apelidos são sanitizados e limitados antes do broadcast.
- Política de reporte em [SECURITY.md](SECURITY.md).

## Stack

- Next.js 15 (App Router)
- React 19 + TypeScript
- Supabase Realtime (canais broadcast, modo Live)
- Tailwind CSS 4
- Motion + canvas-confetti
- Lucide React

## Requisitos

- Node.js 18+

## Variáveis de ambiente

- **Jogo local (D20 / Competição):** nenhuma variável é necessária — os baralhos ficam em `lib/`.
- **Live:** `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (copie de `.env.example`).

### Configuração do Live

1. Crie um projeto gratuito em <https://supabase.com>.
2. Copie a **Project URL** e a **anon public key** (Project Settings → API).
3. Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` em `.env.local`.
4. Reinicie o servidor (`npm run dev`) e abra o modo Ao vivo. Nenhuma tabela ou migration é necessária; só o Realtime precisa estar habilitado (padrão).

## Como rodar localmente

1. Instale as dependências: `npm install`
2. Execute o servidor de desenvolvimento: `npm run dev`
3. Abra [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — servidor de desenvolvimento.
- `npm run build` — build de produção.
- `npm run start` — servidor de produção.
- `npm run lint` — ESLint.

## Estrutura do projeto

```
app/
  page.tsx                  Menu, eventos, D20, roleta, competição, passa ou repassa e orquestração das telas
  host/page.tsx             Sala ao vivo — tela do professor
  join/page.tsx             Sala ao vivo — tela do aluno
  globals.css               Tokens de tema claro/escuro e cenário de Halloween
components/
  D20Setup.tsx              Configuração do modo D20 (temas, dificuldade e idioma)
  WheelSetup.tsx            Configuração da roleta de temas
  WheelGame.tsx             Roleta animada e pergunta sorteada
  CompetitionSetup.tsx      Cadastro de alunos, temas, nível e idioma
  CompetitionGame.tsx       Partida eliminatória
  PassaRepassaSetup.tsx     Configuração das equipes e meta de pontos
  PassaRepassaGame.tsx      Partida em equipes com repasse
  QuestionModal.tsx         Pergunta, resposta e feedback bilíngue
  LanguageToggle.tsx        Seletor PT/EN
  ThemeToggle.tsx           Seletor claro/escuro
  VolumeControl.tsx         Controle de áudio
  HalloweenBackdrop.tsx     Cenário animado do evento
lib/
  questions/                Baralhos bilíngues por tema (T/F e múltipla escolha)
  classic-questions.ts      Baralho padrão T/F, temas, dificuldades e tiers
  classic-live-questions.ts Baralho padrão de múltipla escolha (Live)
  halloween-questions.ts    Baralho Halloween T/F
  live-questions.ts         Baralho Halloween de múltipla escolha (Live)
  i18n/                     Traduções PT/EN, textos de interface e helpers
  competition.ts            Fases, sorteio e regras da competição
  live/                     Protocolo, sala, histórico e helpers do Supabase Realtime
  storage.ts                localStorage com migração das chaves antigas
  game.ts                   Baralhos, dificuldades e utilitários
SECURITY.md                 Política de segurança e reporte
```

## Créditos

- Trilha do modo padrão: faixas de exemplo do [SoundHelix](https://www.soundhelix.com/).
- Música do evento Halloween: ["Danse Macabre - Busy Strings"](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100556), de Kevin MacLeod (incompetech.com), licenciada sob [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).

## Licença

Este projeto está sob a licença MIT. Veja a [LICENSE](LICENSE).

## Autor

[<img src="https://avatars.githubusercontent.com/jrchakalo?v=4" width=115><br><sub>Júnior Silva</sub>](https://github.com/jrchakalo)
