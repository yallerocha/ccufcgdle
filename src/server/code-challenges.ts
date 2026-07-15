// Challenge bank for the daily coding game ("mini leetcode"). Each challenge is
// a small function with a statement in Portuguese (title/description) and in
// English (titleEn/descriptionEn) plus a set of tests the player's code must
// pass. Function names are code identifiers and stay the same in both languages;
// the client picks the statement matching the interface language.

export interface CodeTest {
  args: unknown[]; // arguments passed to the player's function
  expected: unknown; // expected return value (compared structurally)
}

// Languages the player can solve the daily challenge in. Every challenge is
// language-agnostic (JSON-typed args/returns) and ships one starter per language.
export type CodeLanguage = 'js' | 'py';
export const CODE_LANGUAGES: CodeLanguage[] = ['js', 'py'];

export interface CodeChallenge {
  id: string;
  title: string;
  titleEn: string;
  difficulty: 'Fácil' | 'Médio';
  functionName: string;
  description: string;
  descriptionEn: string;
  starters: Record<CodeLanguage, string>;
  tests: CodeTest[];
}

export const CODE_CHALLENGES: CodeChallenge[] = [
  {
    id: 'soma-digitos',
    title: 'Soma dos dígitos',
    titleEn: 'Digit sum',
    difficulty: 'Fácil',
    functionName: 'somaDigitos',
    description:
      'Implemente somaDigitos(n), que recebe um inteiro não negativo n e retorna a soma dos seus dígitos. Exemplo: somaDigitos(123) → 6.',
    descriptionEn:
      'Implement somaDigitos(n), which takes a non-negative integer n and returns the sum of its digits. Example: somaDigitos(123) → 6.',
    starters: {
      js: 'function somaDigitos(n) {\n  // seu código aqui\n}\n',
      py: 'def somaDigitos(n):\n    # seu código aqui\n    pass\n',
    },
    tests: [
      { args: [123], expected: 6 },
      { args: [9], expected: 9 },
      { args: [4059], expected: 18 },
      { args: [0], expected: 0 },
      { args: [999999], expected: 54 },
    ],
  },
  {
    id: 'inverter-string',
    title: 'Inverter string',
    titleEn: 'Reverse string',
    difficulty: 'Fácil',
    functionName: 'inverter',
    description:
      'Implemente inverter(s), que recebe uma string e a retorna invertida. Exemplo: inverter("lsd") → "dsl".',
    descriptionEn:
      'Implement inverter(s), which takes a string and returns it reversed. Example: inverter("lsd") → "dsl".',
    starters: {
      js: 'function inverter(s) {\n  // seu código aqui\n}\n',
      py: 'def inverter(s):\n    # seu código aqui\n    pass\n',
    },
    tests: [
      { args: ['lsd'], expected: 'dsl' },
      { args: ['computacao'], expected: 'oacatupmoc' },
      { args: ['a'], expected: 'a' },
      { args: [''], expected: '' },
      { args: ['abba'], expected: 'abba' },
    ],
  },
  {
    id: 'palindromo',
    title: 'Palíndromo',
    titleEn: 'Palindrome',
    difficulty: 'Fácil',
    functionName: 'ehPalindromo',
    description:
      'Implemente ehPalindromo(s), que retorna true se a string (já em minúsculas, sem espaços) é igual lida de trás para frente, e false caso contrário. Exemplo: ehPalindromo("arara") → true.',
    descriptionEn:
      'Implement ehPalindromo(s), which returns true if the string (already lowercase, no spaces) reads the same backwards, and false otherwise. Example: ehPalindromo("arara") → true.',
    starters: {
      js: 'function ehPalindromo(s) {\n  // seu código aqui\n}\n',
      py: 'def ehPalindromo(s):\n    # seu código aqui\n    pass\n',
    },
    tests: [
      { args: ['arara'], expected: true },
      { args: ['radar'], expected: true },
      { args: ['python'], expected: false },
      { args: ['aa'], expected: true },
      { args: ['ab'], expected: false },
    ],
  },
  {
    id: 'fibonacci',
    title: 'Fibonacci',
    titleEn: 'Fibonacci',
    difficulty: 'Fácil',
    functionName: 'fib',
    description:
      'Implemente fib(n), que retorna o n-ésimo número de Fibonacci, com fib(0) = 0 e fib(1) = 1. Exemplo: fib(7) → 13.',
    descriptionEn:
      'Implement fib(n), which returns the n-th Fibonacci number, with fib(0) = 0 and fib(1) = 1. Example: fib(7) → 13.',
    starters: {
      js: 'function fib(n) {\n  // seu código aqui\n}\n',
      py: 'def fib(n):\n    # seu código aqui\n    pass\n',
    },
    tests: [
      { args: [0], expected: 0 },
      { args: [1], expected: 1 },
      { args: [7], expected: 13 },
      { args: [10], expected: 55 },
      { args: [20], expected: 6765 },
    ],
  },
  {
    id: 'maior-elemento',
    title: 'Maior elemento',
    titleEn: 'Largest element',
    difficulty: 'Fácil',
    functionName: 'maior',
    description:
      'Implemente maior(arr), que retorna o maior número de um array não vazio, sem usar Math.max se preferir — só precisa retornar o valor certo. Exemplo: maior([3, 9, 2]) → 9.',
    descriptionEn:
      'Implement maior(arr), which returns the largest number of a non-empty array. Example: maior([3, 9, 2]) → 9.',
    starters: {
      js: 'function maior(arr) {\n  // seu código aqui\n}\n',
      py: 'def maior(arr):\n    # seu código aqui\n    pass\n',
    },
    tests: [
      { args: [[3, 9, 2]], expected: 9 },
      { args: [[-5, -2, -10]], expected: -2 },
      { args: [[7]], expected: 7 },
      { args: [[1, 2, 3, 100, 4]], expected: 100 },
      { args: [[0, 0, 0]], expected: 0 },
    ],
  },
  {
    id: 'contar-vogais',
    title: 'Contar vogais',
    titleEn: 'Count vowels',
    difficulty: 'Fácil',
    functionName: 'contarVogais',
    description:
      'Implemente contarVogais(s), que conta quantas vogais (a, e, i, o, u — maiúsculas ou minúsculas, sem acentos) existem na string. Exemplo: contarVogais("Kernel") → 2.',
    descriptionEn:
      'Implement contarVogais(s), which counts how many vowels (a, e, i, o, u — upper or lower case, no accents) the string contains. Example: contarVogais("Kernel") → 2.',
    starters: {
      js: 'function contarVogais(s) {\n  // seu código aqui\n}\n',
      py: 'def contarVogais(s):\n    # seu código aqui\n    pass\n',
    },
    tests: [
      { args: ['Kernel'], expected: 2 },
      { args: ['xyz'], expected: 0 },
      { args: ['AEiou'], expected: 5 },
      { args: ['Programacao'], expected: 5 },
      { args: [''], expected: 0 },
    ],
  },
  {
    id: 'binario-decimal',
    title: 'Binário para decimal',
    titleEn: 'Binary to decimal',
    difficulty: 'Fácil',
    functionName: 'binParaDec',
    description:
      'Implemente binParaDec(s), que recebe uma string binária (apenas "0" e "1") e retorna o valor decimal correspondente como número. Exemplo: binParaDec("101101") → 45.',
    descriptionEn:
      'Implement binParaDec(s), which takes a binary string (only "0" and "1") and returns the corresponding decimal value as a number. Example: binParaDec("101101") → 45.',
    starters: {
      js: 'function binParaDec(s) {\n  // seu código aqui\n}\n',
      py: 'def binParaDec(s):\n    # seu código aqui\n    pass\n',
    },
    tests: [
      { args: ['101101'], expected: 45 },
      { args: ['0'], expected: 0 },
      { args: ['1'], expected: 1 },
      { args: ['11111111'], expected: 255 },
      { args: ['10000000000'], expected: 1024 },
    ],
  },
  {
    id: 'parenteses-validos',
    title: 'Parênteses válidos',
    titleEn: 'Valid brackets',
    difficulty: 'Médio',
    functionName: 'valida',
    description:
      'Implemente valida(s), que recebe uma string contendo apenas os caracteres "()[]{}" e retorna true se todos os pares abrem e fecham na ordem correta. Exemplo: valida("([]{})") → true; valida("(]") → false.',
    descriptionEn:
      'Implement valida(s), which takes a string containing only the characters "()[]{}" and returns true if every pair opens and closes in the correct order. Example: valida("([]{})") → true; valida("(]") → false.',
    starters: {
      js: 'function valida(s) {\n  // seu código aqui\n}\n',
      py: 'def valida(s):\n    # seu código aqui\n    pass\n',
    },
    tests: [
      { args: ['([]{})'], expected: true },
      { args: ['(]'], expected: false },
      { args: [''], expected: true },
      { args: ['((('], expected: false },
      { args: ['{[()()]}'], expected: true },
      { args: ['([)]'], expected: false },
    ],
  },
  {
    id: 'dois-somam',
    title: 'Dois números somam o alvo',
    titleEn: 'Two numbers sum to target',
    difficulty: 'Médio',
    functionName: 'existeSoma',
    description:
      'Implemente existeSoma(arr, alvo), que retorna true se existem dois elementos em posições diferentes do array cuja soma é igual a alvo. Exemplo: existeSoma([2, 7, 11], 9) → true.',
    descriptionEn:
      'Implement existeSoma(arr, alvo), which returns true if two elements at different positions of the array add up to alvo. Example: existeSoma([2, 7, 11], 9) → true.',
    starters: {
      js: 'function existeSoma(arr, alvo) {\n  // seu código aqui\n}\n',
      py: 'def existeSoma(arr, alvo):\n    # seu código aqui\n    pass\n',
    },
    tests: [
      { args: [[2, 7, 11], 9], expected: true },
      { args: [[1, 2, 3], 7], expected: false },
      { args: [[5], 10], expected: false },
      { args: [[5, 5], 10], expected: true },
      { args: [[-2, 8, 3], 1], expected: true },
    ],
  },
  {
    id: 'mdc',
    title: 'Máximo divisor comum',
    titleEn: 'Greatest common divisor',
    difficulty: 'Médio',
    functionName: 'mdc',
    description:
      'Implemente mdc(a, b), que retorna o máximo divisor comum de dois inteiros positivos (dica: algoritmo de Euclides). Exemplo: mdc(12, 18) → 6.',
    descriptionEn:
      'Implement mdc(a, b), which returns the greatest common divisor of two positive integers (hint: Euclid\'s algorithm). Example: mdc(12, 18) → 6.',
    starters: {
      js: 'function mdc(a, b) {\n  // seu código aqui\n}\n',
      py: 'def mdc(a, b):\n    # seu código aqui\n    pass\n',
    },
    tests: [
      { args: [12, 18], expected: 6 },
      { args: [7, 13], expected: 1 },
      { args: [100, 10], expected: 10 },
      { args: [48, 36], expected: 12 },
      { args: [17, 17], expected: 17 },
    ],
  },
  {
    id: 'remover-duplicados',
    title: 'Remover duplicados',
    titleEn: 'Remove duplicates',
    difficulty: 'Médio',
    functionName: 'semDuplicados',
    description:
      'Implemente semDuplicados(arr), que retorna um novo array sem elementos repetidos, preservando a ordem da primeira ocorrência. Exemplo: semDuplicados([1, 2, 1, 3]) → [1, 2, 3].',
    descriptionEn:
      'Implement semDuplicados(arr), which returns a new array without repeated elements, preserving first-occurrence order. Example: semDuplicados([1, 2, 1, 3]) → [1, 2, 3].',
    starters: {
      js: 'function semDuplicados(arr) {\n  // seu código aqui\n}\n',
      py: 'def semDuplicados(arr):\n    # seu código aqui\n    pass\n',
    },
    tests: [
      { args: [[1, 2, 1, 3]], expected: [1, 2, 3] },
      { args: [[]], expected: [] },
      { args: [[5, 5, 5]], expected: [5] },
      { args: [[3, 2, 1]], expected: [3, 2, 1] },
      { args: [[1, 2, 2, 3, 3, 3, 4]], expected: [1, 2, 3, 4] },
    ],
  },
  {
    id: 'fizzbuzz',
    title: 'FizzBuzz',
    titleEn: 'FizzBuzz',
    difficulty: 'Fácil',
    functionName: 'fizzbuzz',
    description:
      'Implemente fizzbuzz(n), que retorna "FizzBuzz" se n é divisível por 3 e por 5, "Fizz" se apenas por 3, "Buzz" se apenas por 5, e o próprio número como string caso contrário. Exemplo: fizzbuzz(15) → "FizzBuzz".',
    descriptionEn:
      'Implement fizzbuzz(n), which returns "FizzBuzz" if n is divisible by 3 and by 5, "Fizz" if only by 3, "Buzz" if only by 5, and the number itself as a string otherwise. Example: fizzbuzz(15) → "FizzBuzz".',
    starters: {
      js: 'function fizzbuzz(n) {\n  // seu código aqui\n}\n',
      py: 'def fizzbuzz(n):\n    # seu código aqui\n    pass\n',
    },
    tests: [
      { args: [15], expected: 'FizzBuzz' },
      { args: [9], expected: 'Fizz' },
      { args: [10], expected: 'Buzz' },
      { args: [7], expected: '7' },
      { args: [30], expected: 'FizzBuzz' },
    ],
  },
  {
    id: 'segundo-maior',
    title: 'Segundo maior',
    titleEn: 'Second largest',
    difficulty: 'Médio',
    functionName: 'segundoMaior',
    description:
      'Implemente segundoMaior(arr), que retorna o segundo maior valor distinto de um array com pelo menos dois valores distintos. Exemplo: segundoMaior([4, 1, 4, 3]) → 3.',
    descriptionEn:
      'Implement segundoMaior(arr), which returns the second largest distinct value of an array with at least two distinct values. Example: segundoMaior([4, 1, 4, 3]) → 3.',
    starters: {
      js: 'function segundoMaior(arr) {\n  // seu código aqui\n}\n',
      py: 'def segundoMaior(arr):\n    # seu código aqui\n    pass\n',
    },
    tests: [
      { args: [[4, 1, 4, 3]], expected: 3 },
      { args: [[1, 2]], expected: 1 },
      { args: [[10, 9, 8]], expected: 9 },
      { args: [[-1, -2, -3]], expected: -2 },
      { args: [[5, 5, 4, 4, 3]], expected: 4 },
    ],
  },
  {
    id: 'contar-bits',
    title: 'Contar bits 1',
    titleEn: 'Count set bits',
    difficulty: 'Médio',
    functionName: 'contarBits',
    description:
      'Implemente contarBits(n), que retorna quantos bits 1 existem na representação binária do inteiro não negativo n. Exemplo: contarBits(13) → 3 (1101).',
    descriptionEn:
      'Implement contarBits(n), which returns how many 1 bits exist in the binary representation of the non-negative integer n. Example: contarBits(13) → 3 (1101).',
    starters: {
      js: 'function contarBits(n) {\n  // seu código aqui\n}\n',
      py: 'def contarBits(n):\n    # seu código aqui\n    pass\n',
    },
    tests: [
      { args: [13], expected: 3 },
      { args: [0], expected: 0 },
      { args: [1], expected: 1 },
      { args: [255], expected: 8 },
      { args: [1024], expected: 1 },
    ],
  },
];

export const CHALLENGE_BY_ID = new Map(CODE_CHALLENGES.map((c) => [c.id, c]));
