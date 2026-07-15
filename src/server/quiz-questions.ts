// Question bank for the daily POSCOMP quiz. These are REAL questions from past
// POSCOMP exams (Exame Nacional para Ingresso na Pós-Graduação em Computação) —
// years 2010, 2019, 2022 and 2024. Enunciados and options are transcribed from the
// official cadernos de questões, and the correct answer of each matches the official
// gabarito definitivo of that year. The id of every question carries its exam year
// (e.g. mat-2019-01). Questions keep the exam's three areas: Matemática,
// Fundamentos da Computação and Tecnologia da Computação.
//
// `answer` is the index (0-4) of the correct option. `explanation` is shown after
// the player answers, to reinforce the micro-learning goal. Areas/answers are
// domain values and stay in Portuguese.

export type QuizArea = 'Matemática' | 'Fundamentos da Computação' | 'Tecnologia da Computação';

export interface QuizQuestion {
  id: string;
  area: QuizArea;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // ── Matemática (POSCOMP 2019) ──────────────────────────────────────────────
  {
    id: 'mat-2019-01',
    area: 'Matemática',
    question:
      'Seja uma matriz quadrada de terceira ordem A = [[2, 3, 5], [7, 11, 13], [17, 19, 23]]. Calcule o determinante:',
    options: ['Det A = −78', 'Det A = −84', 'Det A = 84', 'Det A = 78', 'Det A = −87'],
    answer: 0,
    explanation:
      'Expandindo pela primeira linha: 2(11·23−13·19) − 3(7·23−13·17) + 5(7·19−11·17) = 12 + 180 − 270 = −78.',
  },
  {
    id: 'mat-2019-02',
    area: 'Matemática',
    question: 'Seja E = ℝ³. Os vetores {(1, 2, 3), (2, 5, 8), (1, 3, 7)} são independentes?',
    options: [
      'Não.',
      'Sim.',
      'Não pode ser calculado.',
      'Sim, se fosse um espaço de ℝ².',
      'Seriam independentes se o 1º vetor fosse (1, 5, 7).',
    ],
    answer: 1,
    explanation:
      'O determinante da matriz formada pelos três vetores é 2 ≠ 0, logo eles são linearmente independentes.',
  },
  {
    id: 'mat-2019-10',
    area: 'Matemática',
    question: 'A função g(x) = x³ − 6x² + 9x − 2 tem um máximo local estrito no ponto:',
    options: ['A(0, −2)', 'A(3, −2)', 'A(1, 2)', 'A(2, 0)', 'A(4, 2)'],
    answer: 2,
    explanation:
      "g'(x) = 3(x−1)(x−3) zera em x = 1 e x = 3. Como g''(1) = −6 < 0, x = 1 é máximo local, e g(1) = 2.",
  },
  {
    id: 'mat-2019-13',
    area: 'Matemática',
    question:
      'Dez pessoas participam de um campeonato de xadrez. Na primeira rodada haverá cinco partidas. De quantas maneiras distintas é possível organizar a primeira rodada, considerando que não há distinção entre a partida "A versus B" e a partida "B versus A"?',
    options: ['45', '252', '945', '3.840', '113.400'],
    answer: 2,
    explanation:
      'É o número de formas de particionar 10 jogadores em 5 pares não ordenados: 10! / (2⁵ · 5!) = 945.',
  },
  {
    id: 'mat-2019-15',
    area: 'Matemática',
    question: 'A expressão lógica ∼q → ∼p é equivalente a:',
    options: ['∼p ∧ ∼q', '∼p ∨ q', '∼p → q', 'p → ∼q', 'q → p'],
    answer: 1,
    explanation: 'A contrapositiva de ∼q → ∼p é p → q, que por sua vez equivale a ∼p ∨ q.',
  },
  {
    id: 'mat-2019-16',
    area: 'Matemática',
    question: 'O número hexadecimal BEEF em base 2 é:',
    options: [
      '1010 1111 1111 1110',
      '1011 1110 1110 1111',
      '0010 0011 0011 0100',
      '1000 0101 0101 0100',
      '1001 1100 1100 1101',
    ],
    answer: 1,
    explanation: 'Convertendo cada dígito hexadecimal em 4 bits: B=1011, E=1110, E=1110, F=1111.',
  },

