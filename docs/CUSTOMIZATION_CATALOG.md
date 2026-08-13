# Catálogo do Sistema de Personalização de Personagens
## Until The Last Warrior — Character Customization & Asset Blueprint

Este documento estabelece o inventário estruturado e a especificação técnica de todos os componentes de vestuário, anatomia, calçados, acessórios e paletas de cores do sistema de criação de personagens (`CustomSprite`), acompanhado pelo plano de redesenho progressivo para elevação da fidelidade visual em pixel art.

---

## 1. Arquitetura de Camadas e Renderização

O gerador de sprites (`generateCustomSprite`) processa o personagem em uma spritesheet de **12 quadros** (dimensão base de 96x64px com escala 2x por pixel, totalizando frames de 192x128px), cobrindo as seguintes poses e animações:
- **Frames 0 a 3**: *Idle & Breathing* (oscilação vertical de 1px no tronco e cabeça nos frames ímpares).
- **Frames 4 a 7**: *Walk Cycle* (deslocamentos cinemáticos independentes para perna esquerda e perna direita).
- **Frames 8 a 9**: *Attack Stance & Strike* (extensão frontal de braço, punho ampliado e efeitos visuais).
- **Frame 10**: *Defend Stance* (recuo e elevação de guarda).
- **Frame 11**: *Energy Charge* (elevação de braços, postura agachada e aura de energia).
- **Variações de Forma**: Forma Base, *Super Saiyajin* (`_ssj`) e *Ultra Instinct* (`_ui`).

### Ordem de Profundidade (Z-Index de Renderização):
1. **Acessórios Traseiros** (*Back Accessories*): Capa heroica esvoaçante, caudas de cachecol.
2. **Pernas** (*Legs*): Calças, bermudas, ataduras, cintos e coldres.
3. **Pés & Calçados** (*Feet*): Botas de combate, sapatos formais, sandálias ninja/palha, solados.
4. **Tronco & Braços** (*Torso & Arms*): Kimonos, coletes, armaduras, musculatura, mangas e luvas.
5. **Cabeça & Rosto** (*Head & Face*): Estrutura facial, olhos, cicatrizes, cabelos e elmos.
6. **Acessórios Frontais** (*Front Accessories*): Chapéu de palha, katana, bandana, scouter.
7. **Sombras de Contato Universais** (*Universal Ambient Occlusion*).

---

## 2. Catálogo Estruturado de Itens

### 2.1 Tronco (Torso & Braços)

| ID | Nome de Exibição | Cores Afetadas | Descrição Visual & Elementos de Detalhe | Comportamento em Ações |
| :--- | :--- | :--- | :--- | :--- |
| `goku` | **Kimono Z** | `torso_1` (Gi), `torso_2` (Camisa/Punhos) | Kimono de artes marciais com decote V profundo sobre camiseta azul escura, sombras de dobras em três tons, ombreiras sobrepostas e munhequeiras clássicas. | Braços abertos no carregamento, soco direto no ataque com munhequeira visível. |
| `spiderman` | **Traje Aranha** | `torso_1` (Centro/Luvas), `torso_2` (Laterais) | Painel peitoral vermelho anatômico com tecido azul nas costelas, aranha preta de 8 pernas no esterno, linhas de relevo peitoral e luvas com grid de teia. | Punhos cerrados no ataque, tração muscular evidente na guarda e carga. |
| `jotaro` | **Sobretudo JoJo** | `torso_1` (Sobretudo), `torso_2` (Camiseta) | Casaco Gakuran longo com golas largas estruturadas, corrente pesada de elos dourados no peito e camisa canelada justa com sombras abdominais. | Mangas longas no ataque ORA ORA, punho ampliado e corrente dinâmica. |
| `vegeta` | **Armadura Saiyajin** | `torso_1` (Adornos), `torso_2` (Bodysuit) | Peitoral de batalha branco reforçado com placas peitorais douradas reflexivas, costelas flexíveis no abdômen, ombreiras pontiagudas e luvas brancas alargadas. | Ombreiras articuladas na pose de soco, punhos brancos de alta visibilidade. |
| `saitama` | **Uniforme Herói** | `torso_1` (Macacão), `torso_2` (Luvas/Botões) | Macacão amarelo de super-herói com zíper metálico prateado no colarinho, fechos circulares da capa nos ombros, cinto preto grosso com fivela dourada e luvas vermelhas longas. | Soco devastador ("One Punch") com punho vermelho gigante com brilho especular. |
| `chapolim` | **Uniforme CH** | `torso_1` (Túnica), `torso_2` (Coração) | Túnica vermelha com o emblemático escudo amarelo de coração no tórax, monograma "CH" recortado em pixel art nítido e acabamento amarelo nos punhos. | Postura heroica cômica com mãos de luvas abertas ou socos diretos. |
| `muscle` | **Sem Camisa** | `skin` (Pele), `torso_1` (Munhequeiras) | Torso esculpido hiper-definido com peitoral marcado, abdômen 8-pack, linhas de serrátil lateral, clavículas e munhequeiras de combate nos pulsos. | Tensão muscular e sombras profundas acentuadas nas poses de carga e golpe. |
| `naruto` | **Jaqueta Shinobi** | `torso_1` (Laranja), `torso_2` (Ombreiras) | Jaqueta esportiva shinobi com gola alta branca interior, pala azul nos ombros, zíper central preto com cursor metálico e emblema espiral vermelho Uzumaki. | Postura de preparação para Rasengan com mangas destacadas. |
| `sasuke` | **Gola Alta Uchiha** | `torso_1` (Túnica), `torso_2` (Detalhes) | Túnica azul com gola alta pontiaguda envolvente, abertura de bíceps com pele exposta e manguitos brancos longos no antebraço com costuras de compressão. | Postura Chidori com braços flexionados e destaque nos manguitos brancos. |
| `luffy` | **Colete Pirata** | `torso_1` (Colete), `skin` (Pele) | Colete vermelho sem mangas aberto, peitoral nu exibindo a cicatriz em X no tórax e braços musculosos livres. | Soco elástico alongado (*Gomu Gomu*) com punho estendido em perspectiva. |

