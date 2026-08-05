// Question bank for the daily POSCOMP quiz. These are REAL questions from past
// POSCOMP exams (Exame Nacional para Ingresso na Pós-Graduação em Computação) —
// years 2010, 2019, 2022, 2024 and 2025. Enunciados and options are transcribed from
// the official cadernos de questões, and the correct answer of each matches the
// official gabarito definitivo of that year. The id of every question carries its exam year
// (e.g. mat-2019-01). Questions keep the exam's three areas: Matemática,
// Fundamentos da Computação and Tecnologia da Computação.
//
// `answer` is the index (0-4) of the correct option. `explanation` is shown after
// the player answers, to reinforce the micro-learning goal. Areas/answers are
// domain values and stay in Portuguese.

/** Difficulty buckets. Numeric so they stay comparable and sortable, but always
 *  referred to by name — the ladder, the aids and the admin panel all depend on
 *  the ordering FACIL < MEDIO < DIFICIL. */
export const DIFFICULTY = { FACIL: 1, MEDIO: 2, DIFICIL: 3 } as const;
export const DIFFICULTY_COUNT = 3;

export type QuizArea = 'Matemática' | 'Fundamentos da Computação' | 'Tecnologia da Computação';

export interface QuizQuestion {
  id: string;
  area: QuizArea;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  // Deeper walk-through of the same question, revealed only if the player expands
  // the short explanation. Assigned per id in LONG_EXPLANATION_BY_ID below; ids
  // without an entry get '' and the UI hides the expander.
  explanationLong: string;
  // Difficulty bucket: DIFFICULTY.FACIL, .MEDIO or .DIFICIL. The Show's prize
  // ladder is split evenly across the three. Assigned per id in
  // DIFFICULTY_BY_ID below; absent ids default to médio.
  difficulty: number;
  // Fine-grained theme (players can filter runs by it) — see TOPIC_BY_ID below.
  topic: string;
}