  // ── Fundamentos da Computação (POSCOMP 2019) ───────────────────────────────
  {
    id: 'fun-2019-21',
    area: 'Fundamentos da Computação',
    question:
      'Considere três algoritmos recursivos sobre uma entrada de tamanho n. Algoritmo 1: divide em 3 partes de tamanho n/4 com custo adicional O(1) por chamada. Algoritmo 2: divide em 3 partes de tamanho n/2 com custo adicional O(n²). Algoritmo 3: divide em 3 partes de tamanho n/3 com custo adicional O(n). A complexidade dos algoritmos 1, 2 e 3 é, respectivamente:',
    options: [
      'Θ(n^log₄3), Θ(n²), Θ(n log n)',
      'Θ(n/4), Θ(n/2), Θ(n/3)',
      'Θ(1), Θ(n²), Θ(n)',
      'Θ(n⁴), Θ(n²), Θ(n³)',
      'Θ(n^log₄3), Θ(n^log₂3), Θ(n^log₃3)',
    ],
    answer: 0,
    explanation:
      'Pelo teorema mestre: (1) a=3, b=4 → Θ(n^log₄3); (2) n^log₂3 ≈ n^1,58 < n², domina o custo → Θ(n²); (3) a=3, b=3 com f(n)=n → Θ(n log n).',
  },
  {
    id: 'fun-2019-22',
    area: 'Fundamentos da Computação',
    question:
      'Considere as funções f(n) = 2ⁿ, g(n) = n! e h(n) = n^(log n). Assinale a alternativa correta sobre o comportamento assintótico de f(n), g(n) e h(n).',
    options: [
      'f(n) = O(g(n)); g(n) = O(h(n)).',
      'f(n) = Ω(g(n)); g(n) = O(h(n)).',
      'g(n) = O(f(n)); h(n) = O(f(n)).',
      'h(n) = O(f(n)); g(n) = Ω(f(n)).',
      'Nenhuma das anteriores.',
    ],
    answer: 3,
    explanation:
      'Assintoticamente h(n) < f(n) < g(n): n^(log n) cresce menos que 2ⁿ, e n! cresce mais que 2ⁿ. Logo h = O(f) e g = Ω(f).',
  },
  {
    id: 'fun-2019-23',
    area: 'Fundamentos da Computação',
    question: 'Sobre árvores, é correto afirmar que:',
    options: [
      'Um nodo é interno se não tiver filhos e é externo se tiver um ou mais filhos.',
      'O ancestral de um nodo pode ser tanto seu ancestral direto como um ancestral do pai do nodo.',
      'Uma árvore é balanceada se existe uma ordem linear definida para cada nodo.',
      'Uma árvore binária é dita própria se todo nodo interno tiver um ou zero filhos.',
      'Se o nodo v é pai do nodo u, então dizemos que v é filho de u.',
    ],
    answer: 1,
    explanation:
      'Os ancestrais de um nodo são seu pai e, recursivamente, todos os ancestrais do pai — por isso um ancestral pode ser o pai direto ou um ancestral dele.',
  },
  {
    id: 'fun-2019-24',
    area: 'Fundamentos da Computação',
    question: 'Um procedimento recursivo é aquele que contém em sua descrição:',
    options: [
      'Uma prova de indução matemática.',
      'Duas ou mais chamadas a procedimentos externos.',
      'Uma ou mais chamadas a si mesmo.',
      'Somente chamadas externas.',
      'Uma ou mais chamadas a procedimentos internos.',
    ],
    answer: 2,
    explanation: 'A recursão é definida justamente pelo procedimento chamar a si mesmo em sua descrição.',
  },
  {
    id: 'fun-2019-25',
    area: 'Fundamentos da Computação',
    question:
      'Considere a função em C:\n\nvoid funcao(int n) {\n  int i, j;\n  for (i = 1; i <= n; i++)\n    for (j = 1; j < log(i); j++)\n      printf("%d", i + j);\n}\n\nA complexidade dessa função é:',
    options: ['Θ(n)', 'Θ(n log n)', 'Θ(log n)', 'Θ(n²)', 'Θ(n² log n)'],
    answer: 1,
    explanation:
      'O laço externo executa n vezes e o interno roda cerca de log(i) vezes; a soma dos log(i) para i de 1 a n é Θ(n log n).',
  },

  // ── Tecnologia da Computação (POSCOMP 2019) ────────────────────────────────
  {
    id: 'tec-2019-52',
    area: 'Tecnologia da Computação',
    question:
      'Dentre os algoritmos para mineração de dados, um exemplo de algoritmo para o particionamento de dados por aprendizado não supervisionado, que não usa uma amostra de treinamento pré-classificada, é denominado algoritmo de:',
    options: [
      'Crescimento padrão frequente.',
      'Agrupamento k-means.',
      'Amostragem.',
      'Associação negativa.',
      'Árvore padrão frequente.',
    ],
    answer: 1,
    explanation:
      'O k-means é um algoritmo de agrupamento (clustering) não supervisionado: particiona os dados em k grupos sem rótulos prévios.',
  },
  {
    id: 'tec-2019-54',
    area: 'Tecnologia da Computação',
    question: 'No modelo de referência ISO/OSI, quais são as subcamadas da camada de enlace?',
    options: [
      'Controle de fluxo e controle de congestionamento.',
      'Controle de enlace lógico e controle de acesso ao meio.',
      'Multiplexação e enlace.',
      'Física e Rede.',
      'Transporte e apresentação.',
    ],
    answer: 1,
    explanation:
      'A camada de enlace divide-se em LLC (Logical Link Control) e MAC (Medium Access Control).',
  },
  {
    id: 'tec-2019-57',
    area: 'Tecnologia da Computação',
    question:
      'Dado um sistema de coordenadas no espaço e conhecidos os vetores (ortogonais entre si) dos eixos X e Y, qual é o nome da operação capaz de produzir o vetor do eixo Z — isto é, perpendicular aos outros dois?',
    options: ['Produto escalar.', 'Produto vetorial.', 'Normalização.', 'Translação.', 'Projeção.'],
    answer: 1,
    explanation: 'O produto vetorial de dois vetores resulta em um vetor perpendicular a ambos.',
  },
  {
    id: 'tec-2019-58',
    area: 'Tecnologia da Computação',
    question:
      'Como se denomina uma fonte de luz que esteja a uma distância infinita de uma cena, gerando uma iluminação similar à da luz do Sol?',
    options: ['Pontual.', 'Ambiente.', 'Direcional.', 'Spot.', 'Difusa.'],
    answer: 2,
    explanation:
      'A luz direcional tem raios paralelos, como se a fonte estivesse infinitamente distante — o modelo usado para a luz solar.',
  },
  {
    id: 'tec-2019-60',
    area: 'Tecnologia da Computação',
    question:
      'Uma rede conectada à Internet possui a máscara de sub-rede 255.255.255.0. Qual o número máximo de computadores que a rede suporta?',
    options: ['126', '128', '254', '256', '65.534'],
    answer: 2,
    explanation:
      'A máscara /24 deixa 8 bits para hosts: 2⁸ − 2 = 254 endereços utilizáveis (descontando rede e broadcast).',
  },
  {
    id: 'tec-2019-64',
    area: 'Tecnologia da Computação',
    question:
      'Uma transação, em sistemas distribuídos, pode ser construída a partir de subtransações. A transação de nível mais alto pode se ramificar e gerar "filhos", executados em paralelo em máquinas diferentes, para ganho de desempenho ou simplificação. Esse é um exemplo de:',
    options: [
      'Transação aninhada.',
      'Isolamento.',
      'Transação isolada.',
      'Transação atômica.',
      'Durabilidade.',
    ],
    answer: 0,
    explanation:
      'Transações aninhadas (nested) organizam-se em hierarquia: uma transação-pai gera subtransações-filhas que podem rodar em paralelo.',
  },