---

### 2.2 Pernas (Legs & Calças)

| ID | Nome de Exibição | Cores Afetadas | Descrição Visual & Elementos de Detalhe | Comportamento em Ações |
| :--- | :--- | :--- | :--- | :--- |
| `goku` | **Calça Dogi** | `legs_1` (Calça), `legs_2` (Faixa Obi) | Calças largas de artes marciais com dobras profundas nos joelhos, faixa Obi com nó lateral e caudas de tecido penduradas. | Folds dinâmicos que acompanham a amplitude dos passos no walk cycle. |
| `spiderman` | **Lycra Aranha** | `legs_1` (Geral), `legs_2` (Base Azul) | Calça de lycra anatômica azul com realces musculares nas coxas, linhas de articulação do joelho e costuras internas. | Contorno firme e elástico que enfatiza a agilidade nos saltos e passos. |
| `jotaro` | **Calça Gakuran** | `legs_1` (Calça), `legs_2` (Cinto) | Calça social de alfaiataria com vinco vertical rígido, cintos duplos sobrepostos (um dourado e um escuro com rebites) e corrente de bolso dourada suspensa. | Vinco vertical permanece nítido com balanço elegante durante a caminhada. |
| `saitama` | **Calça Herói** | `legs_1` (Amarelo) | Pernas do macacão com reforço nos joelhos, realce de volume nos quadríceps e encaixe perfeito nas botas de cano alto. | Movimentação fluida e acolchoamento do joelho que se dobra no passo. |
| `vegeta` | **Spandex Saiyajin** | `legs_1` (Base), `legs_2` (Azul Escuro) | Calça de compressão Saiyajin com linhas horizontais de tensão muscular nas coxas e sombra de virilha reforçada. | Textura elástica que se estica com vigor durante a carga de energia. |
| `chapolim` | **Bermuda CH** | `legs_1` (Calça Vermelha), `legs_2` (Bermuda) | Calça colante vermelha com sobreposição da famosa bermuda amarela com cinto demarcado e costura central. | Contraste vibrante entre o amarelo e vermelho em qualquer iluminação. |
| `naruto` | **Calça Shinobi** | `legs_1` (Laranja), `legs_2` (Adornos) | Calça shinobi folgada com ataduras médicas brancas enroladas na coxa direita e coldre preto de shurikens fixado. | Ataduras e coldre mantêm a ancoragem precisa durante o ciclo de andar. |
| `sasuke` | **Hakama Uchiha** | `legs_1` (Shorts), `legs_2` (Corda Shimenawa) | Bermuda/Hakama ninja escura com pele dos joelhos exposta e corda roxa Shimenawa trançada na cintura com nós caídos. | Corda roxa com nós que reagem suavemente às passadas. |
| `luffy` | **Jeans Pirata** | `legs_1` (Denim), `legs_2` (Faixa) | Bermuda jeans azul escuro com barras largas brancas dobradas e desfiadas, joelhos nus expostos e faixa amarela amarrada na cintura. | As barras felpudas brancas criam forte contraste sobre as pernas nuas. |

---

### 2.3 Pés e Calçados (Feet)

