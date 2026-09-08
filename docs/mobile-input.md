# Diagnóstico do input mobile

## Caminho confirmado no código

`components/MobileControls.tsx` emite o CustomEvent `mobile-input`, mas não é
importado/montado e não existe listener desse evento no repositório. Não participa
da batalha atual.

O caminho ativo é canvas → TouchManager/InputManager do Phaser 3.90 → hit test do
InputPlugin → `BattleInput.createMobileControls()` → flags e buffers independentes
→ `checkActionDown/JustDown/JustUp()` → `BattleScene`. Online, o jogador local 2
reutiliza o mesmo conjunto mobile de controles P1. O teclado continua com seus
mapeamentos P1/P2 originais. `BattleScene` e os callbacks de ataque/KI não mudaram.

## Falha reproduzida e correção

Antes, cada círculo tinha área clicável de raio `radius * 1.5`. Posições
`hudPos_*` eram carregadas e arrastadas sem validar sobreposição. O InputPlugin
usa `topOnly` e ordenação de exibição; KI é criado depois de ATK. Assim, uma área
invisível de KI podia interceptar um toque dentro do ATK visível.

Reprodução determinística: ATK em (812, 418), raio 55; KI personalizado em
(912, 418), raio 38. O toque (860, 418) está dentro do ATK desenhado e também dentro
do antigo raio clicável 57 de KI. O teste demonstra que a área nova aceita somente
ATK nesse ponto. O layout padrão ATK/KI não se sobrepõe; não temos o localStorage
do celular do jogador para afirmar que essa era sua configuração exata.

Agora a área clicável tem o raio desenhado. Posições personalizadas conflitantes
ou não finitas são ignoradas; arrastar um botão sobre outro reverte o movimento.
Posições padrão conflitantes em escalas grandes são separadas antes de aceitar
customizações. A edição continua permitida, e o arraste só fica ativo nesse modo.

Também havia um único booleano por botão: qualquer `pointerup`/`pointerout` podia
liberar a ação, independentemente do dedo. Agora `Pointer.id` identifica o dono:
um dedo não troca de botão, dois dedos no mesmo botão liberam apenas no último
levantamento, e soltar fora do botão/canvas também libera corretamente. Sair da
área enquanto mantém o dedo pressionado não transfere a ação para outro botão.

O Phaser já converte Touch Events em Pointer com identidade estável. Não foi
necessário adicionar outra camada DOM de Pointer Events. `touchcancel` chega ao
Phaser como pointerup; é distinguido pelo evento original para não disparar SPC
no cancelamento. Reconciliação de `isDown`, blur, visibilidade, pausa, edição e
destruição eliminam estados presos. Listeners adicionados são removidos no teardown.

## Validação

Execute `npm run test:mobile` ou:

```sh
node --import tsx --test tests/mobile-input.test.mjs
```

Os testes executam o `BattleInput` real com doubles apenas de renderização,
browser e fronteira Phaser. Cobrem todos os rótulos, a regressão de sobreposição,
ATK/KI independentes, reutilização de IDs, multitouch, joystick simultâneo,
liberação fora do canvas, cancelamento, SPC normal, perda de foco, pausa,
visibilidade, edição e limpeza. Também verificam os mapeamentos completos do
teclado e seu caminho de consumo. Não substituem uma sessão em aparelho físico.

Nenhum dano, custo de KI, cooldown, duração de buffer ou regra de combate mudou.