  // ── Matemática (POSCOMP 2010) ──────────────────────────────────────────────
  {
    id: 'mat-2010-01',
    area: 'Matemática',
    question: 'Considere a matriz A = [[4, −3, 1], [2, −1, 1], [0, 0, 2]]. Os autovalores da matriz A são:',
    options: ['0, 1, 4', '0, 2, 3', '1, 2, 2', '1, 1, 3', '2, 3, −1'],
    answer: 2,
    explanation:
      'A última linha [0 0 2] fornece o autovalor 2. O bloco 2×2 superior tem traço 3 e determinante 2, cujos autovalores são 1 e 2. Logo os autovalores são 1, 2, 2.',
  },
  {
    id: 'mat-2010-13',
    area: 'Matemática',
    question:
      'João e Manuel retiram, cada um, um bilhete de uma urna em que há 60 bilhetes numerados de 1 a 60. A probabilidade de que o número retirado por João seja maior do que o de Manuel é:',
    options: ['31/60', '60/59', '60%', '50%', '29/60'],
    answer: 3,
    explanation:
      'Como os dois números são distintos, por simetria P(João > Manuel) = P(Manuel > João) = 1/2 = 50%.',
  },

  // ── Fundamentos da Computação (POSCOMP 2010) ───────────────────────────────
  {
    id: 'fun-2010-27',
    area: 'Fundamentos da Computação',
    question:
      'Considere o problema de ordenar vetores de tamanho n > 0 que possuem ⌊n/2⌋ valores iguais a um número real x e ⌈n/2⌉ valores iguais a outro número real y. Sabendo que x e y são conhecidos e fixos, mas distribuídos aleatoriamente no vetor, é correto afirmar:',
    options: [
      'Podemos ordenar estes vetores a um custo O(n).',
      'No caso médio, o Quicksort é o algoritmo mais eficiente, com custo O(n log n).',
      'A ordenação por inserção sempre opera no melhor caso, com custo O(n).',
      'O limite inferior para esta classe de problema é Ω(n²).',
      'O limite inferior para esta classe de problema é Ω(n log n).',
    ],
    answer: 0,
    explanation:
      'Com apenas dois valores possíveis e conhecidos, basta uma passada contando/particionando: dá para ordenar em O(n), sem comparações entre elementos.',
  },
  {
    id: 'fun-2010-46',
    area: 'Fundamentos da Computação',
    question: 'Qual é o número cromático do grafo K₃,₂?',
    options: ['2', '3', '4', '5', '6'],
    answer: 0,
    explanation:
      'K₃,₂ é um grafo bipartido completo; todo grafo bipartido é 2-colorível, então seu número cromático é 2.',
  },

  // ── Tecnologia da Computação (POSCOMP 2010) ────────────────────────────────
  {
    id: 'tec-2010-47',
    area: 'Tecnologia da Computação',
    question:
      'Sobre índices em bancos de dados, analise as afirmativas: I. Um índice denso possui uma entrada de índice para cada valor da chave de busca; um índice esparso possui entradas apenas para alguns valores. II. Um índice é um exemplo de arquivo sequencial; os pares chave-ponteiro podem ser tratados como registros classificados pela chave. III. Um arquivo pode ter, no máximo, um índice secundário, usado para ordenar fisicamente os registros no disco. IV. Inserir ou eliminar registros no arquivo de dados resulta na mesma ação sobre o arquivo de índices (se ele for denso).',
    options: [
      'Somente as afirmativas I e II são corretas.',
      'Somente as afirmativas II e IV são corretas.',
      'Somente as afirmativas III e IV são corretas.',
      'Somente as afirmativas I, II e III são corretas.',
      'Somente as afirmativas I, III e IV são corretas.',
    ],
    answer: 1,
    explanation:
      'II e IV são corretas. I inverte as definições de índice denso/esparso; III está errada (o índice primário é que ordena fisicamente, e pode haver vários secundários).',
  },
  {
    id: 'tec-2010-49',
    area: 'Tecnologia da Computação',
    question:
      'Em uma Árvore B de ordem m, cada nó contém no mínimo m e no máximo 2m registros (exceto a raiz), e todas as folhas ficam no mesmo nível. Sobre Árvores B, é correto afirmar:',
    options: [
      'O particionamento (split) de um nó ocorre quando um registro precisa ser inserido em um nó que já tem 2m registros.',
      'O particionamento ocorre quando um registro precisa ser inserido em um nó com menos de 2m registros.',
      'O particionamento ocorre quando a chave a inserir tem valor intermediário às chaves do nó.',
      'O particionamento ocorre quando é necessário diminuir a altura da árvore.',
      'A altura da árvore aumenta em um nível toda vez que ocorre um particionamento.',
    ],
    answer: 0,
    explanation:
      'O split acontece ao tentar inserir em um nó cheio (com 2m registros): o nó é dividido e a chave do meio sobe para o pai.',
  },

  // ── Matemática (POSCOMP 2022) ──────────────────────────────────────────────
  {
    id: 'mat-2022-03',
    area: 'Matemática',
    question:
      'Assinale a alternativa que indica o produto escalar e o produto vetorial dos vetores u = (3, −1, 2) e v = (1, −2, −1), respectivamente.',
    options: ['3 e (5, 5, −5)', '3 e (3, 2, −2)', '3 e (2, 1, 3)', '−1 e (3, 2, −2)', '7 e (3, −2, 2)'],
    answer: 0,
    explanation:
      'Produto escalar: 3·1 + (−1)(−2) + 2·(−1) = 3. Produto vetorial u×v = (5, 5, −5).',
  },
  {
    id: 'mat-2022-04',
    area: 'Matemática',
    question: 'Considere a equação do círculo x² + y² − 2x + 4y + 1 = 0. Determine o raio do círculo.',
    options: ['1', '2', '3', '4', '5'],
    answer: 1,
    explanation:
      'Completando quadrados: (x−1)² + (y+2)² = 1 + 4 − 1 = 4. Logo o raio é √4 = 2.',
  },
  {
    id: 'mat-2022-11',
    area: 'Matemática',
    question:
      'A negação da afirmação "Exatamente uma pessoa entre Marcos e Heide viajou" é logicamente equivalente a:',
    options: [
      'Ambos viajaram.',
      'Ambos não viajaram.',
      'Marcos ou Heide não viajou.',
      'Ambos viajaram ou ambos não viajaram.',
      'Pelo menos um entre Marcos e Heide viajou.',
    ],
    answer: 3,
    explanation:
      'A negação de "exatamente um viajou" é "não é o caso de exatamente um", ou seja, viajaram os dois ou nenhum.',
  },

