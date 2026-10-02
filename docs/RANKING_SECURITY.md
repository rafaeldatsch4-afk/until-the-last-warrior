# Ranking público do UTLW

O ranking global voltou a aceitar novas pontuações, mas não usa mais escrita
irrestrita do cliente.

## Como funciona

- A coleção pública continua sendo `leaderboard_public`.
- Cada usuário autenticado só pode alterar o próprio documento.
- Contas novas começam com 0 vitórias, 0 partidas e Elo 1000.
- Cada atualização de resultado pode acrescentar exatamente 1 partida, no máximo
  1 vitória e alterar o Elo em no máximo 25 pontos.
- Nome e avatar podem ser atualizados sem alterar a pontuação.
- O ranking continua público para leitura em tempo real.

O cliente atualiza o documento público ao fim de uma batalha e cria uma entrada
base durante cadastro/login quando ainda não existe.

## Limite de segurança

Essas regras impedem saltos diretos de pontuação e alterações em contas de outros
jogadores, mas ainda não tornam o resultado totalmente autoritativo. Um cliente
modificado pode tentar repetir atualizações válidas. A proteção definitiva exige
que o servidor valide a partida e publique o resultado usando credenciais de
servidor.

Até essa validação existir, não use o ranking como fonte de recompensa financeira,
premiação real ou qualquer mecanismo que dependa de integridade competitiva forte.

## Verificação

`npm run test:rules` inicia um emulador Firestore isolado e valida leitura pública,
criação do baseline, avanço de uma partida, rejeição de saltos grandes, isolamento
entre usuários, exclusão da própria entrada e isolamento do save privado.

## Publicação

Alterar o repositório não publica automaticamente as regras do Firestore. Para a
correção funcionar em produção, publique `firestore.rules` no banco configurado
em `firebase.json`, além de publicar o frontend atualizado.
