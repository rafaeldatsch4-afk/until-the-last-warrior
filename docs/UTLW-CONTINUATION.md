# Continuação UTLW — 21/09/2026

Base conferida: `main`, commit `1cc449376400a7ad331fa7bd1dd9fac8d691796f`.

## Mapa do código atual

| Sistema | Arquivos principais | Estado encontrado |
| --- | --- | --- |
| Personagens | `game/data.ts`, `game/characters/FighterRegistry.ts` | 22 personagens fixos, 45 formas jogáveis no manifesto |
| Assets | `game/sprites/RosterAtlases.ts`, `ItachiAtlases.ts`, `SpriteRegistry.ts` | 41 formas ilustradas; fallback procedural somente quando a textura não existe |
| Animações | `game/scenes/PreloadScene.ts`, `game/sprites/FighterAnimations.ts` | Registro comum para preload e personagem recém-salvo |
| Poses e emissão | `game/sprites/CombatPoses.ts`, `combat-poses.json`, `game/characters/*` | Configuração por forma e conversão do ponto da arte para o mundo; inclui direção, origem, escala e rotação |
| Luta e input | `game/scenes/BattleScene.ts`, `game/battle/BattleInput.ts`, `game/utils/MobileButtonInput.ts` | Teclado e controles Phaser; dono do toque por pointer; testes de ATK/KI, analógico e cancelamento |
| Personalização | `game/creator/*`, `CharacterCreatorScene.ts`, `CustomSprite.ts` | Catálogo e renderização dinâmica existentes; esta entrega corrige o caminho prévia → save → reabertura → luta |
| Save local | `game/scenes/BootScene.ts` | Persiste o personagem 999 completo e o restaura no preload |
| Save em nuvem | `game/systems/CloudSave.ts`, `components/GameCanvas.tsx` | Mesclagem de moedas por máximo ainda presente; requer trabalho separado com transações/versões |
| Ranking | `firestore.rules`, `docs/RANKING_SECURITY.md` | Código bloqueia escrita cliente no ranking público; implantação das regras não foi confirmada nesta tarefa |
| Phaser | `game/gameConfig.ts`, `components/GameCanvas.tsx` | Resolução lógica 960 × 540, ENVELOP e cinco pointers; preservados |

## Correções desta entrega

- Reabrir o editor restaura os 11 canais de cor, inclusive preto e valores válidos de saves antigos que não existem na paleta atual.
- A migração das cores antigas usa os mesmos fallbacks `gi1`/`gi2` do renderizador.
- A cabeça é restaurada pelo ID após aplicar a restrição do chapéu de palha. Trocar esse acessório preserva a cabeça quando compatível.
- Prévia e save usam `CreatorState.toCustomData`, evitando duas montagens independentes da aparência.
- Poderes escolhidos na interface chegam ao save e ao personagem da luta.
- Ao salvar, as formas normal, SSJ e UI recebem imediatamente as mesmas animações do preload, incluindo soco, chute e especial com pose estável.
- O editor reinicia seu rascunho ao entrar e recupera a base do personagem salvo.
- A luta reconhece `part_accessory: "sword"`; saves legados continuam aceitos, sem sobrepor uma escolha atual explícita.

## Verificação

Teste específico: `npm run test:creator`. TypeScript: `npm run lint`. Produção: `npm run build`.

Validação final com instalação limpa por `npm ci` e as versões exatas do `package-lock.json`: 71 testes passaram, TypeScript sem erros e build de frontend/servidor concluído. O build ainda avisa sobre o tamanho do bundle.

A suíte de jogo inclui os testes de matemática em `game/utils` e `game/systems` e os arquivos de `tests`, exceto `firestore.rules.test.mjs`, que exige o emulador separado. As regras não foram alteradas nesta entrega.

O fluxo foi executado em Chrome com mouse/teclado a 1280 × 720 e com toque e user-agent Android a 844 × 390: abrir o editor pelo menu, selecionar cabeça/acessório/cores e Galick Gun/Final Flash, salvar, recarregar a página, reabrir, comparar todos os dados e entrar em treino. Foram exercitados ataque e carga no PC e os botões ATK/KI no mobile emulado. Nenhum erro JavaScript de página nesse percurso. Isso não equivale a teste em aparelho físico nem a uma revisão visual de todas as habilidades do elenco.

## Pendências preservadas

- Batman, Batman transformado, Homem-Aranha e Homem-Aranha transformado continuam com as quatro formas procedurais identificadas no manifesto. Uma nova tentativa de gerar a folha de Batman foi recusada pelo serviço de imagens; nenhuma imagem nova foi integrada nesta entrega.
- Cyber Zero e Overdrive já possuem atlas e registro de animações. A existência de nove registros não significa que haja arte exclusiva para dash, dano ou cada frame da transformação: o contrato atual ainda usa 12 quadros por forma.
- Expansão visual do catálogo, múltiplos equipamentos simultâneos, itens de Vinícius 13 e novas poses completas continuam como etapas futuras; esta entrega corrige a base funcional do editor existente.
- Bundle grande, sincronização de moedas e backend autoritativo para ranking permanecem trabalhos separados. Nenhuma mecânica de dano/custo, regra Firebase ou saldo de usuário foi alterada.
- O conector Vercel conectado retornou 403 para o escopo `sla5`; logs privados e observabilidade dependem de uma conexão autorizada nesse escopo. A implantação pode ser verificada pelo status do commit no GitHub e pelo site público.
