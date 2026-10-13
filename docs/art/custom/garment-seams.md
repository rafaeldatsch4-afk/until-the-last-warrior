# Encaixes de cintura e botas

O quimono Z continha uma aba abaixo da própria faixa, enquanto a calça Dogi também continha uma faixa. A composição agora usa a faixa da camisa e a parte inferior da calça, com sobreposição de um pixel lógico na cintura. O recorte central preserva os braços e as mãos. A pose de Genki Dama encontra a mesma altura da cintura.

O cano do calçado é medido abaixo da borda curva. Sua largura e centro acompanham a barra efetivamente desenhada da calça, sem limites diferentes e arbitrários para o pé esquerdo e direito. A barra é desenhada na frente do cano, escondendo a abertura. As pontas de pele das calças são identificadas antes da troca de cores. Bermudas preservam as pernas expostas; a extremidade de cada panturrilha é medida separadamente.

Validação de 3 de outubro de 2026: revisão visual do conjunto marcado pelo usuário em repouso, caminhada, soco, chute, defesa, Ki e Genki Dama. Checagem de conectividade dos pixels de 90 combinações (todas as 81 combinações de pernas/calçados com quimono e os outros nove torsos com Dogi/Botas Z), em oito quadros distintos: 720 quadros sem fragmentos inferiores desconectados maiores que 30 pixels lógicos e sem erros JavaScript. Essa verificação detectou e permitiu corrigir a panturrilha mais curta da bermuda.

Testes de regressão: `node --import tsx --test tests/custom-seams.test.mjs tests/genki-torso.test.mjs`. Os testes usam os arquivos reais das roupas para conferir que o encaixe conserva tecido e exclui a ponta de pele.

Revisão das marcações seguintes: a Spandex Saiyajin também cede sua faixa à do quimono. Os calçados usam uma única escala para largura e altura, preservando o desenho das sandálias ninja. O cachecol completo fica entre o corpo e o retrato, com a gola atrás da mandíbula e as pontas visíveis sobre o ombro. Bandana e chapéu têm medidas menores; a bandana acompanha a testa das diferentes cabeças, e o chapéu mantém a apresentação careca sem alterar a escolha salva. Revisão ampliada das cinco combinações marcadas e de 27 combinações de cabeça/acessório, além da checagem de 720 quadros.
