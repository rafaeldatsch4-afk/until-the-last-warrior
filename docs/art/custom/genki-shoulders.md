# Genki Dama: ombros contínuos

A pose modular anterior girava recortes retangulares dos braços e mantinha os ombros da pose de repouso. Isso deixava junções artificiais, pedaços das mangas para baixo e áreas abertas junto ao peito.

O quadro 12 agora usa um desenho inteiro de tronco, ombros, braços e mãos. Cabeça, pernas, cores e equipamentos continuam sendo os escolhidos pelo jogador. As dez opções existentes de tronco têm uma versão correspondente; nenhuma opção nova foi acrescentada ao editor. Ki permanece no quadro 11.

As fontes `genki-torsos-a-source.png` e `genki-torsos-b-source.png` foram geradas a partir dos dez torsos existentes com o gerador integrado. Briefing: mudar somente a pose para ambos os braços elevados, palmas abertas, ombros levantados e conexão anatômica contínua com o peito; manter roupas, materiais branco/ciano/pele/dourado e detalhes; sem cabeça ou pernas; transparência e contornos suaves. Cada fonte tem uma grade 3 × 2 com cinco sprites e uma célula vazia. A segunda fonte contém resíduo nas linhas divisórias, excluído pela margem transparente de oito pixels durante o empacotamento.

Reproduzir: `node --import tsx scripts/pack-genki-torsos.mjs`. Os pontos de encaixe do pescoço e da barra ficam em `game/sprites/GenkiTorsoLayout.ts`. A escala é uniforme e não deforma cada braço separadamente.

Verificação: teste de conectividade dos pixels exige que os dois braços e o peito pertençam ao mesmo desenho conectado, para cada roupa. A revisão visual compara as dez roupas; o teste de batalha percorre Ki, preparação, lançamento e retorno à posição normal. A geometria e os efeitos da esfera não foram alterados nesta correção do encaixe dos braços.
