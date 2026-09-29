# Sprites do elenco OTLW

O elenco fixo tem 22 personagens e 45 formas jogáveis, todas com folha ilustrada. As duas folhas de Itachi e Susanoo usam caminhos próprios. Cyber Zero é o guerreiro futurista original de OTLW, com armadura grafite, visor e plasma ciano. O Overdrive usa energia carmesim e magenta.

**Batman e Homem-Aranha (desenho vetorial):** o serviço de imagens recusou essas quatro folhas, então elas são desenhadas por código em `scripts/draw-hero-art.mjs`: um esqueleto com 12 poses (as mesmas do contrato abaixo), contorno escuro e sombreamento em camadas, renderizado em 4× e reduzido pelo mesmo empacotador das outras folhas. As formas são Batman clássico (cinza, capa e cinto amarelo), Batman blindado (grafite, olhos e detalhes ciano), Homem-Aranha clássico e simbionte (preto, aranha branca e mãos brancas). Para refazer:

```
node scripts/draw-hero-art.mjs                 # gera docs/art/roster/<forma>-source.png
node scripts/pack-roster-art.mjs batman batman_ssj spiderman spiderman_ssj
node scripts/draw-hero-art.mjs --sockets       # grava os pontos de emissão em combat-poses.json
```

Os geradores procedurais antigos continuam como reserva caso um PNG não carregue.

Cada forma conserva os 12 quadros de 192 × 128 pixels, origem e escala usadas pelo jogo. Não foram alterados dano, custos, duração dos golpes, colisões ou controles. Os personagens personalizados continuam com geração dinâmica.

| Animação | Quadros | FPS |
| --- | --- | --- |
| Parado | 0–3 | 10 |
| Caminhada | 4–7 | 12 |
| Ataque | 8–9 | 16 |
| Soco | 8 | 12 |
| Chute | 9 | 12 |
| Especial | 11 (conjuração) ou 8 (mão/arma estendida), conforme a forma | 12 |
| Defesa | 10 | 10 |
| Transformação | 0–3 | 24 |
| Carga | 0–3 (postura com aura) ou 11, quando o desenho é realmente de carga | 10 |

O mapeamento de especial e carga e os pontos de emissão foram revisados por forma em `game/sprites/combat-poses.json`. O especial sustenta a pose escolhida, sem alternar soco e chute. Não há novos estados de combate. Gohan Beast agora registra as animações `_ui`, correspondentes à segunda transformação já permitida pelo jogo.

## Revisão reproduzível

Na raiz do repositório, execute `python -m http.server 8080` e abra `http://localhost:8080/docs/art/roster/preview.html`. O visualizador oferece seleção das 45 formas com PNG, reprodução, pausa, avanço de quadro e espelhamento. Usa os PNGs reais do jogo e não exige autenticação.

Execute `node --import tsx --test tests/roster-atlases.test.mjs` para conferir a cobertura das 45 formas, transparência, quadros preenchidos e isolados, preservação das texturas carregadas, carregamento comum em PC/celular e registro real das nove animações no Phaser.

Os arquivos `*-source.png` preservam as folhas geradas. O `manifest.json` registra seleção, enquadramento e atlas de destino. Para reempacotar uma folha revisada, use `node scripts/pack-roster-art.mjs chave_do_personagem`. Os arquivos de arte e revisão em `docs` não entram na compilação do jogo; somente os atlas finais em `game/assets/roster` são carregados.

## Limites da verificação

A revisão visual das folhas e os testes determinísticos não substituem uma partida em aparelho físico. Os controles não foram modificados nesta atualização; os testes existentes de input mobile também devem passar antes da publicação.

## Validação da conclusão

- 40 testes de sprites, efeitos, atualização e controles, incluindo poses procedurais sem corte.
- 14 testes de matemática de combate e progressão.
- TypeScript e build de produção.
- As 45 formas mantêm as nove animações registradas; 41 usam folhas ilustradas e quatro usam a arte procedural revisada.
- A instalação do navegador automatizado falhou por certificado do provedor de download. Não foi possível validar uma partida em navegador ou aparelho físico nesta sessão.

Teste adicional: `node --import tsx --test tests/procedural-poses.test.mjs`.

## Correção de poses e emissão de ataques

A revisão das 41 formas ilustradas e das quatro formas procedurais separou a pose de conjuração da recuperação de Ki. O Kamehameha conserva a pose de conjuração durante a emissão. Os feixes usam a direção real do personagem, inclusive após trocar de lado.

Os pontos de emissão são medidos nos quadros reais e convertidos para o mundo com origem, escala, rotação e espelhamento. As formas procedurais e personagens personalizados conservam um ponto baseado no desenho procedural, com ajustes próprios para Batman e Homem-Aranha. O efeito de conjuração não deforma mais o personagem depois de capturar a posição das mãos. Mísseis de Optimus e Rasenshuriken não recebem mais deslocamento vertical extra; a bomba/feixe de Obito usa o ponto de emissão.

`node scripts/preview-combat-sockets.mjs <diretório>` gera pranchas de inspeção com marcas sobre as mãos, armas ou focos de energia. Requer `@napi-rs/canvas` ou o runtime fornecido. O visualizador HTML lê o mesmo JSON do jogo.

Validação: 65 testes automatizados, TypeScript e compilação de produção passaram. Incluem espelhamento, origem/escala/rotação, proximidade dos pontos à arte real, separação das poses e execução do Kamehameha dos dois lados. A análise foi feita com renderização e testes locais; não houve partida em navegador nem teste em aparelho físico.
