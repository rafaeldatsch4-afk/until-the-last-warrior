# Until the Last Warrior

Fan game de luta 2D (Phaser 3 + React), sem fins comerciais. Responda em português.

## Regra de trabalho

- **Ao terminar cada tarefa, sempre faça o commit** com uma mensagem clara e envie (`git push`) para a branch de trabalho. O ambiente na nuvem é apagado depois, então trabalho sem commit/push se perde.
- Antes do commit, rode as verificações abaixo e só faça commit com tudo passando (ou explique o que falhou).

## Verificações

- `npm run lint` — TypeScript
- `npm test` — matemática de combate e progressão
- `node --import tsx --test $(ls tests/*.mjs | grep -v firestore)` — sprites, efeitos, controles, criador
- `npm run build` — build de produção

## Contexto

- Modo online desativado por enquanto: o servidor Socket.IO (`server.ts`) rodava no Railway e o período de teste acabou. Saves ficam no Firebase.
- Não troque o modo de escala `ENVELOP` em `game/gameConfig.ts` (ver comentário no arquivo).
- Folhas do elenco: 12 quadros de 192 × 128 em `game/assets/roster/`; ver `docs/art/roster/README.md`.
- Histórico e pendências: `docs/UTLW-CONTINUATION.md`.