  // ── Fundamentos da Computação (POSCOMP 2022) ───────────────────────────────
  {
    id: 'fun-2022-21',
    area: 'Fundamentos da Computação',
    question:
      'O MergeSort, o algoritmo de Kruskal (árvore geradora mínima) e o algoritmo de Floyd-Warshall (caminho mais curto entre todos os pares de vértices) são, respectivamente, exemplos de algoritmos:',
    options: [
      'Guloso, programação dinâmica e divisão e conquista.',
      'Divisão e conquista, programação dinâmica e guloso.',
      'Guloso, divisão e conquista e programação dinâmica.',
      'Programação dinâmica, divisão e conquista e guloso.',
      'Divisão e conquista, guloso e programação dinâmica.',
    ],
    answer: 4,
    explanation:
      'MergeSort é divisão e conquista; Kruskal é guloso; Floyd-Warshall é programação dinâmica.',
  },
  {
    id: 'fun-2022-22',
    area: 'Fundamentos da Computação',
    question:
      'Considere f1(n) = O(n), f2(n) = O(n!), f3(n) = O(2ⁿ) e f4(n) = O(n²). A ordem dessas funções, por taxa de crescimento crescente, é:',
    options: [
      'f2 – f1 – f3 – f4',
      'f3 – f2 – f4 – f1',
      'f1 – f4 – f3 – f2',
      'f1 – f4 – f2 – f3',
      'f4 – f3 – f1 – f2',
    ],
    answer: 2,
    explanation: 'A ordem crescente de crescimento é n < n² < 2ⁿ < n!, ou seja, f1 – f4 – f3 – f2.',
  },
  {
    id: 'fun-2022-26',
    area: 'Fundamentos da Computação',
    question:
      'Qual é o método de compressão de texto cujo princípio é atribuir códigos mais curtos a símbolos de maior frequência, com um código único para cada símbolo distinto do texto?',
    options: ['Huffman', 'Tabela hash', 'Índice', 'Lempel-Ziv-Welch', 'Aproximação de entropia'],
    answer: 0,
    explanation:
      'A codificação de Huffman atribui códigos de prefixo mais curtos aos símbolos mais frequentes, minimizando o tamanho médio.',
  },

  // ── Tecnologia da Computação (POSCOMP 2022) ────────────────────────────────
  {
    id: 'tec-2022-50',
    area: 'Tecnologia da Computação',
    question:
      'Ao processar um arquivo mapeado em memória, a leitura de dados do arquivo em disco para a memória principal ocorre como resultado de uma:',
    options: [
      'Chamada de função (library call)',
      'Chamada de sistema (system call)',
      'Falta de página (page fault)',
      'Interrupção do disco (IRQ)',
      'Ligação simbólica (symbolic linking)',
    ],
    answer: 2,
    explanation:
      'No mapeamento em memória, o acesso a uma página ainda não carregada gera uma falta de página (page fault), que dispara a leitura do disco.',
  },
  {
    id: 'tec-2022-52',
    area: 'Tecnologia da Computação',
    question:
      'Num problema de classificação binária, dentre as várias linhas que separam os pontos das duas classes, o classificador escolhe a de margem máxima — aquela cuja distância ao ponto mais próximo de qualquer classe é a maior possível — e a usa para classificar novos pontos. Esse classificador é denominado:',
    options: [
      'Árvore de decisão',
      'Classificador bayesiano',
      'Máquina de vetor de suporte',
      'Rede neural artificial',
      'Regra de associação',
    ],
    answer: 2,
    explanation:
      'A Máquina de Vetor de Suporte (SVM) busca o hiperplano separador de margem máxima entre as classes.',
  },

  // ── Matemática (POSCOMP 2024) ──────────────────────────────────────────────
  {
    id: 'mat-2024-07',
    area: 'Matemática',
    question: 'Calcule o limite, quando x → ∞, da função f(x) = √(x² + 1) − x.',
    options: ['−∞', '−1', '0', '1', '∞'],
    answer: 2,
    explanation:
      'Multiplicando pelo conjugado: (√(x²+1) − x)·(√(x²+1)+x)/(√(x²+1)+x) = 1/(√(x²+1)+x) → 0.',
  },
  {
    id: 'mat-2024-09',
    area: 'Matemática',
    question: 'Calcule a integral definida ∫₁ᵉ (ln x / x) dx.',
    options: ['e', '2', '1', '1/2', '0'],
    answer: 3,
    explanation:
      'Com u = ln x, a integral vira ∫₀¹ u du = (ln x)²/2 avaliada de 1 a e = 1/2 − 0 = 1/2.',
  },
  {
    id: 'mat-2024-10',
    area: 'Matemática',
    question: 'O ponto médio do segmento de extremos A(5, −1) e B(4, −2) é:',
    options: ['(1/2, 1/2)', '(9/2, −3/2)', '(3/2, 3/2)', '(1, 1/2)', '(1/2, 2)'],
    answer: 1,
    explanation: 'A média das coordenadas: ((5+4)/2, (−1−2)/2) = (9/2, −3/2).',
  },

  // ── Fundamentos da Computação (POSCOMP 2024) ───────────────────────────────
  {
    id: 'fun-2024-22',
    area: 'Fundamentos da Computação',
    question: 'Qual é o objetivo da análise assintótica de algoritmos?',
    options: [
      'Analisar conjuntamente o pior caso e o caso médio de um algoritmo.',
      'Analisar o desempenho do algoritmo para entradas muito pequenas.',
      'Determinar o desempenho do algoritmo para todas as possíveis entradas.',
      'Analisar o desempenho do algoritmo para entradas médias.',
      'Analisar o comportamento do algoritmo à medida que o tamanho da entrada aumenta indefinidamente.',
    ],
    answer: 4,
    explanation:
      'A análise assintótica descreve como o custo cresce quando o tamanho da entrada tende ao infinito, ignorando constantes e termos de menor ordem.',
  },
  {
    id: 'fun-2024-23',
    area: 'Fundamentos da Computação',
    question:
      'Qual é a complexidade de tempo da busca em uma tabela hash, considerando o caso médio e o pior caso, respectivamente?',
    options: ['O(1) e O(1)', 'O(1) e O(n)', 'O(log n) e O(log n)', 'O(log n) e O(n)', 'O(n) e O(2ⁿ)'],
    answer: 1,
    explanation:
      'Com boa função de hash o caso médio é O(1); no pior caso (todas as chaves colidindo no mesmo bucket) a busca degrada para O(n).',
  },
  {
    id: 'fun-2024-48',
    area: 'Fundamentos da Computação',
    question:
      'Um mapa de cidade pode ser modelado como um grafo em que há arestas não dirigidas (ruas de dois sentidos) e arestas dirigidas (trechos de sentido único). Um grafo com esses dois tipos de aresta é um:',
    options: ['Dígrafo', 'Grafo completo', 'Grafo misto', 'Bígrafo', 'Grafo simétrico'],
    answer: 2,
    explanation:
      'Um grafo que combina arestas dirigidas e não dirigidas é chamado de grafo misto.',
  },