const RAW_QUESTIONS: Omit<QuizQuestion, 'difficulty' | 'topic' | 'explanationLong'>[] = [
  // ── Matemática (POSCOMP) ───────────────────────────────────────────────────
  // Inclui tanto as questões teóricas/conceituais (lógica, quantificadores)
  // quanto as de cálculo (álgebra linear, integrais, combinatória, geometria
  // analítica, estatística), que entraram a partir da edição de 2025.
  {
    id: 'mat-2019-15',
    area: 'Matemática',
    question: 'A expressão lógica ∼q → ∼p é equivalente a:',
    options: ['∼p ∧ ∼q', '∼p ∨ q', '∼p → q', 'p → ∼q', 'q → p'],
    answer: 1,
    explanation: 'A contrapositiva de ∼q → ∼p é p → q, que por sua vez equivale a ∼p ∨ q.',
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

  // ── Matemática — lógica (POSCOMP 2022) ─────────────────────────────────────
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

  // ── Matemática — lógica (lote 2) ───────────────────────────────────────────
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

  // ── Matemática — lógica e grafos (POSCOMP 2024) ────────────────────────────
  {
    id: 'mat-2024-05',
    area: 'Matemática',
    question:
      'Em um grafo simples não direcionado com n vértices, a quantidade máxima de arestas é n(n−1)/2. Qual é o número máximo de arestas que um grafo não direcionado G com 7 vértices pode ter sem formar um ciclo?',
    options: ['6', '7', '10', '11', '21'],
    answer: 0,
    explanation:
      'Um grafo sem ciclos é uma floresta; o máximo de arestas ocorre quando ele é uma árvore, com n−1 arestas. Para n=7, são 6 arestas.',
  },
  {
    id: 'mat-2024-14',
    area: 'Matemática',
    question:
      'Dadas duas proposições lógicas q e p, a proposição lógica ∼(p ∨ q) é verdadeira se, e somente se, for falsa a proposição:',
    options: ['p ∧ q', '∼p', '∼p → q', '∼p → ∼q', '∼q'],
    answer: 2,
    explanation:
      '∼(p ∨ q) é verdadeira exatamente quando p ∨ q é falsa. Como ∼p → q ≡ p ∨ q, essa é a proposição que precisa ser falsa.',
  },
  {
    id: 'mat-2024-15',
    area: 'Matemática',
    question:
      'Considere as premissas verdadeiras: (1) Se Ana Paula joga vôlei ou Joaquim joga videogame, então Victória vai à praia. (2) Hoje, Victória não foi à praia. (3) Se hoje é sábado, então Ana Paula joga vôlei e Caio treina boxe. É correto afirmar que:',
    options: [
      'Hoje é sábado e Ana Paula jogou vôlei.',
      'Hoje não é sábado e Joaquim não jogou videogame.',
      'Ana Paula jogou vôlei ou Joaquim jogou videogame.',
      'Hoje é sábado e Joaquim jogou videogame.',
      'Hoje não é sábado e Ana Paula jogou vôlei.',
    ],
    answer: 1,
    explanation:
      'De (2) e (1), por modus tollens, nem Ana jogou vôlei nem Joaquim jogou videogame. Por (3), como Ana não jogou vôlei, hoje não é sábado.',
  },

  // ── Fundamentos da Computação (POSCOMP 2024) ───────────────────────────────
  {
    id: 'fun-2024-26',
    area: 'Fundamentos da Computação',
    question:
      'No caminhamento _______ de uma árvore T, a raiz de T é visitada em primeiro lugar, e então as subárvores enraizadas nos seus filhos são percorridas recursivamente. Assinale a alternativa que preenche corretamente a lacuna.',
    options: ['simétrico', 'em largura', 'central', 'pré-fixado', 'pós-fixado'],
    answer: 3,
    explanation:
      'No percurso pré-fixado (pré-ordem) a raiz é visitada antes das subárvores dos filhos.',
  },
  {
    id: 'fun-2024-28',
    area: 'Fundamentos da Computação',
    question:
      'Sobre a ponte norte e a ponte sul de uma placa-mãe, analise: I. A ponte norte comunica o processador com dispositivos de E/S de baixa velocidade, e a ponte sul conecta a RAM e a placa de vídeo. II. A ponte sul conecta o processador diretamente à RAM e à placa de vídeo, e a ponte norte lida com armazenamento e periféricos de E/S. III. A ponte norte faz a interface entre o processador e componentes de alta velocidade como a RAM e a placa de vídeo, e a ponte sul gerencia dispositivos de E/S de menor velocidade. IV. As duas pontes são substituíveis e podem ser usadas indistintamente. Quais estão corretas?',
    options: ['Apenas I.', 'Apenas II.', 'Apenas III.', 'Apenas I e II.', 'Apenas III e IV.'],
    answer: 2,
    explanation:
      'A ponte norte conecta o processador aos componentes de alta velocidade (RAM, GPU); a ponte sul cuida dos dispositivos de E/S mais lentos. Apenas a assertiva III está correta.',
  },
  {
    id: 'fun-2024-29',
    area: 'Fundamentos da Computação',
    question:
      'Qual dos seguintes métodos permite a transferência de dados entre um dispositivo de entrada e saída e a memória principal sem o intermédio da CPU?',
    options: ['Polling.', 'Interrupções.', 'E/S mapeada em memória.', 'Direct Memory Access (DMA).', 'E/S programada.'],
    answer: 3,
    explanation:
      'O DMA (Direct Memory Access) permite que dispositivos transfiram dados de/para a memória principal sem passar pela CPU, liberando o processador.',
  },
  {
    id: 'fun-2024-36',
    area: 'Fundamentos da Computação',
    question: 'Qual das seguintes linguagens pode ser gerada por uma gramática regular?',
    options: [
      "{w ∈ {a,b}* | o número de a's em w é maior que o número de b's}",
      "{w ∈ {a,b}* | o número de a's em w é o dobro do número de b's}",
      "{w ∈ {a,b}* | o número de a's em w é divisível por 3 e o número de b's é ímpar}",
      "{w ∈ {a,b}* | w contém o mesmo número de a's e b's}",
      "{w ∈ {a,b}* | w contém números diferentes de a's e b's}",
    ],
    answer: 2,
    explanation:
      "Contar divisibilidade/paridade exige apenas memória finita (estados) e é regular. As demais comparam quantidades de a's e b's, o que não é regular (exigiria uma pilha).",
  },
  {
    id: 'fun-2024-38',
    area: 'Fundamentos da Computação',
    question:
      'O _______, de _______, demonstra limitações dos sistemas formais e a impossibilidade de provar certas afirmações dentro deles. Já o _______, de _______, pergunta se um determinado programa irá eventualmente parar ou entrar em loop infinito para uma entrada dada. Preencha correta e respectivamente as lacunas.',
    options: [
      'Teorema da Incompletude – Alan Turing – Problema da Parada – Kurt Gödel',
      'Teorema da Incompletude – Kurt Gödel – Problema da Parada – Alan Turing',
      'Problema da Parada – Alan Turing – Teorema da Incompletude – Kurt Gödel',
      'Problema da Parada – Kurt Gödel – Teorema da Incompletude – Alonzo Church',
      'Teorema da Incompletude – Alonzo Church – Problema da Parada – Alan Turing',
    ],
    answer: 1,
    explanation:
      'O Teorema da Incompletude é de Kurt Gödel; o Problema da Parada (Halting Problem) é de Alan Turing.',
  },
  {
    id: 'fun-2024-39',
    area: 'Fundamentos da Computação',
    question:
      'Considerando arquivos e registros, assinale a alternativa correta sobre a estrutura de armazenamento e recuperação de informações em memória secundária.',
    options: [
      'Um arquivo é um conjunto de dados de diferentes tipos, e cada item individual dentro de um arquivo é chamado de byte.',
      'Um programa não pode ser considerado um arquivo, pois é executável e não segue a mesma estrutura de arquivos de dados.',
      'Na memória secundária, o sistema operacional armazena informações em grupos, chamados blocos, para aumentar a eficiência na transferência de dados entre a memória secundária e a principal.',
      'A estrutura de armazenamento em memória secundária não utiliza arquivos e registros, mas sim páginas e segmentos.',
      'Na memória secundária os dados são armazenados exclusivamente em formato não hierárquico, o que impede a organização em pastas ou diretórios.',
    ],
    answer: 2,
    explanation:
      'Os dados em memória secundária são organizados em blocos, a unidade de transferência entre disco e memória principal, para maior eficiência de E/S.',
  },
  {
    id: 'fun-2024-40',
    area: 'Fundamentos da Computação',
    question: 'Considerando a compressão de dados, assinale a alternativa correta.',
    options: [
      'A compressão pode ser alcançada atribuindo descrições curtas aos resultados mais frequentes da fonte e descrições mais longas aos menos frequentes.',
      'A compressão pode ser alcançada atribuindo descrições de comprimento uniforme a todos os resultados da fonte de dados.',
      'A desigualdade de Kraft afirma que os comprimentos dos códigos não precisam seguir qualquer padrão específico.',
      'A codificação de Huffman minimiza o tamanho da mensagem codificada, porém sempre com perda de informação.',
      'A compressão de dados sempre resulta em perda de qualidade, independentemente do algoritmo utilizado.',
    ],
    answer: 0,
    explanation:
      'A compressão eficiente (ex.: Huffman) atribui códigos curtos aos símbolos mais frequentes e códigos mais longos aos menos frequentes, reduzindo o tamanho médio.',
  },
  {
    id: 'fun-2024-42',
    area: 'Fundamentos da Computação',
    question:
      'O gerenciamento de E/S é implementado em camadas. Um dispositivo notifica que realizou uma operação comunicando-se com a camada de _______ (usualmente via APIC), que informa a camada de _______ sobre o resultado. Quando o SO precisa programar o dispositivo, a camada de _______ se comunica diretamente com ele. Preencha correta e respectivamente as lacunas.',
    options: [
      'controladores de dispositivo – chamada de sistemas – tratadores de interrupção',
      'tratadores de interrupção – controladores de dispositivo – chamada de sistemas',
      'software independente de dispositivo – tratadores de interrupção – controladores de dispositivo',
      'controladores de dispositivo – software independente de dispositivo – chamada de sistemas',
      'tratadores de interrupção – controladores de dispositivo – controladores de dispositivo',
    ],
    answer: 4,
    explanation:
      'O dispositivo sinaliza (via APIC) os tratadores de interrupção, que informam os controladores de dispositivo; para programar o hardware, é a camada de controladores de dispositivo que fala diretamente com ele.',
  },
  {
    id: 'fun-2024-45',
    area: 'Fundamentos da Computação',
    question: 'Sobre os tipos de dados básicos, assinale a alternativa correta.',
    options: [
      'As variáveis do tipo inteiro armazenam valores sem parte fracionária, positivos e negativos.',
      'O tipo caractere permite armazenar strings ou conjuntos de caracteres em uma única variável do tipo caractere.',
      'Por padrão, uma variável do tipo inteiro admite somente valores positivos; para negativos é necessário um comando específico da linguagem.',
      'As variáveis do tipo vetor são utilizadas para armazenar valores numéricos com parte fracionária.',
      'O conjunto de operações do tipo caractere inclui soma, subtração, multiplicação, divisão inteira e resto da divisão.',
    ],
    answer: 0,
    explanation:
      'O tipo inteiro armazena números sem parte fracionária, podendo ser positivos ou negativos.',
  },

  // ── Tecnologia da Computação (POSCOMP 2024) ────────────────────────────────
  {
    id: 'tec-2024-46',
    area: 'Tecnologia da Computação',
    question:
      'Sobre estruturas (structs) em linguagens de programação, analise: I. Uma estrutura agrupa uma ou mais variáveis sob um único nome, para facilitar a referência. II. A declaração de uma estrutura corresponde unicamente à definição de um novo tipo, e não à declaração de variáveis desse tipo. III. Uma estrutura pode conter, na sua definição, variáveis simples, vetores, ponteiros ou mesmo outras estruturas. IV. As estruturas permitem agrupar diversos componentes, de tipos distintos, em uma única variável. Quais estão corretas?',
    options: ['Apenas I e II.', 'Apenas III e IV.', 'Apenas I, II e III.', 'Apenas II, III e IV.', 'I, II, III e IV.'],
    answer: 4,
    explanation:
      'Todas descrevem corretamente structs: agrupam variáveis (possivelmente de tipos distintos) sob um nome, definem um novo tipo e podem conter simples, vetores, ponteiros ou outras estruturas.',
  },
  {
    id: 'tec-2024-47',
    area: 'Tecnologia da Computação',
    question:
      'Um programa lê um salário e mostra o imposto: se o salário for negativo ou zero, mostra o erro; se for maior que 1000 paga 10% de imposto, senão paga apenas 5%. Qual instrução deve ser utilizada?',
    options: ['Laço encadeado.', 'Atribuição composta.', 'Laço infinito.', 'Condicional encadeada.', 'Atribuição simples.'],
    answer: 3,
    explanation:
      'As múltiplas faixas de decisão (≤ 0, > 1000, caso contrário) exigem condicionais aninhadas/encadeadas (if / else if / else).',
  },
  {
    id: 'tec-2024-49',
    area: 'Tecnologia da Computação',
    question:
      'A definição de um grafo agrupa arestas como uma coleção, não como um conjunto, permitindo que duas arestas não dirigidas tenham os mesmos pontos finais e que duas arestas dirigidas tenham a mesma origem e o mesmo destino. Tais arestas são chamadas de:',
    options: ['Paralelas.', 'Laços.', 'Adjacentes.', 'Incidentes.', 'Finais.'],
    answer: 0,
    explanation:
      'Arestas com os mesmos extremos (mesma origem e destino) são chamadas de arestas paralelas (ou múltiplas), característica de multigrafos.',
  },
  {
    id: 'tec-2024-50',
    area: 'Tecnologia da Computação',
    question:
      'Um _______ é um caminho em que os vértices de início e fim são os mesmos. Assinale a alternativa que preenche corretamente a lacuna.',
    options: ['arco', 'ciclo', 'caminho simples', 'laço', 'k-cubo'],
    answer: 1,
    explanation: 'Um ciclo é um caminho fechado, cujos vértices de início e fim coincidem.',
  },
  {
    id: 'tec-2024-55',
    area: 'Tecnologia da Computação',
    question:
      'Sobre representação intermediária (RI) na construção de compiladores, analise: I. Árvores sintáticas e código de três endereços são dois tipos de RI. II. Os enunciados de código de três endereços têm a forma geral x := y op z, em que x, y e z são nomes, constantes ou temporários criados pelo compilador; outras formas (desvios condicionais e incondicionais etc.) também são usadas. III. RIs podem ser produzidas usando Definições Dirigidas pela Sintaxe. IV. Autômatos finitos definem RIs, com os estados representando as variáveis do programa e as transições, instruções do código intermediário. Quais estão corretas?',
    options: ['Apenas I.', 'Apenas I e II.', 'Apenas II e IV.', 'Apenas I, II e III.', 'I, II, III e IV.'],
    answer: 3,
    explanation:
      'Árvores sintáticas e código de três endereços são RIs (I), a forma x := y op z e suas variações estão corretas (II) e RIs podem ser geradas por Definições Dirigidas pela Sintaxe (III). A assertiva IV é falsa.',
  },
  {
    id: 'tec-2024-57',
    area: 'Tecnologia da Computação',
    question:
      'Sobre técnicas de renderização e iluminação, analise: I. Ray Tracing simula a propagação da luz e é frequentemente usada em jogos por sua renderização eficiente em tempo real. II. Z-Buffer armazena a profundidade dos objetos e é usada para gerar as cenas ultrarrealistas do cinema, por representar o estado da arte da geração 3D. III. O Modelo de Reflexão de Phong combina reflexão difusa, especular e ambiente; por ser iluminação global que calcula incidência direta e indireta, não é muito usada em tempo real. Assinale a alternativa correta.',
    options: [
      'Todas as assertivas estão corretas.',
      'Todas as assertivas estão incorretas.',
      'Apenas as assertivas I e II estão corretas.',
      'Apenas as assertivas I e III estão corretas.',
      'Apenas as assertivas II e III estão corretas.',
    ],
    answer: 1,
    explanation:
      'Ray Tracing é custoso (não é o padrão de tempo real por velocidade); Z-Buffer resolve visibilidade, não gera o realismo cinematográfico; e o modelo de Phong é iluminação local (não global) e é usado em tempo real. Todas estão incorretas.',
  },
  {
    id: 'tec-2024-60',
    area: 'Tecnologia da Computação',
    question:
      'Sobre gerenciamento de configuração de software, analise: I. Os elementos que constituem todas as informações geradas durante o processo de software são conhecidos coletivamente como configuração de software. II. À medida que o trabalho de engenharia de software progride, forma-se uma hierarquia de itens de configuração de software. III. O gerenciamento de configuração é um conjunto de atividades para administrar as mudanças ao longo de todo o ciclo de vida do software. Quais estão corretas?',
    options: [
      'Todas as assertivas estão corretas.',
      'Todas as assertivas estão incorretas.',
      'Apenas as assertivas I e II estão corretas.',
      'Apenas as assertivas I e III estão corretas.',
      'Apenas as assertivas II e III estão corretas.',
    ],
    answer: 0,
    explanation:
      'As três afirmações descrevem corretamente a configuração de software, sua hierarquia de itens e o gerenciamento de mudanças ao longo do ciclo de vida.',
  },
  {
    id: 'tec-2024-61',
    area: 'Tecnologia da Computação',
    question: 'Em um Algoritmo Genético (AG), o operador de crossover é responsável por:',
    options: [
      'Avaliar a aptidão de cada indivíduo na população.',
      'Manter os melhores indivíduos de uma geração para a próxima.',
      'Modificar aleatoriamente os genes de um indivíduo para explorar novas soluções.',
      'Selecionar os indivíduos que participarão do processo de reprodução.',
      'Combinar partes dos cromossomos de dois pais para criar descendentes.',
    ],
    answer: 4,
    explanation:
      'O crossover (recombinação) combina material genético de dois pais para gerar descendentes; avaliação, elitismo, mutação e seleção são operadores distintos.',
  },
  {
    id: 'tec-2024-62',
    area: 'Tecnologia da Computação',
    question: 'Em relação aos Sistemas Especialistas, assinale a alternativa que melhor descreve o papel do motor de inferência.',
    options: [
      'Atua principalmente na otimização de algoritmos de aprendizado de máquina dentro do sistema.',
      'É responsável por gerenciar a interface de usuário do sistema.',
      'Utiliza as regras da base de conhecimento para derivar conclusões a partir de fatos específicos, simulando o raciocínio humano especializado.',
      'Substitui a necessidade de uma base de conhecimento, operando com base em dados brutos e estatísticas.',
      'Serve exclusivamente para a manutenção e atualização automática da base de dados.',
    ],
    answer: 2,
    explanation:
      'O motor de inferência aplica as regras da base de conhecimento sobre os fatos para derivar novas conclusões, emulando o raciocínio de um especialista.',
  },
  {
    id: 'tec-2024-63',
    area: 'Tecnologia da Computação',
    question:
      'Uma imagem digital é criada por digitalização em duas etapas: a _______, que discretiza as coordenadas no domínio espacial, e a _______, que discretiza os valores de amplitude dos pixels. Preencha correta e respectivamente as lacunas.',
    options: [
      'interpolação – ampliação',
      'modulação – codificação',
      'quantização – amostragem',
      'amostragem – quantização',
      'codificação – modulação',
    ],
    answer: 3,
    explanation:
      'A amostragem discretiza as coordenadas espaciais; a quantização discretiza os valores de amplitude (intensidade) dos pixels.',
  },
  {
    id: 'tec-2024-64',
    area: 'Tecnologia da Computação',
    question:
      'Sobre filtragem de imagens digitais, analise: I. Um filtro espacial de média resulta na suavização da imagem. II. Um filtro de frequência passa-baixa resulta no aguçamento da imagem. III. Um filtro espacial com o operador laplaciano resulta no aguçamento da imagem. IV. Para suavização usam-se apenas filtros no domínio espacial e para aguçamento apenas filtros no domínio das frequências. Quais estão corretas?',
    options: ['Apenas I e II.', 'Apenas I e III.', 'Apenas II e III.', 'Apenas II e IV.', 'I, II, III e IV.'],
    answer: 1,
    explanation:
      'O filtro de média suaviza (I) e o laplaciano aguça (III). O passa-baixa suaviza (não aguça), e ambos os efeitos podem ser obtidos tanto no domínio espacial quanto no de frequências.',
  },
  {
    id: 'tec-2024-65',
    area: 'Tecnologia da Computação',
    question:
      'Um roteador recebe um pacote com IP de origem 13.1.2.3 e IP de destino 11.1.2.5. Em qual rota ele encaminhará o pacote?',
    options: ['13.0.0.0/8', '13.1.0.0/16', '11.1.0.0/16', '13.1.2.0/24', '11.1.2.0/24'],
    answer: 4,
    explanation:
      'O encaminhamento usa o IP de destino (11.1.2.5) e o critério do prefixo mais longo (longest prefix match): 11.1.2.0/24 é a rota mais específica que casa com o destino.',
  },
  {
    id: 'tec-2024-66',
    area: 'Tecnologia da Computação',
    question: 'Sobre o protocolo IP, assinale a alternativa correta.',
    options: [
      'O protocolo IP é baseado em datagramas e orientado à conexão.',
      'O protocolo IP funciona segundo o melhor esforço possível, garantindo a entrega de mensagens.',
      'O protocolo IP é conhecido como a cola da Internet porque permite que outros protocolos sejam usados no seu lugar.',
      'Várias cópias de um pacote IP podem ser entregues.',
      'O datagrama IP identifica o destinatário através dos campos porta de destino e número IP de destino.',
    ],
    answer: 3,
    explanation:
      'O IP é sem conexão e não confiável (best-effort): não garante entrega nem ordem e duplicatas podem ocorrer. Portas são da camada de transporte, não do IP.',
  },
  {
    id: 'tec-2024-67',
    area: 'Tecnologia da Computação',
    question: 'Qual protocolo da camada de transporte o DNS (Domain Name Service) utiliza para consultas regulares?',
    options: ['TCP', 'TCP/IP', 'HTTP', 'CoAP', 'UDP'],
    answer: 4,
    explanation:
      'Consultas DNS regulares usam UDP (porta 53), por serem rápidas e de baixa sobrecarga; o TCP é reservado a casos como transferência de zona ou respostas grandes.',
  },
  {
    id: 'tec-2024-68',
    area: 'Tecnologia da Computação',
    question:
      'Os clientes não devem conhecer a distribuição de arquivos: um único conjunto de operações atende arquivos locais e remotos, e programas escritos para arquivos locais acessam arquivos remotos sem modificação. Qual é o requisito de transparência descrito para serviços de arquivos em sistemas distribuídos?',
    options: ['Localização.', 'Acesso.', 'Mobilidade.', 'Desempenho.', 'Mudança de escala.'],
    answer: 1,
    explanation:
      'A transparência de acesso permite operar sobre recursos locais e remotos com as mesmas operações, sem que o cliente perceba a diferença.',
  },
  {
    id: 'tec-2024-69',
    area: 'Tecnologia da Computação',
    question:
      'Uma falha _______ ocorre quando um servidor para abruptamente, mas estava funcionando corretamente até parar; uma vez que pare, nada mais se ouve dele (ex.: um SO que trava e só é resolvido reinicializando). Assinale a alternativa que preenche corretamente a lacuna.',
    options: ['por omissão', 'de temporização', 'de resposta', 'arbitrária', 'por queda'],
    answer: 4,
    explanation:
      'A falha por queda (crash) ocorre quando o servidor, antes correto, para completamente e deixa de responder.',
  },
  {
    id: 'tec-2024-70',
    area: 'Tecnologia da Computação',
    question:
      'O algoritmo de exclusão mútua _______ requer apenas três mensagens para entrar e sair de uma região crítica: uma requisição, uma permissão para entrar e uma liberação para sair. Assinale a alternativa que preenche corretamente a lacuna.',
    options: ['centralizado', 'descentralizado', 'distribuído', 'token-ring', 'relógios vetoriais'],
    answer: 0,
    explanation:
      'No algoritmo centralizado, um coordenador gerencia o acesso: requisição, permissão e liberação — três mensagens por uso da região crítica.',
  },

  // ── Matemática (POSCOMP 2025) ──────────────────────────────────────────────
  {
    id: 'mat-2025-01',
    area: 'Matemática',
    question:
      'Utilizando o método de Gauss, determine o valor de z no sistema de equações: 3x − 3y + z = −9; x + y − z = 1; 3x − 5y + z = 7.',
    options: ['z = −15', 'z = −8', 'z = −6', 'z = −1', 'z = 2'],
    answer: 0,
    explanation:
      'Subtraindo a 3ª equação da 1ª, x e z se cancelam: 2y = −16, logo y = −8. Substituindo na 2ª, x − z = 9. Levando à 1ª: 4z = −60, ou seja, z = −15.',
  },
  {
    id: 'mat-2025-02',
    area: 'Matemática',
    question: 'Sobre os autovalores e autovetores da matriz A = [[4, 1], [0, 2]], é correto afirmar que:',
    options: [
      'A possui autovalores complexos e não é diagonalizável',
      'Os autovalores de A são iguais e iguais a 3',
      'A não possui autovalores porque não é simétrica',
      'O autovalor 4 possui multiplicidade algébrica 2',
      'A possui dois autovalores reais e distintos: 4 e 2',
    ],
    answer: 4,
    explanation:
      'A matriz é triangular superior, então os autovalores são os próprios elementos da diagonal: 4 e 2. Sendo reais e distintos, A é diagonalizável.',
  },
  {
    id: 'mat-2025-03',
    area: 'Matemática',
    question:
      'Em R³ com o produto interno usual, dado o vetor v = (3, 4, 0) e o subespaço W gerado por w = (1, 0, 0), a projeção ortogonal de v sobre W é:',
    options: ['(0, 4, 0)', '(3, 4, 0)', '(1, 0, 0)', '(0, 0, 0)', '(3, 0, 0)'],
    answer: 4,
    explanation:
      'A projeção é (⟨v, w⟩ / ⟨w, w⟩)·w. Como ⟨v, w⟩ = 3 e ⟨w, w⟩ = 1, o resultado é 3·(1, 0, 0) = (3, 0, 0) — a componente de v na direção do eixo x.',
  },
  {
    id: 'mat-2025-04',
    area: 'Matemática',
    question:
      'Um processador executa tarefas compostas por micro-operações de dois tipos: tipo A, que dura 1 ciclo de clock, e tipo B, que dura 2 ciclos. Quantas sequências distintas de micro-operações formam uma tarefa com duração total de exatamente 8 ciclos?',
    options: ['21', '26', '34', '42', '55'],
    answer: 2,
    explanation:
      'Seja f(n) o número de sequências que somam n ciclos. A última operação é do tipo A ou B, então f(n) = f(n−1) + f(n−2), com f(0) = f(1) = 1. A sequência é 1, 1, 2, 3, 5, 8, 13, 21, 34 — logo f(8) = 34.',
  },
  {
    id: 'mat-2025-05',
    area: 'Matemática',
    question:
      'Um gerente precisa selecionar 4 especialistas de um grupo de 9. O grupo contém 3 especialistas que não podem trabalhar juntos: nenhum par entre eles pode aparecer na equipe. De quantas maneiras a equipe pode ser formada?',
    options: ['36', '75', '81', '120', '126'],
    answer: 1,
    explanation:
      'A equipe pode conter no máximo um dos 3 conflitantes. Com nenhum deles: C(6,4) = 15. Com exatamente um: 3 × C(6,3) = 3 × 20 = 60. Total 15 + 60 = 75.',
  },
  {
    id: 'mat-2025-06',
    area: 'Matemática',
    question:
      'Um rack possui 7 slots, nos quais devem ser alocados 3 servidores idênticos do tipo A e 4 do tipo B, um por slot. Por restrições de ventilação, dois servidores do tipo A não podem ocupar slots adjacentes. De quantas maneiras distintas os servidores podem ser dispostos?',
    options: ['10', '12', '15', '20', '35'],
    answer: 0,
    explanation:
      'Posicionando primeiro os 4 servidores B, formam-se 5 lacunas (antes, entre e depois deles). Basta escolher 3 dessas 5 lacunas para os servidores A, o que garante que nenhum fique adjacente: C(5,3) = 10.',
  },
  {
    id: 'mat-2025-07',
    area: 'Matemática',
    question:
      'Para encontrar os extremos condicionados de uma função f(x, y) sujeita à restrição g(x, y) = 0, o método dos multiplicadores de Lagrange consiste em resolver:',
    options: ['∇f = λg', '∇f = λ∇g', '∇f + ∇g = λ', 'f(x, y) = λg(x, y)', '∇(f · g) = λ'],
    answer: 1,
    explanation:
      'No ponto de extremo condicionado, a curva de nível de f tangencia a restrição, então os gradientes são paralelos: ∇f = λ∇g, resolvido junto com g(x, y) = 0.',
  },
  {
    id: 'mat-2025-08',
    area: 'Matemática',
    question:
      'Considere f(x) = x² no intervalo [0, 2]. Utilizando a regra dos trapézios com dois subintervalos, a aproximação da integral definida de x² de 0 a 2 é:',
    options: ['1,0', '2,0', '3,0', '4,0', '5,0'],
    answer: 2,
    explanation:
      'Com h = 1, a regra dos trapézios composta dá (h/2)·[f(0) + 2f(1) + f(2)] = (1/2)·[0 + 2 + 4] = 3. O valor exato é 8/3 ≈ 2,67; o trapézio superestima porque x² é convexa.',
  },
  {
    id: 'mat-2025-09',
    area: 'Matemática',
    question: 'Seja a função f(x, y) = x²y + 3y². O gradiente ∇f(x, y) é:',
    options: [
      '(2xy, x² + 6y)',
      '(x² + 3, 2xy + 6y)',
      '(2x + y, 3y² + x)',
      '(2x, 3y)',
      '(xy, y²)',
    ],
    answer: 0,
    explanation:
      'O gradiente reúne as derivadas parciais. Derivando em x (com y constante): 2xy. Derivando em y (com x constante): x² + 6y. Logo ∇f = (2xy, x² + 6y).',
  },
  {
    id: 'mat-2025-10',
    area: 'Matemática',
    question: 'As coordenadas do baricentro de um triângulo ABC, com A(2, −5), B(4, 0) e C(0, 2), são:',
    options: ['(2, −1)', '(6, −3)', '(3, −3/2)', '(−3/2, 3)', '(−1, 2)'],
    answer: 0,
    explanation:
      'O baricentro é a média aritmética dos vértices: x = (2 + 4 + 0)/3 = 2 e y = (−5 + 0 + 2)/3 = −1. Logo G = (2, −1).',
  },
  {
    id: 'mat-2025-11',
    area: 'Matemática',
    question:
      'A reta r passa pelo ponto P(1, 4, 3) e é paralela ao vetor V = (−3, −2, −3). Determine o ponto de interseção da reta r com o plano xy.',
    options: ['(0, −2, 3)', '(−2, 2, 0)', '(2, −2, 0)', '(0, −2, 2)', '(−3, −2, 0)'],
    answer: 1,
    explanation:
      'A reta é (1 − 3t, 4 − 2t, 3 − 3t). O plano xy é z = 0, então 3 − 3t = 0 dá t = 1. Substituindo: x = −2 e y = 2, ou seja, (−2, 2, 0).',
  },
  {
    id: 'mat-2025-12',
    area: 'Matemática',
    question: 'Determine a coordenada cartesiana do ponto P cuja coordenada polar é (3, π).',
    options: ['(3, 0)', '(π, 3)', '(3, π)', '(0, −3)', '(−3, 0)'],
    answer: 4,
    explanation:
      'A conversão é x = r·cos θ e y = r·sen θ. Com r = 3 e θ = π: x = 3·(−1) = −3 e y = 3·0 = 0. Logo P = (−3, 0).',
  },
  {
    id: 'mat-2025-14',
    area: 'Matemática',
    question:
      'Quantas linhas tem a tabela-verdade da fórmula (p ∧ q) → r, considerando que existem três proposições (p, q e r)?',
    options: ['3', '6', '8', '12', '16'],
    answer: 2,
    explanation:
      'Cada proposição assume dois valores, e a tabela precisa cobrir todas as combinações: 2³ = 8 linhas. O número de conectivos não altera a contagem, só o número de proposições distintas.',
  },
  {
    id: 'mat-2025-15',
    area: 'Matemática',
    question: 'Considerando a lógica de primeira ordem, qual das frases abaixo pode ser representada por ∀x P(x)?',
    options: [
      'Existe um número que é par',
      'Nenhum aluno passou na prova',
      'Todos os alunos estudaram',
      'Alguns alunos faltaram',
      'Pedro estudou para a prova',
    ],
    answer: 2,
    explanation:
      'O quantificador ∀ afirma que a propriedade vale para todos os elementos do domínio, que é exatamente a leitura de "Todos os alunos estudaram".',
  },
  {
    id: 'mat-2025-16',
    area: 'Matemática',
    question:
      'Considere a definição recursiva f(n) = 1 se n = 0, e f(n) = n · f(n − 1) se n > 0. Qual é o valor de f(4)?',
    options: ['12', '16', '20', '24', '32'],
    answer: 3,
    explanation:
      'A definição é a do fatorial. Desenrolando: f(4) = 4 · f(3) = 4 · 3 · f(2) = 4 · 3 · 2 · f(1) = 4 · 3 · 2 · 1 · f(0) = 24.',
  },
  {
    id: 'mat-2025-17',
    area: 'Matemática',
    question: 'Considerando um código de Hamming (7,4), qual das alternativas representa corretamente uma propriedade desse código?',
    options: [
      'Detecta até 3 erros e corrige até 2',
      'Corrige até 2 erros de bit por palavra',
      'Detecta até 2 erros e corrige até 1 erro',
      'Apenas detecta, mas não corrige erros',
      'Utiliza uma matriz geradora de 7 colunas e 3 linhas',
    ],
    answer: 2,
    explanation:
      'O Hamming (7,4) tem distância mínima 3. Com d = 3, detectam-se até d − 1 = 2 erros e corrige-se até ⌊(d − 1)/2⌋ = 1 erro por palavra.',
  },
  {
    id: 'mat-2025-18',
    area: 'Matemática',
    question: 'Sejam A = {x ∈ Z | −2 ≤ x ≤ 3} e B = {x ∈ Z | x é par e 0 ≤ x ≤ 6}. Qual é o conjunto A ∩ B?',
    options: ['{0, 2}', '{0, 2, 4}', '{−2, 0, 2}', '{−2, 0, 2, 4}', '{−2, −1, 0, 1, 2, 3}'],
    answer: 0,
    explanation:
      'A = {−2, −1, 0, 1, 2, 3} e B = {0, 2, 4, 6}. Os elementos comuns são apenas 0 e 2 — o 4 pertence a B mas não a A, e −2 pertence a A mas não a B.',
  },
  {
    id: 'mat-2025-19',
    area: 'Matemática',
    question: 'Sobre a correlação, assinale a alternativa correta.',
    options: [
      'A correlação linear procura medir o grau da relação entre duas variáveis determinísticas X e Y através da disposição dos pontos (X, Y) em torno de uma hipérbole',
      'A correlação é considerada negativa se os valores crescentes de X estiverem associados aos valores crescentes de Y',
      'A correlação é considerada positiva quando os valores crescentes de X estiverem associados a valores decrescentes de Y',
      'Na correlação linear perfeita positiva, os pontos (X, Y) estão perfeitamente alinhados; quando alinhados em sentido contrário, a correlação é denominada perfeita negativa',
      'Quando duas variáveis X e Y forem independentes, o coeficiente de correlação é espúrio, podendo apresentar valor próximo de ±1',
    ],
    answer: 3,
    explanation:
      'Correlação linear perfeita significa pontos exatamente sobre uma reta: r = +1 se a reta é crescente, r = −1 se decrescente. As demais trocam os sinais ou falam de hipérbole, não de reta.',
  },
  {
    id: 'mat-2025-20',
    area: 'Matemática',
    question:
      'Em relação às séries estatísticas, analise as assertivas e assinale V (verdadeira) ou F (falsa). I. A série temporal, também chamada cronológica ou histórica, identifica-se pelo caráter variável do fator cronológico. II. A série geográfica, ou de localização, apresenta como caráter variável somente o fator geográfico. III. Série heterógrada é aquela em que a variável apresenta variação discreta; são heterógradas a série temporal, a geográfica e a específica. IV. Série homógrada é aquela na qual o fenômeno apresenta subdivisões, e a distribuição de frequências é uma série homógrada. A ordem correta, de cima para baixo, é:',
    options: ['V – F – F – V', 'V – V – F – F', 'V – F – V – F', 'F – V – F – V', 'F – F – V – V'],
    answer: 1,
    explanation:
      'I e II são as definições corretas de série temporal e geográfica. III e IV estão invertidas: homógrada é a que não se subdivide (temporal, geográfica, específica) e heterógrada é a que se subdivide, como a distribuição de frequências.',
  },

  // ── Fundamentos da Computação (POSCOMP 2025) ───────────────────────────────
  {
    id: 'fun-2025-21',
    area: 'Fundamentos da Computação',
    question:
      'Um robô de resgate precisa decidir rapidamente a cada encruzilhada de um labirinto, sem poder voltar atrás nem ver o mapa completo, escolhendo sempre o caminho que parece melhor no momento. Qual estratégia algorítmica o robô estaria usando?',
    options: [
      'Força bruta, testando todas as combinações de caminhos',
      'Programação dinâmica, construindo soluções a partir de subproblemas menores',
      'Algoritmos gulosos (greedy), fazendo a melhor escolha local a cada passo',
      'Backtracking, explorando caminhos e retornando se não levarem ao objetivo',
      'Divisão e conquista, quebrando o problema em subproblemas independentes',
    ],
    answer: 2,
    explanation:
      'Decidir pelo melhor imediato, sem revisão e sem visão global, é a definição de algoritmo guloso. A impossibilidade de voltar atrás elimina backtracking, e a falta do mapa completo elimina as demais.',
  },
  {
    id: 'fun-2025-22',
    area: 'Fundamentos da Computação',
    question:
      'Considere a função recursiva: calcula_algo(n) retorna 1 se n ≤ 1, senão retorna calcula_algo(n−1) + calcula_algo(n−2). Sobre a complexidade de tempo T(N) e de espaço S(N) dessa implementação, é correto afirmar que:',
    options: [
      'T(N) = O(N) e S(N) = O(log N), devido à otimização de compilação',
      'T(N) = O(2^N) e S(N) = O(N), pela duplicação exponencial de chamadas e pela profundidade da pilha',
      'T(N) = O(N²) e S(N) = O(N), porque cada chamada adiciona uma entrada à pilha',
      'T(N) = O(N log N) e S(N) = O(1), pois a maioria das chamadas é memorizada implicitamente',
      'T(N) = O(log N) e S(N) = O(N), assumindo gerenciamento otimizado da pilha',
    ],
    answer: 1,
    explanation:
      'É Fibonacci ingênuo: cada chamada gera duas, formando uma árvore de tamanho exponencial, T(N) = O(2^N). O espaço segue a profundidade máxima da pilha, que é O(N), pois só um ramo fica ativo por vez.',
  },
  {
    id: 'fun-2025-23',
    area: 'Fundamentos da Computação',
    question: 'Sobre a notação assintótica, assinale a alternativa INCORRETA.',
    options: [
      'f(n) = O(g(n)) significa que f(n) cresce no máximo tão rápido quanto g(n), assintoticamente',
      'Se f(n) = 2n² + 3n e g(n) = n², então f(n) = O(g(n))',
      'O(c·g(n)) = O(g(n)) para qualquer constante c > 0',
      'A notação O (Big O) fornece um limite inferior assintótico para o tempo de execução de um algoritmo',
      'Se f(n) = O(g(n)) e g(n) = O(h(n)), então f(n) = O(h(n))',
    ],
    answer: 3,
    explanation:
      'Big O é limite superior, não inferior — quem dá limite inferior é Ω. As demais estão corretas: constantes somem, a transitividade vale e 2n² + 3n é O(n²).',
  },
  {
    id: 'fun-2025-24',
    area: 'Fundamentos da Computação',
    question:
      'A ordenação por inserção troca apenas itens adjacentes, então o menor item na posição mais à direita exige n−1 comparações e movimentações. Qual algoritmo contorna isso permitindo trocas entre registros distantes, rearranjando itens separados h posições de modo que todo h-ésimo item forme uma sequência ordenada (h-ordenada)?',
    options: ['Shellsort', 'Quicksort', 'Heapsort', 'Intercalação polifásica', 'Ordenação por seleção'],
    answer: 0,
    explanation:
      'O Shellsort é exatamente a inserção generalizada por incrementos h decrescentes. Trocas a distância h movem itens muito fora de lugar em poucos passos, e o último passo com h = 1 termina o serviço com o vetor quase ordenado.',
  },
  {
    id: 'fun-2025-25',
    area: 'Fundamentos da Computação',
    question:
      'Sobre pilhas e filas, analise as assertivas e assinale V (verdadeira) ou F (falsa). I. As pilhas possuem a propriedade de que o último item inserido é o primeiro a ser retirado. II. A ordem linear das pilhas é a ordem de chegada; pilhas são usadas quando se deseja processar itens na ordem "primeiro que chega, primeiro atendido". III. Uma fila é uma lista linear em que todas as inserções são realizadas em um extremo e todas as retiradas no outro. IV. Existe uma ordem linear para as filas, que é a ordem "do mais recente para o menos recente". A ordem correta, de cima para baixo, é:',
    options: ['V – F – F – V', 'V – V – F – F', 'V – F – V – F', 'F – V – F – V', 'F – F – V – V'],
    answer: 2,
    explanation:
      'I define LIFO (pilha) e III define FIFO (fila), ambas corretas. II atribui à pilha o comportamento da fila, e IV inverte a ordem da fila, que atende do mais antigo para o mais recente.',
  },
  {
    id: 'fun-2025-26',
    area: 'Fundamentos da Computação',
    question:
      'Em uma tabela hash, como duas ou mais chaves podem ser transformadas no mesmo endereço, é preciso tratar colisões. Uma forma de resolvê-las é construir uma _____________ para cada endereço da tabela, na qual todas as chaves com o mesmo endereço são armazenadas sequencialmente. Assinale a alternativa que preenche corretamente a lacuna.',
    options: ['lista generalizada', 'lista encadeada', 'pilha em arranjo', 'fila de prioridades', 'árvore de pesquisa binária'],
    answer: 1,
    explanation:
      'É o encadeamento separado (separate chaining): cada posição da tabela guarda o início de uma lista encadeada com todas as chaves que colidiram naquele endereço.',
  },
  {
    id: 'fun-2025-27',
    area: 'Fundamentos da Computação',
    question:
      'Um barramento de dados possui largura de 32 bits e opera a 200 MHz. A taxa de transferência máxima desse barramento é de quantos Mbps?',
    options: ['800', '1.600', '3.200', '6.400', '12.800'],
    answer: 3,
    explanation:
      'A taxa é largura × frequência: 32 bits × 200×10⁶ transferências/s = 6,4×10⁹ bits/s, ou seja, 6.400 Mbps.',
  },
  {
    id: 'fun-2025-28',
    area: 'Fundamentos da Computação',
    question:
      'O tipo de função de mapeamento que permite que cada bloco da memória principal seja carregado em qualquer linha da memória cache é o mapeamento:',
    options: ['relativo', 'aleatório', 'associativo por conjunto', 'direto', 'associativo'],
    answer: 4,
    explanation:
      'No mapeamento totalmente associativo, qualquer bloco pode ocupar qualquer linha. O direto fixa uma única linha por bloco, e o associativo por conjunto permite qualquer linha dentro de um conjunto restrito.',
  },
  {
    id: 'fun-2025-29',
    area: 'Fundamentos da Computação',
    question:
      'Sobre o tratamento de interrupções no ciclo de execução de um processador, analise as assertivas. I. Antes de executar a rotina de tratamento, é necessário salvar o contexto do processo corrente. II. Ao constatar a interrupção, o processador sinaliza que a reconheceu e em seguida realiza as tratativas para executar a rotina. III. A rotina de tratamento é executada em modo usuário, pois trata-se de uma função do programa em execução. Quais estão corretas?',
    options: ['Apenas I', 'Apenas II', 'Apenas III', 'Apenas I e II', 'I, II e III'],
    answer: 3,
    explanation:
      'I e II descrevem o protocolo padrão de interrupção. III está errada: o tratador roda em modo núcleo (kernel), com privilégios que o programa de usuário não possui.',
  },
  {
    id: 'fun-2025-30',
    area: 'Fundamentos da Computação',
    question: 'Considerando a função F(A,B,C) = A·C̄ + A·B̄·C + A·(B + C), qual é a função dual de F?',
    options: [
      'A·C̄ + A·B̄·C + A·(B + C)',
      'Ā·C + Ā·B·C̄ + Ā·(B̄ + C̄)',
      'A·C̄ * A·B̄·C * A·(B * C)',
      '(Ā + C) * (Ā + B + C̄) * (Ā + B̄ * C̄)',
      '(A + C̄) * (A + B̄ + C) * (A + B * C)',
    ],
    answer: 4,
    explanation:
      'O dual troca todo AND por OR e todo OR por AND, mantendo as variáveis e suas negações. Assim A·C̄ vira (A + C̄), A·B̄·C vira (A + B̄ + C) e A·(B + C) vira (A + B·C).',
  },
  {
    id: 'fun-2025-31',
    area: 'Fundamentos da Computação',
    question:
      'Considere a função F(W, X, Y, Z) com termos mínimos (minterms) = {11, 12, 14, 15} e termos não essenciais (don’t care) = {5, 6, 7}. Simplificada como soma de produtos, seria obtido:',
    options: ['W·X·Z̄ + W·Y·Z', 'W·X·Z̄ + W·Y·Z + X·Y', 'W·X·Z̄ + W·Y·Z + X·W̄', 'W·X·Z̄·Ȳ + W·Y·Z + X·Y·W', 'X·Y + W·Y·Z + W·X·Z̄·Ȳ'],
    answer: 0,
    explanation:
      'W·X·Z̄ cobre 1100 (12) e 1110 (14); W·Y·Z cobre 1011 (11) e 1111 (15). Os dois termos juntos cobrem exatamente os minterms pedidos, sem precisar recorrer aos don’t cares.',
  },
  {
    id: 'fun-2025-33',
    area: 'Fundamentos da Computação',
    question:
      'Relacione os paradigmas (1. Imperativo, 2. Funcional, 3. Orientado a Objetos, 4. Lógico, 5. Declarativo) às características, na ordem: ( ) aplicação de funções matemáticas, com imutabilidade e ausência de efeitos colaterais; ( ) foca no "quê", descrevendo o resultado sem especificar a sequência de passos; ( ) resolve problemas por encadeamento de regras e fatos, com inferência automática; ( ) centrada na modificação explícita de estados da memória por comandos sequenciais; ( ) organiza o programa em entidades que encapsulam dados e comportamentos, com herança. A ordem correta é:',
    options: ['3 – 5 – 2 – 1 – 4', '2 – 4 – 5 – 1 – 3', '5 – 3 – 2 – 4 – 1', '4 – 2 – 5 – 3 – 1', '2 – 5 – 4 – 1 – 3'],
    answer: 4,
    explanation:
      'Funções matemáticas sem efeitos colaterais é funcional (2); descrever o "quê" é declarativo (5); regras, fatos e inferência é lógico (4); estados e comandos sequenciais é imperativo (1); encapsulamento e herança é orientado a objetos (3).',
  },
  {
    id: 'fun-2025-34',
    area: 'Fundamentos da Computação',
    question: 'Sobre verificação de tipos e inferência de tipos em linguagens de programação, assinale a alternativa correta.',
    options: [
      'A verificação de tipos estática ocorre em tempo de execução, sendo comum em linguagens de script',
      'A inferência de tipos exige que o programador declare o tipo de cada variável, aumentando a verbosidade',
      'Linguagens com verificação dinâmica não detectam erros de tipo até que o trecho com erro seja executado',
      'A inferência de tipos compromete a segurança de tipos, pois o compilador pode supor tipos incorretos',
      'Verificação de tipos forte é sinônimo de verificação estática, garantindo detecção antes da execução',
    ],
    answer: 2,
    explanation:
      'Na tipagem dinâmica o tipo só é conferido quando a linha roda, então o erro pode ficar latente até um caminho raro ser executado. As outras invertem definições: estática é em compilação, inferência dispensa a declaração, e forte é ortogonal a estática.',
  },
  {
    id: 'fun-2025-35',
    area: 'Fundamentos da Computação',
    question:
      'Sobre polimorfismo em POO, analise as assertivas. I. É a capacidade de um objeto assumir diferentes formas, permitindo que métodos de mesmo nome se comportem de modo distinto em classes de uma mesma hierarquia. II. É alcançado principalmente por sobrescrita (overriding) e, em alguns contextos, por sobrecarga (overloading), esta última considerada polimorfismo de tempo de compilação. III. O polimorfismo de inclusão (por subtipo) permite tratar um objeto de subclasse como sendo da superclasse. IV. Visa aumentar a coesão e reduzir o acoplamento, tornando o código mais flexível e extensível. Quais estão corretas?',
    options: ['Apenas I e III', 'Apenas II e IV', 'Apenas III e IV', 'Apenas I, II e III', 'I, II, III e IV'],
    answer: 4,
    explanation:
      'As quatro descrevem corretamente o conceito: a definição geral, as duas formas de obtê-lo, o polimorfismo por subtipo e o efeito de projeto (menos acoplamento, mais extensibilidade).',
  },
  {
    id: 'fun-2025-36',
    area: 'Fundamentos da Computação',
    question:
      'Analise a expressão regular sobre o alfabeto {a, b}: (a+b)*a(a+b)* + (a+b)*b(a+b)*. A expressão pode ser simplificada como:',
    options: ['(a+b)*', 'a*b*', 'ab + ba', '(a+b)*(a+b)(a+b)*', 'a + ba + b'],
    answer: 3,
    explanation:
      'A união exige pelo menos um "a" OU pelo menos um "b", ou seja, pelo menos um símbolo qualquer — todas as cadeias não vazias. Isso é (a+b)*(a+b)(a+b)*, e não (a+b)*, que também aceitaria a cadeia vazia.',
  },
  {
    id: 'fun-2025-37',
    area: 'Fundamentos da Computação',
    question:
      'Sobre o lema do bombeamento para linguagens regulares, analise as assertivas. I. Se uma linguagem não satisfaz o lema, então ela não é regular. II. Se uma linguagem satisfaz o lema, então ela é regular. III. Toda linguagem regular satisfaz o lema. IV. O lema pode ser usado para provar que uma linguagem não é regular. V. O lema pode ser usado para provar que uma linguagem é regular. Quais estão corretas?',
    options: ['Apenas I, II e IV', 'Apenas I, III e IV', 'Apenas II, III e V', 'Apenas I, III, IV e V', 'I, II, III, IV e V'],
    answer: 1,
    explanation:
      'O lema é condição necessária, não suficiente: toda regular o satisfaz (III), então falhar nele prova não regularidade (I e IV). Satisfazê-lo não prova nada a favor, o que derruba II e V.',
  },
  {
    id: 'fun-2025-38',
    area: 'Fundamentos da Computação',
    question:
      'Sobre linguagens e gramáticas livres de contexto e autômatos com pilha, assinale V ou F. I. Derivações à esquerda e à direita de uma mesma cadeia podem resultar em árvores de derivação diferentes. II. Uma gramática é ambígua se existir ao menos uma cadeia com duas ou mais árvores de derivação distintas. III. Toda gramática livre de contexto pode ser transformada, sem alterar a linguagem, na Forma Normal de Chomsky. IV. Toda linguagem livre de contexto pode ser aceita por um autômato com pilha por critério de pilha vazia. V. A simplificação de uma gramática altera a linguagem gerada, pois remove símbolos inúteis e inacessíveis. A ordem correta é:',
    options: ['V – V – V – V – F', 'F – V – F – F – F', 'V – F – V – F – V', 'V – F – F – V – V', 'F – F – V – F – V'],
    answer: 0,
    explanation:
      'As quatro primeiras são verdadeiras — em gramática ambígua as duas derivações realmente podem dar árvores distintas. A última é falsa: remover símbolos inúteis e inacessíveis preserva exatamente a linguagem gerada.',
  },
  {
    id: 'fun-2025-39',
    area: 'Fundamentos da Computação',
    question:
      'Um Sistema de Gestão de Documentos e Arquivos (SGDA) gerencia o ciclo de vida dos documentos institucionais. São objetivos do SGDA, EXCETO:',
    options: [
      'Organizar os documentos, tanto digitais quanto físicos',
      'Classificar os documentos com base em planos de classificação e tabelas de temporalidade',
      'Controlar os prazos de guarda e descarte dos documentos',
      'Assegurar autenticidade, integridade, confiabilidade e acessibilidade dos documentos',
      'Substituir integralmente os arquivos físicos por versões digitais',
    ],
    answer: 4,
    explanation:
      'Um SGDA gerencia documentos em qualquer suporte, físico ou digital — a digitalização é um meio, não um objetivo. Substituir integralmente o acervo físico não é meta do sistema, e muitos documentos têm guarda física obrigatória.',
  },
  {
    id: 'fun-2025-40',
    area: 'Fundamentos da Computação',
    question:
      'Sobre compressão de imagens, assinale V ou F. I. RLE é uma técnica sem perdas, usada com frequência em imagens com grandes áreas da mesma cor. II. A compressão com perdas, como JPEG, preserva todos os dados originais após a descompressão. III. O formato BMP usa compressão com perdas para reduzir o tamanho dos arquivos. IV. RLE é mais eficiente em imagens com padrões simples e repetitivos do que em fotografias complexas. V. O BMP suporta alta resolução e profundidade de cor, mas não é adequado para a web pelo tamanho. A ordem correta é:',
    options: ['V – F – V – V – F', 'V – V – F – F – V', 'F – V – V – F – F', 'V – F – F – V – V', 'F – F – V – F – V'],
    answer: 3,
    explanation:
      'I, IV e V estão corretas. II é falsa por definição: compressão com perdas descarta informação. III também: o BMP é tipicamente não comprimido, e é justamente por isso que gera arquivos grandes.',
  },
  {
    id: 'fun-2025-41',
    area: 'Fundamentos da Computação',
    question: 'Qual é a técnica utilizada para a pesquisa por conteúdo textual dentro de arquivos em sistemas de arquivos virtuais?',
    options: [
      'Indexação e pesquisa full-text',
      'Armazenamento em blocos',
      'Hashing para localização de arquivos',
      'Uso de árvores R-tree',
      'Compactação por redundância',
    ],
    answer: 0,
    explanation:
      'Buscar por conteúdo exige um índice invertido que mapeia termos para os arquivos onde aparecem — a indexação full-text. As demais tratam de layout físico, localização por nome ou dados espaciais.',
  },
  {
    id: 'fun-2025-42',
    area: 'Fundamentos da Computação',
    question:
      'Processos alternam ciclos de CPU (tempo médio exec_t) e de espera de E/S, sob escalonamento round-robin preemptivo com troca de contexto de custo médio switch_t e fatia de tempo quantum. Assinale a alternativa que melhor minimiza o tempo médio de turnaround.',
    options: [
      '(exec_t > switch_t) e (exec_t > quantum)',
      '(exec_t < switch_t) e (exec_t < quantum)',
      '(exec_t > switch_t) e (exec_t < quantum)',
      '(exec_t < switch_t) e (exec_t > quantum)',
      '(exec_t + switch_t) > quantum',
    ],
    answer: 2,
    explanation:
      'Duas condições precisam valer juntas: o ciclo de CPU deve ser maior que a troca de contexto, senão o overhead domina; e menor que o quantum, para o processo terminar seu ciclo sem sofrer preempção e voltar para o fim da fila.',
  },
  {
    id: 'fun-2025-45',
    area: 'Fundamentos da Computação',
    question:
      'O comando de seleção ___________ permite que a execução de um trecho de programa dependa de uma condição ser verdadeira, vinculando a execução de um ou mais comandos ao resultado da avaliação de uma expressão lógica. Assinale a alternativa que preenche corretamente a lacuna.',
    options: ['simples', 'dupla', 'aninhada', 'múltipla', 'aleatória'],
    answer: 0,
    explanation:
      'A seleção simples (if sem else) executa o bloco apenas quando a condição é verdadeira. A dupla teria um caminho alternativo, e a múltipla escolheria entre vários casos.',
  },
  {
    id: 'fun-2025-46',
    area: 'Fundamentos da Computação',
    question:
      'Qual é a instrução adequada para quando o número de iterações é conhecido a priori, isto é, antes de iniciar a repetição?',
    options: ['while', 'break', 'continue', 'for', 'if'],
    answer: 3,
    explanation:
      'O for reúne inicialização, condição e incremento numa única linha, sendo a forma natural de repetição contada. O while atende melhor quando o fim depende de uma condição avaliada a cada passo.',
  },
  {
    id: 'fun-2025-47',
    area: 'Fundamentos da Computação',
    question:
      'Qual é o método de desenvolvimento de algoritmos que decompõe um problema em um número finito de subtarefas e explora sistematicamente suas possibilidades por meio de sucessivos testes até alcançar uma solução viável?',
    options: ['Tentativa e erro', 'Divisão e conquista', 'Recursividade', 'Programação dinâmica', 'Algoritmos gulosos'],
    answer: 0,
    explanation:
      'A descrição é a de tentativa e erro (backtracking): testar sistematicamente as possibilidades e desfazer escolhas que não levam a uma solução viável.',
  },
  {
    id: 'fun-2025-48',
    area: 'Fundamentos da Computação',
    question: 'Sobre grafos orientados e não orientados, é correto afirmar que:',
    options: [
      'Um grafo direcionado é desconexo se cada dois vértices quaisquer são alcançáveis a partir um do outro',
      'Em um grafo direcionado, a aresta (u,v) sai de u e entra em v; se (u,v) é aresta de G, então v é adjacente a u',
      'O grau de um vértice em um grafo direcionado é o número de arestas que incidem nele',
      'Em um grafo não direcionado, o grau de um vértice é o número de arestas que saem mais as que chegam',
      'Um grafo não direcionado é fortemente conectado se cada par de vértices está conectado por um caminho',
    ],
    answer: 1,
    explanation:
      'Só a segunda está correta. A primeira descreve grafo conexo, não desconexo; em grafo direcionado fala-se em grau de entrada e de saída; e "fortemente conectado" é termo exclusivo de grafos direcionados.',
  },
  {
    id: 'fun-2025-49',
    area: 'Fundamentos da Computação',
    question:
      'A _____________ de um grafo direcionado acíclico G = (V, A) é uma ordenação linear de todos os seus vértices tal que, se G contém uma aresta (u,v), então u aparece antes de v. Assinale a alternativa que preenche corretamente a lacuna.',
    options: ['ordenação topológica', 'árvore geradora mínima', 'lista de adjacência', 'árvore geradora máxima', 'matriz de adjacência'],
    answer: 0,
    explanation:
      'É a definição de ordenação topológica, que só existe em grafos acíclicos: qualquer ciclo tornaria impossível colocar todos os vértices numa linha com as arestas apontando sempre para a frente.',
  },
  {
    id: 'fun-2025-50',
    area: 'Fundamentos da Computação',
    question:
      'Dado um grafo G(V, A), qual é o algoritmo de busca que descobre todos os vértices a uma distância k do vértice origem antes de descobrir qualquer vértice a uma distância k+1?',
    options: ['Busca binária', 'Busca sequencial', 'Busca em largura', 'Caminhamento pós-fixado', 'Busca em profundidade'],
    answer: 2,
    explanation:
      'A busca em largura (BFS) usa uma fila e avança por camadas de distância, o que garante essa ordem e faz dela o algoritmo natural para caminho mínimo em grafos não ponderados.',
  },

  // ── Tecnologia da Computação (POSCOMP 2025) ────────────────────────────────
  {
    id: 'tec-2025-51',
    area: 'Tecnologia da Computação',
    question:
      'Na relação BEM(id, nome, valor), seja V o conjunto de valores distintos. Considere: SELECT id, nome, valor FROM BEM AS B1 WHERE 1 >= (SELECT COUNT(DISTINCT B2.valor) FROM BEM AS B2 WHERE B2.valor < B1.valor). A execução resulta no(s) bem(ns) cujo valor é igual ao:',
    options: [
      'maior valor em V',
      'maior valor em V ou ao segundo maior valor em V',
      'menor valor em V',
      'menor valor em V ou ao segundo menor valor em V',
      'menor valor em V ou ao maior valor em V',
    ],
    answer: 3,
    explanation:
      'A subconsulta conta quantos valores distintos são menores que o da linha atual. Esse contador vale 0 para o menor valor e 1 para o segundo menor; a condição 1 >= contador aceita exatamente esses dois casos.',
  },
  {
    id: 'tec-2025-52',
    area: 'Tecnologia da Computação',
    question:
      'Sobre escalonamentos de transações, um escalonamento não serial S de n transações é dito serializável se: I. for equivalente em conflito a algum escalonamento serial das mesmas n transações; II. o estado final de S for o mesmo de algum escalonamento serial, com relação a pelo menos um estado inicial; III. o estado final de S for o mesmo de algum escalonamento serial, com relação a todos os estados iniciais. Quais estão corretas?',
    options: ['Apenas I', 'Apenas II', 'Apenas III', 'Apenas I e II', 'Apenas I e III'],
    answer: 4,
    explanation:
      'I é a serializabilidade por conflito e III é a serializabilidade por visão, ambas definições válidas. II é fraca demais: coincidir o estado final para um único estado inicial pode ser coincidência, sem garantir equivalência.',
  },
  {
    id: 'tec-2025-53',
    area: 'Tecnologia da Computação',
    question:
      'Sobre as regras steal/no-steal e force/no-force na recuperação de SGBDs, analise: I. a regra force determina que todas as páginas atualizadas por uma transação são gravadas em memória secundária antes que ela confirme; II. na regra no-force, uma página atualizada por transação já confirmada pode ainda estar em cache quando outra transação precisar atualizá-la; III. na regra no-steal, operações de UNDO nunca serão necessárias durante a recuperação.',
    options: [
      'Todas as assertivas estão corretas',
      'Todas as assertivas estão incorretas',
      'Apenas as assertivas I e II estão corretas',
      'Apenas as assertivas I e III estão corretas',
      'Apenas as assertivas II e III estão corretas',
    ],
    answer: 0,
    explanation:
      'As três descrevem corretamente as regras. Em especial, no-steal impede que páginas de transações não confirmadas cheguem ao disco, então nunca há efeito de transação abortada para desfazer — daí a dispensa do UNDO.',
  },
  {
    id: 'tec-2025-54',
    area: 'Tecnologia da Computação',
    question:
      'A forma da derivação implementada por um analisador sintático ascendente (LR, bottom-up) durante o reconhecimento de uma cadeia lida da esquerda para a direita é:',
    options: [
      'Mais à esquerda (leftmost), a partir do símbolo de partida da gramática',
      'Mais à esquerda (leftmost), de forma reversa',
      'Mais à direita (rightmost), de forma reversa, partindo da cadeia até o símbolo de partida',
      'Mais à direita (rightmost), partindo do símbolo de partida até a cadeia',
      'Aleatória, escolhendo qualquer não terminal a cada passo',
    ],
    answer: 2,
    explanation:
      'O analisador LR parte da cadeia e vai reduzindo até o símbolo inicial. Cada redução desfaz o último passo de uma derivação mais à direita, então a sequência de reduções é uma derivação rightmost em ordem reversa.',
  },
  {
    id: 'tec-2025-55',
    area: 'Tecnologia da Computação',
    question:
      'No contexto das Definições Dirigidas pela Sintaxe, os grafos de dependência servem para descrever:',
    options: [
      'o fluxo de controle entre as instruções geradas para um programa fonte',
      'restrições de integridade entre elementos da tabela de símbolos',
      'o processamento de gramáticas de operadores quanto a precedência e associatividade',
      'o relacionamento entre cada lexema do programa fonte e o token recebido pelo analisador sintático',
      'o fluxo de informação entre instâncias de atributos associados aos símbolos que aparecem em uma árvore sintática',
    ],
    answer: 4,
    explanation:
      'Cada nó do grafo é uma instância de atributo e cada arco indica que um atributo é calculado a partir de outro. É esse grafo que determina em que ordem os atributos podem ser avaliados.',
  },
  {
    id: 'tec-2025-56',
    area: 'Tecnologia da Computação',
    question:
      'No pipeline de computação gráfica, considerando somente as tarefas de remoção de superfícies ocultas e de aplicação de modelos de tonalização (shading), assinale a alternativa que apresenta algoritmos pertencentes a essa parte específica do pipeline.',
    options: [
      'Algoritmo Z-Buffer, método de Gouraud e método de Phong',
      'Geração de curvas de Bézier, transformações geométricas e X-Ray',
      'Algoritmo de flood fill, algoritmo de divisão recursiva e mapeamento de texturas',
      'Coordenadas homogêneas, construção de árvore BSP e transformação de iluminação global',
      'Algoritmo de Bresenham, algoritmo de Cohen-Sutherland e geração de mipmaps',
    ],
    answer: 0,
    explanation:
      'O Z-Buffer resolve visibilidade comparando profundidades por pixel, e Gouraud e Phong são justamente os dois modelos clássicos de tonalização. Os demais itens pertencem a outras etapas: modelagem, rasterização ou recorte.',
  },
  {
    id: 'tec-2025-57',
    area: 'Tecnologia da Computação',
    question: 'É correto afirmar que o mipmapping é um(a):',
    options: [
      'método de filtragem que suaviza transições de cor entre pixels de duas texturas adjacentes',
      'técnica que ajusta as coordenadas da textura para remover distorções em superfícies curvas',
      'algoritmo que calcula previamente detalhes de superfície como rugosidade e reflexividade',
      'algoritmo que calcula como a luz interage com a superfície de um objeto com textura',
      'processo de criar versões pré-filtradas de uma textura em resoluções menores, usadas conforme a distância do objeto à câmera',
    ],
    answer: 4,
    explanation:
      'O mipmap é uma pirâmide de versões da textura em resoluções decrescentes, geradas antecipadamente. Objetos distantes usam níveis menores, o que evita aliasing e melhora a localidade de acesso à memória.',
  },
  {
    id: 'tec-2025-58',
    area: 'Tecnologia da Computação',
    question:
      'Um módulo calcula um valor de forma determinística e deve poder ser trocado por um modelo treinado de IA, alternando entre eles em tempo de execução e permitindo acrescentar novas formas de cálculo, tudo encapsulado para quem consome o módulo. Qual padrão de projeto deve ser usado?',
    options: ['Decorator', 'Factory Method', 'Proxy', 'Builder', 'Strategy'],
    answer: 4,
    explanation:
      'O Strategy encapsula cada algoritmo atrás de uma interface comum e permite trocar a implementação em tempo de execução. Acrescentar uma nova forma de cálculo vira uma nova classe, sem alterar quem usa o módulo.',
  },
  {
    id: 'tec-2025-59',
    area: 'Tecnologia da Computação',
    question:
      'Um sistema será entregue em versões operacionais sucessivas: primeiro as funcionalidades essenciais de rastreamento, depois o módulo de manutenção e por fim a otimização de rotas, sendo cada entrega um software completo e utilizável que se integra aos anteriores. Qual modelo de ciclo de vida essa abordagem descreve?',
    options: ['Modelo espiral', 'Modelo incremental', 'Modelo cascata', 'Prototipação', 'Modelo em V'],
    answer: 1,
    explanation:
      'O modelo incremental entrega incrementos funcionais e utilizáveis, definidos previamente, que se somam ao produto. O espiral é orientado a ciclos de análise de risco, e cascata e V entregam tudo ao final.',
  },
  {
    id: 'tec-2025-60',
    area: 'Tecnologia da Computação',
    question:
      'Uma instituição catalogou seus sistemas legados por importância e custo (análise de inventário), reestruturou a documentação técnica, aplicou engenharia reversa para extrair regras de negócio e arquitetura do código, e então reestruturou código e dados. Que processo descreve essa sequência?',
    options: [
      'Refatoração de software',
      'Manutenção adaptativa de software',
      'Reengenharia de software',
      'Melhoria do processo de software',
      'Garantia da qualidade de software',
    ],
    answer: 2,
    explanation:
      'A sequência inventário → reestruturação de documentos → engenharia reversa → reestruturação de código e dados é o processo canônico de reengenharia. A refatoração é apenas uma das etapas e não envolve inventário nem engenharia reversa.',
  },
  {
    id: 'tec-2025-61',
    area: 'Tecnologia da Computação',
    question:
      'Em árvores de decisão, a pureza de um nó mede a homogeneidade das amostras em relação à variável alvo. Assinale a alternativa que descreve corretamente o que ocorre quando um nó apresenta pureza máxima ou mínima.',
    options: [
      'Quando a pureza é máxima, o nó é sempre dividido; quando é mínima, torna-se folha',
      'Um nó com pureza máxima não precisa ser dividido, pois todas as amostras pertencem à mesma classe, enquanto um nó com pureza mínima tem as classes igualmente distribuídas e é candidato a nova divisão',
      'Pureza máxima indica classes equilibradas, e pureza mínima indica predominância de uma classe',
      'Quando a pureza é mínima, o nó não é dividido para evitar overfitting',
      'Pureza mínima representa o estado ideal de separação, e pureza máxima indica perda de capacidade de generalização',
    ],
    answer: 1,
    explanation:
      'Pureza máxima significa nó homogêneo — todas as amostras da mesma classe —, então dividir não traria ganho e ele vira folha. Pureza mínima é o oposto: classes igualmente misturadas, o caso em que a divisão tem mais a ganhar.',
  },
  {
    id: 'tec-2025-62',
    area: 'Tecnologia da Computação',
    question:
      'Assinale a alternativa que corretamente descreve o objetivo do aprendizado por transferência (transfer learning) em deep learning.',
    options: [
      'Treinar redes do zero com um conjunto de dados sempre maior que o da tarefa original',
      'Evitar o uso de redes convolucionais pré-treinadas, priorizando dados sintéticos',
      'Reduzir o desempenho do modelo original para aumentar a generalização',
      'Reutilizar conhecimento aprendido em uma tarefa fonte para acelerar o treinamento e reduzir custos na tarefa alvo',
      'Substituir o aprendizado supervisionado, dispensando a rotulagem de dados',
    ],
    answer: 3,
    explanation:
      'As camadas iniciais de uma rede treinada em uma base grande aprendem representações genéricas (bordas, texturas) que servem a outras tarefas. Reaproveitá-las permite treinar com menos dados rotulados e menos computação.',
  },
  {
    id: 'tec-2025-63',
    area: 'Tecnologia da Computação',
    question:
      'Considerando um filtro de média de tamanho M×M para imagens no domínio espacial, é correto afirmar que aumentar o valor de M:',
    options: [
      'aumenta o efeito de suavização (borramento) da imagem',
      'provoca um alargamento de contraste da imagem',
      'aumenta o efeito de aguçamento (realce) da imagem',
      'reduz o efeito de suavização (borramento) da imagem',
      'aumenta a resolução espacial da imagem',
    ],
    answer: 0,
    explanation:
      'A média é um filtro passa-baixa: quanto maior a vizinhança, mais pixels entram na média e mais as altas frequências (bordas e detalhes) são atenuadas, aumentando o borramento.',
  },
  {
    id: 'tec-2025-64',
    area: 'Tecnologia da Computação',
    question: 'Sobre a codificação de imagens no padrão JPEG, é correto afirmar que:',
    options: [
      'O JPEG utiliza a transformada de Fourier, preservando apenas as frequências mais baixas',
      'A compressão JPEG é sempre sem perdas, garantindo reconstrução exata',
      'A transformada discreta do cosseno (DCT) é usada para converter blocos de pixels do domínio espacial para o domínio da frequência',
      'A compressão baseia-se em reduzir a profundidade de bits por pixel, eliminando canais de cor',
      'O padrão substitui blocos de 8×8 pixels por blocos de 2×2 pixels',
    ],
    answer: 2,
    explanation:
      'O JPEG aplica a DCT em blocos de 8×8, levando-os ao domínio da frequência. A perda vem da etapa seguinte, a quantização, que descarta coeficientes de alta frequência aos quais o olho é menos sensível.',
  },
  {
    id: 'tec-2025-65',
    area: 'Tecnologia da Computação',
    question: 'Sobre a camada de aplicação, é correto afirmar que:',
    options: [
      'O DNS utiliza como padrão o protocolo TCP',
      'O SMTP utiliza como padrão o protocolo UDP',
      'O protocolo HTTP permite criar carrinhos de compras porque é um protocolo com estado',
      'O HTML é uma linguagem baseada em hipertexto para definição da estrutura lógica dos documentos',
      'O protocolo POP é o sucessor do protocolo IMAP',
    ],
    answer: 3,
    explanation:
      'Só a definição de HTML está correta. O DNS usa UDP por padrão e o SMTP usa TCP; o HTTP é sem estado (carrinhos dependem de cookies e sessão); e o IMAP é posterior ao POP, não o contrário.',
  },
  {
    id: 'tec-2025-66',
    area: 'Tecnologia da Computação',
    question: 'Sobre a velocidade de sinalização, assinale a alternativa INCORRETA.',
    options: [
      'É medida em bauds',
      'Uma linha de b bauds não transmite necessariamente b bits/s',
      'Indica o número de vezes por segundo que o valor de um sinal é injetado na linha',
      'Indica o número de bits/s',
      'A taxa de transmissão depende da velocidade de sinalização',
    ],
    answer: 3,
    explanation:
      'Baud mede símbolos por segundo, não bits por segundo. Como um símbolo pode carregar vários bits (em QAM-16, quatro), a taxa em bits/s é o produto da taxa de símbolos pelos bits por símbolo.',
  },
  {
    id: 'tec-2025-67',
    area: 'Tecnologia da Computação',
    question: 'Em um ataque de negação de serviço que explora o handshake TCP, qual flag é utilizada?',
    options: ['ACK', 'SYN', 'FIN', 'SYN+ACK', 'FIN+ACK'],
    answer: 1,
    explanation:
      'No SYN flood o atacante envia muitos segmentos SYN sem completar o handshake. Cada um consome uma entrada na fila de conexões semiabertas do servidor até esgotá-la.',
  },
  {
    id: 'tec-2025-68',
    area: 'Tecnologia da Computação',
    question:
      'Em sistemas de arquivos distribuídos, os programas clientes devem continuar funcionando satisfatoriamente enquanto a carga sobre o serviço varia dentro de um intervalo especificado. Esse exemplo define qual forma de transparência?',
    options: ['Acesso', 'Desempenho', 'Mobilidade', 'Mudança de escala', 'Localização'],
    answer: 1,
    explanation:
      'Transparência de desempenho é a que trata da variação de carga: o cliente não percebe degradação enquanto a carga se mantém na faixa prevista. Mudança de escala refere-se a crescer o sistema sem alterar a estrutura ou a aplicação.',
  },
  {
    id: 'tec-2025-69',
    area: 'Tecnologia da Computação',
    question:
      'Em sistemas distribuídos, o controle de concorrência _____________ permite que as transações prossigam sem qualquer verificação até serem concluídas, sendo validadas antes de poderem ser confirmadas. Assinale a alternativa que preenche corretamente a lacuna.',
    options: ['por separação', 'ordenação por carimbo de tempo', 'por bloqueios em duas fases', 'otimista', 'por aninhamento'],
    answer: 3,
    explanation:
      'O controle otimista aposta que conflitos são raros: não bloqueia nada durante a execução e só na fase de validação, antes do commit, verifica se houve conflito — abortando a transação se houver.',
  },
  {
    id: 'tec-2025-70',
    area: 'Tecnologia da Computação',
    question:
      'Uma forma de construir exclusão mútua entre N processos distribuídos é organizá-los em um círculo lógico, no qual cada processo só precisa de um canal com o seguinte, e a exclusão é concedida pela obtenção de uma ficha passada de processo para processo em uma única direção. Esse é o algoritmo:',
    options: [
      'que emprega um servidor central',
      'que utiliza multicast e relógios lógicos',
      'baseado em anel',
      'de votação de Maekawa',
      'de eleição',
    ],
    answer: 2,
    explanation:
      'É o algoritmo de anel com ficha (token ring): quem detém a ficha pode entrar na região crítica e, ao sair, repassa-a ao vizinho. Cada processo só conhece o seguinte, o que dispensa coordenador central.',
  },
];

// Per-question difficulty: 1 fácil, 2 médio, 3 difícil. Ids not listed default
// to médio.
// Kept as a compact map so it can be retuned without touching the question data.
const DIFFICULTY_BY_ID: Record<string, number> = {
  'tec-2025-51': 3, 'tec-2025-52': 3, 'tec-2025-53': 3, 'tec-2025-54': 3,
  'tec-2025-55': 3, 'tec-2025-56': 2, 'tec-2025-57': 2, 'tec-2025-58': 2,
  'tec-2025-59': 1, 'tec-2025-60': 2, 'tec-2025-61': 2, 'tec-2025-62': 1,
  'tec-2025-63': 1, 'tec-2025-64': 1, 'tec-2025-65': 2, 'tec-2025-66': 2,
  'tec-2025-67': 1, 'tec-2025-68': 2, 'tec-2025-69': 2, 'tec-2025-70': 2,
  'fun-2025-21': 1, 'fun-2025-22': 2, 'fun-2025-23': 1, 'fun-2025-24': 2,
  'fun-2025-25': 1, 'fun-2025-26': 1, 'fun-2025-27': 1, 'fun-2025-28': 1,
  'fun-2025-29': 2, 'fun-2025-30': 3, 'fun-2025-31': 3, 'fun-2025-33': 2,
  'fun-2025-34': 2, 'fun-2025-35': 2, 'fun-2025-36': 3, 'fun-2025-37': 3,
  'fun-2025-38': 3, 'fun-2025-39': 1, 'fun-2025-40': 2, 'fun-2025-41': 1,
  'fun-2025-42': 3, 'fun-2025-45': 1, 'fun-2025-46': 1, 'fun-2025-47': 1,
  'fun-2025-48': 2, 'fun-2025-49': 1, 'fun-2025-50': 1,
  'mat-2025-01': 1, 'mat-2025-02': 1, 'mat-2025-03': 1, 'mat-2025-04': 3,
  'mat-2025-05': 3, 'mat-2025-06': 3, 'mat-2025-07': 1, 'mat-2025-08': 2,
  'mat-2025-09': 1, 'mat-2025-10': 1, 'mat-2025-11': 2, 'mat-2025-12': 1,
  'mat-2025-14': 1, 'mat-2025-15': 1, 'mat-2025-16': 1, 'mat-2025-17': 2,
  'mat-2025-18': 1, 'mat-2025-19': 2, 'mat-2025-20': 3,
  'mat-2019-15': 1, 'fun-2019-21': 3, 'fun-2019-22': 3, 'fun-2019-23': 2,
  'fun-2019-24': 1, 'fun-2019-25': 3, 'tec-2019-52': 1, 'tec-2019-54': 1,
  'tec-2019-57': 1, 'tec-2019-58': 1, 'tec-2019-60': 2, 'tec-2019-64': 2,
  'fun-2010-27': 3, 'fun-2010-46': 2, 'tec-2010-47': 3, 'tec-2010-49': 2,
  'mat-2022-11': 2, 'fun-2022-21': 2, 'fun-2022-22': 2, 'fun-2022-26': 1,
  'tec-2022-50': 2, 'tec-2022-52': 1, 'fun-2024-22': 1, 'fun-2024-23': 1,
  'fun-2024-48': 1, 'tec-2024-52': 2, 'tec-2024-54': 3, 'tec-2024-59': 1,
  'mat-2019-12': 2, 'mat-2024-13': 1, 'fun-2010-21': 3, 'fun-2010-26': 1,
  'fun-2010-50': 3, 'fun-2022-24': 2, 'fun-2022-25': 1, 'fun-2022-28': 3,
  'fun-2024-21': 2, 'fun-2024-24': 1, 'fun-2024-25': 1, 'tec-2019-43': 2,
  'tec-2019-45': 3, 'tec-2019-46': 1, 'tec-2019-61': 1, 'tec-2019-62': 2,
  'tec-2022-46': 3, 'tec-2022-54': 3, 'tec-2024-51': 3, 'tec-2024-53': 3,
  'tec-2024-58': 1,
  // POSCOMP 2024 (adicionais)
  'mat-2024-05': 1, 'mat-2024-14': 2, 'mat-2024-15': 2,
  'fun-2024-26': 1, 'fun-2024-28': 2, 'fun-2024-29': 1, 'fun-2024-36': 3,
  'fun-2024-38': 2, 'fun-2024-39': 1, 'fun-2024-40': 2, 'fun-2024-42': 3,
  'fun-2024-45': 1,
  'tec-2024-46': 2, 'tec-2024-47': 1, 'tec-2024-49': 1, 'tec-2024-50': 1,
  'tec-2024-55': 3, 'tec-2024-57': 3, 'tec-2024-60': 1, 'tec-2024-61': 1,
  'tec-2024-62': 1, 'tec-2024-63': 2, 'tec-2024-64': 3, 'tec-2024-65': 2,
  'tec-2024-66': 2, 'tec-2024-67': 1, 'tec-2024-68': 2, 'tec-2024-69': 2,
  'tec-2024-70': 2,
};

// Fine-grained theme per question (players can filter the run by these). Same
// compact-map pattern as DIFFICULTY_BY_ID; unlisted ids fall into 'Outros'.
const TOPIC_BY_ID: Record<string, string> = {
  // Tecnologia (POSCOMP 2025)
  'tec-2025-51': 'Banco de Dados', 'tec-2025-52': 'Banco de Dados', 'tec-2025-53': 'Banco de Dados',
  'tec-2025-54': 'Programação e Compiladores', 'tec-2025-55': 'Programação e Compiladores',
  'tec-2025-56': 'Computação Gráfica', 'tec-2025-57': 'Computação Gráfica',
  'tec-2025-63': 'Computação Gráfica', 'tec-2025-64': 'Computação Gráfica',
  'tec-2025-58': 'Engenharia de Software', 'tec-2025-59': 'Engenharia de Software',
  'tec-2025-60': 'Engenharia de Software',
  'tec-2025-61': 'IA e Dados', 'tec-2025-62': 'IA e Dados',
  'tec-2025-65': 'Redes', 'tec-2025-66': 'Redes', 'tec-2025-67': 'Redes',
  'tec-2025-68': 'Sistemas Distribuídos', 'tec-2025-69': 'Sistemas Distribuídos',
  'tec-2025-70': 'Sistemas Distribuídos',
  // Fundamentos (POSCOMP 2025)
  'fun-2025-21': 'Algoritmos e Complexidade', 'fun-2025-22': 'Algoritmos e Complexidade',
  'fun-2025-23': 'Algoritmos e Complexidade', 'fun-2025-24': 'Algoritmos e Complexidade',
  'fun-2025-47': 'Algoritmos e Complexidade',
  'fun-2025-25': 'Estruturas de Dados', 'fun-2025-26': 'Estruturas de Dados',
  'fun-2025-48': 'Estruturas de Dados', 'fun-2025-49': 'Estruturas de Dados',
  'fun-2025-50': 'Estruturas de Dados',
  'fun-2025-27': 'SO e Arquitetura', 'fun-2025-28': 'SO e Arquitetura',
  'fun-2025-29': 'SO e Arquitetura', 'fun-2025-30': 'SO e Arquitetura',
  'fun-2025-31': 'SO e Arquitetura', 'fun-2025-41': 'SO e Arquitetura',
  'fun-2025-42': 'SO e Arquitetura',
  'fun-2025-33': 'Programação e Compiladores', 'fun-2025-34': 'Programação e Compiladores',
  'fun-2025-35': 'Programação e Compiladores', 'fun-2025-45': 'Programação e Compiladores',
  'fun-2025-46': 'Programação e Compiladores',
  'fun-2025-36': 'Teoria da Computação', 'fun-2025-37': 'Teoria da Computação',
  'fun-2025-38': 'Teoria da Computação',
  'fun-2025-39': 'Engenharia de Software',
  'fun-2025-40': 'Computação Gráfica',
  // Álgebra Linear / Cálculo / Geometria (POSCOMP 2025)
  'mat-2025-01': 'Álgebra Linear', 'mat-2025-02': 'Álgebra Linear', 'mat-2025-03': 'Álgebra Linear',
  'mat-2025-07': 'Cálculo', 'mat-2025-08': 'Cálculo', 'mat-2025-09': 'Cálculo',
  'mat-2025-10': 'Geometria Analítica', 'mat-2025-11': 'Geometria Analítica',
  'mat-2025-12': 'Geometria Analítica',
  'mat-2025-04': 'Combinatória', 'mat-2025-05': 'Combinatória', 'mat-2025-06': 'Combinatória',
  'mat-2025-14': 'Lógica', 'mat-2025-15': 'Lógica', 'mat-2025-16': 'Lógica', 'mat-2025-18': 'Lógica',
  'mat-2025-17': 'Teoria da Informação',
  'mat-2025-19': 'Estatística', 'mat-2025-20': 'Estatística',
  // Lógica
  'mat-2019-15': 'Lógica', 'mat-2022-11': 'Lógica', 'mat-2019-12': 'Lógica', 'mat-2024-13': 'Lógica',
  'mat-2024-14': 'Lógica', 'mat-2024-15': 'Lógica',
  // Algoritmos e Complexidade
  'fun-2019-21': 'Algoritmos e Complexidade', 'fun-2019-22': 'Algoritmos e Complexidade',
  'fun-2019-24': 'Algoritmos e Complexidade', 'fun-2019-25': 'Algoritmos e Complexidade',
  'fun-2010-27': 'Algoritmos e Complexidade', 'fun-2022-21': 'Algoritmos e Complexidade',
  'fun-2022-22': 'Algoritmos e Complexidade', 'fun-2022-26': 'Algoritmos e Complexidade',
  'fun-2024-22': 'Algoritmos e Complexidade', 'fun-2024-23': 'Algoritmos e Complexidade',
  'fun-2022-25': 'Algoritmos e Complexidade', 'fun-2024-21': 'Algoritmos e Complexidade',
  'fun-2024-40': 'Algoritmos e Complexidade',
  // Estruturas de Dados
  'fun-2019-23': 'Estruturas de Dados', 'fun-2010-21': 'Estruturas de Dados',
  'fun-2010-26': 'Estruturas de Dados', 'fun-2024-24': 'Estruturas de Dados',
  'fun-2022-24': 'Estruturas de Dados', 'mat-2024-05': 'Estruturas de Dados',
  'fun-2024-26': 'Estruturas de Dados', 'tec-2024-49': 'Estruturas de Dados',
  'tec-2024-50': 'Estruturas de Dados',
  // Teoria da Computação (inclui grafos)
  'fun-2010-50': 'Teoria da Computação', 'fun-2010-46': 'Teoria da Computação', 'fun-2024-48': 'Teoria da Computação',
  'fun-2024-36': 'Teoria da Computação', 'fun-2024-38': 'Teoria da Computação',
  // Programação e Compiladores
  'fun-2022-28': 'Programação e Compiladores', 'fun-2024-25': 'Programação e Compiladores', 'tec-2024-54': 'Programação e Compiladores',
  'fun-2024-45': 'Programação e Compiladores', 'tec-2024-46': 'Programação e Compiladores',
  'tec-2024-47': 'Programação e Compiladores', 'tec-2024-55': 'Programação e Compiladores',
  // Sistemas Operacionais e Arquitetura
  'tec-2022-50': 'SO e Arquitetura', 'tec-2019-45': 'SO e Arquitetura', 'tec-2019-46': 'SO e Arquitetura',
  'tec-2022-46': 'SO e Arquitetura', 'tec-2019-43': 'SO e Arquitetura',
  'fun-2024-28': 'SO e Arquitetura', 'fun-2024-29': 'SO e Arquitetura',
  'fun-2024-39': 'SO e Arquitetura', 'fun-2024-42': 'SO e Arquitetura',
  // Redes
  'tec-2019-54': 'Redes', 'tec-2019-60': 'Redes', 'tec-2022-54': 'Redes',
  'tec-2024-65': 'Redes', 'tec-2024-66': 'Redes', 'tec-2024-67': 'Redes',
  // Banco de Dados
  'tec-2010-47': 'Banco de Dados', 'tec-2010-49': 'Banco de Dados', 'tec-2024-51': 'Banco de Dados',
  'tec-2024-52': 'Banco de Dados', 'tec-2024-53': 'Banco de Dados',
  // IA e Ciência de Dados
  'tec-2019-52': 'IA e Dados', 'tec-2022-52': 'IA e Dados',
  'tec-2024-61': 'IA e Dados', 'tec-2024-62': 'IA e Dados',
  // Sistemas Distribuídos
  'tec-2019-64': 'Sistemas Distribuídos', 'tec-2019-62': 'Sistemas Distribuídos',
  'tec-2024-68': 'Sistemas Distribuídos', 'tec-2024-69': 'Sistemas Distribuídos',
  'tec-2024-70': 'Sistemas Distribuídos',
  // Computação Gráfica
  'tec-2019-57': 'Computação Gráfica', 'tec-2019-58': 'Computação Gráfica', 'tec-2019-61': 'Computação Gráfica',
  'tec-2024-57': 'Computação Gráfica', 'tec-2024-63': 'Computação Gráfica', 'tec-2024-64': 'Computação Gráfica',
  // Engenharia de Software
  'tec-2024-59': 'Engenharia de Software', 'tec-2024-58': 'Engenharia de Software',
  'tec-2024-60': 'Engenharia de Software',
};

// Explicação longa por questão, revelada quando o jogador expande a explicação
// curta. Mesmo padrão de mapa compacto de DIFFICULTY_BY_ID/TOPIC_BY_ID, para não
// inflar o bloco de cada questão. Cada texto segue a mesma estrutura: o raciocínio
// que leva à resposta, por que as demais alternativas caem e o conceito a fixar.
// Parágrafos são separados por '\n\n' (a UI preserva as quebras).
const LONG_EXPLANATION_BY_ID: Record<string, string> = {
  'tec-2025-51':
    'A consulta usa uma subconsulta correlacionada: para cada linha B1, ela conta quantos valores distintos da tabela são estritamente menores que o valor daquela linha.\n\n' +
    'Esse contador funciona como um ranking começando em zero. Para o menor valor de V, não existe nada menor, então o contador é 0. Para o segundo menor, existe exatamente um valor menor, e o contador é 1. Para o terceiro menor já seria 2, e assim por diante.\n\n' +
    'A condição do WHERE é 1 >= contador, ou seja, contador ∈ {0, 1}. Isso seleciona precisamente as linhas cujo valor é o menor ou o segundo menor de V.\n\n' +
    'Dois detalhes decidem a questão: o DISTINCT faz o ranking ser sobre valores distintos (empates não consomem posições) e o < estrito garante que o menor valor receba contador 0. Trocar por <= deslocaria todo o ranking em um.',
  'tec-2025-52':
    'Serializabilidade é a garantia de que um escalonamento concorrente produz o mesmo efeito de alguma execução serial. As definições formais aceitas são duas.\n\n' +
    'A serializabilidade por conflito (assertiva I) exige que S possa ser transformado em um escalonamento serial trocando apenas operações não conflitantes. É a definição usada na prática, porque pode ser testada com o grafo de precedência: S é serializável por conflito se e somente se esse grafo é acíclico.\n\n' +
    'A serializabilidade por visão (assertiva III) é mais abrangente e exige que o estado final coincida com o de um escalonamento serial para todos os estados iniciais possíveis — é isso que caracteriza equivalência de verdade.\n\n' +
    'A assertiva II enfraquece a III ao pedir a coincidência para apenas um estado inicial, o que pode acontecer por acaso, sem que os escalonamentos sejam equivalentes. Vale notar que todo escalonamento serializável por conflito também é por visão, mas não o contrário.',
  'tec-2025-53':
    'As duas políticas tratam de quando páginas sujas podem ou devem ir para o disco, e cada combinação define de que operações a recuperação vai precisar.\n\n' +
    'Force significa gravar todas as páginas atualizadas antes do commit (assertiva I), o que dispensa REDO mas encarece cada confirmação. No-force permite que páginas de uma transação já confirmada continuem em cache (assertiva II), o que é mais eficiente mas exige REDO após falha.\n\n' +
    'Steal permite que o gerenciador de buffers roube um quadro e grave no disco a página de uma transação ainda não confirmada — daí a necessidade de UNDO. No-steal proíbe isso, então nenhum efeito de transação não confirmada chega ao disco e o UNDO se torna desnecessário (assertiva III).\n\n' +
    'As três estão corretas. Na prática, os SGBDs adotam steal/no-force, a combinação mais eficiente, e por isso precisam tanto de UNDO quanto de REDO — o que motiva o protocolo ARIES com write-ahead logging.',
  'tec-2025-54':
    'Analisadores descendentes e ascendentes percorrem a árvore de derivação em sentidos opostos, e cada um corresponde a um tipo de derivação.\n\n' +
    'O analisador LR é ascendente: começa pela cadeia de entrada e vai reduzindo trechos a não terminais até chegar ao símbolo de partida. Cada redução é o inverso de uma aplicação de regra.\n\n' +
    'Se invertermos a sequência de reduções, obtemos uma derivação que parte do símbolo inicial e, a cada passo, expande o não terminal mais à direita — uma derivação rightmost. Por isso se diz que o LR constrói uma derivação mais à direita em ordem reversa.\n\n' +
    'O contraponto é o analisador LL, descendente, que constrói diretamente uma derivação leftmost. Vale lembrar o que as siglas dizem: em LR, o L é ler a entrada da esquerda para a direita e o R é rightmost; em LL, o segundo L é leftmost.',
  'tec-2025-55':
    'Numa definição dirigida pela sintaxe, cada símbolo da gramática carrega atributos, e as regras semânticas dizem como calcular uns a partir dos outros.\n\n' +
    'O grafo de dependência materializa essas relações para uma árvore sintática concreta: cada nó é uma instância de atributo e cada arco vai do atributo usado para o atributo calculado.\n\n' +
    'A utilidade é definir a ordem de avaliação. Qualquer ordem topológica do grafo é uma ordem válida, e a existência de ciclo significa que a definição não pode ser avaliada.\n\n' +
    'É esse grafo que separa as classes de definições: com atributos apenas sintetizados (S-atribuídas), a avaliação é bottom-up; com herdados em posição controlada (L-atribuídas), ainda é possível avaliar em uma única passada durante a análise sintática.',
  'tec-2025-56':
    'O enunciado restringe o escopo a duas tarefas do estágio de rendering: decidir o que é visível e decidir com que cor a superfície aparece.\n\n' +
    'O Z-Buffer resolve a primeira: mantém, para cada pixel, a profundidade do fragmento mais próximo já desenhado, e só sobrescreve o pixel quando chega um fragmento mais à frente. É a solução padrão para remoção de superfícies ocultas em hardware.\n\n' +
    'Gouraud e Phong resolvem a segunda. O de Gouraud calcula a iluminação nos vértices e interpola as cores pela face; o de Phong interpola as normais e calcula a iluminação por pixel, o que custa mais e reproduz melhor os brilhos especulares.\n\n' +
    'Os itens das outras alternativas pertencem a etapas diferentes: Bézier e coordenadas homogêneas são modelagem e transformação, Bresenham é rasterização de linhas, Cohen-Sutherland é recorte e mipmap é filtragem de textura.',
  'tec-2025-57':
    'O problema que o mipmapping resolve é o aliasing de minificação: quando um objeto está longe, um único pixel na tela cobre muitos texels, e amostrar apenas um deles produz ruído e cintilação conforme a câmera se move.\n\n' +
    'A solução é pré-calcular uma pirâmide de versões da textura, cada nível com metade da resolução do anterior e já devidamente filtrado. Na hora de desenhar, escolhe-se o nível cuja densidade de texels mais se aproxima da densidade de pixels.\n\n' +
    'O ganho é duplo: a imagem fica estável, porque a média já foi calculada antecipadamente, e o desempenho melhora, porque níveis menores cabem melhor no cache de textura.\n\n' +
    'O custo é cerca de 33% de memória adicional (a soma da série 1 + 1/4 + 1/16 + …). Filtragem trilinear interpola entre dois níveis vizinhos para evitar a transição brusca de um nível para o outro.',
  'tec-2025-58':
    'Os requisitos do enunciado apontam para um único padrão. São eles: várias implementações intercambiáveis do mesmo cálculo, troca em tempo de execução, extensibilidade para novas formas e encapsulamento em relação a quem consome.\n\n' +
    'O Strategy define uma interface para a família de algoritmos e coloca cada implementação em uma classe própria. O contexto guarda uma referência à interface, o que permite substituir a implementação a qualquer momento sem que os chamadores percebam.\n\n' +
    'Acrescentar o modelo de IA vira apenas mais uma classe que implementa a interface — o código existente não muda, o que atende ao princípio aberto/fechado.\n\n' +
    'Os outros padrões resolvem outros problemas: Decorator acrescenta comportamento envolvendo um objeto, Factory Method trata da criação, Proxy controla o acesso e Builder monta objetos complexos por etapas.',
  'tec-2025-59':
    'A descrição tem três marcas do modelo incremental: entregas sucessivas, cada uma um software completo e utilizável, e um conjunto de funcionalidades definido previamente.\n\n' +
    'No incremental o escopo total é conhecido desde o início e fatiado em incrementos. O primeiro entrega o núcleo (aqui, o rastreamento) e os seguintes acrescentam módulos que se integram ao que já existe.\n\n' +
    'A motivação citada — evitar o risco de uma substituição completa e simultânea — é exatamente o argumento a favor do incremental: valor entra em produção cedo e o risco se distribui.\n\n' +
    'O espiral também é iterativo, mas seus ciclos giram em torno de análise de risco e prototipação, sem exigir entrega operacional a cada volta. Cascata e V entregam tudo de uma vez no final, e a prototipação produz artefatos para validar requisitos, não versões de produção.',
  'tec-2025-60':
    'Cada etapa citada é uma fase nomeada do processo de reengenharia de software, e é a sequência completa que identifica o processo.\n\n' +
    'A análise de inventário cataloga e prioriza os sistemas por valor de negócio e custo. A reestruturação de documentos organiza o que existe de documentação. A engenharia reversa parte do código para recuperar o projeto perdido: regras de negócio, arquitetura e modelo de dados.\n\n' +
    'Com esse entendimento, vêm a reestruturação de código, que melhora a modularidade sem mudar o comportamento, e a reestruturação de dados, que costuma ser a etapa mais cara por afetar todos os programas que tocam o esquema.\n\n' +
    'Refatoração é apenas a etapa de reestruturação de código, sem inventário nem engenharia reversa. Manutenção adaptativa é ajustar o sistema a um novo ambiente, e não reconstruí-lo. O detalhe que fecha a resposta é a engenharia reversa: ela não aparece nos outros processos.',
  'tec-2025-61':
    'Pureza mede o quanto as amostras de um nó pertencem a uma mesma classe, e é ela que guia a decisão de dividir ou parar.\n\n' +
    'Pureza máxima significa nó homogêneo: todas as amostras são da mesma classe. Nesse caso não há informação a ganhar dividindo, o nó vira folha e passa a prever aquela classe. Em termos de entropia, o valor é zero.\n\n' +
    'Pureza mínima é o extremo oposto: as classes aparecem igualmente distribuídas, a entropia é máxima e o nó é justamente o candidato mais promissor a uma nova divisão, porque é onde o ganho de informação pode ser maior.\n\n' +
    'Os critérios usuais (ganho de informação com entropia, ou índice de Gini) formalizam isso escolhendo o atributo que mais reduz a impureza. Como levar a divisão ao limite gera overfitting, usa-se poda ou critérios de parada como profundidade máxima e número mínimo de amostras por folha.',
  'tec-2025-62':
    'Treinar uma rede profunda do zero exige muitos dados rotulados e muito poder computacional — restrições que a maioria dos projetos não consegue satisfazer.\n\n' +
    'O aprendizado por transferência contorna isso reaproveitando um modelo já treinado em uma base grande. Em redes convolucionais, as camadas iniciais aprendem representações genéricas (bordas, texturas, padrões simples) que servem a praticamente qualquer tarefa de visão; a especialização fica nas camadas finais.\n\n' +
    'Na prática, congelam-se as camadas iniciais e treinam-se apenas as últimas com os dados da tarefa alvo, ou faz-se fine-tuning com taxa de aprendizado baixa. O resultado é convergência mais rápida e desempenho melhor com poucos dados.\n\n' +
    'As alternativas erradas invertem o objetivo: transferência não dispensa rotulagem (o fine-tuning continua supervisionado), não busca reduzir desempenho e não exige base maior que a original — o ponto é justamente precisar de menos.',
  'tec-2025-63':
    'O filtro de média substitui cada pixel pela média dos pixels de uma janela M×M ao redor dele. É um filtro passa-baixa: preserva as variações lentas e atenua as rápidas.\n\n' +
    'Aumentar M amplia a vizinhança considerada, então cada pixel de saída passa a ser a média de mais pixels. Detalhes finos e bordas, que são altas frequências, são progressivamente diluídos.\n\n' +
    'O efeito visível é mais borramento. No domínio da frequência, a explicação é direta: uma janela mais larga no domínio espacial corresponde a uma resposta mais estreita em frequência, cortando mais componentes altas.\n\n' +
    'Aguçamento é o oposto e exige filtros passa-alta, como o laplaciano ou a máscara de nitidez. E o filtro não altera a resolução espacial: a imagem continua com as mesmas dimensões, apenas com menos detalhe.',
  'tec-2025-64':
    'O JPEG comprime em etapas encadeadas, e a questão testa se a transformada usada é reconhecida corretamente.\n\n' +
    'Depois de converter para um espaço de cor com luminância e crominância separadas (e frequentemente subamostrar a crominância), a imagem é dividida em blocos de 8×8 pixels. Cada bloco passa pela transformada discreta do cosseno (DCT), que o leva do domínio espacial para o domínio da frequência.\n\n' +
    'A perda vem da etapa seguinte: a quantização divide os coeficientes por uma tabela que castiga as altas frequências, às quais o olho humano é menos sensível. Muitos coeficientes viram zero, e é isso que o codificador de entropia (RLE mais Huffman) comprime bem.\n\n' +
    'Por isso a compressão é com perdas, e não sem perdas — a quantização é irreversível. A DCT em si é reversível; quem descarta informação é o passo posterior. A escolha da DCT em vez da transformada de Fourier se deve à melhor compactação de energia em sinais reais.',
  'tec-2025-65':
    'Cada alternativa toca em um ponto clássico da camada de aplicação, e apenas a definição de HTML resiste.\n\n' +
    'O DNS usa UDP por padrão, porque consultas cabem em um datagrama e a ausência de handshake reduz a latência; só recorre a TCP em respostas grandes ou transferência de zona. O SMTP faz o contrário: usa TCP, pois entrega de mensagem exige confiabilidade.\n\n' +
    'O HTTP é sem estado por projeto: cada requisição é independente. Carrinhos de compras funcionam apesar disso, com cookies e sessão do lado do servidor — não porque o protocolo tenha estado.\n\n' +
    'O IMAP é posterior ao POP e mantém as mensagens no servidor, permitindo acesso por vários dispositivos, enquanto o POP tradicionalmente baixa e remove. Dizer que o POP sucede o IMAP inverte a cronologia.',
  'tec-2025-66':
    'A questão explora a diferença entre duas grandezas frequentemente confundidas: velocidade de sinalização e taxa de transmissão.\n\n' +
    'A velocidade de sinalização é medida em bauds e conta quantos símbolos (mudanças de estado do sinal) são colocados na linha por segundo. É uma característica física da modulação.\n\n' +
    'A taxa de transmissão, em bits por segundo, depende também de quantos bits cada símbolo carrega. Com modulação QAM-16, por exemplo, cada símbolo codifica 4 bits, então 1.000 bauds equivalem a 4.000 bits/s.\n\n' +
    'Por isso a alternativa que iguala velocidade de sinalização a bits/s é a incorreta, e é justamente ela que contradiz a alternativa anterior, que afirma que b bauds não transmitem necessariamente b bits/s. As duas só coincidem no caso particular de 1 bit por símbolo.',
  'tec-2025-67':
    'O estabelecimento de conexão TCP tem três passos: o cliente envia SYN, o servidor responde SYN+ACK e reserva recursos para a conexão semiaberta, e o cliente confirma com ACK.\n\n' +
    'O SYN flood explora a janela entre o segundo e o terceiro passo. O atacante envia uma enxurrada de SYN, geralmente com endereço de origem forjado, e nunca envia o ACK final.\n\n' +
    'Cada SYN faz o servidor alocar uma entrada na fila de conexões semiabertas e aguardar um ACK que não virá, até o timeout. Com volume suficiente, a fila enche e conexões legítimas passam a ser recusadas.\n\n' +
    'A defesa clássica são os SYN cookies: em vez de guardar estado, o servidor codifica as informações da conexão no próprio número de sequência do SYN+ACK, e só aloca recursos quando o ACK válido chega.',
  'tec-2025-68':
    'Sistemas distribuídos definem várias formas de transparência, cada uma escondendo um aspecto diferente da distribuição. A chave é identificar o que o enunciado está escondendo.\n\n' +
    'Aqui o ponto é a variação de carga sobre o serviço: o cliente deve continuar funcionando satisfatoriamente enquanto ela oscila dentro de uma faixa. Esconder o efeito da carga sobre a qualidade percebida é transparência de desempenho.\n\n' +
    'As demais tratam de outras dimensões: acesso esconde a diferença entre operar sobre recurso local ou remoto; localização esconde onde o recurso está; mobilidade permite mover o recurso sem afetar quem o usa.\n\n' +
    'A que mais confunde é a de escala, e a distinção é sutil: escala trata de o sistema poder crescer (em usuários ou recursos) sem mudança estrutural, enquanto desempenho trata de manter a qualidade sob variação de carga na configuração atual.',
  'tec-2025-69':
    'As famílias de controle de concorrência diferem em quando verificam conflitos: antes, durante ou depois da execução.\n\n' +
    'O controle otimista aposta que conflitos são raros. A transação executa livremente sobre cópias locais, sem adquirir bloqueios, e só ao final entra na fase de validação, que confere se algum dado lido foi alterado por outra transação enquanto isso. Se houve conflito, a transação é abortada e reiniciada.\n\n' +
    'É exatamente o comportamento descrito: prosseguir sem qualquer verificação até concluir, e validar antes de confirmar.\n\n' +
    'As alternativas são pessimistas ou usam outro critério: bloqueio em duas fases previne conflitos adquirindo travas antes do acesso, e ordenação por carimbo de tempo impõe uma ordem seriada desde o início. O otimista compensa em cargas com muita leitura e pouca escrita, e é a base do controle de concorrência multiversão em vários SGBDs modernos.',
  'tec-2025-70':
    'O enunciado dá três pistas que apontam para a mesma solução: topologia em círculo lógico, cada processo conhecendo apenas o seguinte e uma ficha circulando em uma única direção.\n\n' +
    'No algoritmo de anel com ficha (token ring), quem possui a ficha tem o direito de entrar na região crítica. Ao terminar (ou se não precisar dela), o processo repassa a ficha ao vizinho, e ela segue circulando indefinidamente.\n\n' +
    'A exclusão mútua é garantida por construção, já que existe uma única ficha. A espera é limitada: no pior caso, um processo aguarda N−1 repasses.\n\n' +
    'A desvantagem é o tráfego constante mesmo sem ninguém querendo a região crítica, e a fragilidade a falhas: perder a ficha ou perder um processo do anel exige um protocolo de recuperação. O algoritmo de servidor central seria mais simples, mas concentra a falha num único ponto.',
  'fun-2025-21':
    'A pista está nas três restrições do enunciado: decidir rápido, sem voltar atrás e sem enxergar o mapa completo. Cada uma elimina uma família de algoritmos.\n\n' +
    'Sem voltar atrás, cai o backtracking, cuja essência é justamente desfazer escolhas ruins. Sem o mapa completo, caem força bruta e programação dinâmica, que precisam enumerar ou tabelar o espaço de soluções. Sem subproblemas independentes, cai divisão e conquista.\n\n' +
    'Sobra a estratégia gulosa: a cada passo, tomar a decisão que parece melhor localmente e nunca revisá-la. É barata (uma decisão por encruzilhada) e simples de implementar.\n\n' +
    'O preço é que o guloso não garante o ótimo global — ele só o alcança em problemas com estrutura específica, como matroides. Para caminho mínimo em grafo com pesos não negativos, por exemplo, o guloso do Dijkstra funciona; num labirinto arbitrário, pode se enfiar num beco.',
  'fun-2025-22':
    'A função é a definição ingênua de Fibonacci: cada chamada dispara outras duas, uma com n−1 e outra com n−2, sem guardar resultados já calculados.\n\n' +
    'A árvore de chamadas resultante quase dobra de tamanho a cada nível, e o número de nós cresce proporcionalmente ao próprio Fibonacci — daí T(N) exponencial, escrito como O(2^N) na alternativa. O trabalho é desperdiçado: calcula_algo(n−2), por exemplo, é recomputado várias vezes.\n\n' +
    'O espaço, porém, não é exponencial. A pilha só guarda o ramo que está sendo executado no momento, e o ramo mais profundo tem N níveis, logo S(N) = O(N).\n\n' +
    'Essa diferença entre tempo e espaço é o ponto da questão: a árvore inteira nunca existe ao mesmo tempo na memória. Com memoização, o tempo cai para O(N) mantendo O(N) de espaço, e com iteração de duas variáveis chega-se a O(N) de tempo com O(1) de espaço.',
  'fun-2025-23':
    'As notações assintóticas descrevem limites diferentes: O dá limite superior (cresce no máximo tanto quanto), Ω dá limite inferior (cresce pelo menos tanto quanto) e Θ dá os dois ao mesmo tempo.\n\n' +
    'A alternativa incorreta troca justamente esses papéis, atribuindo a O o significado de limite inferior — que pertence a Ω.\n\n' +
    'As demais são propriedades válidas: constantes multiplicativas são absorvidas, O(c·g) = O(g); termos de menor ordem somem, então 2n² + 3n é O(n²); e a relação é transitiva, o que permite encadear estimativas.\n\n' +
    'Uma confusão comum vale registrar: dizer que o pior caso do quicksort é O(n²) e o melhor é O(n log n) mistura as coisas. O correto é usar Θ dentro de cada caso e reservar O e Ω para os limites.',
  'fun-2025-24':
    'A ordenação por inserção só troca elementos vizinhos. Um item que precisa andar k posições exige k trocas, e por isso o pior caso é quadrático: o menor elemento na ponta direita percorre o vetor inteiro de um em um.\n\n' +
    'O Shellsort ataca exatamente essa limitação. Ele executa várias passadas de inserção usando um incremento h: em vez de comparar vizinhos, compara elementos separados por h posições, o que move um item para longe em uma única troca.\n\n' +
    'A cada passada, h diminui, e o vetor vai ficando "h-ordenado" — todo h-ésimo item já em ordem. A última passada usa h = 1, ou seja, é uma inserção comum, mas agora sobre um vetor quase ordenado, caso em que a inserção é praticamente linear.\n\n' +
    'Quicksort e heapsort também fazem trocas a distância, mas nenhum deles é descrito como sequências h-ordenadas — essa formulação identifica o Shellsort sem ambiguidade.',
  'fun-2025-25':
    'Pilha e fila diferem apenas na disciplina de retirada, e a questão testa se os rótulos não estão trocados.\n\n' +
    'A pilha é LIFO (last in, first out): entra e sai pelo mesmo extremo, então o último a chegar é o primeiro a sair — o que valida a assertiva I. A fila é FIFO: insere-se em um extremo e retira-se no outro, exatamente como diz a assertiva III.\n\n' +
    'A assertiva II descreve "primeiro que chega, primeiro atendido" atribuindo isso à pilha, quando esse é o comportamento da fila. E a IV diz que a fila ordena "do mais recente para o menos recente", invertendo: a fila atende do mais antigo para o mais recente.\n\n' +
    'Daí a ordem V – F – V – F. Na prática, a pilha aparece na pilha de chamadas e no desfazer de editores; a fila, em escalonamento e em busca em largura.',
  'fun-2025-26':
    'Uma tabela hash mapeia chaves para posições por meio de uma função de espalhamento. Como o espaço de chaves costuma ser muito maior que o da tabela, colisões são inevitáveis, e o método precisa de uma política para tratá-las.\n\n' +
    'O encadeamento separado transforma cada posição da tabela no início de uma lista encadeada. Todas as chaves que colidem naquele endereço são armazenadas sequencialmente nessa lista, que é justamente o que a lacuna descreve.\n\n' +
    'A busca passa a ter duas etapas: calcular o endereço (custo constante) e percorrer a lista daquele endereço. Com uma boa função de espalhamento e fator de carga controlado, as listas ficam curtas e a busca continua O(1) em média.\n\n' +
    'A alternativa é o endereçamento aberto, que procura outra posição livre na própria tabela (sondagem linear, quadrática ou duplo hash) em vez de manter listas externas.',
  'fun-2025-27':
    'A taxa máxima de um barramento é o produto de quantos bits ele transporta por vez pela frequência com que faz essas transferências.\n\n' +
    'Aqui são 32 bits por transferência e 200 MHz, ou seja, 200 milhões de transferências por segundo: 32 × 200×10⁶ = 6,4×10⁹ bits por segundo.\n\n' +
    'Convertendo para megabits por segundo, 6,4×10⁹ bits/s = 6.400 Mbps.\n\n' +
    'Atenção à unidade: a resposta é pedida em Mbps (megabits), não MB/s (megabytes). Em bytes seriam 800 MB/s — que é justamente a primeira alternativa, a armadilha de quem divide por 8 sem perceber.',
  'fun-2025-28':
    'As funções de mapeamento de cache diferem em quanta liberdade um bloco de memória tem para escolher onde ficar.\n\n' +
    'No mapeamento direto, cada bloco tem uma única linha possível, calculada pelo resto da divisão do endereço. É barato de implementar, mas dois blocos que disputam a mesma linha se expulsam mutuamente mesmo com a cache vazia.\n\n' +
    'No totalmente associativo, qualquer bloco pode ocupar qualquer linha — que é o caso descrito no enunciado. Isso elimina os conflitos, mas exige comparar a tag com todas as linhas simultaneamente, o que encarece o hardware.\n\n' +
    'O associativo por conjunto é o meio-termo adotado na prática: a cache é dividida em conjuntos, o bloco vai para um conjunto fixo e, dentro dele, para qualquer linha. Uma cache 4-way associativa compara só 4 tags, com quase o mesmo desempenho do totalmente associativo.',
  'fun-2025-29':
    'A interrupção é o mecanismo que permite ao hardware avisar a CPU de um evento sem que ela precise ficar perguntando. O protocolo tem uma ordem bem definida.\n\n' +
    'Primeiro a CPU termina a instrução corrente e reconhece a interrupção, sinalizando ao dispositivo (assertiva II). Em seguida salva o contexto do processo interrompido — contador de programa, registradores e flags — para poder retomá-lo depois (assertiva I). Só então desvia para o vetor de interrupção.\n\n' +
    'A assertiva III é a errada: a rotina de tratamento pertence ao sistema operacional e roda em modo núcleo. Executá-la em modo usuário daria ao programa acesso direto ao hardware e destruiria o isolamento entre processos.\n\n' +
    'É justamente a troca de modo que torna a interrupção cara, e é por isso que sistemas de alto desempenho usam técnicas como interrupt coalescing para reduzir a frequência delas.',
  'fun-2025-30':
    'O dual de uma expressão booleana é obtido trocando todo operador AND por OR e todo OR por AND, e trocando as constantes 0 e 1 entre si. As variáveis e suas negações ficam exatamente como estão — esse é o ponto que a questão testa.\n\n' +
    'Aplicando termo a termo em F = A·C̄ + A·B̄·C + A·(B + C): o produto A·C̄ vira a soma (A + C̄); o produto A·B̄·C vira (A + B̄ + C); e A·(B + C) vira A + (B·C), ou seja, (A + B·C).\n\n' +
    'As três somas resultantes eram ligadas por OR na expressão original, então passam a ser ligadas por AND: (A + C̄) · (A + B̄ + C) · (A + B·C).\n\n' +
    'A armadilha está nas alternativas que também negam as variáveis. Negar tudo além de trocar os operadores não produz o dual, e sim o complemento da função, pelo teorema de De Morgan — são conceitos diferentes.',
  'fun-2025-31':
    'Com quatro variáveis W, X, Y, Z (W como bit mais significativo), os minterms viram combinações binárias: 11 = 1011, 12 = 1100, 14 = 1110 e 15 = 1111.\n\n' +
    'Agrupando 12 (1100) e 14 (1110), o que se mantém é W = 1, X = 1 e Z = 0, enquanto Y varia — esse par gera o termo W·X·Z̄.\n\n' +
    'Agrupando 11 (1011) e 15 (1111), o que se mantém é W = 1, Y = 1 e Z = 1, enquanto X varia — esse par gera W·Y·Z.\n\n' +
    'Os dois termos cobrem exatamente os quatro minterms exigidos, então a soma mínima é W·X·Z̄ + W·Y·Z. Os don’t cares {5, 6, 7} poderiam ser usados para ampliar grupos, mas aqui nenhum deles ajuda: todos têm W = 0, e ambos os grupos exigem W = 1. As demais alternativas acrescentam termos redundantes que cobririam minterms fora do conjunto.',
  'fun-2025-33':
    'Cada característica descrita aponta para o traço definidor de um paradigma, e a associação sai lendo o que é enfatizado.\n\n' +
    'Funções matemáticas, imutabilidade e ausência de efeitos colaterais definem o paradigma funcional (2). Descrever o "quê" sem a sequência de passos é a marca do declarativo (5). Regras, fatos e inferência automática caracterizam o lógico (4), de que Prolog é o exemplo canônico.\n\n' +
    'Modificação explícita de estado por comandos sequenciais e atribuições é o imperativo (1) — o modelo mais próximo de como a máquina realmente funciona. Encapsular dados e comportamento com herança e reúso é orientação a objetos (3).\n\n' +
    'A ordem fica 2 – 5 – 4 – 1 – 3. Vale notar que funcional e lógico são ambos subfamílias do declarativo, o que costuma confundir: aqui "declarativo" aparece no sentido genérico, e a distinção está no mecanismo (aplicar funções vs. inferir a partir de regras).',
  'fun-2025-34':
    'Duas dimensões independentes costumam ser embaralhadas nessa questão: quando a verificação acontece (estática, em compilação, ou dinâmica, em execução) e quão rígida ela é (forte ou fraca, quanto a conversões implícitas).\n\n' +
    'A alternativa correta descreve a consequência prática da tipagem dinâmica: o erro de tipo só se manifesta quando aquela linha é executada. Um caminho raro de código pode carregar um erro por muito tempo, o que explica a ênfase em testes automatizados nessas linguagens.\n\n' +
    'As demais invertem definições. Verificação estática ocorre em compilação, não em execução. Inferência de tipos é o oposto de exigir declarações: o compilador deduz o tipo do contexto, como fazem Haskell, Rust ou o var do Java.\n\n' +
    'E inferência não enfraquece a segurança de tipos — o tipo inferido é verificado com o mesmo rigor de um tipo escrito à mão. Forte e estática também não são sinônimos: Python é dinâmica e forte, C é estática e relativamente fraca.',
  'fun-2025-35':
    'As quatro assertivas cobrem ângulos diferentes do mesmo conceito, e todas se sustentam.\n\n' +
    'A primeira é a definição geral: um mesmo nome de método produz comportamentos diferentes conforme a classe concreta do objeto. A segunda separa as duas formas de obtê-lo — sobrescrita, resolvida em tempo de execução pelo despacho dinâmico, e sobrecarga, resolvida em compilação pela assinatura, daí ser chamada de polimorfismo estático.\n\n' +
    'A terceira nomeia o polimorfismo de inclusão ou por subtipo, que permite tratar um objeto da subclasse onde se espera a superclasse — a base do princípio de substituição de Liskov.\n\n' +
    'A quarta traz o efeito de projeto: código escrito contra a superclasse não precisa conhecer as subclasses, o que reduz acoplamento e permite estender o sistema sem alterar o que já existe. Como nenhuma contém erro, a resposta inclui as quatro.',
  'fun-2025-36':
    'Convém ler cada parcela separadamente. (a+b)*a(a+b)* descreve as cadeias que contêm pelo menos um "a" em alguma posição, com qualquer coisa antes e depois. A segunda parcela faz o mesmo para o "b".\n\n' +
    'A união das duas é o conjunto das cadeias que têm pelo menos um "a" OU pelo menos um "b". Como o alfabeto só tem esses dois símbolos, ter pelo menos um deles é o mesmo que ter pelo menos um símbolo qualquer.\n\n' +
    'Ou seja, a linguagem é a de todas as cadeias não vazias, que se escreve (a+b)*(a+b)(a+b)* — o símbolo do meio força comprimento mínimo 1.\n\n' +
    'A armadilha é responder (a+b)*, que gera todas as cadeias inclusive a vazia ε. A cadeia vazia não contém nem "a" nem "b", então não pertence a nenhuma das duas parcelas originais — e é exatamente essa cadeia que separa a alternativa correta da errada.',
  'fun-2025-37':
    'O lema do bombeamento é uma condição necessária para regularidade, nunca suficiente. Toda a questão gira em torno dessa assimetria.\n\n' +
    'Da necessidade sai a assertiva III (toda regular satisfaz o lema) e, por contraposição, a I (não satisfazer implica não ser regular). É esse raciocínio por contraposição que sustenta a IV: o uso prático do lema é provar não regularidade, exibindo uma cadeia que não pode ser bombeada.\n\n' +
    'As assertivas II e V tentam usar a recíproca, que é falsa. Existem linguagens não regulares que satisfazem as condições do lema, então satisfazê-lo não prova nada a favor.\n\n' +
    'Para provar que uma linguagem É regular, o caminho é construtivo: exibir um autômato finito, uma expressão regular ou uma gramática regular que a gere. O lema serve só para o lado negativo.',
  'fun-2025-38':
    'A primeira assertiva depende de uma leitura atenta do verbo "podem". Numa gramática não ambígua, as derivações à esquerda e à direita de uma cadeia produzem a mesma árvore; mas numa gramática ambígua elas realmente podem produzir árvores distintas, então a possibilidade existe e a assertiva é verdadeira.\n\n' +
    'A segunda é a definição literal de ambiguidade. A terceira é um teorema clássico: toda GLC admite uma equivalente na Forma Normal de Chomsky (com o cuidado usual quanto à cadeia vazia), e é essa forma que viabiliza o algoritmo CYK.\n\n' +
    'A quarta também é teorema: aceitação por estado final e por pilha vazia têm o mesmo poder de reconhecimento em autômatos com pilha não determinísticos, então toda LLC é aceita por pilha vazia.\n\n' +
    'A última é a única falsa. Remover símbolos inúteis (que não derivam terminais) e inacessíveis (que não são alcançados do símbolo inicial) preserva exatamente a linguagem — se alterasse, a simplificação não teria utilidade. Daí V – V – V – V – F.',
  'fun-2025-39':
    'A questão pede a EXCEÇÃO, então quatro alternativas descrevem objetivos legítimos e uma extrapola.\n\n' +
    'Organizar o acervo, classificar por plano de classificação e tabela de temporalidade, controlar prazos de guarda e descarte e assegurar autenticidade, integridade, confiabilidade e acessibilidade são funções centrais de um SGDA — as três últimas, aliás, são requisitos previstos em normas de gestão arquivística.\n\n' +
    'Substituir integralmente os arquivos físicos por versões digitais não é objetivo do sistema. Um SGDA gerencia documentos em qualquer suporte; a digitalização é um meio possível, não a finalidade.\n\n' +
    'Há ainda uma razão prática: documentos com valor legal ou histórico frequentemente têm guarda física obrigatória, e a digitalização não elimina o original. Confundir gestão documental com digitalização é justamente o erro que a alternativa explora.',
  'fun-2025-40':
    'Duas ideias separam as verdadeiras das falsas: a diferença entre compressão com e sem perdas, e o fato de o BMP ser essencialmente não comprimido.\n\n' +
    'A primeira assertiva está correta: RLE codifica sequências repetidas como par (valor, contagem), é reversível bit a bit e brilha em imagens com grandes áreas de cor uniforme. Pelo mesmo motivo, a quarta também é verdadeira — em fotografias, os valores variam a cada pixel e o RLE pode até aumentar o arquivo.\n\n' +
    'A segunda é falsa por definição: JPEG descarta informação (quantização dos coeficientes DCT), então o resultado da descompressão não é idêntico ao original. A terceira também: o BMP tipicamente não comprime nada, guardando cada pixel diretamente.\n\n' +
    'A quinta é verdadeira e decorre da terceira: por armazenar tudo sem compressão, o BMP suporta alta profundidade de cor com fidelidade total, mas gera arquivos grandes demais para a web. A ordem é V – F – F – V – V.',
  'fun-2025-41':
    'Buscar por nome de arquivo e buscar por conteúdo são problemas diferentes. O primeiro se resolve com a estrutura de diretórios; o segundo exige olhar dentro de cada arquivo.\n\n' +
    'Varrer todos os arquivos a cada consulta seria inviável, então a solução é construir antecipadamente um índice invertido: uma estrutura que, para cada termo, guarda a lista de arquivos (e posições) onde ele aparece. É a indexação full-text.\n\n' +
    'Com o índice pronto, a consulta deixa de depender do tamanho do acervo e passa a depender apenas do número de ocorrências do termo.\n\n' +
    'As demais alternativas resolvem outros problemas: armazenamento em blocos é organização física do disco, hashing localiza arquivos por nome, R-trees indexam dados espaciais e compactação trata do tamanho, não da busca.',
  'fun-2025-42':
    'O turnaround de um processo é o tempo total entre a chegada e o término, e no round-robin ele sofre com dois efeitos opostos que o quantum precisa equilibrar.\n\n' +
    'Se o ciclo de CPU for menor que o custo da troca de contexto, o processador gasta mais tempo trocando de processo do que executando — a sobrecarga domina. Daí a exigência exec_t > switch_t.\n\n' +
    'Por outro lado, se o ciclo de CPU exceder o quantum, o processo é preemptado no meio do trabalho, volta para o fim da fila e ainda paga uma troca de contexto extra, alongando seu turnaround. Daí a exigência exec_t < quantum.\n\n' +
    'As duas condições precisam valer ao mesmo tempo, ou seja, switch_t < exec_t < quantum. É o raciocínio clássico de dimensionamento do quantum: grande o bastante para a maioria dos ciclos de CPU caber inteiro, pequeno o bastante para manter a interatividade.',
  'fun-2025-45':
    'As estruturas de seleção são classificadas pelo número de caminhos que oferecem.\n\n' +
    'A seleção simples tem um só caminho condicional: se a expressão lógica for verdadeira, o bloco é executado; se for falsa, o fluxo simplesmente segue adiante. Corresponde ao if sem else, e é exatamente o que o enunciado descreve.\n\n' +
    'A seleção dupla acrescenta um caminho alternativo (if/else), e a múltipla escolhe entre vários casos a partir do valor de uma expressão (switch/case).\n\n' +
    'A seleção aninhada não é um quarto tipo, e sim o encaixe de uma seleção dentro de outra. E "aleatória" não existe como estrutura de controle — está ali apenas como distrator.',
  'fun-2025-46':
    'A escolha entre estruturas de repetição depende de quando o número de iterações é conhecido.\n\n' +
    'Quando ele é conhecido de antemão, o for é a forma natural: ele reúne inicialização, condição de parada e incremento num único cabeçalho, deixando o contrato da repetição explícito para quem lê.\n\n' +
    'O while atende ao caso oposto, em que o fim depende de uma condição avaliada a cada passo — ler até o fim do arquivo, repetir até o usuário digitar algo válido.\n\n' +
    'As outras alternativas nem são estruturas de repetição: break e continue alteram o fluxo dentro de um laço já existente, e if é seleção. Vale notar que for e while têm o mesmo poder expressivo; a escolha é de clareza, não de capacidade.',
  'fun-2025-47':
    'O enunciado descreve três elementos: decompor em subtarefas finitas, explorar sistematicamente as possibilidades e fazer sucessivos testes até chegar a uma solução viável.\n\n' +
    'Essa combinação caracteriza tentativa e erro, também chamada de backtracking: percorre-se a árvore de possibilidades, e sempre que um caminho se mostra inviável, desfaz-se a última escolha e tenta-se a próxima.\n\n' +
    'Divisão e conquista quebra o problema em subproblemas independentes e combina as soluções, sem esse vaivém. Programação dinâmica também decompõe, mas guarda resultados de subproblemas sobrepostos em vez de testar alternativas. Algoritmos gulosos escolhem e nunca revisam.\n\n' +
    'Recursividade é a que mais confunde: ela é a técnica de implementação usada com frequência pelo backtracking, mas é um mecanismo de programação, não um método de projeto de algoritmos. Problemas clássicos resolvidos assim são as oito rainhas, o sudoku e o passeio do cavalo.',
  'fun-2025-48':
    'Cada alternativa errada troca um termo por outro de definição próxima, então vale conferir uma a uma.\n\n' +
    'A correta descreve a orientação da aresta: em (u,v) a aresta sai de u e chega em v, e dizer que v é adjacente a u respeita esse sentido — a relação de adjacência em grafo direcionado não é simétrica.\n\n' +
    'A primeira inverte conexo com desconexo: se todo par de vértices é mutuamente alcançável, o grafo é fortemente conexo, não desconexo. A terceira ignora que grafos direcionados têm grau de entrada e grau de saída separados, não um grau único.\n\n' +
    'A quarta aplica a grafos não direcionados a contagem de entrada e saída, que só faz sentido quando há orientação. E a quinta usa "fortemente conectado", termo exclusivo de grafos direcionados — em não direcionados o conceito equivalente é simplesmente conexo.',
  'fun-2025-49':
    'A ordenação topológica arruma os vértices numa linha de modo que toda aresta aponte da esquerda para a direita, respeitando as dependências.\n\n' +
    'A exigência de o grafo ser acíclico não é detalhe: um ciclo criaria uma dependência circular, e nenhum de seus vértices poderia vir antes de todos os seus sucessores. Por isso a ordenação existe se e somente se o grafo é um DAG.\n\n' +
    'Os dois algoritmos usuais são o de Kahn, que remove repetidamente vértices de grau de entrada zero, e a busca em profundidade, que empilha cada vértice ao terminá-lo e devolve a pilha invertida. Ambos rodam em O(V + A).\n\n' +
    'As demais alternativas são de outras famílias: árvore geradora mínima resolve conexão de custo mínimo, e listas e matrizes de adjacência são formas de representar o grafo, não de ordená-lo. Aplicações típicas são ordem de compilação, resolução de dependências de pacotes e escalonamento de tarefas.',
  'fun-2025-50':
    'A propriedade descrita — esgotar a distância k antes de tocar em qualquer vértice de distância k+1 — é a definição de exploração por camadas, que caracteriza a busca em largura.\n\n' +
    'O que garante essa ordem é a estrutura de dados: a BFS usa uma fila. Como a fila é FIFO, os vértices descobertos primeiro (mais próximos) são também os primeiros a ser expandidos, e nenhum vértice mais distante é alcançado antes.\n\n' +
    'A busca em profundidade faz o oposto: usa pilha (ou recursão) e mergulha o mais fundo possível antes de voltar, podendo alcançar um vértice distante logo no começo.\n\n' +
    'A consequência prática é importante: em grafos não ponderados, a BFS encontra o caminho mínimo em número de arestas, porque a camada em que um vértice é descoberto é exatamente sua distância à origem. Busca binária e busca sequencial nem operam sobre grafos.',
  'mat-2025-01':
    'O método de Gauss elimina incógnitas combinando linhas. Aqui vale procurar a combinação que apaga duas de uma vez: a 1ª e a 3ª equação têm o mesmo 3x e o mesmo +z, então subtrair uma da outra deixa só y.\n\n' +
    '(3x − 3y + z) − (3x − 5y + z) = −9 − 7 dá 2y = −16, logo y = −8. Com y conhecido, a 2ª equação vira x − 8 − z = 1, ou seja, x = 9 + z.\n\n' +
    'Substituindo os dois na 1ª: 3(9 + z) − 3(−8) + z = −9 → 27 + 3z + 24 + z = −9 → 4z = −60 → z = −15.\n\n' +
    'A lição é escolher a ordem da eliminação em vez de seguir o pivô mecanicamente: reparar que duas equações compartilham coeficientes economiza metade da conta.',
  'mat-2025-02':
    'A matriz é triangular superior (tudo abaixo da diagonal é zero). Para essas matrizes, o polinômio característico já sai fatorado: det(A − λI) = (4 − λ)(2 − λ), porque o determinante de uma triangular é o produto da diagonal.\n\n' +
    'Logo os autovalores são exatamente os elementos da diagonal, 4 e 2 — reais e distintos. Como uma matriz n×n com n autovalores distintos sempre tem n autovetores linearmente independentes, A é diagonalizável.\n\n' +
    'As outras alternativas erram em pontos clássicos: autovalores complexos exigiriam discriminante negativo, o que não é o caso; a simetria é condição suficiente para autovalores reais, não necessária; e a multiplicidade de 4 é 1, não 2.\n\n' +
    'Vale fixar o atalho: diante de matriz triangular (ou diagonal), leia os autovalores direto da diagonal, sem montar o polinômio característico.',
  'mat-2025-03':
    'Projetar v sobre o subespaço gerado por w é encontrar o múltiplo de w mais próximo de v. A fórmula é proj_W(v) = (⟨v, w⟩ / ⟨w, w⟩) · w.\n\n' +
    'Com v = (3, 4, 0) e w = (1, 0, 0): ⟨v, w⟩ = 3·1 + 4·0 + 0·0 = 3 e ⟨w, w⟩ = 1. O escalar é 3/1 = 3, e a projeção é 3·(1, 0, 0) = (3, 0, 0).\n\n' +
    'Como w é o versor do eixo x, o resultado tem interpretação direta: a projeção guarda só a componente x de v e descarta o resto. O vetor descartado, (0, 4, 0), é a parte de v ortogonal a W.\n\n' +
    'Repare que (3, 4, 0) é o próprio v (projeção só devolve v se v já estivesse em W) e (0, 4, 0) é justamente a componente perpendicular — as duas armadilhas mais comuns da questão.',
  'mat-2025-04':
    'O truque é montar uma recorrência olhando para a última micro-operação da sequência. Se ela é do tipo A (1 ciclo), o que veio antes soma n − 1 ciclos; se é do tipo B (2 ciclos), o que veio antes soma n − 2.\n\n' +
    'Como os dois casos são disjuntos e cobrem tudo, f(n) = f(n − 1) + f(n − 2). Os casos-base: f(0) = 1 (a sequência vazia) e f(1) = 1 (só um A cabe em 1 ciclo).\n\n' +
    'Isso é exatamente Fibonacci deslocado: 1, 1, 2, 3, 5, 8, 13, 21, 34 para n = 0 até 8. Logo f(8) = 34.\n\n' +
    'A alternativa 21 é a resposta para 7 ciclos e a 55 para 9 — erros de deslocar o índice em um. Contar os casos-base com cuidado é o que separa as três.',
  'mat-2025-05':
    'A restrição diz que a equipe não pode conter dois dos 3 especialistas conflitantes. Ou seja, ela contém no máximo um deles, o que já sugere separar em casos.\n\n' +
    'Caso 1 — nenhum dos 3: escolhem-se os 4 entre os outros 6, C(6,4) = 15. Caso 2 — exatamente um dos 3: são 3 escolhas para ele e C(6,3) = 20 para completar a equipe, dando 3 × 20 = 60.\n\n' +
    'Os casos são mutuamente exclusivos, então basta somar: 15 + 60 = 75.\n\n' +
    'Dá para conferir pelo complementar: o total sem restrição é C(9,4) = 126, e as equipes proibidas (com dois ou três conflitantes) somam 51 — 126 − 51 = 75. A alternativa 126 é justamente a armadilha de ignorar a restrição.',
  'mat-2025-06':
    'Quando a restrição é "não podem ficar adjacentes", a técnica padrão é posicionar primeiro os elementos sem restrição e só depois encaixar os restritos nos espaços entre eles.\n\n' +
    'Aqui os 4 servidores B ocupam suas posições e criam 5 lacunas: uma antes do primeiro, três entre eles e uma depois do último. Colocar cada A em uma lacuna diferente garante automaticamente que dois A nunca fiquem lado a lado.\n\n' +
    'Como os servidores de cada tipo são idênticos, só importa quais lacunas foram escolhidas: C(5,3) = 10.\n\n' +
    'A alternativa 35 é C(7,3), o total de disposições sem a restrição de ventilação — o erro de quem esquece a condição. A diferença entre 35 e 10 mostra o quanto a restrição corta o espaço de soluções.',
  'mat-2025-07':
    'A ideia geométrica é: caminhando sobre a curva g(x, y) = 0, o valor de f só para de crescer quando a direção de maior crescimento de f não tem componente ao longo da restrição. Isso acontece quando a curva de nível de f tangencia a restrição.\n\n' +
    'Dois gradientes são perpendiculares às suas respectivas curvas de nível. Se as curvas se tangenciam, os gradientes ficam paralelos, e paralelismo se escreve como ∇f = λ∇g, sendo λ o multiplicador de Lagrange.\n\n' +
    'O sistema a resolver junta essa igualdade (uma equação por variável) com a própria restrição g(x, y) = 0, que fecha o número de equações.\n\n' +
    'As demais alternativas erram na natureza dos objetos: ∇f = λg iguala um vetor a um escalar, e f = λg iguala valores da função em vez de direções de crescimento.',
  'mat-2025-08':
    'A regra dos trapézios aproxima a área sob a curva por trapézios. Na forma composta com n subintervalos de largura h, a fórmula é (h/2)·[f(x₀) + 2f(x₁) + … + 2f(xₙ₋₁) + f(xₙ)] — os pontos internos entram com peso 2 porque são compartilhados por dois trapézios.\n\n' +
    'Com o intervalo [0, 2] e dois subintervalos, h = 1 e os pontos são 0, 1 e 2, com f(0) = 0, f(1) = 1 e f(2) = 4.\n\n' +
    'Aplicando: (1/2)·[0 + 2·1 + 4] = (1/2)·6 = 3.\n\n' +
    'O valor exato da integral é 8/3 ≈ 2,67, então a aproximação superestima. Isso não é acaso: para funções convexas como x², a corda fica acima da curva e o trapézio sempre erra para cima.',
  'mat-2025-09':
    'O gradiente é o vetor que reúne as derivadas parciais: ∇f = (∂f/∂x, ∂f/∂y). Cada parcial trata as demais variáveis como constantes.\n\n' +
    'Derivando f = x²y + 3y² em relação a x, o termo 3y² é constante e some; sobra 2xy.\n\n' +
    'Derivando em relação a y, o termo x²y tem x² como constante e vira x²; o termo 3y² vira 6y. Logo ∂f/∂y = x² + 6y.\n\n' +
    'As alternativas erradas misturam as variáveis, tratando x e y como se ambas variassem na mesma derivada — o erro mais comum ao começar cálculo de várias variáveis.',
  'mat-2025-10':
    'O baricentro é o ponto de encontro das medianas de um triângulo e coincide com a média aritmética dos três vértices, coordenada a coordenada.\n\n' +
    'Somando as abscissas: 2 + 4 + 0 = 6, dividido por 3 dá x = 2. Somando as ordenadas: −5 + 0 + 2 = −3, dividido por 3 dá y = −1.\n\n' +
    'Portanto G = (2, −1). A alternativa (6, −3) é a soma sem dividir por 3, o descuido mais frequente aqui.\n\n' +
    'Vale lembrar a propriedade que dá origem à fórmula: o baricentro divide cada mediana na razão 2:1 a partir do vértice, e é o centro de massa de três massas iguais nos vértices.',
  'mat-2025-11':
    'A reta em forma paramétrica parte do ponto e caminha na direção do vetor: (x, y, z) = (1, 4, 3) + t·(−3, −2, −3), ou seja, x = 1 − 3t, y = 4 − 2t e z = 3 − 3t.\n\n' +
    'O plano xy é caracterizado por z = 0. Basta então achar o t que zera a terceira coordenada: 3 − 3t = 0 → t = 1.\n\n' +
    'Com t = 1: x = 1 − 3 = −2 e y = 4 − 2 = 2. O ponto de interseção é (−2, 2, 0).\n\n' +
    'O passo que decide a questão é traduzir "plano xy" para a equação z = 0. Trocar por x = 0 ou y = 0 leva direto às alternativas erradas que começam com 0.',
  'mat-2025-12':
    'Na coordenada polar (r, θ), r é a distância à origem e θ o ângulo medido a partir do eixo x positivo. A conversão para cartesianas é x = r·cos θ e y = r·sen θ.\n\n' +
    'Com r = 3 e θ = π (meia volta, 180°): cos π = −1 e sen π = 0.\n\n' +
    'Logo x = 3·(−1) = −3 e y = 3·0 = 0, ou seja, P = (−3, 0).\n\n' +
    'Geometricamente: caminhar 3 unidades na direção oposta ao eixo x positivo. A alternativa (3, π) é a armadilha de copiar o par polar sem converter, e (3, 0) esquece a meia volta.',
  'mat-2025-14':
    'A tabela-verdade precisa esgotar todas as atribuições possíveis de valores às proposições atômicas. Cada uma pode ser V ou F, de forma independente das outras.\n\n' +
    'Com 3 proposições (p, q e r), o número de combinações é 2 × 2 × 2 = 2³ = 8. A regra geral é 2ⁿ linhas para n proposições distintas.\n\n' +
    'O número de conectivos da fórmula não muda essa contagem: (p ∧ q) → r tem dois conectivos, mas eles apenas acrescentam colunas intermediárias, não linhas.\n\n' +
    'Esse é o motivo prático de a verificação por tabela-verdade ser inviável em fórmulas grandes: o custo dobra a cada nova proposição, e a satisfatibilidade proposicional é o problema NP-completo original.',
  'mat-2025-15':
    'O quantificador universal ∀x P(x) afirma que a propriedade P vale para todo elemento do domínio, sem exceção. A leitura natural é "para todo x, P(x)".\n\n' +
    '"Todos os alunos estudaram" é exatamente essa forma, com o domínio sendo os alunos e P(x) = "x estudou".\n\n' +
    'As demais usam outras estruturas: "existe" e "alguns" pedem o quantificador existencial ∃x P(x); "nenhum aluno passou" é ∀x ¬P(x) (ou, equivalentemente, ¬∃x P(x)); e "Pedro estudou" é uma proposição sobre uma constante, P(pedro), sem quantificador.\n\n' +
    'Vale gravar a dualidade que aparece o tempo todo em provas: ¬∀x P(x) ≡ ∃x ¬P(x) e ¬∃x P(x) ≡ ∀x ¬P(x).',
  'mat-2025-16':
    'A definição tem os dois ingredientes de toda recursão: um caso-base que encerra (f(0) = 1) e um passo recursivo que reduz o problema (f(n) = n · f(n − 1)).\n\n' +
    'Desenrolando de fora para dentro: f(4) = 4 · f(3); f(3) = 3 · f(2); f(2) = 2 · f(1); f(1) = 1 · f(0); e f(0) = 1 encerra a cadeia.\n\n' +
    'Multiplicando na volta: 1 → 1 → 2 → 6 → 24. Logo f(4) = 24.\n\n' +
    'Essa é a definição clássica do fatorial, e serve de modelo para entender a pilha de chamadas: cada chamada fica suspensa esperando a de baixo terminar, e é o caso-base que impede a recursão infinita.',
  'mat-2025-17':
    'O código de Hamming (7,4) transmite 7 bits para cada 4 bits de dados, usando 3 bits de paridade. Sua distância mínima de Hamming é 3: duas palavras válidas quaisquer diferem em pelo menos 3 posições.\n\n' +
    'Da distância mínima d saem as duas capacidades: detectam-se até d − 1 erros e corrigem-se até ⌊(d − 1)/2⌋. Com d = 3, isso dá detecção de 2 erros e correção de 1.\n\n' +
    'A intuição é geométrica: com d = 3, uma palavra com 1 erro ainda está mais perto da original do que de qualquer outra válida, então dá para corrigi-la. Com 2 erros ela fica equidistante — dá para perceber que houve erro, mas não para saber qual era a original.\n\n' +
    'A matriz geradora, por sinal, é 4×7 (4 linhas de dados, 7 colunas de saída), e não 3×7 como sugere a última alternativa.',
  'mat-2025-18':
    'Vale listar os dois conjuntos antes de intersectar. A = {x ∈ Z | −2 ≤ x ≤ 3} contém os inteiros de −2 a 3: {−2, −1, 0, 1, 2, 3}.\n\n' +
    'B = {x ∈ Z | x é par e 0 ≤ x ≤ 6} contém os pares de 0 a 6: {0, 2, 4, 6}.\n\n' +
    'A interseção guarda só o que está nos dois: 0 e 2. O 4 e o 6 estão em B mas passam do limite superior de A; os negativos e os ímpares estão em A mas não em B.\n\n' +
    'Os distratores exploram exatamente esses dois descuidos: {0, 2, 4} inclui um elemento fora de A, e {−2, 0, 2} inclui um par negativo que está fora de B.',
  'mat-2025-19':
    'O coeficiente de correlação linear mede o quanto os pontos (X, Y) se aproximam de uma reta, e seu sinal indica o sentido dessa reta.\n\n' +
    'Quando o alinhamento é perfeito, r vale exatamente +1 (reta crescente, correlação perfeita positiva) ou −1 (reta decrescente, correlação perfeita negativa) — que é o que a alternativa correta descreve.\n\n' +
    'As demais trocam as definições: correlação negativa é X crescente com Y decrescente (e não crescente com crescente), positiva é o oposto disso, e a referência a uma hipérbole está errada porque a correlação linear se apoia em reta.\n\n' +
    'Um alerta importante: r próximo de zero descarta relação linear, mas não descarta dependência — variáveis ligadas por uma parábola, por exemplo, podem ter r ≈ 0. E correlação alta nunca implica causalidade.',
  'mat-2025-20':
    'As duas primeiras assertivas repetem as definições padrão: a série temporal (ou cronológica, ou histórica) varia no tempo, e a série geográfica varia apenas no local. Ambas verdadeiras.\n\n' +
    'A terceira e a quarta estão trocadas entre si. Série homógrada é aquela em que o fenômeno NÃO se subdivide — é o caso da temporal, da geográfica e da específica, justamente as que a assertiva III chama de heterógradas.\n\n' +
    'Série heterógrada é a que se subdivide, com o fenômeno variando em intensidade — a distribuição de frequências é o exemplo clássico, e a assertiva IV a classifica como homógrada, invertendo os termos.\n\n' +
    'Daí a ordem V – V – F – F. O padrão da banca aqui é clássico: definições corretas nas primeiras assertivas e uma troca de nomes nas últimas, para separar quem decorou o rótulo de quem entendeu o critério (subdividir ou não).',
  'mat-2019-15':
    'Toda implicação é equivalente à sua contrapositiva: A → B ≡ ∼B → ∼A. Lendo ∼q → ∼p nessa forma, com A = ∼q e B = ∼p, a contrapositiva é p → q. Ou seja, negar os dois lados e inverter o sentido da flecha devolve a implicação original.\n\n' +
    'Falta só reescrever p → q sem a flecha. Pela definição de implicação material, p → q ≡ ∼p ∨ q — a implicação só é falsa quando p é verdadeira e q é falsa, exatamente o único caso em que ∼p ∨ q também é falsa.\n\n' +
    'As demais falham no teste da tabela-verdade: ∼p ∧ ∼q só é verdadeira quando p e q são ambas falsas; ∼p → q equivale a p ∨ q; p → ∼q equivale a ∼p ∨ ∼q; e q → p é a recíproca, não a contrapositiva (troca os lados sem negar).\n\n' +
    'Para a prova, vale decorar as duas regras usadas aqui: A → B ≡ ∼B → ∼A e A → B ≡ ∼A ∨ B. Com elas, quase toda questão de equivalência lógica do POSCOMP sai em duas linhas.',
  'fun-2019-21':
    'Cada algoritmo vira uma recorrência T(n) = a·T(n/b) + f(n), e o teorema mestre compara f(n) com n^(log_b a): quem crescer mais rápido domina o custo total.\n\n' +
    'Algoritmo 1: a = 3, b = 4, f(n) = O(1). Como n^(log₄3) ≈ n^0,79 cresce mais que a constante, o custo é dominado pelas folhas da recursão: Θ(n^log₄3).\n\n' +
    'Algoritmo 2: a = 3, b = 2, f(n) = O(n²). Aqui n^(log₂3) ≈ n^1,58 é menor que n², então o custo extra de cada nível domina e o resultado é Θ(n²) — é justamente esse detalhe que elimina a alternativa que responde Θ(n^log₂3).\n\n' +
    'Algoritmo 3: a = 3, b = 3, f(n) = O(n). Como n^(log₃3) = n empata com f(n), entra o caso de empate do teorema, que acrescenta um fator log: Θ(n log n).\n\n' +
    'As outras alternativas erram por confundir o tamanho do subproblema (n/4, n/2, n/3) com a complexidade final, ou por ignorar o custo adicional por chamada.',
  'fun-2019-22':
    'O truque para comparar funções que crescem muito rápido é comparar seus logaritmos, porque log é monótono crescente: se log a(n) < log b(n) assintoticamente, então a(n) < b(n).\n\n' +
    'Para h(n) = n^(log n) temos log h(n) = (log n)²; para f(n) = 2ⁿ temos log f(n) = n·log 2, que é linear. Como n domina (log n)², concluímos h(n) = O(f(n)) — potências de log ficam sempre abaixo de qualquer função linear.\n\n' +
    'Para g(n) = n!, a aproximação de Stirling dá n! ≈ (n/e)ⁿ·√(2πn), cuja base cresce com n, enquanto 2ⁿ tem base fixa 2. Logo n! cresce mais rápido que 2ⁿ, isto é, g(n) = Ω(f(n)).\n\n' +
    'A ordem final é h(n) < f(n) < g(n). Isso derruba as alternativas que afirmam g(n) = O(h(n)), f(n) = Ω(g(n)) ou g(n) = O(f(n)): todas invertem algum elo dessa cadeia.',
  'fun-2019-23':
    'Ancestral é uma relação definida por recursão: os ancestrais de um nodo são o seu pai e, em seguida, todos os ancestrais desse pai. Por isso a alternativa correta descreve tanto o ancestral direto (o pai) quanto os ancestrais mais acima na árvore, até a raiz.\n\n' +
    'As outras alternativas trocam definições clássicas: nodo interno é o que tem ao menos um filho e nodo externo (folha) é o que não tem nenhum — a alternativa inverte os dois. Árvore balanceada diz respeito à diferença de altura entre subárvores, e não à existência de uma ordem linear. Árvore binária própria (ou cheia) é aquela em que todo nodo interno tem exatamente dois filhos, não "um ou zero". E se v é pai de u, então u é filho de v — a última alternativa inverte a relação.\n\n' +
    'Fica a dica de estudo: em questões de terminologia de árvores, a banca costuma apenas inverter pares de conceitos (interno/externo, pai/filho, ancestral/descendente). Ler cada alternativa checando a direção da relação resolve a maioria delas.',
  'fun-2019-24':
    'A definição de recursão é sintática e direta: um procedimento é recursivo quando, na sua própria descrição, aparecem uma ou mais chamadas a si mesmo. É o que permite escrever fatorial(n) em termos de fatorial(n−1), com um caso base para encerrar as chamadas.\n\n' +
    'A indução matemática aparece como distratora porque é a ferramenta usada para provar a corretude de algoritmos recursivos — mas provar e ser recursivo são coisas diferentes; nenhum código precisa conter uma prova.\n\n' +
    'Chamadas a procedimentos externos ou internos, sozinhas, caracterizam apenas composição de funções. Sem a autorreferência não há recursão, e sem caso base há recursão infinita (que estoura a pilha de execução).',
  'fun-2019-25':
    'Analise os laços de dentro para fora. Para um i fixo, o laço interno vai de j = 1 até j < log(i), executando aproximadamente log(i) iterações de custo constante.\n\n' +
    'O total é então a soma dos log(i) para i indo de 1 a n. Essa soma é log(1) + log(2) + ... + log(n) = log(n!), e por Stirling log(n!) = Θ(n log n). Uma forma mais intuitiva: metade dos termos tem i > n/2, e para esses log(i) > log(n) − 1, o que já garante pelo menos (n/2)(log n − 1) operações.\n\n' +
    'Θ(n) sairia se o laço interno tivesse custo constante; Θ(n²) exigiria um laço interno proporcional a i; e Θ(n² log n) superestima em uma ordem inteira. O padrão a fixar: laço externo n vezes com interno logarítmico dá Θ(n log n).',
  'tec-2019-52':
    'A pergunta traz duas pistas que restringem a resposta: aprendizado não supervisionado (sem amostra de treinamento pré-classificada) e particionamento dos dados. As duas juntas descrevem agrupamento (clustering), e o representante clássico é o k-means.\n\n' +
    'O k-means funciona assim: escolhe k centroides, atribui cada ponto ao centroide mais próximo e recalcula os centroides como a média dos pontos atribuídos, repetindo até estabilizar. Nenhum rótulo é usado — apenas a distância entre os pontos.\n\n' +
    'As distratoras vêm de outra família de tarefas: crescimento de padrão frequente (FP-Growth), árvore de padrão frequente (FP-Tree) e associação negativa pertencem à mineração de regras de associação; amostragem é técnica de redução de dados, não de particionamento em grupos.',
  'tec-2019-54':
    'No modelo ISO/OSI (e no padrão IEEE 802), a camada de enlace é dividida em duas subcamadas com responsabilidades bem separadas: LLC (Logical Link Control), que trata do enquadramento, do controle de erros e da interface com a camada de rede; e MAC (Medium Access Control), que decide quem transmite e quando, além de cuidar do endereçamento físico.\n\n' +
    'As alternativas erradas misturam camadas e funções: controle de fluxo é função, não subcamada, e controle de congestionamento é da camada de transporte; multiplexação também é da camada de transporte; física, rede, transporte e apresentação são outras camadas do modelo, e não subdivisões do enlace.\n\n' +
    'Mnemônico útil: LLC olha "para cima" (conversa com a camada de rede) e MAC olha "para baixo" (conversa com o meio físico).',
  'tec-2019-57':
    'O produto vetorial a × b devolve um vetor perpendicular ao plano formado por a e b, com módulo |a||b|·sen θ e sentido dado pela regra da mão direita. Aplicado aos eixos X e Y de um sistema destro, X × Y produz exatamente o eixo Z.\n\n' +
    'É essa propriedade que torna o produto vetorial onipresente em computação gráfica: ele gera as normais de superfícies para cálculo de iluminação e permite montar uma base ortonormal (por exemplo, a matriz de visão de uma câmera) a partir de dois vetores conhecidos.\n\n' +
    'As demais operações não servem: o produto escalar devolve um número (útil para ângulos e projeções, não para gerar direções); normalização só ajusta o comprimento para 1, mantendo a direção; translação desloca pontos; projeção reduz um vetor à sua componente sobre outro.',
  'tec-2019-58':
    'A luz direcional é modelada como uma fonte infinitamente distante: seus raios chegam paralelos e apenas a direção importa, sem posição nem atenuação com a distância. É o modelo usado para o Sol, cuja distância é enorme em relação à cena.\n\n' +
    'Comparando com as outras fontes: a pontual tem posição no espaço e intensidade que cai com a distância; a ambiente é uma constante aplicada a tudo, para simular a luz que já foi espalhada pelo ambiente; a spot é uma pontual restrita a um cone (como um holofote).\n\n' +
    'Já "difusa" não é tipo de fonte, e sim tipo de reflexão — a componente do modelo de Phong que espalha a luz igualmente em todas as direções a partir da superfície.',
  'tec-2019-60':
    'A máscara 255.255.255.0 é um /24: os 24 primeiros bits identificam a rede e sobram 8 bits para hosts, o que dá 2⁸ = 256 combinações.\n\n' +
    'Dessas 256, duas não podem ser atribuídas a máquinas: a de bits de host todos em 0 identifica a própria rede, e a de bits todos em 1 é o endereço de broadcast. Logo, 2⁸ − 2 = 254 hosts endereçáveis.\n\n' +
    'As distratoras correspondem a outros prefixos ou ao erro de esquecer o desconto: 126 é o resultado de um /25 (2⁷ − 2), 128 e 256 são potências de 2 sem subtrair rede e broadcast, e 65.534 é o total de um /16 (2¹⁶ − 2).\n\n' +
    'Regra geral: com h bits de host, o número de endereços utilizáveis é 2^h − 2.',
  'tec-2019-64':
    'O enunciado descreve uma transação que se ramifica em subtransações executadas em paralelo em máquinas diferentes — isto é, uma hierarquia de transações. Esse arranjo tem nome próprio: transação aninhada (nested transaction).\n\n' +
    'A ideia é que a transação de nível mais alto só confirma (commit) se as regras de suas filhas permitirem; uma filha pode abortar e ser recomposta sem necessariamente derrubar a transação-pai, o que dá flexibilidade em ambientes distribuídos.\n\n' +
    'As outras alternativas listam propriedades ACID, não formas de organizar transações: atomicidade (tudo ou nada), isolamento (transações concorrentes não interferem entre si) e durabilidade (o efeito do commit persiste a falhas). São conceitos ortogonais ao aninhamento.',
  'fun-2010-27':
    'A chave do problema é que o vetor contém apenas dois valores distintos, e ambos são conhecidos de antemão. Basta uma passada contando quantas vezes x aparece e quantas vezes y aparece, e depois reescrever o vetor com os x seguidos dos y — duas passadas lineares, custo O(n).\n\n' +
    'Isso não viola o limite inferior Ω(n log n): esse limite vale para ordenação por comparação de elementos arbitrários. Aqui não comparamos elementos entre si, apenas os testamos contra valores conhecidos, saindo do modelo de comparação (a mesma ideia do counting sort).\n\n' +
    'Por isso as alternativas de limite inferior Ω(n²) e Ω(n log n) caem, e também a que diz que o Quicksort O(n log n) seria o mais eficiente — existe algo melhor. A da ordenação por inserção também falha: seu melhor caso O(n) só ocorre se o vetor já estiver ordenado, e o enunciado diz que os valores estão distribuídos aleatoriamente.',
  'fun-2010-46':
    'K₃,₂ é o grafo bipartido completo com partes de 3 e 2 vértices: toda aresta liga um vértice de um lado a um do outro, e nunca dois vértices do mesmo lado.\n\n' +
    'Isso dá uma coloração imediata com duas cores — uma para cada parte — pois vértices adjacentes estão sempre em partes diferentes. E uma cor não basta, já que o grafo tem pelo menos uma aresta. Portanto o número cromático é exatamente 2.\n\n' +
    'Generalizando: um grafo é bipartido se e somente se não possui ciclo de comprimento ímpar, e todo grafo bipartido com ao menos uma aresta tem número cromático 2. Números cromáticos 3 ou mais aparecem quando há triângulos ou outros ciclos ímpares — o que não é o caso aqui.',
  'tec-2010-47':
    'Vale checar afirmativa por afirmativa. I está invertida: índice denso tem uma entrada para cada valor da chave de busca no arquivo de dados, e índice esparso tem entradas apenas para alguns valores (tipicamente um por bloco).\n\n' +
    'II está correta: o índice é um arquivo sequencial de pares (chave, ponteiro) ordenado pela chave — é isso que permite a busca binária sobre ele.\n\n' +
    'III está errada em dois pontos: quem determina a ordem física dos registros no disco é o índice primário (ou de agrupamento), e um arquivo pode ter vários índices secundários, não no máximo um.\n\n' +
    'IV está correta: em um índice denso, cada inserção ou remoção no arquivo de dados exige a inserção ou remoção da entrada correspondente no índice — é o preço da densidade, e a razão de o índice esparso ser mais barato de manter.\n\n' +
    'Logo, apenas II e IV.',
  'tec-2010-49':
    'Em uma Árvore B de ordem m, cada nó (exceto a raiz) guarda entre m e 2m registros. O split acontece exatamente quando se tenta inserir em um nó que já está cheio, com 2m registros: o nó é dividido em dois, cada um com cerca de m registros, e a chave do meio sobe para o nó pai.\n\n' +
    'Como essa subida pode encher o pai, o split pode propagar-se para cima em cascata. A altura da árvore aumenta somente no caso extremo em que a propagação chega à raiz e a raiz também é dividida — por isso a alternativa que diz que a altura cresce a cada split está errada.\n\n' +
    'As outras também caem: inserir em nó com menos de 2m registros cabe sem divisão; o valor relativo da chave define apenas onde ela entra, não se há split; e split não serve para diminuir altura (quem reduz altura é a fusão de nós na remoção).\n\n' +
    'Esse mecanismo é o que mantém a árvore sempre balanceada, com todas as folhas no mesmo nível e busca em O(log n) acessos a disco.',
  'mat-2022-11':
    '"Exatamente uma pessoa entre Marcos e Heide viajou" é o ou-exclusivo: p ⊕ q, verdadeiro quando exatamente um dos dois viajou.\n\n' +
    'Negar isso é dizer que não é o caso de exatamente um ter viajado, ou seja, que os dois têm o mesmo valor de verdade: ∼(p ⊕ q) ≡ (p ↔ q). Em português: ambos viajaram ou nenhum dos dois viajou.\n\n' +
    'As demais são apenas uma metade da negação ou coisa diferente: "ambos viajaram" e "ambos não viajaram" cobrem cada um só um dos dois casos; "Marcos ou Heide não viajou" continua verdadeira quando exatamente um viajou (logo não é a negação); e "pelo menos um viajou" também é compatível com exatamente um ter viajado.\n\n' +
    'Regra prática: a negação do ou-exclusivo é a bicondicional, e a da bicondicional é o ou-exclusivo.',
  'fun-2022-21':
    'Cada algoritmo citado é o exemplo de livro de um paradigma diferente, e a questão só pede o casamento correto na ordem dada.\n\n' +
    'MergeSort é divisão e conquista: divide o vetor pela metade, ordena recursivamente cada metade e combina as duas na intercalação.\n\n' +
    'Kruskal é guloso: ordena as arestas por peso e vai escolhendo, uma a uma, a mais leve que não forma ciclo — decisão local definitiva, sem revisão posterior.\n\n' +
    'Floyd-Warshall é programação dinâmica: preenche uma tabela de distâncias reaproveitando subproblemas, testando para cada par (i, j) se passar por um vértice intermediário k melhora o caminho.\n\n' +
    'Logo a ordem é divisão e conquista, guloso e programação dinâmica. As outras alternativas apenas permutam esses três rótulos.',
  'fun-2022-22':
    'A comparação é entre quatro classes clássicas de crescimento: linear (n), polinomial quadrática (n²), exponencial (2ⁿ) e fatorial (n!).\n\n' +
    'A hierarquia é n < n² < 2ⁿ < n!. Qualquer polinômio é eventualmente superado por uma exponencial de base maior que 1, e a exponencial é superada pelo fatorial, porque n! multiplica fatores que crescem com n (por Stirling, n! ≈ (n/e)ⁿ), enquanto 2ⁿ multiplica sempre o mesmo 2.\n\n' +
    'Traduzindo para os rótulos do enunciado — f1 = n, f4 = n², f3 = 2ⁿ, f2 = n! — a ordem crescente é f1 – f4 – f3 – f2. As demais alternativas colocam o fatorial ou a exponencial antes dos polinômios, invertendo a hierarquia.',
  'fun-2022-26':
    'Duas pistas do enunciado fecham a resposta: códigos mais curtos para os símbolos mais frequentes e um código único para cada símbolo distinto. Isso é exatamente a codificação de Huffman.\n\n' +
    'O algoritmo constrói uma árvore binária de baixo para cima, unindo repetidamente os dois símbolos de menor frequência; a profundidade de cada folha vira o comprimento do seu código. O resultado é um código de prefixo (nenhum código é prefixo de outro, o que permite decodificar sem separadores) e de comprimento médio ótimo entre os códigos símbolo a símbolo.\n\n' +
    'O LZW é a distratora forte, mas ele funciona de outro jeito: monta dinamicamente um dicionário de sequências de caracteres, e não um código por símbolo distinto. Tabela hash e índice são estruturas de busca, não de compressão, e "aproximação de entropia" não é um método de compressão — a entropia é o limite teórico que Huffman tenta alcançar.',
  'tec-2022-50':
    'Em um arquivo mapeado em memória, o mmap apenas cria a associação entre uma faixa de endereços virtuais e o conteúdo do arquivo. Nenhum dado é lido nesse momento — as páginas ficam marcadas como ausentes.\n\n' +
    'Quando o programa acessa uma posição dessa faixa, a MMU descobre que a página não está presente e gera uma falta de página (page fault). É o tratador dessa falta, no núcleo, que dispara a leitura do bloco correspondente do disco para um quadro de memória física e retoma a instrução interrompida. Esse é o mecanismo de paginação por demanda.\n\n' +
    'Por isso a chamada de sistema não é a resposta: ela participou da criação do mapeamento, não da leitura em si. Chamada de biblioteca é apenas código em espaço de usuário; a interrupção do disco ocorre depois, para sinalizar que a transferência já terminou; e ligação simbólica é conceito de sistema de arquivos, sem relação com o assunto.\n\n' +
    'A grande vantagem do modelo é essa: ler o arquivo passa a ser acesso a memória, sem chamadas explícitas de read a cada trecho.',
  'tec-2022-52':
    'O enunciado descreve o critério de margem máxima: entre as infinitas fronteiras que separam as duas classes, escolher aquela cuja distância ao ponto mais próximo de qualquer classe seja a maior possível. Esse é o princípio da Máquina de Vetor de Suporte (SVM).\n\n' +
    'Os pontos que ficam exatamente sobre as margens são os vetores de suporte, e só eles determinam a fronteira — mover os demais não altera o classificador. Maximizar a margem tende a melhorar a generalização, e com o truque do kernel a mesma ideia separa dados não linearmente separáveis em um espaço de maior dimensão.\n\n' +
    'As distratoras usam outros critérios: árvore de decisão faz cortes sucessivos por atributo, guiada por ganho de informação; o classificador bayesiano decide por probabilidade a posteriori; redes neurais ajustam pesos por gradiente, sem otimizar margem explicitamente; e regras de associação nem são um classificador supervisionado.',
  'fun-2024-22':
    'Análise assintótica é o estudo do comportamento do custo quando o tamanho da entrada cresce indefinidamente (n → ∞). Constantes multiplicativas e termos de menor ordem são descartados, porque deixam de importar nesse limite: 3n² + 100n + 7 é simplesmente Θ(n²).\n\n' +
    'É por isso que as outras alternativas caem. Entradas muito pequenas ou "médias" são exatamente o que a análise assintótica ignora; determinar o desempenho para todas as entradas possíveis seria análise exata, não assintótica; e juntar pior caso com caso médio não é o objetivo — pior caso, caso médio e melhor caso são cenários que podem ser analisados assintoticamente cada um por sua vez.\n\n' +
    'A utilidade prática é permitir comparar algoritmos independentemente de máquina, linguagem ou compilador: um algoritmo O(n log n) vence um O(n²) para n suficientemente grande, ainda que perca para entradas pequenas.',
  'fun-2024-23':
    'Na tabela hash, a busca calcula h(chave) em tempo constante e vai direto ao bucket correspondente. Se a função de hash distribui bem as chaves e o fator de carga é mantido baixo, cada bucket guarda poucos elementos e o custo médio é O(1).\n\n' +
    'O pior caso é o cenário em que todas as chaves colidem no mesmo bucket — função de hash ruim ou dados adversariais. A estrutura degenera em uma lista linear com n elementos e a busca passa a custar O(n).\n\n' +
    'As demais alternativas descrevem outras estruturas: O(log n) nos dois casos é a assinatura de uma árvore balanceada (AVL, rubro-negra); O(log n) e O(n) descrevem uma árvore binária de busca sem balanceamento; e O(2ⁿ) não aparece em busca alguma.\n\n' +
    'Vale notar o contraponto de projeto: a tabela hash ganha da árvore no caso médio, mas não mantém ordenação e não dá garantia de pior caso — em Java, por exemplo, buckets grandes passam a usar árvore justamente para conter esse pior caso.',
  'fun-2024-48':
    'Grafo misto é a definição exata de um grafo que contém, ao mesmo tempo, arestas não dirigidas e arestas dirigidas — o modelo natural para um mapa com ruas de mão dupla e trechos de sentido único.\n\n' +
    'Os outros termos designam coisas distintas: dígrafo (grafo dirigido) tem todas as arestas com direção; grafo completo tem uma aresta entre cada par de vértices, o que fala de densidade e não de orientação; grafo simétrico é aquele em que a presença do arco (u, v) implica a de (v, u) — uma forma de representar mão dupla dentro de um dígrafo, mas sem misturar os dois tipos; e bígrafo é outro nome para grafo bipartido.\n\n' +
    'Na prática, muitos algoritmos tratam um grafo misto convertendo cada aresta não dirigida em dois arcos opostos, o que reduz tudo a um dígrafo e permite reaproveitar Dijkstra, BFS e afins.',
  'tec-2024-52':
    'As estratégias contra deadlock dividem-se em dois grupos. Prevenção impede que o ciclo de espera se forme, tipicamente decidindo na hora do conflito quem espera e quem é abortado. Detecção deixa o ciclo acontecer, descobre que ele existe e então quebra-o abortando uma transação vítima.\n\n' +
    'O grafo de espera (wait-for graph) é o mecanismo de detecção: cada transação é um nó e cada espera é uma aresta Tᵢ → Tⱼ. O sistema procura ciclos nesse grafo; achar um ciclo é exatamente achar um deadlock.\n\n' +
    'Todas as outras alternativas são técnicas de prevenção baseadas em timestamps ou em teste no momento do bloqueio: esperar ou morrer (wait-die), ferir ou esperar (wound-wait), sem espera (no waiting) e espera cautelosa (cautious waiting).\n\n' +
    'Detalhe importante da detecção: além de encontrar o ciclo, o sistema precisa escolher a vítima (normalmente a transação mais nova ou a que fez menos trabalho) e desfazer seus efeitos com rollback.',
  'tec-2024-54':
    'Um esquema de tradução dirigido pela sintaxe é uma gramática livre de contexto em que fragmentos de programa — as ações semânticas — são escritos entre chaves dentro dos lados direitos das produções. A posição da ação define quando ela executa em relação ao reconhecimento dos símbolos vizinhos.\n\n' +
    'É esse detalhe que distingue o esquema de tradução da definição dirigida pela sintaxe: a definição associa regras semânticas aos atributos sem fixar ordem de avaliação, enquanto o esquema já prescreve a ordem, sendo assim diretamente implementável em um parser (é o que se escreve em ferramentas como Yacc/Bison).\n\n' +
    'As distratoras descrevem outros conceitos: o grafo que relaciona atributos é o grafo de dependências; uma sequência informal de etapas não define nada formalmente; recuperação de erros e verificação de tipos são outras tarefas do compilador, a última pertencente à análise semântica.',
  'tec-2024-59':
    'Sommerville organiza o processo de software em quatro atividades fundamentais: especificação, desenvolvimento (projeto e implementação), validação e evolução. A definição do enunciado — entender e definir quais serviços são exigidos e identificar as restrições de operação e desenvolvimento — é a de especificação de software, também chamada de engenharia de requisitos.\n\n' +
    'As outras três aparecem como distratoras justamente porque vêm depois na cadeia: desenvolvimento é projetar e programar o sistema especificado; validação é verificar se o que foi construído atende ao que o cliente quer; evolução é modificar o software conforme as necessidades mudam. Projeto de software é uma etapa dentro do desenvolvimento, não uma das atividades fundamentais.\n\n' +
    'Duas palavras do enunciado entregam a resposta: "serviços exigidos" (requisitos funcionais) e "restrições" (requisitos não funcionais) — o vocabulário padrão da engenharia de requisitos.',
  'mat-2019-12':
    'Primeiro, formalize a proposição. "Em todos os cursos de Computação existe pelo menos uma disciplina de Lógica" é ∀x ∃y (y é disciplina de Lógica em x), com x percorrendo os cursos.\n\n' +
    'Negar uma cadeia de quantificadores troca cada um pelo seu dual e empurra a negação para dentro: ∼∀x ∃y P(x, y) ≡ ∃x ∀y ∼P(x, y). Em português: existe pelo menos um curso de Computação no qual nenhuma disciplina é de Lógica.\n\n' +
    'O erro clássico — cometido por três das alternativas — é negar demais. "Em nenhum curso há disciplina de Lógica", "em cada um dos cursos não há disciplina de Lógica" e "não há curso no qual tenha disciplina de Lógica" são todas ∀x ∀y ∼P, afirmações muito mais fortes: basta um único curso sem Lógica para a original ser falsa, e não é preciso que todos sejam assim.\n\n' +
    'A alternativa do "no máximo uma disciplina" muda de assunto: é compatível com haver exatamente uma disciplina de Lógica, caso em que a proposição original continua verdadeira.',
  'mat-2024-13':
    'Aplique a lei da contrapositiva, A → B ≡ ∼B → ∼A, com A = ∼p e B = ∼q. Negando os dois lados e invertendo a flecha, ∼p → ∼q torna-se q → p.\n\n' +
    'Confirme pela tabela-verdade se quiser: ∼p → ∼q só é falsa quando ∼p é verdadeira e ∼q é falsa, ou seja, quando p é falsa e q é verdadeira — precisamente o único caso em que q → p também é falsa.\n\n' +
    'A pegadinha é a alternativa ∼q → ∼p, que é a recíproca (troca os lados sem negar) e não é equivalente. Também caem q → ∼p, p → q e a conjunção ∼q ∧ ∼p, que é verdadeira apenas quando p e q são ambas falsas.\n\n' +
    'Fixe a diferença: contrapositiva (nega e inverte) é equivalente; recíproca (só inverte) e inversa (só nega) não são.',
  'fun-2010-21':
    'Simule as operações mantendo a pilha à vista, lembrando que a pilha é LIFO: o POP devolve sempre o elemento empilhado mais recentemente.\n\n' +
    'Depois de PUSH P, E, R, T, O a pilha é [P, E, R, T, O] com O no topo. Os dois POPs retiram O e depois T, que entram na fila nessa ordem: O, T.\n\n' +
    'A pilha volta a [P, E, R] e recebe PUSH S, O, L, ficando [P, E, R, S, O, L]. Os três POPs finais retiram L, O e S, nessa ordem.\n\n' +
    'Concatenando as saídas na ordem em que foram produzidas, a fila recebe O – T – L – O – S. As distratoras correspondem a erros típicos: ler a pilha como FIFO (P – E – R – T – O), inverter o resultado (O – T – R – E – P) ou embaralhar as duas rodadas de POP.',
  'fun-2010-26':
    'Os três caminhamentos de árvore binária diferem apenas em quando a raiz é visitada em relação às subárvores — e o nome vem daí.\n\n' +
    'Em (1) visita-se a subárvore esquerda, escreve-se o valor e visita-se a direita: a raiz fica no meio, é o caminhamento em-ordem (in-order, também chamado simétrico ou central). Em uma árvore binária de busca, ele produz as chaves em ordem crescente.\n\n' +
    'Em (2) escreve-se o valor antes de descer: raiz primeiro, é pré-ordem (pre-order, ou pré-fixado) — o percurso usado para copiar uma árvore ou gerar notação prefixa.\n\n' +
    'Em (3) escreve-se depois de percorrer os dois filhos: raiz por último, é pós-ordem (post-order, ou pós-fixado) — usado para liberar uma árvore da memória ou avaliar expressões em notação posfixa.\n\n' +
    'A ordem pedida é, portanto, em-ordem, pré-ordem e pós-ordem. Todas as distratoras apenas permutam esses três nomes.',
  'fun-2010-50':
    'A questão trata "P ≠ NP?" como um problema de decisão sem entrada: a resposta é uma constante — ou é sim, ou é não — mesmo que ninguém saiba qual.\n\n' +
    'Ora, um dos dois algoritmos triviais, "retorne sim" ou "retorne não", está necessariamente correto. Esse algoritmo é determinístico, roda em tempo O(1) (portanto polinomial) e decide o problema. Isso torna III e IV verdadeiras e, ao mesmo tempo, falsifica I (que nega a existência de algoritmo polinomial determinístico) e II (que restringe a solução a algoritmos não determinísticos).\n\n' +
    'O ponto conceitual é o que torna a questão difícil: decidibilidade é uma afirmação sobre a existência de um algoritmo, não sobre nós sabermos qual algoritmo é. Não saber a resposta não impede que o problema seja decidível — apenas nos impede de apontar qual dos dois programas triviais é o correto.\n\n' +
    'Cuidado para não confundir com o Problema da Parada: lá a indecidibilidade é sobre uma família infinita de entradas (programa, entrada), e não sobre uma única pergunta de resposta fixa.',
  'fun-2022-24':
    'A condição sᵢ ≤ s⌊i/2⌋ diz que todo elemento é menor ou igual ao que está na posição ⌊i/2⌋ do vetor. Em um vetor que representa uma árvore binária começando em 1, ⌊i/2⌋ é exatamente o pai de i — então a condição é "todo filho ≤ pai", que é a propriedade do max-heap.\n\n' +
    'O heap é a estrutura que implementa a fila de prioridade: o máximo está sempre na raiz (posição 1), e inserção e remoção do máximo custam O(log n), pois só percorrem um caminho da árvore. Ordenar com ela é o HeapSort: construir o heap e extrair o máximo repetidamente, dando O(n log n) no pior caso.\n\n' +
    'As distratoras não têm essa propriedade estrutural: inserção e seleção são métodos elementares O(n²) sobre a lista, o Quicksort baseia-se em particionamento por pivô e o Shellsort em inserções com incrementos decrescentes — nenhum deles mantém relação fixa entre as posições i e ⌊i/2⌋.',
  'fun-2022-25':
    'O custo de um algoritmo recursivo é descrito por uma equação de recorrência: uma equação que define T(n) em função do custo das chamadas menores mais o trabalho feito fora delas. O MergeSort, por exemplo, dá T(n) = 2T(n/2) + Θ(n), com T(1) = Θ(1).\n\n' +
    'Resolvê-la significa encontrar uma forma fechada ou uma cota assintótica, e há três técnicas padrão: substituição (chutar a resposta e provar por indução), árvore de recursão (somar o custo por nível) e teorema mestre (comparar f(n) com n^(log_b a)).\n\n' +
    'As demais alternativas descrevem ferramentas de outros contextos: variável aleatória e função de probabilidade aparecem na análise de algoritmos randomizados ou no caso médio, não na análise de recursão em si; somatórios são úteis, mas são o que se obtém ao expandir a recorrência, não o instrumento que a define; e a alternativa dos logaritmos não descreve técnica alguma.',
  'fun-2022-28':
    'Siga as declarações. p = &a faz p apontar para a, que vale −1. r = &p faz r apontar para p, então r é ponteiro para ponteiro para int.\n\n' +
    'Em **r, a primeira desreferência devolve p e a segunda chega ao valor de a: **r vale −1.\n\n' +
    'Agora o pós-decremento: em b--, o valor usado na expressão é o valor atual de b, isto é, 10; só depois b passa a valer 9. Portanto c = −1 + 10 = 9, e é 9 que o printf imprime.\n\n' +
    'As distratoras cobrem os erros clássicos: usar 9 no lugar de 10 (confundindo b-- com --b, o que daria 8), somar em vez de subtrair o sinal de a (dando 11) ou ignorar a desreferência dupla.',
  'fun-2024-21':
    'Na busca sequencial, se a chave está na posição k, examinam-se k registros. Supondo que a chave procurada tenha a mesma probabilidade de estar em qualquer uma das n posições, o número médio de consultas é a média aritmética de 1 a n.\n\n' +
    'Essa média é (1 + 2 + ... + n)/n = [n(n + 1)/2]/n = (n + 1)/2 — pouco mais da metade do arquivo, o que confirma o custo Θ(n) do caso médio.\n\n' +
    'Os outros cenários também são simples: o melhor caso é f(n) = 1 (a chave está no primeiro registro) e o pior caso é f(n) = n (último registro ou chave ausente). As alternativas invertem exatamente esses dois valores ou inventam expressões sem sentido para o problema.',
  'fun-2024-24':
    'Duas informações do enunciado precisam ser lidas em conjunto. "Um ponteiro para o próximo elemento" — apenas um — significa lista simplesmente encadeada; se houvesse também ponteiro para o anterior, seria duplamente encadeada.\n\n' +
    '"Há um campo-chave pelo qual uma determinada ordenação é mantida" significa lista ordenada: as inserções respeitam a ordem da chave, o que encarece a inserção (é preciso achar a posição) mas permite parar a busca ao passar do valor procurado.\n\n' +
    'Juntando as duas, a lacuna é "simplesmente encadeada ordenada". As distratoras erram em um dos dois eixos: as duplamente encadeadas exigem dois ponteiros, a circular não ordenada dispensa a ordenação (e faz o último apontar para o primeiro), e a lista de prioridades organiza-se por prioridade de atendimento, não por um campo-chave de ordenação.',
  'fun-2024-25':
    'A diferença entre os laços está no momento do teste. No do...while a condição é avaliada depois do corpo, então o corpo executa pelo menos uma vez. No while e no for a condição é avaliada antes, e se ela já for falsa na primeira avaliação o corpo nunca executa — exatamente o que a alternativa correta afirma.\n\n' +
    'As outras alternativas invertem esses papéis ou trocam de assunto: dizer que o while testa a condição depois do corpo é descrever o do...while; dizer que o for testa depois comete o mesmo erro. A instrução if não é um laço, e portanto não serve para número conhecido de iterações (esse é o uso típico do for). E break não avança para a próxima iteração — ele encerra o laço; quem pula para a próxima iteração é o continue.\n\n' +
    'Resumo prático: teste no início (while, for) pode executar zero vezes; teste no fim (do...while) executa uma ou mais vezes.',
  'tec-2019-43':
    'Contar endereços em um intervalo fechado é uma contagem inclusiva: de A até B, inclusive, há B − A + 1 posições.\n\n' +
    'Convertendo os limites: 0x20 = 32 e 0xFF = 255. Logo, 255 − 32 + 1 = 224 endereços.\n\n' +
    'O erro clássico é esquecer o +1 e responder 223, ou calcular apenas 0x100 − 0x20 pensando em potências de 2. As distratoras 128 e 160 correspondem a intervalos diferentes, e 236 não tem base no cálculo.\n\n' +
    'Note também que 224 endereços não formam uma potência de 2, ou seja, a faixa de E/S não é um bloco alinhado — algo comum em mapas de memória de microcontroladores, onde os primeiros endereços ficam reservados para outra finalidade.',
  'tec-2019-45':
    'O fork() duplica o processo que o chama, e o filho continua a execução do mesmo ponto — inclusive dentro do laço, com o mesmo valor de i. Isso faz a população dobrar em cada iteração.\n\n' +
    'Começando com 1 processo: após a primeira iteração há 2, após a segunda 4 e após a terceira 8. Em geral, k forks em sequência produzem 2^k processos, logo 2³ = 8.\n\n' +
    'Nenhuma thread é criada explicitamente pelo programa, mas todo processo tem sua thread principal de execução. Assim, 8 processos e 8 threads.\n\n' +
    'As distratoras vêm de erros comuns: contar apenas os filhos (7), contar uma iteração de menos (4) ou supor que fork() cria thread e não processo.',
  'tec-2019-46':
    'Código reentrante é aquele que pode ser invocado de novo — por outra CPU, outra thread ou uma interrupção — antes de a invocação anterior terminar, sem corromper estado. Consegue isso mantendo os dados por invocação na pilha ou em estruturas passadas por parâmetro, em vez de usar variáveis globais ou estáticas compartilhadas.\n\n' +
    'É exatamente o requisito descrito no enunciado: o driver está tratando um pacote e chega outro, gerando nova interrupção que reentra no mesmo código. Sem reentrância, a segunda execução sobrescreveria o estado da primeira.\n\n' +
    'Assíncrono descreve o modelo de operação (a chamada retorna antes de a E/S terminar), não a segurança da reentrada; recursivo é o caso particular em que a função chama a si mesma; assimétrico e elástico não são propriedades de código de driver.',
  'tec-2019-61':
    'A visão estéreo imita a visão binocular: duas câmeras captam a mesma cena de referenciais ligeiramente diferentes. Um ponto do mundo projeta-se em posições distintas nas duas imagens, e essa diferença de posição é a disparidade.\n\n' +
    'Calculando a disparidade para cada pixel obtém-se o mapa de disparidade, do qual se extrai a profundidade: a distância é inversamente proporcional à disparidade (Z = f·B/d, com B a distância entre as câmeras e f a distância focal). Objetos próximos deslocam-se muito entre as imagens; objetos distantes, quase nada.\n\n' +
    'As distratoras confundem estéreo com outras subáreas: reconhecer imagens similares é casamento/recuperação de imagens; subdividir a imagem é segmentação; "dispersão" e "desconstruir as imagens em apenas uma" não correspondem a etapas do pipeline estéreo (o que se faz é retificar e correlacionar as duas imagens, preservando ambas).',
  'tec-2019-62':
    'Transparência, em sistemas distribuídos, é esconder do usuário algum aspecto da distribuição — e cada tipo esconde um aspecto específico. A alternativa correta é a de replicação: o usuário vê um recurso único, sem perceber que há várias cópias mantidas consistentes entre si.\n\n' +
    'As demais trocam as definições entre si. Ocultar diferenças de representação de dados é transparência de acesso, não de concorrência — concorrência é ocultar que outros usuários compartilham o recurso. Ocultar que o recurso pode ser movido enquanto está sendo acessado é transparência de migração, e movê-lo sem afetar como é acessado é relocação — a alternativa embaralha as duas. E não poder dizer a localização física do recurso é transparência de localização, não de acesso.\n\n' +
    'Para não errar, associe cada nome à pergunta que ele responde: acesso = "como eu acesso?"; localização = "onde está?"; migração/relocação = "mudou de lugar?"; replicação = "quantas cópias?"; concorrência = "quem mais usa?"; falha = "quebrou?".',
  'tec-2022-46':
    'Antes do fork, i (global) vale 0. O fork cria um segundo processo, e a partir daí os dois têm espaços de endereçamento independentes: alterar i em um não afeta o outro.\n\n' +
    'No pai, fork() retorna o PID do filho (> 0), então o if incrementa i. No filho, fork() retorna 0, então o else incrementa i. Cada processo, portanto, executa exatamente um dos dois incrementos e chega a i = 1.\n\n' +
    'Em seguida ambos executam o i++ que está fora do if/else, chegando a i = 2, e cada um imprime "2 ". A saída combinada é "2 2".\n\n' +
    'A resposta "indeterminado" é tentadora, mas a indeterminação aqui é só na ordem de impressão, não nos valores — os dois processos imprimem 2 independentemente de quem rodar primeiro. E a resposta "1 1" ignora o incremento fora do condicional; "4 4" supõe memória compartilhada, o que fork não faz.',
  'tec-2022-54':
    'Item a item. Roteadores precisam implementar até a camada de rede porque encaminham com base no endereço IP de destino, que está no cabeçalho dessa camada — verdadeiro.\n\n' +
    'No TCP/IP o controle de congestionamento é feito pelo TCP, na camada de transporte, com mecanismos como janela de congestionamento, slow start e reação a perdas — verdadeiro.\n\n' +
    'Controle de acesso ao meio é função da subcamada MAC, dentro da camada de enlace, e não da camada de rede — falso.\n\n' +
    'Quem esconde os detalhes do meio físico das camadas superiores são as camadas inferiores (física e enlace); a camada de transporte abstrai a rede fim a fim, não o meio de transmissão — falso.\n\n' +
    'A sequência é, portanto, V – V – F – F.',
  'tec-2024-51':
    'Em um RIGHT OUTER JOIN, todas as tuplas do lado direito (aqui, o apelido PAI) aparecem no resultado — casando com o lado esquerdo quando houver correspondência, e completadas com NULL quando não houver. A condição é FILHO.Fk = PAI.Id.\n\n' +
    'Percorrendo cada PAI: o item 1 é apontado pelos itens 2 e 3 (Fk = 1), gerando 2 tuplas; o item 2 não é apontado por ninguém, gerando 1 tupla com NULLs; o item 3 é apontado pelo item 4, gerando 1 tupla; o item 4 não é apontado por ninguém, gerando 1 tupla com NULLs.\n\n' +
    'Somando: 2 + 1 + 1 + 1 = 5 tuplas.\n\n' +
    'Os erros típicos que as distratoras capturam: contar só as correspondências reais, o que daria 3 (é o resultado de um INNER JOIN), ou esquecer que o item 1, com Fk NULL, jamais casa com nenhum PAI — NULL não é igual a nada em SQL, nem a outro NULL.',
  'tec-2024-53':
    'A diferença estrutural entre B e B⁺ está em onde ficam os ponteiros de dados (as referências aos registros no arquivo).\n\n' +
    'Na árvore B, cada chave armazenada — em qualquer nó, interno ou folha — vem acompanhada do seu ponteiro de dados. Isso torna verdadeiros os itens I e II, e permite que uma busca termine em um nó interno, se a chave estiver lá.\n\n' +
    'Na árvore B⁺, os nós internos guardam apenas chaves de roteamento, servindo para direcionar a busca; todos os ponteiros de dados ficam nas folhas. Logo IV é verdadeiro e III é falso, e toda busca desce necessariamente até uma folha.\n\n' +
    'A resposta é I, II e IV. Vale saber por que a B⁺ é a preferida em bancos de dados: sem ponteiros de dados, cabem mais chaves por nó interno, o que reduz a altura da árvore e o número de acessos a disco; e as folhas são encadeadas entre si, tornando eficiente a varredura sequencial e as consultas por faixa.',
  'tec-2024-58':
    'A questão pede o item que NÃO é resultado de software de alta qualidade. Aumentar a complexidade dos processos de negócio é justamente o oposto do que Pressman e Maxim apontam: software de qualidade simplifica e agiliza os processos que apoia.\n\n' +
    'Os outros quatro itens são benefícios citados pelos autores: maior receita gerada pelo produto, maior rentabilidade quando a aplicação sustenta um processo de negócio, maior disponibilidade de informações cruciais e menor exigência de manutenção, com menos correções e menos suporte ao cliente.\n\n' +
    'A dica de prova é mecânica: em questões com "EXCETO", quatro alternativas puxam para o mesmo lado (aqui, benefícios) e uma foge do padrão. Achar a de sinal invertido resolve sem precisar lembrar a lista exata dos autores.',
  'mat-2024-05':
    'Um grafo sem ciclos é, por definição, uma floresta. Uma floresta com n vértices e c componentes conexas tem exatamente n − c arestas, e como c ≥ 1, o máximo de arestas acontece com c = 1, isto é, quando a floresta é uma árvore: n − 1 arestas.\n\n' +
    'Para n = 7, o máximo é 6 arestas. Acrescentar qualquer aresta a uma árvore fecha um ciclo, pois já existe um caminho entre os dois extremos — não há como passar de 6 mantendo o grafo acíclico.\n\n' +
    'A fórmula n(n−1)/2 citada no enunciado é uma distratora deliberada: ela dá 21, o número de arestas do grafo completo K₇, que é cheio de ciclos. As alternativas 7, 10 e 11 correspondem a grafos que já contêm ciclos.\n\n' +
    'Vale guardar a caracterização: um grafo conexo com n vértices é árvore se e somente se tem n − 1 arestas e nenhum ciclo — duas dessas três propriedades implicam a terceira.',
  'mat-2024-14':
    'A pergunta é: qual proposição precisa ser falsa para que ∼(p ∨ q) seja verdadeira? Como ∼(p ∨ q) é verdadeira exatamente quando p ∨ q é falsa, basta achar entre as alternativas aquela que é equivalente a p ∨ q.\n\n' +
    'Use a equivalência da implicação material: A → B ≡ ∼A ∨ B. Assim, ∼p → q ≡ ∼(∼p) ∨ q ≡ p ∨ q. É a alternativa correta.\n\n' +
    'Confirmando as outras: p ∧ q pode ser falsa sem que p ∨ q o seja (basta p verdadeira e q falsa); ∼p e ∼q, isoladamente, dizem respeito a uma variável só; e ∼p → ∼q ≡ p ∨ ∼q, que é falsa quando p é falsa e q verdadeira — caso em que ∼(p ∨ q) também é falsa, logo não serve.\n\n' +
    'Note ainda que, por De Morgan, ∼(p ∨ q) ≡ ∼p ∧ ∼q: as duas proposições precisam ser falsas simultaneamente.',
  'mat-2024-15':
    'Trate as premissas como implicações e aplique modus tollens. A premissa (1) é (A ∨ J) → V, onde A = "Ana Paula joga vôlei", J = "Joaquim joga videogame" e V = "Victória vai à praia". A premissa (2) diz ∼V.\n\n' +
    'De (1) e ∼V conclui-se ∼(A ∨ J), e por De Morgan ∼A ∧ ∼J: nem Ana Paula jogou vôlei, nem Joaquim jogou videogame.\n\n' +
    'A premissa (3) é S → (A ∧ C), com S = "hoje é sábado". Como já sabemos ∼A, a conjunção A ∧ C é falsa, e novamente por modus tollens conclui-se ∼S: hoje não é sábado.\n\n' +
    'Juntando ∼S e ∼J, a alternativa correta é "hoje não é sábado e Joaquim não jogou videogame". As demais afirmam A, J ou S, todos negados pelas conclusões — e nada se pode concluir sobre Caio treinar boxe, já que a premissa (3) só foi usada no sentido contrário.',
  'fun-2024-26':
    'O nome de cada caminhamento vem da posição em que a raiz é visitada. Se a raiz vem primeiro e só depois as subárvores dos filhos são percorridas recursivamente, o percurso é pré-fixado — também chamado de pré-ordem (pre-order).\n\n' +
    'Os sinônimos das distratoras é que confundem: simétrico e central são nomes do percurso em-ordem, em que a raiz é visitada entre as subárvores; pós-fixado é o pós-ordem, com a raiz por último.\n\n' +
    '"Em largura" é a distratora conceitualmente diferente: ela percorre a árvore nível por nível, usando uma fila, e não é um dos três percursos em profundidade definidos recursivamente.\n\n' +
    'Uso típico do pré-fixado: serializar ou copiar uma árvore preservando a estrutura, já que a raiz é registrada antes dos filhos.',
  'fun-2024-28':
    'A divisão clássica do chipset é simples: a ponte norte (northbridge) fica perto do processador e faz a interface com os componentes de alta velocidade — memória RAM e placa de vídeo (barramento AGP/PCI Express); a ponte sul (southbridge) cuida dos dispositivos mais lentos — armazenamento, USB, áudio, rede e demais periféricos de E/S.\n\n' +
    'Só a assertiva III descreve esse arranjo corretamente. As assertivas I e II invertem os papéis das duas pontes, e a IV é falsa: as pontes têm funções e conexões distintas, não são intercambiáveis.\n\n' +
    'Vale um contexto atual: nos processadores modernos o controlador de memória e a controladora gráfica foram integrados ao próprio die da CPU, e a ponte norte praticamente desapareceu — restou um único chip (PCH na Intel, FCH na AMD) que desempenha o papel da ponte sul. A questão cobra o modelo tradicional, ainda padrão nos livros de arquitetura.',
  'fun-2024-29':
    'O DMA (Direct Memory Access) existe precisamente para tirar a CPU do caminho das transferências volumosas. A CPU programa a controladora de DMA informando endereço de memória, quantidade de bytes e sentido da transferência; a controladora então move os dados entre o dispositivo e a memória principal por conta própria, avisando a CPU por interrupção apenas no fim.\n\n' +
    'Todas as demais alternativas envolvem a CPU em cada dado transferido. No polling e na E/S programada a CPU testa o estado do dispositivo e copia byte a byte (ou palavra a palavra). Com interrupções ela deixa de ficar em espera ocupada, mas ainda executa o tratador para mover cada dado. E na E/S mapeada em memória os registradores do dispositivo apenas aparecem no espaço de endereçamento — a cópia continua sendo feita por instruções da CPU.\n\n' +
    'É por isso que disco, rede e placas de som usam DMA: sem ele, copiar alguns megabytes consumiria o processador integralmente.',
  'fun-2024-36':
    "Uma linguagem é regular quando um autômato finito a reconhece — ou seja, quando basta uma quantidade fixa de memória (os estados) para decidir a pertinência, sem armazenar quantidades arbitrárias.\n\n" +
    "Contar a's módulo 3 e b's módulo 2 é exatamente isso: bastam 3 × 2 = 6 estados, cada um representando um par (resto da divisão do número de a's por 3, paridade do número de b's), com estado de aceitação em (0, ímpar). Memória finita resolve, logo a linguagem é regular.\n\n" +
    "As outras quatro alternativas comparam as quantidades de a's e b's (igual, maior, diferente, o dobro). Para isso seria preciso guardar a diferença entre as contagens, que não tem limite — e o lema do bombeamento formaliza a impossibilidade. Essas linguagens são livres de contexto (reconhecidas com uma pilha), não regulares.\n\n" +
    'A regra prática que a questão cobra: contar módulo uma constante é regular; comparar contagens sem limite não é.',
  'fun-2024-38':
    'São dois resultados fundacionais de autores diferentes, e a questão só troca as atribuições. O Teorema da Incompletude é de Kurt Gödel (1931): em qualquer sistema formal consistente e suficientemente expressivo para a aritmética existem afirmações verdadeiras que o sistema não consegue provar.\n\n' +
    'O Problema da Parada é de Alan Turing (1936): não existe algoritmo que, dado um programa e uma entrada, decida sempre se aquela execução termina ou entra em loop infinito. A prova é por diagonalização — supor que o decisor existe permite construir um programa que o contradiz.\n\n' +
    'Alonzo Church aparece como distratora com razão histórica: ele chegou a um resultado equivalente no mesmo período usando o cálculo lambda, e daí vem a Tese de Church-Turing. Mas o Problema da Parada, na formulação do enunciado, é atribuído a Turing.\n\n' +
    'Os dois teoremas são parentes conceituais: ambos exibem limites intrínsecos — um da demonstrabilidade em sistemas formais, outro da computabilidade.',
  'fun-2024-39':
    'A alternativa correta é a que descreve o bloco: o sistema operacional agrupa os dados em blocos, que são a unidade de transferência entre a memória secundária e a principal. Ler um único byte do disco custa praticamente o mesmo que ler o bloco inteiro, porque o tempo é dominado por posicionamento e latência — daí o ganho de eficiência em transferir blocos.\n\n' +
    'As demais alternativas erram em pontos específicos: o item individual dentro de um arquivo é o registro (ou campo), não o byte; um programa executável é sim um arquivo, apenas com conteúdo binário e formato próprio; páginas e segmentos são unidades do gerenciamento de memória virtual e coexistem com arquivos e registros, não os substituem; e a organização em diretórios é justamente hierárquica na esmagadora maioria dos sistemas de arquivos.\n\n' +
    'Vale conectar os conceitos: o bloco lógico do sistema de arquivos costuma agrupar vários setores físicos do disco, e é essa granularidade que explica a fragmentação interna quando o arquivo não preenche o último bloco.',
  'fun-2024-40':
    'A afirmação correta enuncia o princípio da codificação de comprimento variável: dar descrições curtas aos resultados mais frequentes e longas aos menos frequentes reduz o comprimento médio da mensagem. É o que fazem Huffman e a codificação aritmética, e o limite teórico desse ganho é a entropia da fonte.\n\n' +
    'A alternativa do comprimento uniforme descreve exatamente o caso que não comprime: se todos os códigos têm o mesmo tamanho, o comprimento médio não cai (é o código de tamanho fixo que se quer melhorar).\n\n' +
    'A desigualdade de Kraft é o oposto do que a alternativa diz: ela impõe uma restrição precisa aos comprimentos, ∑ 2^(−lᵢ) ≤ 1, condição necessária e suficiente para existir um código de prefixo com aqueles comprimentos.\n\n' +
    'As duas últimas alternativas confundem compressão com perda: Huffman é rigorosamente sem perdas (a mensagem original é reconstruída bit a bit), e algoritmos como ZIP, PNG e FLAC também são. Perda existe em JPEG, MP3 e afins, por escolha de projeto, não por necessidade.',
  'fun-2024-42':
    'Siga o caminho de um evento de E/S de baixo para cima. O dispositivo termina a operação e sinaliza uma interrupção, normalmente via APIC; quem recebe esse sinal é a camada de tratadores de interrupção, a mais próxima do hardware.\n\n' +
    'O tratador faz o mínimo necessário e informa o resultado à camada de controladores de dispositivo (os device drivers), que conhecem a semântica daquele hardware específico e sabem o que fazer com o dado recebido.\n\n' +
    'No sentido inverso, quando o sistema operacional precisa programar o dispositivo — escrever em seus registradores, iniciar uma transferência — é também a camada de controladores de dispositivo que fala diretamente com ele. Nenhuma outra camada acessa registradores de hardware.\n\n' +
    'Daí a sequência: tratadores de interrupção – controladores de dispositivo – controladores de dispositivo. As camadas acima (software independente de dispositivo e interface de chamadas de sistema) oferecem a visão uniforme para os programas de usuário e nunca tocam o hardware.',
  'fun-2024-45':
    'A alternativa correta é a definição usual do tipo inteiro: valores numéricos sem parte fracionária, abrangendo positivos, negativos e o zero, dentro da faixa permitida pela quantidade de bits do tipo.\n\n' +
    'As demais alternativas trocam os tipos entre si. Uma variável de tipo caractere guarda um único caractere; para uma sequência de caracteres usa-se string, ou um vetor de caracteres. O tipo inteiro admite negativos por padrão (é o modificador unsigned que os proíbe, e não o contrário). Vetor não é tipo numérico fracionário, mas um agregado homogêneo de qualquer tipo — quem tem parte fracionária é float ou double.\n\n' +
    'A última alternativa exige cuidado: em C, caracteres são internamente códigos numéricos e aceitam aritmética, mas isso é uma particularidade da linguagem, não parte do conjunto de operações conceitualmente associado ao tipo caractere, cujas operações próprias são comparação e ordenação.',
  'tec-2024-46':
    'Todas as quatro assertivas descrevem corretamente estruturas (structs), por isso a resposta é I, II, III e IV. Vale ver por quê, uma a uma.\n\n' +
    'I e IV são as duas faces da mesma definição: a struct agrupa variáveis sob um único nome, e esses componentes podem ser de tipos distintos — é justamente o que a diferencia do vetor, que é homogêneo.\n\n' +
    'II é a que costuma gerar dúvida: declarar uma struct define um novo tipo, e não cria variáveis. Em C é preciso um passo adicional (struct Ponto p; ou um typedef) para que exista uma variável daquele tipo.\n\n' +
    'III é verdadeira e importante: os campos podem ser variáveis simples, vetores, ponteiros ou outras structs. É essa composição aninhada que permite construir listas, árvores e grafos — um nó que contém dados e um ponteiro para outro nó do mesmo tipo.',
  'tec-2024-47':
    'O problema tem três faixas mutuamente exclusivas: salário ≤ 0 (erro), salário > 1000 (imposto de 10%) e o caso restante, entre 0 e 1000 (imposto de 5%). Testar faixas sucessivas exige uma condicional encadeada — o if / else if / else, em que cada teste só é avaliado se os anteriores falharam.\n\n' +
    'O encadeamento não é só elegância: ele garante que apenas um dos ramos execute e evita reavaliar condições já descartadas (dentro do else, já se sabe que o salário é positivo).\n\n' +
    'As distratoras não servem ao problema: não há repetição envolvida, o que elimina laço encadeado e laço infinito; atribuição simples e composta apenas armazenam valores, sem tomar decisão alguma.',
  'tec-2024-49':
    'Quando as arestas são tratadas como coleção (multiconjunto) em vez de conjunto, torna-se possível ter duas ou mais arestas com os mesmos extremos — no caso dirigido, mesma origem e mesmo destino. Essas arestas repetidas são chamadas paralelas (ou múltiplas), e um grafo que as admite é um multigrafo.\n\n' +
    'Os outros termos designam coisas distintas: laço é a aresta que liga um vértice a si mesmo; adjacentes são dois vértices ligados por uma aresta (ou duas arestas que compartilham um vértice); incidência é a relação entre uma aresta e os vértices que ela toca; e "finais" não é conceito de teoria dos grafos.\n\n' +
    'Consequência prática: um multigrafo não pode ser representado por matriz de adjacência booleana — é preciso guardar a multiplicidade de cada par, ou usar lista de arestas.',
  'tec-2024-50':
    'Ciclo é o caminho fechado: começa e termina no mesmo vértice. É esse fechamento que o enunciado descreve.\n\n' +
    'As distratoras exigem precisão terminológica. Laço é a aresta que liga um vértice a si mesmo — um caso degenerado, não um caminho em geral. Caminho simples é o que não repete vértices, portanto justamente o que não fecha. Arco é outro nome para aresta dirigida. E k-cubo é uma família específica de grafos (o hipercubo Qₖ), sem relação com caminhos fechados.\n\n' +
    'Detectar ciclos é operação básica em vários contextos: uma busca em profundidade que encontra uma aresta de retorno acusa ciclo, e é assim que se verifica se um dígrafo é acíclico (DAG) antes de fazer ordenação topológica.',
  'tec-2024-55':
    'As três primeiras assertivas estão corretas e a quarta é falsa, por isso a resposta é I, II e III.\n\n' +
    'I: árvores sintáticas e código de três endereços são, de fato, duas representações intermediárias clássicas — a primeira mais próxima da estrutura do fonte, a segunda mais próxima do código de máquina.\n\n' +
    'II: a forma geral x := y op z é exatamente a do código de três endereços (no máximo um operador por instrução, com temporários criados pelo compilador), e o repertório inclui outras formas, como desvios condicionais e incondicionais, chamadas e atribuições indexadas.\n\n' +
    'III: RIs podem ser geradas por Definições Dirigidas pela Sintaxe, associando a cada produção regras que constroem o trecho de código correspondente.\n\n' +
    'IV é a assertiva falsa: autômatos finitos são o formalismo da análise léxica (reconhecer tokens), e não uma forma de representação intermediária — seus estados não representam variáveis do programa nem suas transições, instruções.',
  'tec-2024-57':
    'A resposta é que todas as três assertivas estão incorretas, cada uma por um motivo diferente.\n\n' +
    'I: Ray Tracing realmente simula a propagação da luz, mas é computacionalmente caro — historicamente foi a técnica do cinema, não dos jogos. Só recentemente, com hardware dedicado, entrou em tempo real de forma parcial (híbrida com rasterização), e chamá-lo de "eficiente em tempo real" contraria o motivo pelo qual foi preterido nos jogos.\n\n' +
    'II: o Z-Buffer é um algoritmo de determinação de visibilidade — guarda a profundidade de cada pixel para decidir o que fica na frente. Ele não produz realismo cinematográfico nem representa o estado da arte em geração 3D; é um mecanismo básico de rasterização.\n\n' +
    'III: o modelo de Phong é iluminação local, calculada por superfície a partir de fontes diretas, sem considerar a luz refletida entre objetos. Justamente por ser barato, é muito usado em tempo real — o oposto do que a assertiva afirma. Iluminação global é o que fazem ray tracing, path tracing e radiosidade.',
  'tec-2024-60':
    'As três assertivas estão corretas, por isso a resposta é "todas". Elas cobrem, em sequência, os três conceitos centrais do gerenciamento de configuração de software (GCS).\n\n' +
    'I define a configuração de software: o conjunto de todos os artefatos gerados no processo — código, requisitos, projeto, casos de teste, documentação, scripts de build —, e não apenas o código-fonte.\n\n' +
    'II descreve a hierarquia de itens de configuração (SCIs) que se forma conforme o trabalho avança, com itens agregando outros itens e sendo versionados em conjunto.\n\n' +
    'III define o GCS como o conjunto de atividades para administrar mudanças ao longo de todo o ciclo de vida — identificação de itens, controle de versões, controle de mudanças (com baselines e solicitações formais), auditoria e relato de situação.\n\n' +
    'É esse arcabouço que, na prática, se materializa em controle de versão, revisão de mudanças e rastreabilidade entre requisito, código e teste.',
  'tec-2024-61':
    'Em um Algoritmo Genético, o crossover (recombinação) toma dois indivíduos-pais e combina partes de seus cromossomos para gerar descendentes — por exemplo, no crossover de um ponto, cortando os dois cromossomos na mesma posição e trocando os pedaços.\n\n' +
    'O papel dele é a exploração de combinações promissoras: se cada pai carrega um bom pedaço de solução, o filho pode herdar os dois. É o operador que dá ao AG seu caráter de busca populacional, em vez de busca local.\n\n' +
    'As demais alternativas descrevem outros componentes do ciclo, todos distintos: avaliar a aptidão é a função de fitness; manter os melhores indivíduos entre gerações é elitismo; modificar aleatoriamente genes é mutação (que preserva diversidade e evita mínimos locais); e escolher quem se reproduz é a seleção (roleta, torneio, ranking).\n\n' +
    'A divisão de trabalho a fixar: seleção decide quem cruza, crossover combina, mutação perturba.',
  'tec-2024-62':
    'Um Sistema Especialista tem duas partes principais: a base de conhecimento, com fatos e regras do domínio (tipicamente na forma "SE condição ENTÃO conclusão"), e o motor de inferência, que aplica essas regras aos fatos disponíveis para derivar novas conclusões — emulando o raciocínio de um especialista humano.\n\n' +
    'O motor pode encadear as regras para frente (forward chaining: dos fatos para as conclusões) ou para trás (backward chaining: parte da hipótese e busca fatos que a sustentem), e normalmente registra o caminho percorrido, o que permite explicar a conclusão ao usuário.\n\n' +
    'As distratoras deslocam o papel do motor: interface de usuário é outro módulo do sistema; otimizar algoritmos de aprendizado de máquina não é sua função (sistemas especialistas clássicos são baseados em regras, não em aprendizado); e ele não substitui a base de conhecimento — depende inteiramente dela, pois sem regras não há o que inferir.',
  'tec-2024-63':
    'Digitalizar uma imagem envolve discretizar duas coisas distintas, e cada uma tem seu nome. A amostragem discretiza o domínio espacial: define em quais coordenadas a imagem será medida, determinando o número de pixels (a resolução espacial).\n\n' +
    'A quantização discretiza a amplitude: converte a intensidade contínua medida em cada amostra para um número finito de níveis — 256 níveis em 8 bits por canal, por exemplo.\n\n' +
    'A ordem do enunciado é essa: primeiro amostragem, depois quantização. A alternativa que inverte os dois termos é a distratora principal, e as outras trocam de assunto: interpolação e ampliação são operações de redimensionamento posteriores; modulação e codificação pertencem à transmissão e ao armazenamento do sinal.\n\n' +
    'Os efeitos de errar cada uma são visíveis e diferentes: amostragem insuficiente causa serrilhado e aliasing; quantização grosseira causa falsos contornos (banding) em regiões de variação suave.',
  'tec-2024-64':
    'A resposta é I e III. O filtro espacial de média substitui cada pixel pela média da vizinhança, atenuando variações rápidas — ou seja, suaviza a imagem e reduz ruído, ao custo de borrar bordas (I correta).\n\n' +
    'O operador laplaciano é uma derivada de segunda ordem, que realça justamente onde a intensidade muda depressa. Somado à imagem original, produz aguçamento das bordas (III correta).\n\n' +
    'II está errada porque inverte o efeito: um filtro passa-baixa preserva as frequências baixas e atenua as altas, portanto suaviza. Quem aguça é o passa-alta.\n\n' +
    'IV está errada porque suaviza e aguça não são exclusivos de um domínio. O teorema da convolução garante a correspondência: convoluir no domínio espacial equivale a multiplicar no domínio das frequências, então ambos os efeitos podem ser obtidos nos dois domínios — a escolha é de conveniência e custo computacional.',
  'tec-2024-65':
    'O encaminhamento IP olha somente o endereço de destino; o de origem (13.1.2.3) é irrelevante para essa decisão e está no enunciado apenas para distrair. Isso já elimina as três rotas 13.x, que nem casam com o destino 11.1.2.5.\n\n' +
    'Restam duas rotas compatíveis: 11.1.0.0/16 e 11.1.2.0/24. Ambas contêm o destino, e o critério de desempate é o do prefixo mais longo (longest prefix match): vence a rota mais específica, isto é, a de máscara maior.\n\n' +
    'Como /24 é mais específica que /16, o pacote é encaminhado por 11.1.2.0/24.\n\n' +
    'Esse critério é o que torna possível ter uma rota default 0.0.0.0/0 convivendo com rotas específicas: a default só é usada quando nenhuma outra entrada casa com o destino.',
  'tec-2024-66':
    'O IP é um protocolo sem conexão e de melhor esforço (best-effort): cada datagrama é roteado de forma independente, sem estabelecimento prévio de conexão e sem garantia de entrega, de ordem ou de unicidade. Como datagramas podem seguir caminhos diferentes e retransmissões ocorrem em camadas inferiores, é perfeitamente possível que várias cópias de um pacote cheguem ao destino — a alternativa correta.\n\n' +
    'As demais contradizem essa natureza: "baseado em datagramas e orientado à conexão" é contraditório (datagrama implica ausência de conexão); "melhor esforço garantindo a entrega" também se autocontradiz, pois melhor esforço é justamente a ausência de garantia; e o apelido de "cola da Internet" vem de o IP unificar redes heterogêneas sob um único formato de endereçamento, não de poder ser substituído por outros protocolos.\n\n' +
    'A última alternativa erra de camada: o datagrama IP identifica o destino apenas pelo endereço IP. Números de porta são da camada de transporte, nos cabeçalhos TCP ou UDP — quem garante entrega, ordem e ausência de duplicatas é o TCP, acima do IP.',
  'tec-2024-67':
    'Consultas DNS regulares usam UDP na porta 53. A escolha faz sentido: a consulta e a resposta são pequenas e cabem em um datagrama, e abrir uma conexão TCP custaria um three-way handshake antes de qualquer dado — sobrecarga desproporcional para uma resposta que chega em milissegundos. Se a resposta não vier, o próprio cliente simplesmente repete a consulta.\n\n' +
    'O TCP é reservado para os casos em que o UDP não serve: transferência de zona entre servidores (AXFR) e respostas grandes que não caberiam no limite do datagrama — situação sinalizada pelo bit de truncamento, que faz o cliente repetir a consulta sobre TCP.\n\n' +
    'As distratoras não são alternativas válidas aqui: "TCP/IP" é o nome da arquitetura, não um protocolo de transporte; HTTP é de aplicação; e CoAP é um protocolo de aplicação para IoT (que, aliás, roda sobre UDP).',
  'tec-2024-68':
    'O enunciado descreve transparência de acesso: as mesmas operações servem para arquivos locais e remotos, e programas escritos para arquivos locais funcionam sem modificação sobre arquivos remotos. O que está sendo escondido é a diferença de forma de acesso.\n\n' +
    'As outras transparências escondem outros aspectos: localização esconde onde o recurso está (o nome não revela o servidor); mobilidade permite que o arquivo mude de lugar sem que o cliente precise ser alterado; desempenho mantém o serviço aceitável sob carga variável; e mudança de escala permite crescer o sistema sem alterar sua estrutura ou os aplicativos.\n\n' +
    'A distinção entre acesso e localização é a que mais cai em prova: acesso responde "como eu chego ao recurso?" e localização, "onde ele está?". O enunciado fala de um único conjunto de operações — logo, acesso.',
  'tec-2024-69':
    'A falha por queda (crash failure) é o modelo em que o servidor funcionava corretamente e simplesmente para: depois disso não emite mais nada, e o único remédio é reiniciá-lo. É o cenário do sistema operacional que trava.\n\n' +
    'Os outros modelos de falha descrevem comportamentos diferentes: na falha por omissão o servidor está de pé, mas deixa de responder a algumas requisições (ou perde mensagens); na falha de temporização a resposta vem correta, porém fora do intervalo de tempo esperado; na falha de resposta o servidor responde, mas com valor errado ou violando o protocolo; e a falha arbitrária (bizantina) é a pior de todas, com o servidor podendo produzir saídas quaisquer, inclusive maliciosas ou inconsistentes entre destinatários.\n\n' +
    'A dificuldade prática que essa taxonomia expõe: em um sistema assíncrono, um cliente não distingue um servidor que caiu de um que está apenas muito lento — é por isso que a detecção de falhas depende de temporizadores e o problema do consenso é tão difícil.',
  'tec-2024-70':
    'No algoritmo centralizado de exclusão mútua, um processo é eleito coordenador e controla o acesso à região crítica. O protocolo é mínimo: o processo envia REQUEST ao coordenador, recebe GRANT quando pode entrar e envia RELEASE ao sair — três mensagens por uso da região crítica, exatamente o que o enunciado descreve.\n\n' +
    'Se a região está ocupada, o coordenador enfileira o pedido (ou responde negando) e concede a permissão ao primeiro da fila quando o RELEASE chega. É simples, justo e livre de inanição — mas o coordenador é ponto único de falha e gargalo de desempenho.\n\n' +
    'As alternativas correspondem a custos maiores: o algoritmo distribuído de Ricart-Agrawala precisa de 2(n − 1) mensagens por entrada; o token-ring circula o token continuamente, com número de mensagens sem limite fixo entre dois usos; a versão descentralizada usa vários coordenadores e votação por maioria. Relógios vetoriais, por sua vez, não são algoritmo de exclusão mútua, mas mecanismo de ordenação causal de eventos.',
};

export const QUIZ_QUESTIONS: QuizQuestion[] = RAW_QUESTIONS.map((q) => ({
  ...q,
  difficulty: DIFFICULTY_BY_ID[q.id] ?? DIFFICULTY.MEDIO,
  topic: TOPIC_BY_ID[q.id] ?? 'Outros',
  explanationLong: LONG_EXPLANATION_BY_ID[q.id] ?? '',
}));

/** Distinct topics, in a sensible display order. */
export const TOPICS: string[] = [...new Set(Object.values(TOPIC_BY_ID))];

/** Exam editions present in the bank, newest first. */
export const YEARS: number[] = [...new Set(QUIZ_QUESTIONS.map((q) => questionSource(q)?.year))]
  .filter((y): y is number => y !== undefined)
  .sort((a, b) => b - a);

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
