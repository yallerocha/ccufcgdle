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
  // Difficulty on a 1 (fácil) .. 5 (difícil) scale, used to order the Show's
  // prize ladder from easy to hard. Assigned per id in DIFFICULTY_BY_ID below;
  // absent ids default to 3. Values are an initial estimate, refinable later.
  difficulty: number;
  // Fine-grained theme (players can filter runs by it) — see TOPIC_BY_ID below.
  topic: string;
}

const RAW_QUESTIONS: Omit<QuizQuestion, 'difficulty' | 'topic'>[] = [
  // ── Matemática — lógica e conceitos (POSCOMP) ──────────────────────────────
  // Somente questões teóricas/conceituais (lógica, quantificadores). Questões de
  // cálculo (determinantes, limites, integrais, combinatória, geometria
  // analítica etc.) foram removidas por opção do produto.
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
];

// Per-question difficulty (1 fácil .. 5 difícil). Ids not listed default to 3.
// Kept as a compact map so it can be retuned without touching the question data.
const DIFFICULTY_BY_ID: Record<string, number> = {
  'mat-2019-15': 2, 'fun-2019-21': 5, 'fun-2019-22': 4, 'fun-2019-23': 3,
  'fun-2019-24': 1, 'fun-2019-25': 4, 'tec-2019-52': 2, 'tec-2019-54': 2,
  'tec-2019-57': 2, 'tec-2019-58': 2, 'tec-2019-60': 3, 'tec-2019-64': 3,
  'fun-2010-27': 4, 'fun-2010-46': 3, 'tec-2010-47': 4, 'tec-2010-49': 3,
  'mat-2022-11': 3, 'fun-2022-21': 3, 'fun-2022-22': 3, 'fun-2022-26': 1,
  'tec-2022-50': 3, 'tec-2022-52': 2, 'fun-2024-22': 1, 'fun-2024-23': 2,
  'fun-2024-48': 2, 'tec-2024-52': 3, 'tec-2024-54': 4, 'tec-2024-59': 2,
  'mat-2019-12': 3, 'mat-2024-13': 2, 'fun-2010-21': 4, 'fun-2010-26': 2,
  'fun-2010-50': 5, 'fun-2022-24': 3, 'fun-2022-25': 2, 'fun-2022-28': 4,
  'fun-2024-21': 3, 'fun-2024-24': 2, 'fun-2024-25': 2, 'tec-2019-43': 3,
  'tec-2019-45': 4, 'tec-2019-46': 2, 'tec-2019-61': 2, 'tec-2019-62': 3,
  'tec-2022-46': 4, 'tec-2022-54': 4, 'tec-2024-51': 5, 'tec-2024-53': 4,
  'tec-2024-58': 2,
  // POSCOMP 2024 (adicionais)
  'mat-2024-05': 2, 'mat-2024-14': 3, 'mat-2024-15': 3,
  'fun-2024-26': 2, 'fun-2024-28': 3, 'fun-2024-29': 1, 'fun-2024-36': 4,
  'fun-2024-38': 3, 'fun-2024-39': 2, 'fun-2024-40': 3, 'fun-2024-42': 4,
  'fun-2024-45': 1,
  'tec-2024-46': 3, 'tec-2024-47': 1, 'tec-2024-49': 2, 'tec-2024-50': 1,
  'tec-2024-55': 4, 'tec-2024-57': 4, 'tec-2024-60': 2, 'tec-2024-61': 2,
  'tec-2024-62': 2, 'tec-2024-63': 3, 'tec-2024-64': 4, 'tec-2024-65': 3,
  'tec-2024-66': 3, 'tec-2024-67': 2, 'tec-2024-68': 3, 'tec-2024-69': 3,
  'tec-2024-70': 3,
};

// Fine-grained theme per question (players can filter the run by these). Same
// compact-map pattern as DIFFICULTY_BY_ID; unlisted ids fall into 'Outros'.
const TOPIC_BY_ID: Record<string, string> = {
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

export const QUIZ_QUESTIONS: QuizQuestion[] = RAW_QUESTIONS.map((q) => ({
  ...q,
  difficulty: DIFFICULTY_BY_ID[q.id] ?? 3,
  topic: TOPIC_BY_ID[q.id] ?? 'Outros',
}));

/** Distinct topics, in a sensible display order. */
export const TOPICS: string[] = [...new Set(Object.values(TOPIC_BY_ID))];

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
