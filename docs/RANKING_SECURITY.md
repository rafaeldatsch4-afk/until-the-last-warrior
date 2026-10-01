# Ranking público

`leaderboard_public/{uid}` é público para leitura. Só o dono escreve na própria entrada,
e apenas um passo por partida: `matches` sobe exatamente 1, `wins` sobe 0 ou 1,
`elo` não muda, há no mínimo 20 s entre atualizações e o `updatedAt` é o horário do servidor.
Uma entrada nova só pode nascer com 1 partida, até 1 vitória e Elo 1000. O dono pode apagar a entrada.

O cliente publica ao fim de cada partida contra a CPU (`components/AuthModal.tsx`, evento
`battle-ended`). Falhas de ranking nunca bloqueiam o salvamento do progresso do jogador.

## Limite importante

O combate roda no navegador, então as regras não conseguem provar que a vitória foi real.
Elas só limitam a velocidade de crescimento (no máximo 3 vitórias por minuto). Um cliente
adulterado ainda pode inflar o próprio placar aos poucos. Para ranking à prova de fraude é
preciso um backend que valide o resultado e publique com o Admin SDK.

## Verificação

`npm run test:rules` (emulador do Firestore, requer Java 17+).

## Publicação

Alterar o GitHub não publica as regras. Publique `firestore.rules` no banco de `firebase.json`
(`firebase deploy --only firestore:rules`) e o frontend atualizado. Sem as regras novas, o ranking
continua recusando escritas (o jogo ignora o erro e segue normal).