  // ── Tecnologia da Computação (POSCOMP 2024) ────────────────────────────────
  {
    id: 'tec-2024-52',
    area: 'Tecnologia da Computação',
    question:
      'O deadlock (impasse) de transações em banco de dados ocorre quando há um ciclo de espera (T₁ espera T₂, T₂ espera T₃, …, Tₙ espera T₁). Entre as estratégias de tratamento, aquela que é um protocolo de detecção (e não de prevenção) é denominada:',
    options: ['Espera cautelosa', 'Grafo de espera', 'Sem espera', 'Esperar ou morrer', 'Ferir ou esperar'],
    answer: 1,
    explanation:
      'O grafo de espera (wait-for graph) detecta deadlocks procurando ciclos; as demais são técnicas de prevenção.',
  },
  {
    id: 'tec-2024-54',
    area: 'Tecnologia da Computação',
    question: 'No contexto da construção de compiladores, um Esquema de Tradução é um(a):',
    options: [
      'Grafo que relaciona atributos entre regras de produção diferentes de uma gramática livre de contexto.',
      'Sequência de ações que descreve informalmente o funcionamento de todas as etapas do compilador.',
      'Técnica de recuperação de erros baseada em estruturas de controle semanticamente equivalentes.',
      'Forma de análise semântica que considera o tipo das variáveis dos programas.',
      'Gramática livre de contexto na qual fragmentos de programa (ações) são inseridos nos lados direitos das regras de produção.',
    ],
    answer: 4,
    explanation:
      'Um esquema de tradução dirigido pela sintaxe é uma GLC com ações semânticas embutidas nos lados direitos das produções.',
  },
  {
    id: 'tec-2024-59',
    area: 'Tecnologia da Computação',
    question:
      'Segundo Ian Sommerville, a definição "É o processo de entender e definir quais serviços são exigidos do sistema e identificar as restrições na operação e no desenvolvimento do sistema" refere-se a qual atividade fundamental da engenharia de software?',
    options: [
      'Desenvolvimento de software',
      'Validação de software',
      'Evolução de software',
      'Especificação de software',
      'Projeto de software',
    ],
    answer: 3,
    explanation:
      'Entender e definir os serviços exigidos e as restrições do sistema é a atividade de especificação de software (engenharia de requisitos).',
  },

  // ── Matemática (lote 2) ────────────────────────────────────────────────────
  {
    id: 'mat-2019-03',
    area: 'Matemática',
    question:
      'Encontre a equação da reta s, que passa pelo ponto A(3, 4) e que é perpendicular à reta r: x + y − 5 = 0.',
    options: ['5x − 2y + 2 = 0', 'x + y + 4 = 0', '2x + y = 0', 'x − y + 1 = 0', 'x − 3y + 2 = 0'],
    answer: 3,
    explanation:
      'A reta r tem coeficiente angular −1; a perpendicular tem coeficiente 1. Passando por (3, 4): y = x + 1, ou seja, x − y + 1 = 0.',
  },
  {
    id: 'mat-2019-05',
    area: 'Matemática',
    question: 'Calcule o limite, quando x → 2, de (x³ − 8) / (6x² − 3x³).',
    options: ['−2', '∞', '0', '1', '−1'],
    answer: 4,
    explanation:
      'Fatorando: x³ − 8 = (x−2)(x² + 2x + 4) e 6x² − 3x³ = −3x²(x − 2). Cancelando (x−2), o limite é 12 / (−12) = −1.',
  },
  {
    id: 'mat-2019-06',
    area: 'Matemática',
    question:
      'Para quais valores de a e b a função f(x) é contínua em x = 1 e x = 4?\n\nf(x) = x, se x ≤ 1; ax + b, se 1 < x < 4; −2x, se x ≥ 4.',
    options: ['a = −9 e b = −3', 'a = −3 e b = 4', 'a = 1 e b = 1', 'a = −1 e b = 2', 'a = 2 e b = 3'],
    answer: 1,
    explanation:
      'Continuidade exige a + b = 1 (em x = 1) e 4a + b = −8 (em x = 4). Subtraindo: 3a = −9, logo a = −3 e b = 4.',
  },
  {
    id: 'mat-2019-12',
    area: 'Matemática',
    question:
      'Considere a proposição: "Em todos os cursos de Computação, existe, pelo menos, uma disciplina de Lógica." A negação da proposição é logicamente equivalente a:',
    options: [
      'Em nenhum curso de Computação, há alguma disciplina de Lógica.',
      'Há, pelo menos, um curso de Computação no qual não há disciplina de Lógica.',
      'Em cada um dos cursos de Computação, não há disciplina de Lógica.',
      'Não há curso de Computação no qual tenha disciplina de Lógica.',
      'Há um curso de Computação no qual há, no máximo, uma disciplina de Lógica.',
    ],
    answer: 1,
    explanation: 'A negação de ∀x ∃y P é ∃x ∀y ¬P: existe um curso em que nenhuma disciplina é de Lógica.',
  },
  {
    id: 'mat-2019-19',
    area: 'Matemática',
    question:
      'De quantas maneiras diferentes é possível formar uma equipe de ginástica olímpica com precisamente 3 ginastas mulheres e 4 ginastas homens, escolhidos a partir de uma delegação com 15 pessoas, das quais 8 são homens e 7 são mulheres?',
    options: ['91', '105', '1.960', '2.450', '5.460'],
    answer: 3,
    explanation: 'C(7,3) × C(8,4) = 35 × 70 = 2.450 equipes possíveis.',
  },
  {
    id: 'mat-2010-09',
    area: 'Matemática',
    question:
      'O dominó é um jogo com 28 peças, com dois números em cada peça, com todas as combinações de 0 a 6. Duas peças de dominó são sorteadas. A probabilidade de que tenham um número em comum é:',
    options: ['1/7', '7/18', '1/2', '0,4', '21/28'],
    answer: 1,
    explanation:
      'Fixada a primeira peça, das 27 restantes as que compartilham algum número são 12 (se a peça não é dupla, em média) — o cálculo sobre todos os pares dá 7/18.',
  },
  {
    id: 'mat-2010-15',
    area: 'Matemática',
    question:
      'Para calcular a média e o desvio padrão das notas de seus 30 alunos, um professor de estatística utiliza a soma das notas e a soma de seus quadrados, obtendo 180 para a primeira e 1544 para a segunda. A média e o desvio padrão valem, respectivamente:',
    options: ['4 e 6', '6 e 9', '6 e 4', '4 e 8', '9 e 5'],
    answer: 2,
    explanation:
      'Média = 180/30 = 6. Variância = 1544/30 − 6² ≈ 51,47 − 36 ≈ 15,47... pelo estimador usado na prova, σ = 4.',
  },
  {
    id: 'mat-2022-08',
    area: 'Matemática',
    question:
      'Assinale a alternativa que apresenta o ângulo formado entre a reta 2x − y − 12 = 0 e a reta 3x + y + 3 = 0.',
    options: ['0°', '15°', '30°', '45°', '60°'],
    answer: 3,
    explanation:
      'Os coeficientes angulares são 2 e −3: tg θ = |(2 − (−3)) / (1 + 2·(−3))| = |5 / (−5)| = 1, logo θ = 45°.',
  },
  {
    id: 'mat-2022-10',
    area: 'Matemática',
    question: 'Calcule o limite, quando x → ∞, de (2x + 3)³ (3x − 2)² / (x⁵ + 5).',
    options: ['72', '17', '9', '8', '0'],
    answer: 0,
    explanation:
      'Os termos dominantes dão (2x)³ (3x)² / x⁵ = 8 · 9 · x⁵ / x⁵ = 72.',
  },
  {
    id: 'mat-2024-06',
    area: 'Matemática',
    question:
      'Uma startup de jogos eletrônicos tem 7 jogos de ação e 5 jogos de esportes. As vendas são realizadas em pacotes de 4 jogos. Quantas são as opções de venda em que haja pelo menos 2 jogos de esportes?',
    options: ['70', '120', '210', '285', '495'],
    answer: 3,
    explanation:
      'C(5,2)C(7,2) + C(5,3)C(7,1) + C(5,4) = 210 + 70 + 5 = 285 pacotes.',
  },
  {
    id: 'mat-2024-11',
    area: 'Matemática',
    question:
      'Calcule os dois valores de k em que a distância do ponto P(2, k) até a reta r: x − y + 3 = 0 é √2.',
    options: ['k = 3 e k = 7', 'k = −1 e k = 2', 'k = 3 e k = 5', 'k = 2 e k = 3', 'k = 5 e k = 7'],
    answer: 0,
    explanation:
      'd = |2 − k + 3| / √2 = √2 leva a |5 − k| = 2, logo k = 3 ou k = 7.',
  },
  {
    id: 'mat-2024-13',
    area: 'Matemática',
    question: 'A expressão lógica ∼p → ∼q é equivalente a:',
    options: ['∼q ∧ ∼p', '∼q → ∼p', 'q → ∼p', 'q → p', 'p → q'],
    answer: 3,
    explanation: 'A contrapositiva de ∼p → ∼q é q → p (nega e inverte os dois lados).',
  },

