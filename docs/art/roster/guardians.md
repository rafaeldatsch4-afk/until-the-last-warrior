# Novas sprites: Sentinela Noturna, Bastião, Vetor e Linha de Fuga

Artes originais aprovadas em 29/09/2026. As chaves `batman`, `batman_ssj`,
`spiderman` e `spiderman_ssj` permanecem para preservar saves, catálogo e rede.
Esta entrega substitui as quatro formas procedurais por 28 poses ilustradas
cada, sem alterar dano, alcance, custo de Ki, controles ou tempos de combate.

| Quadros | Ação |
| --- | --- |
| 0–3 | Parado |
| 4–7 | Caminhada |
| 8–9 | Ataque, soco e chute |
| 10 | Defesa legada |
| 11 | Especial |
| 12–15 | Transformação |
| 16–19 | Carregar Ki |
| 20–23 | Defesa |
| 24–27 | Dash |

Cada quadro mede 192 × 128. Os atlases mantêm 12 colunas e medem 2304 × 384,
com oito células finais vazias que não participam das animações. PC e celular
carregam os mesmos arquivos. O fallback procedural continua funcionando se
uma imagem não carregar. Cópias personalizadas com apenas 12 quadros não
herdam intervalos indisponíveis. As poses especiais do Goku e o modo
personalizado atual foram preservados.

Os sockets de disparo foram medidos nas mãos e armas das novas poses. O
Sentinela usa um corte junto à tonfa no ataque corpo a corpo. Seu especial
resolve o socket em cada lançamento. O cabo do Vetor fica preso ao punho
durante a aproximação do alvo e não redimensiona o inimigo.

Para reproduzir: `node scripts/pack-guardian-art.mjs`. Os PNGs de origem
permanecem em `docs/art/roster/`; somente os atlases finais entram no build.
O script separa a aura que encosta no especial do Vetor em y=667 sem alterar
a folha de origem. O tamanho do corpo é calculado pelas poses paradas, sem
encolher o personagem por causa da aura.

Validação: TypeScript, build de produção, inspeção visual dos 112 recortes e
testes de atlas, animações, sockets, efeitos, controles mobile, combate,
história e persistência do criador. Não houve teste manual em aparelho físico.