| ID | Nome de Exibição | Cores Afetadas | Descrição Visual |
| :--- | :--- | :--- | :--- |
| `goku` | **Botas Z** | `feet_1` (Bota), `feet_2` (Detalhes) | Botas azuis de cano médio com cordões amarelos cruzados, faixa central vermelha e sola tratorada preta. |
| `spiderman` | **Botas Aranha** | `feet_1` (Sola), `feet_2` (Bota Vermelha) | Botas vermelhas anatômicas com brilho de curvatura no peito do pé e sola emborrachada preta. |
| `chapolim` | **Tênis Retrô** | `feet_1` (Meias), `feet_2` (Tênis) | Meias amarelas à mostra, tênis vermelho com cadarço amarelo e biqueira/sola branca reforçada. |
| `saitama` | **Botas Herói** | `feet_1` (Sola), `feet_2` (Bota) | Botas de cano alto vermelhas com dobra no topo, brilho vertical reflexivo e solado escuro. |
| `vegeta` | **Botas Saiyajin** | `feet_1` (Base Branca), `feet_2` (Dourado) | Botas brancas reforçadas de armadura com biqueiras douradas ranhuradas e solado de combate. |
| `jotaro` | **Sapatos Couro** | `feet_1` (Couro) | Sapatos sociais pretos de couro polido com brilho especular branco no bico e salto marcado. |
| `naruto` | **Sandálias Ninja** | `feet_1` (Cano Tecido), `skin` (Pele) | Sandálias shinobi com cano de tecido azul/preto e abertura frontal deixando os dedos expostos. |
| `sasuke` | **Sandálias Ninja** | `feet_1` (Cano Tecido), `skin` (Pele) | Sandálias ninja de combate com suporte de tornozelo e dedos articulados à mostra. |
| `luffy` | **Sandálias Palha** | `feet_1` (Palha/Couro), `skin` (Pele) | Sandálias tradicionais de palha trançada com tiras marrons em Y presas entre os dedos. |

---

### 2.4 Cabeça e Cabelos (Head & Hair)

