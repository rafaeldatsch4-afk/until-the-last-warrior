# Novas sprites: Batman, Batman Dark Knight, Homem-Aranha e Homem-Aranha de Ferro

**Batman e Batman Dark Knight** (armadura escura, forma transformada) são arte de fã, em pixel art
de anime no estilo do elenco, gerada em duas folhas de 28 poses no Figma e recortada
com este mesmo empacotador (fundo verde removido antes; `batman-source.png` e
`batman_ssj-source.png` guardam as folhas já com transparência). Substituem o antigo
"Sentinela Noturna" e "Bastião". As chaves `batman`, `batman_ssj`,
`spiderman` e `spiderman_ssj` permanecem para preservar saves, catálogo e rede.
**Homem-Aranha** (clássico, vermelho e azul) e **Homem-Aranha de Ferro** (vermelho e dourado, com
quatro pernas mecânicas) também são arte de fã no mesmo estilo. O Figma recusa a folha inteira de 28
poses desse personagem (erro 422), então cada forma foi gerada em linhas de 4 poses e montada numa
grade 4 × 7, com a cabeça de cada pose na linha central da célula. O empacotador recorta essas folhas
por célula (pontas das pernas mecânicas e faíscas soltas não se perdem) e usa uma escala fixa para as
duas formas: as poses em pé medem 347 px na folha e viram 72 px no jogo, porque o idle é agachado.
Só o dash (24–27) é derivado: quadros de corrida com rastros e a volta à guarda, porque o gerador
recusou essa linha.

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
O Batman ataca corpo a corpo com um soco em avanço. Seu especial
resolve o socket em cada lançamento. A teia do Homem-Aranha fica presa ao punho
durante a aproximação do alvo e não redimensiona o inimigo.

Para reproduzir: `node scripts/pack-guardian-art.mjs [chave ...]` (sem chaves, empacota as quatro folhas). Os PNGs de origem
permanecem em `docs/art/roster/`; somente os atlases finais entram no build.
O tamanho do corpo é calculado pelas poses paradas (pelas poses em pé no Homem-Aranha), sem
encolher o personagem por causa da aura.

Validação: TypeScript, build de produção, inspeção visual dos 112 recortes e
testes de atlas, animações, sockets, efeitos, controles mobile, combate,
história e persistência do criador. Não houve teste manual em aparelho físico.
