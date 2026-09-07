# Sincronização de moedas e carregamento

O saldo canônico fica em `users/{uid}/save/progress`. O campo de moedas do perfil
é apenas um espelho escrito na mesma transação; seus snapshots não alimentam mais
o saldo do jogo. Login e eventos de interface também não escrevem esse espelho.

`coinSync` no save local guarda saldo, conta e horário da última alteração do saldo.
Autosaves sem alteração não avançam esse horário. A nuvem recebe `coinsUpdatedAt`;
saves antigos usam `lastSyncedAt` na migração. Uma compra recente com saldo menor
prevalece sobre um saldo maior antigo. Saldo zero é válido. Desbloqueios e saldo
são gravados juntos, e um save antigo não remove personagens comprados.

A primeira gravação espera a leitura inicial da nuvem. Falhas de conexão mantêm
o save local, com nova tentativa ao reconectar, ao ocultar a página e no autosave.
Transações precisam de conexão; fechar a página não garante um upload concluído,
por isso o evento de saída persiste localmente. Não se usa `beforeunload` para
prometer uma gravação remota assíncrona.

Limites: isto é resolução de versões de saves, não uma carteira autoritativa nem
um registro contábil de cada compra. Edições independentes simultâneas em aparelhos
diferentes usam a revisão mais recente, não a soma de operações. Relógios de
aparelhos diferentes precisam estar corretos; dentro da sessão a revisão é
monotônica. As regras privadas continuam permitindo edição pelo próprio jogador.

## Carregamento

Menu, inicialização, pausa e configurações são registrados no início. As demais
telas usam importação dinâmica na primeira navegação. A transição impede cliques
duplicados, mantém a tela atual se o download falhar e permite tentar novamente.

O Phaser fica em arquivo separado para reaproveitar o cache entre atualizações.
O service worker armazena as telas opcionais quando visitadas; elas não são
pré-baixadas na instalação. Portanto, uma tela nunca visitada precisa de conexão
na primeira abertura. A resolução lógica de 960×540, ENVELOP e os controles de
toque não foram alterados.

Primeira medição de produção: JavaScript inicial (entrada + Phaser), ~2,62 MB,
~645 KB gzip, contra ~3,08 MB / ~751 KB gzip anteriormente. Isso representa cerca
de 14% menos transferência inicial, não uma medição de tempo de carregamento.
Os módulos opcionais ainda são transferidos conforme usados. O Phaser continua
sendo o maior arquivo, então os avisos de bundle grande não foram ocultados.

## Verificação

- `node --import tsx --test game/utils/*.test.ts game/systems/*.test.ts`
- `npm run test:cloud` (emulador isolado, sem dados de produção)
- `npm run lint`
- `npm run build`