| ID | Nome de Exibição | Cores Afetadas | Descrição Visual |
| :--- | :--- | :--- | :--- |
| `goku` | **Goku / Espetado Z** | `hair`, `skin`, `head_1` | Cabelo volumoso com mechas angulares características (transforma em loiro com mechas douradas em SSJ e prateado cintilante em UI). |
| `vegeta` | **Vegeta / Chamas** | `hair`, `skin`, `head_1` | Entrada frontal em V acentuada (*Widow's Peak*) e mechas erguidas em formato de chama ascendente. |
| `spiderman` | **Máscara Aranha** | `head_1` (Máscara), `head_2` | Máscara completa com grandes lentes angulares brancas contornadas de preto e grade de teia. |
| `saitama` | **Careca Polida** | `skin`, `head_1` | Cabeça perfeitamente lisa com brilho no topo; expressão muda de cômica para séria ao atacar/carregar. |
| `chapolim` | **Capuz com Anteninhas** | `head_1` (Capuz), `head_2` (Pompons) | Capuz vermelho com recorte facial e antenas de vinil articuladas com pompons amarelos na ponta. |
| `jotaro` | **Quepe JoJo** | `head_1` (Quepe), `hair`, `skin` | Quepe de estudante com aba frontal, broche da mão dourada e fusão traseira direta com o cabelo. |
| `naruto` | **Naruto / Espetos & Bigodes** | `hair`, `skin` | Cabelo loiro espetado e as três marcas características de bigodes de raposa em cada bochecha. |
| `sasuke` | **Sasuke / Franja & Sharingan** | `hair`, `skin` | Franja repartida ao meio, pontas traseiras em cauda de pato e olhos vermelhos com pupilas de Tomoe. |
| `luffy` | **Luffy / Franja & Cicatriz** | `hair`, `skin` | Cabelo desgrenhado preto, cicatriz com dois pontos abaixo do olho esquerdo e sorriso confiante. |

---

### 2.5 Acessórios (Accessories)

| ID | Nome de Exibição | Cores Afetadas | Camada / Descrição Visual |
| :--- | :--- | :--- | :--- |
| `none` | **Nenhum** | N/A | Nenhum acessório adicional equipado. |
| `straw_hat` | **Chapéu de Palha** | Cores Fixas / Dourado | Chapéu de palha com aba larga trançada, fita vermelha viva, copa arredondada e cordão preso ao pescoço. |
| `sword` | **Katana Suprema** | `skin` / `torso` (Empunhadura) | Katana de aço forjado com brilho de gume, tsuba (guarda) dourada, cabo trançado e rastro de corte de energia azul (`VFX`) no golpe. |
| `headband` | **Bandana Ninja** | `acc_1` (Tecido), `acc_1_shadow` | Placa de metal polido com 4 rebites, símbolo espiral da folha gravado, risco de renegado e faixas de tecido esvoaçantes atrás da cabeça. |
| `cape` | **Capa Heroica** | `acc_1` (Tecido), `acc_1_shadow` | Capa dorsal de super-herói com sombreamento triplo; ondula dinamicamente ao atacar ou carregar energia. |
| `scouter` | **Scouter Saiyajin** | Cores de HUD | Suporte auricular branco/dourado com visor translúcido verde sobre o olho esquerdo e mira HUD luminosa. |
| `scarf` | **Cachecol Shinobi** | `acc_1` (Tecido) | Cachecol longo enrolado no pescoço com pontas esvoaçando para trás da silhueta do lutador. |

---

### 2.6 Paletas de Cores Disponíveis

1. **Paleta de Pele (`skin`)**:
   - `0xffcfb0` (Clara 1), `0xffe0c0` (Clara 2), `0xe0ac88` (Média 1), `0xd09a7a` (Média 2), `0x8d5524` (Escura 1), `0xc68642` (Escura 2), `0x4aa37a` (Namekuseijin/Alien).
2. **Paleta de Cabelo (`hair`)**:
   - `0x1a1a1a` (Preto), `0xe0e0e0` (Platina/Branco), `0xffea00` (Loiro), `0xd92525` (Vermelho), `0x003399` (Azul), `0x2ecc71` (Verde), `0x9b59b6` (Roxo), `0xff5a00` (Laranja), `0x8d5524` (Castanho).
3. **Paleta de Traje & Acessórios (`gi`)**:
   - `0xff5a00` (Laranja Clássico), `0x003399` (Azul Real), `0xd92525` (Vermelho Vivo), `0x111111` (Preto Ébano), `0xffffff` (Branco Puro), `0x2ecc71` (Verde Esmeralda), `0x9b59b6` (Roxo), `0xf1c40f` (Dourado/Amarelo), `0x8e44ad` (Índigo).
4. **Paleta de Aura (`aura`)**:
   - `0x3498db` (Azul Ki), `0xf1c40f` (Dourado Super Saiyajin), `0xe74c3c` (Vermelho Kaio-ken), `0x9b59b6` (Púrpura Destruição), `0x2ecc71` (Verde Lendário), `0xffffff` (Branco Ultra Instinct).

---

## 3. Plano de Redesenho Progressivo

O plano de evolução visual é dividido em 3 fases de execução técnica e estética, garantindo compatibilidade total com animações, estados de transformação e paletas dinâmicas:

### Fase 1: Redesenho do Núcleo Anatômico e Vestuário Principal (Torso & Pernas) — *[IMPLEMENTADO]*
- **Objetivo**: Elevar a qualidade de todos os 10 modelos de torso e 9 modelos de pernas.
- **Implementações Realizadas**:
  - **Iluminação Tri-Tonal Direcional**: Introdução de funções de sombreamento procedural `getShade()` e `getLight()` para criar brilhos especulares nos músculos/tecidos e sombras de dobra profundas (`DEEP`).
  - **Micromodelagem Anatômica**: Adição de clavículas, serráteis, corte de peitorais e gomos de 8-pack em torsos expostos (`muscle`, `luffy`).
  - **Acessórios Integrados e Fivelas**: Adição de fivelas metálicas polidas com brilhos brancos, zíperes de 2 tons (`saitama`, `naruto`), cordas Shimenawa com nós trançados (`sasuke`) e faixas Obi volumosas (`goku`).
  - **Textura e Desgaste de Tecidos**: Barras desfiadas felpudas no jeans (`luffy`), ataduras médicas com sombras de costura e coldre de shuriken 3D (`naruto`).

### Fase 2: Redesenho de Extremidades (Pés/Calçados e Cabeça/Cabelos) — *[FASE SEGUINTE]*
- **Objetivo**: Alinhar o nível de acabamento dos calçados e cabeças com o novo padrão dos torsos e pernas.
- **Metas**:
  - Sombreamento em degradê suave nos fios e pontas de cabelos normais, SSJ e UI.
  - Articulação nítida de dedos e tiras em sandálias abertas (`luffy`, `naruto`, `sasuke`).
  - Reflexos metálicos em sapatos de verniz e botas espaciais com ranhuras em alto relevo (`jotaro`, `vegeta`).

### Fase 3: Dinâmica Avançada e Acessórios Vivos — *[FASE FINAL]*
- **Objetivo**: Dotar acessórios de física visual e partículas complementares.
- **Metas**:
  - Capas com ondulação multi-quadro no ciclo de caminhada e carica.
  - Brilho pulsante no HUD do Scouter durante ataques especiais.
  - Rastros de corte de energia na lâmina da katana sincronizados com o frame exato do golpe.

---
*Documento homologado para o sistema de customização do Until The Last Warrior.*
