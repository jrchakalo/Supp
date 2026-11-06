<div align="center">
   <h1>🎲 Supp</h1>
   <p>
      <img src="https://img.shields.io/badge/Next.js-15-black" alt="Next.js" />
      <img src="https://img.shields.io/badge/React-19-61dafb" alt="React" />
      <img src="https://img.shields.io/badge/TypeScript-5-3178c6" alt="TypeScript" />
      <img src="https://img.shields.io/badge/TailwindCSS-4-38bdf8" alt="TailwindCSS" />
   </p>
   <p><strong>Classroom games, competition and live rooms — in Portuguese and English.</strong></p>
</div>

## Sobre

**Supp** é uma plataforma de dinâmicas para sala de aula. O D20 foi o ponto de partida, mas o projeto cresceu: hoje ele reúne três formas de jogar, baralhos temáticos, competição eliminatória, salas multiplayer com QR code, interface bilíngue e eventos sazonais.

- O **modo padrão** é o ponto de entrada: escolha D20, Competição ou Ao vivo, configure temas e dificuldade e comece.
- Os **eventos especiais** ficam em uma área separada, acessível pelo botão no topo. Halloween já está disponível; Natal e Páscoa estão preparados para as próximas temporadas.
- A plataforma é **PT/EN**: a interface e o idioma das perguntas podem ser escolhidos de forma independente.
- O tema **claro/escuro** também é uma preferência da plataforma, com claro como padrão.

## Modos de jogo

### D20 Roll

O professor rola um D20 de verdade e toca no número sorteado. O app revela uma pergunta de verdadeiro ou falso e mostra o feedback na hora.

- Grid de 1 a 20, com números que podem se repetir como em uma rolagem real.
- Rodadas de 20 perguntas, com pontuação, sequência e melhor sequência.
- Atalhos `T`/`F` (ou `V`/`F` em português), `Enter` para continuar e `Esc` para fechar.

### Competição

Torneio eliminatório para a turma inteira.

- Cadastro de alunos por nome, incluindo colar a lista inteira separada por vírgulas ou quebras de linha.
- Ordem **em ordem** ou **aleatória** a cada fase.
- Uma pergunta por aluno por fase: quem acerta avança, quem erra sai.
- Morte súbita quando dois ou mais alunos chegam ao fim das fases.
- Escadas **Fácil**, **Médio**, **Difícil** e **Progressivo**, com 6 ou 9 fases.
- As configurações ficam salvas no navegador; a lista de alunos começa vazia em cada nova sessão.

### Ao vivo (Live)

Sala multiplayer estilo quiz show, com o professor projetando a pergunta e os alunos respondendo no celular.

- **/host**: cria a sala, mostra código de 5 caracteres e QR code, controla rodadas, tempo, avanço automático e placar.
- **/join**: o aluno entra com código ou QR, escolhe um apelido e responde com quatro botões coloridos.
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
- **Perguntas:** seletor PT/EN separado, na configuração da rodada. A plataforma pode estar em inglês com perguntas em português, e vice-versa.
- **Tema:** claro/escuro, com claro como padrão.
- As preferências ficam salvas em `localStorage` (`supp-ui-language`, `supp-language`, `supp-theme`).
- Perguntas, alternativas, explicações, feedback de acerto/erro e textos de jogo acompanham o idioma das perguntas.
- Menus, botões administrativos, tela do host e tela do aluno acompanham o idioma da interface.

## Temas e dificuldades

O baralho padrão tem **87 perguntas de verdadeiro ou falso** em cinco temas:

| Tema | Conteúdo |
| --- | --- |
| **Jogos** | Minecraft, Roblox, Brawl Stars, Valorant, Free Fire, League of Legends |
| **Anime** | Dragon Ball, Naruto, One Piece, My Hero Academia, Demon Slayer e outros |
| **Cultura pop** | Filmes, séries, super-heróis e cultura pop |
| **Animais ameaçados** | Espécies, habitats e conservação |
| **Tecnologia** | Hardware, internet, Word, PowerPoint, Excel e curiosidades |

- **Fácil (25 perguntas)**, **Médio (30)** e **Difícil (32)**.
- Cada pergunta tem tema, dificuldade e tier, usados pela competição.
- O Live do modo padrão usa um baralho próprio de **60 perguntas de múltipla escolha** (20 por dificuldade, 4 por tema).
- Todas as perguntas de **Tecnologia** têm versão em português e inglês.
- A seleção de temas é múltipla e vale para D20, Competição e Live.

## Música

- O modo padrão tem uma playlist de **10 faixas royalty-free** do SoundHelix.
- As faixas tocam em **shuffle cíclico**: nenhuma se repete antes de a lista inteira tocar, e a primeira de um novo ciclo nunca repete a última.
- O Halloween mantém a faixa tema “Danse Macabre — Busy Strings”.
- O volume e o mute ficam salvos no navegador.

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
  page.tsx                  Menu, configuração da rodada, D20, competição e eventos
  host/page.tsx             Sala ao vivo — tela do professor
  join/page.tsx             Sala ao vivo — tela do aluno
  globals.css               Tokens de tema claro/escuro e cenário de Halloween
components/
  CompetitionSetup.tsx      Cadastro de alunos, temas e escada
  CompetitionGame.tsx       Partida eliminatória
  QuestionModal.tsx         Pergunta, resposta e feedback bilíngue
  LanguageToggle.tsx        Seletor PT/EN
  ThemeToggle.tsx           Seletor claro/escuro
  VolumeControl.tsx         Controle de áudio
  HalloweenBackdrop.tsx     Cenário animado do evento
lib/
  classic-questions.ts      Baralho padrão T/F, temas, dificuldades e tiers
  classic-live-questions.ts Baralho padrão de múltipla escolha (Live)
  halloween-questions.ts    Baralho Halloween T/F
  live-questions.ts         Baralho Halloween de múltipla escolha (Live)
  i18n/                     Traduções PT/EN, textos de interface e helpers
  competition.ts            Fases, sorteio e regras da competição
  live/                     Protocolo, sala e helpers do Supabase Realtime
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
