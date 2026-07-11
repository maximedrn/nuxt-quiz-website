/**
 * ABI of the on-chain quiz-storage contract the blockchain driver talks to.
 *
 * ponytail: this is the contract *shape* the driver expects. Replace it with
 * the ABI emitted by your compiled Solidity (or adjust your Solidity to match
 * these signatures). Struct field order here must equal the driver's
 * `ChainSession` / `ChainAnswer` / `ChainQuestion` interfaces.
 */
const quizStorageAbi = [
  {
    type: 'function',
    name: 'questionCount',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'questionRefs',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'number', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'questionMeta',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'number', type: 'uint256' },
          { name: 'title', type: 'string' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'questionsByIds',
    stateMutability: 'view',
    inputs: [{ name: 'ids', type: 'uint256[]' }],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'number', type: 'uint256' },
          { name: 'title', type: 'string' },
          { name: 'question', type: 'string' },
          { name: 'code', type: 'string' },
          { name: 'optionA', type: 'string' },
          { name: 'optionB', type: 'string' },
          { name: 'optionC', type: 'string' },
          { name: 'optionD', type: 'string' },
          { name: 'correctAnswer', type: 'uint8' },
          { name: 'explanation', type: 'string' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'createSession',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'userId', type: 'uint256' },
      { name: 'questionIds', type: 'uint256[]' },
      { name: 'mode', type: 'uint8' },
    ],
    outputs: [{ name: 'id', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'sessionExists',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'getSession',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'userId', type: 'uint256' },
          { name: 'questionIds', type: 'uint256[]' },
          { name: 'mode', type: 'uint8' },
          { name: 'status', type: 'uint8' },
          { name: 'score', type: 'uint256' },
          { name: 'startedAt', type: 'uint256' },
          { name: 'finishedAt', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'sessionsByUser',
    stateMutability: 'view',
    inputs: [{ name: 'userId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'userId', type: 'uint256' },
          { name: 'questionIds', type: 'uint256[]' },
          { name: 'mode', type: 'uint8' },
          { name: 'status', type: 'uint8' },
          { name: 'score', type: 'uint256' },
          { name: 'startedAt', type: 'uint256' },
          { name: 'finishedAt', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'updateSession',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'id', type: 'uint256' },
      { name: 'status', type: 'uint8' },
      { name: 'score', type: 'uint256' },
      { name: 'finishedAt', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'addAnswer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'sessionId', type: 'uint256' },
      { name: 'questionId', type: 'uint256' },
      { name: 'selected', type: 'uint8' },
      { name: 'isCorrect', type: 'bool' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'answersBySession',
    stateMutability: 'view',
    inputs: [{ name: 'sessionId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'sessionId', type: 'uint256' },
          { name: 'questionId', type: 'uint256' },
          { name: 'selected', type: 'uint8' },
          { name: 'isCorrect', type: 'bool' },
          { name: 'answeredAt', type: 'uint256' },
        ],
      },
    ],
  },
] as const

export { quizStorageAbi }