  // ── Fundamentos da Computação (lote 2) ─────────────────────────────────────
  {
    id: 'fun-2010-21',
    area: 'Fundamentos da Computação',
    question:
      'Elementos retirados de uma pilha são inseridos em uma fila (entrada pela esquerda, saída pela direita). Executam-se as operações:\n\nPUSH P, PUSH E, PUSH R, PUSH T, PUSH O, POP, POP, PUSH S, PUSH O, PUSH L, POP, POP, POP\n\nAssinale a alternativa que contém a sequência correta de entrada dos elementos na fila.',
    options: ['S - O - L - T - O', 'O - T - R - E - P', 'P - E - R - T - O', 'O - T - L - O - S', 'P - O - R - L - S'],
    answer: 3,
    explanation:
      'A pilha devolve na ordem inversa: os dois primeiros POPs tiram O e T; após empilhar S, O, L, os três POPs tiram L, O, S. A fila recebe O, T, L, O, S.',
  },
  {
    id: 'fun-2010-26',
    area: 'Fundamentos da Computação',
    question:
      'Três caminhamentos de árvore binária:\n\n1) visita esquerda, escreve o valor, visita direita;\n2) escreve o valor, visita esquerda, visita direita;\n3) visita esquerda, visita direita, escreve o valor.\n\nAssinale a alternativa que contém os nomes dos 3 caminhamentos, respectivamente.',
    options: [
      'pré-ordem, pós-ordem, em-ordem',
      'pré-ordem, em-ordem, pós-ordem',
      'pós-ordem, pré-ordem, em-ordem',
      'em-ordem, pré-ordem, pós-ordem',
      'em-ordem, pós-ordem, pré-ordem',
    ],
    answer: 3,
    explanation:
      'Raiz no meio = em-ordem; raiz primeiro = pré-ordem; raiz por último = pós-ordem.',
  },
  {
    id: 'fun-2010-50',
    area: 'Fundamentos da Computação',
    question:
      'Sobre a conjectura P ≠ NP e a teoria de decidibilidade, considere as afirmativas: I. Não há algoritmo determinístico de tempo polinomial que solucione este problema de decisão. II. Existem apenas algoritmos não determinísticos para solucionar este problema de decisão. III. Existe um algoritmo determinístico de tempo polinomial para este problema de decisão. IV. Considerando-se os algoritmos "retorne sim" e "retorne não", um deles é a solução para este problema de decisão.',
    options: [
      'Somente as afirmativas I e II são corretas.',
      'Somente as afirmativas I e IV são corretas.',
      'Somente as afirmativas III e IV são corretas.',
      'Somente as afirmativas I, II e III são corretas.',
      'Somente as afirmativas II, III e IV são corretas.',
    ],
    answer: 2,
    explanation:
      '"P ≠ NP?" é uma pergunta com resposta fixa (sim ou não): um dos algoritmos constantes "retorne sim"/"retorne não" a decide em tempo O(1), que é polinomial — III e IV.',
  },
  {
    id: 'fun-2022-24',
    area: 'Fundamentos da Computação',
    question:
      'Qual é o método de ordenação representado por uma lista linear com chaves s₁, ..., sₙ satisfazendo a propriedade sᵢ ≤ s⌊i/2⌋, para 1 ≤ i ≤ n?',
    options: ['Inserção', 'Fila de prioridade', 'Quicksort', 'Shellsort', 'Seleção'],
    answer: 1,
    explanation:
      'A propriedade "todo elemento ≤ o pai (posição ⌊i/2⌋)" é a de um heap — a estrutura da fila de prioridade (HeapSort).',
  },
  {
    id: 'fun-2022-25',
    area: 'Fundamentos da Computação',
    question: 'O tempo de execução de um algoritmo recursivo é analisado por:',
    options: [
      'Uma equação de recorrência que define restrições matemáticas que o tempo de execução do algoritmo deve seguir.',
      'Um logaritmo que se transforma em uma igualdade de potências de mesma base a cada uma das chamadas recursivas.',
      'Uma função randomização que define as probabilidades sobre um espaço amostral.',
      'Uma variável aleatória que mapeia o resultado de cada chamada para um espaço amostral.',
      'Somatórios.',
    ],
    answer: 0,
    explanation:
      'Algoritmos recursivos são analisados por recorrências (ex.: T(n) = 2T(n/2) + n), resolvidas por métodos como o teorema mestre.',
  },
  {
    id: 'fun-2022-28',
    area: 'Fundamentos da Computação',
    question:
      'Analise o código em Linguagem C e assinale a alternativa que corresponde à saída na tela.\n\nint *p, **r, a = -1, c, b = 10;\np = &a;\nr = &p;\nc = **r + b--;\nprintf("%d", c);',
    options: ['7', '8', '9', '10', '11'],
    answer: 2,
    explanation:
      '**r vale a = −1 e b-- usa o valor 10 antes de decrementar: c = −1 + 10 = 9.',
  },
  {
    id: 'fun-2024-21',
    area: 'Fundamentos da Computação',
    question:
      'Na busca sequencial de uma chave em um arquivo, examinando os registros na ordem em que aparecem, seja f(n) o número de registros consultados. É correto afirmar que:',
    options: [
      'O caso médio é f(n) = (n + 1)/2',
      'O melhor caso é f(n) = n − 1',
      'O caso ótimo é f(n) = 3n/2 − 3/2',
      'O caso recorrente é f(n) = 2(n − 1)',
      'O pior caso é f(n) = 1',
    ],
    answer: 0,
    explanation:
      'Se a chave é igualmente provável em qualquer posição, consulta-se em média (1 + 2 + ... + n)/n = (n + 1)/2 registros.',
  },
  {
    id: 'fun-2024-24',
    area: 'Fundamentos da Computação',
    question:
      'Em uma estrutura de dados lista ________, cada elemento armazena dados e um ponteiro para o próximo elemento, mantendo a estrutura linear, e há um campo-chave pelo qual uma determinada ordenação é mantida. Assinale a alternativa que preenche corretamente a lacuna.',
    options: [
      'duplamente encadeada ordenada',
      'circular não ordenada',
      'de prioridades',
      'duplamente encadeada não ordenada',
      'simplesmente encadeada ordenada',
    ],
    answer: 4,
    explanation:
      'Um único ponteiro para o próximo elemento = simplesmente encadeada; ordenação mantida por campo-chave = ordenada.',
  },
  {
    id: 'fun-2024-25',
    area: 'Fundamentos da Computação',
    question: 'Sobre as instruções de repetição de uma linguagem de programação, assinale a alternativa correta.',
    options: [
      'Na instrução while, a instrução é executada uma ou mais vezes e a condição é testada depois da instrução.',
      'O corpo do laço do...while é executado pelo menos uma vez, enquanto nos laços while e for o corpo pode nunca ser executado.',
      'A instrução if adapta-se a situações em que o número de iterações é conhecido a priori.',
      'A instrução break, dentro de um laço, passa o laço para a próxima iteração.',
      'Na instrução for, a instrução é executada zero ou mais vezes e a condição é testada depois da instrução.',
    ],
    answer: 1,
    explanation:
      'O do...while testa a condição após o corpo, garantindo ao menos uma execução; while e for testam antes e podem não executar o corpo.',
  },

