# Proteção do ranking público

`leaderboard_public` aceita leituras públicas, mas não aceita criação ou alteração
por clientes, nem pelo dono do documento. A exclusão pelo dono continua permitida
para o fluxo de exclusão de conta. Depois de excluir, o cliente não pode recriar
a entrada. Login, cadastro e fim de partida não publicam pontuações.

## Efeito e limites

Novas pontuações ficam pausadas. O jogo informa isso na tela do ranking.
As entradas anteriores continuam visíveis; esta mudança não verifica nem corrige
eventuais pontuações fraudulentas já existentes.

Os documentos privados `users` e os saves continuam editáveis pelo jogador para
preservar o progresso atual. Seus campos `wins`, `elo` e `matches` não são fontes
confiáveis para o ranking. Não crie uma função que simplesmente copie esses campos
ou aceite `win: true` enviado pelo navegador.

O servidor Socket.IO atual apenas retransmite ações: ele não valida o resultado
da batalha. Para reativar novas pontuações, implemente autenticação no servidor,
validação autoritativa dos resultados e atribuição de recompensas uma única vez
por partida. Só esse backend deve publicar pontuações usando o Admin SDK, com
credenciais restritas ao servidor. Nunca exponha credenciais de serviço no cliente.

## Verificação

`npm run test:rules` inicia um emulador isolado com o projeto fictício
`demo-utlw-rules` e testa bloqueios de criação, alteração, incremento, substituição,
escrita em lote e acesso por terceiros; também verifica leitura pública, exclusão
de conta e isolamento do save privado. Requer Java 17 ou superior e dependências
de desenvolvimento (Java 21 recomendado).

## Publicação

Alterar o GitHub não publica regras no Firebase. Após revisar e integrar a mudança,
publique as regras no banco configurado em `firebase.json` e publique o frontend
atualizado. Publicar apenas o frontend deixa a brecha aberta para clientes alterados.
Publicar apenas as regras protege o ranking, mas versões antigas do frontend ainda
tentarão escrever nele e poderão interromper seus fluxos ao receber a recusa.

Revise as regras que estão ativas antes de publicar para preservar eventuais
alterações feitas fora do repositório. Esta correção não realiza deploy nem migra
ou exclui pontuações existentes.

Referências:
- https://firebase.google.com/docs/firestore/security/insecure-rules
- https://firebase.google.com/docs/firestore/security/test-rules-emulator
