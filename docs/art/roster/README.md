# Sprites do elenco OTLW

O elenco fixo tem 22 personagens e 45 formas jogáveis. Esta atualização acrescenta 39 folhas; as duas folhas de Itachi e Susanoo já estavam integradas. Cyber Zero é o guerreiro futurista original de OTLW, com armadura grafite, visor e plasma ciano. O Overdrive usa energia carmesim e magenta.

**Pendência de geração:** o serviço de imagens recusou as quatro folhas de Batman e Homem-Aranha após novas tentativas. Essas formas preservam as sprites procedurais. Nesta conclusão, as poses de chute e defesa foram diferenciadas, a carga de Batman recebeu pose própria e o enquadramento foi corrigido para não cortar botas/capa. O manifesto identifica essas entradas como `generation-blocked`; elas não são apresentadas como arte nova.

Cada forma conserva os 12 quadros de 192 × 128 pixels, origem e escala usadas pelo jogo. Não foram alterados dano, custos, duração dos golpes, colisões ou controles. Os personagens personalizados continuam com geração dinâmica.

| Animação | Quadros | FPS |
| --- | --- | --- |
| Parado | 0–3 | 10 |
| Caminhada | 4–7 | 12 |
| Ataque | 8–9 | 16 |
| Soco | 8 | 12 |
| Chute | 9 | 12 |
| Especial | 8–9 | 12 |
| Defesa | 10 | 10 |
| Transformação | 0–3 | 24 |
| Carga | 11 | 10 |

As animações compartilham os quadros acima conforme o contrato existente do Phaser. Não há novos estados de combate. Gohan Beast agora registra as animações `_ui`, correspondentes à segunda transformação já permitida pelo jogo.

## Revisão reproduzível

Na raiz do repositório, execute `python -m http.server 8080` e abra `http://localhost:8080/docs/art/roster/preview.html`. O visualizador oferece seleção das 41 formas com PNG, reprodução, pausa, avanço de quadro e espelhamento. Usa os PNGs reais do jogo e não exige autenticação. As quatro formas procedurais podem ser conferidas no próprio jogo.

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