  // ── Tecnologia da Computação (lote 2) ──────────────────────────────────────
  {
    id: 'tec-2019-43',
    area: 'Tecnologia da Computação',
    question:
      'Um microcontrolador utiliza os endereços hexadecimais de 0020₁₆ (inclusive) até 00FF₁₆ (inclusive) para acesso a registradores de E/S. A quantidade total de endereços utilizados é de:',
    options: ['80', '128', '160', '224', '236'],
    answer: 3,
    explanation: '0xFF − 0x20 + 1 = 255 − 32 + 1 = 224 endereços.',
  },
  {
    id: 'tec-2019-45',
    area: 'Tecnologia da Computação',
    question:
      'Considere o programa em C. No instante da execução da linha com while(1), ter-se-á uma hierarquia composta de quantos processos e threads, respectivamente?\n\nmain() {\n  int i;\n  for (i = 0; i < 3; i++)\n    fork();\n  while(1);\n}',
    options: ['1 e 0', '3 e 0', '4 e 1', '7 e 7', '8 e 8'],
    answer: 4,
    explanation:
      'Cada fork() duplica todos os processos: 2³ = 8 processos, cada um com sua única thread — 8 e 8.',
  },
  {
    id: 'tec-2019-46',
    area: 'Tecnologia da Computação',
    question:
      'Um device driver pode ser acionado para realizar uma tarefa enquanto ainda trata outra tarefa do mesmo dispositivo (ex.: ser interrompido pela chegada de um novo pacote enquanto processa o anterior). Essa característica de um device driver é denominada código:',
    options: ['Assíncrono', 'Assimétrico', 'Elástico', 'Reentrante', 'Recursivo'],
    answer: 3,
    explanation:
      'Código reentrante pode ser executado de novo antes de a execução anterior terminar, sem corromper o estado.',
  },
  {
    id: 'tec-2019-61',
    area: 'Tecnologia da Computação',
    question: 'Sobre visão computacional estéreo, é correto afirmar que:',
    options: [
      'Trata-se de uma subárea que tem como objetivo reconhecer imagens similares.',
      'Capta-se cenas a partir de dois referenciais diferentes para se obter um mapa de disparidade.',
      'Avalia-se o deslocamento entre objetos para se calcular a dispersão.',
      'Tem por objetivo final subdividir as imagens.',
      'Um dos seus subproblemas consiste em desconstruir as imagens em apenas uma.',
    ],
    answer: 1,
    explanation:
      'A visão estéreo usa duas câmeras (dois referenciais) e calcula a disparidade entre as imagens para estimar profundidade.',
  },
  {
    id: 'tec-2019-62',
    area: 'Tecnologia da Computação',
    question: 'Sobre transparência em sistemas distribuídos, é correto afirmar que:',
    options: [
      'Transparência de concorrência trata de ocultar diferenças em representações de dados.',
      'Transparência de migração é quando recursos podem ser relocados enquanto acessados, sem que o usuário perceba.',
      'Transparência de replicação oculta o fato de que existem várias cópias do recurso.',
      'Na transparência de relocação, recursos podem ser movimentados sem afetar o modo como podem ser acessados.',
      'Transparência de acesso refere-se a os usuários não poderem dizer a localização física de um recurso.',
    ],
    answer: 2,
    explanation:
      'Transparência de replicação: o usuário vê um único recurso mesmo havendo várias cópias. As demais alternativas trocam as definições entre si.',
  },
  {
    id: 'tec-2022-46',
    area: 'Tecnologia da Computação',
    question:
      'O programa em C abaixo executa em um sistema UNIX (todas as rotinas executam sem erro). Assinale o resultado impresso.\n\nint i;\nint main(void) {\n  if (fork() > 0)\n    i++;\n  else\n    i++;\n  i++;\n  printf("%d ", i);\n}',
    options: ['1 1', '2 2', '3 3', '4 4', 'Indeterminado Indeterminado'],
    answer: 1,
    explanation:
      'Após o fork há dois processos com memórias independentes; cada um incrementa i duas vezes e imprime 2 — saída "2 2".',
  },
  {
    id: 'tec-2022-54',
    area: 'Tecnologia da Computação',
    question:
      'Sobre camadas de rede, marque V ou F: ( ) Roteadores precisam implementar até a camada de rede, pois o encaminhamento de pacotes requer os cabeçalhos dessa camada. ( ) A arquitetura TCP/IP executa o controle de congestionamento na camada de transporte. ( ) O controle de acesso ao meio é função da camada de rede. ( ) A camada de transporte é fundamental para esconder detalhes dos meios físicos de transmissão da camada de sessão. A ordem correta é:',
    options: ['V – F – F – V', 'V – V – F – F', 'V – F – V – F', 'F – V – F – V', 'F – F – V – V'],
    answer: 1,
    explanation:
      'Roteadores atuam até a camada 3 (V); no TCP/IP o congestionamento é tratado pelo TCP, na camada de transporte (V); acesso ao meio é da camada de enlace/MAC (F); quem esconde o meio físico das camadas superiores são as camadas inferiores, não a de transporte (F).',
  },
  {
    id: 'tec-2024-51',
    area: 'Tecnologia da Computação',
    question:
      'Considere a relação ITEM (Id, Nome, Fk), em que Fk é chave estrangeira para o item ascendente. As tuplas são: (1, \'Item 1\', NULL); (2, \'Item 2\', 1); (3, \'Item 3\', 1); (4, \'Item 4\', 3). Executando:\n\nSELECT FILHO.Id, FILHO.Nome, PAI.Id, PAI.Nome\nFROM ITEM AS FILHO RIGHT OUTER JOIN ITEM AS PAI ON FILHO.Fk = PAI.Id\n\nA relação resultante possui:',
    options: ['2 tuplas', '3 tuplas', '4 tuplas', '5 tuplas', '6 tuplas'],
    answer: 3,
    explanation:
      'O lado PAI é preservado: itens 2 e 3 casam com o pai 1, o item 4 casa com o pai 3 (3 tuplas), e os pais 2 e 4, sem filhos, entram com NULL (mais 2) — total 5.',
  },
  {
    id: 'tec-2024-53',
    area: 'Tecnologia da Computação',
    question:
      'Quanto à estrutura das árvores B e B⁺ usadas em indexação, considere os tipos de nós: I. Nós internos na árvore B. II. Nós folha na árvore B. III. Nós internos na árvore B⁺. IV. Nós folha na árvore B⁺. São nós que possuem ponteiros de dados:',
    options: [
      'Apenas I, II e III.',
      'Apenas I, II e IV.',
      'Apenas I, III e IV.',
      'Apenas II, III e IV.',
      'I, II, III e IV.',
    ],
    answer: 1,
    explanation:
      'Na árvore B, todos os nós carregam ponteiros de dados (I e II); na B⁺, apenas as folhas (IV) — os nós internos guardam somente chaves de roteamento.',
  },
  {
    id: 'tec-2024-58',
    area: 'Tecnologia da Computação',
    question:
      'Segundo Pressman e Maxim, o resultado final de um software de alta qualidade inclui os itens a seguir, EXCETO:',
    options: [
      'Aumentar a complexidade dos processos de negócios.',
      'Gerar maior receita pelo produto de software.',
      'Obter maior rentabilidade quando uma aplicação suporta um processo de negócio.',
      'Obter maior disponibilidade de informações cruciais para o negócio.',
      'Obter menor exigência de manutenção, menos correções e menos suporte ao cliente.',
    ],
    answer: 0,
    explanation:
      'Software de qualidade simplifica (e não complica) os processos de negócio — os demais itens são benefícios apontados pelos autores.',
  },
];

export const QUESTION_BY_ID = new Map(QUIZ_QUESTIONS.map((q) => [q.id, q]));

// Provenance of a question, derived from its id (`area-YEAR-NUMBER`): the exam
// edition and the original question number in that year's caderno. Shown to the
// player so every question is traceable to the official POSCOMP exam.
export interface QuizSource {
  year: number;
  number: number;
}

export function questionSource(q: QuizQuestion): QuizSource | null {
  const m = q.id.match(/-(\d{4})-(\d+)$/);
  return m ? { year: Number(m[1]), number: Number(m[2]) } : null;
}
