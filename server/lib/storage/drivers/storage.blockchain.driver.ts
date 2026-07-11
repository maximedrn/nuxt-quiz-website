import { ResultAsync } from 'neverthrow'
import { createNone, createSome, type Option } from 'option-t/plain_option'
import { match } from 'ts-pattern'
import {
  type Address,
  createPublicClient,
  createWalletClient,
  getAddress,
  type Hex,
  http,
  type PublicClient,
  type WalletClient,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { quizStorageAbi } from '@/server/lib/storage/drivers/storage.blockchain.abi'
import type { IStorageDriver } from '@/server/lib/storage/drivers/storage.driver.interface'
import { StorageError } from '@/server/lib/storage/storage.error'
import { computeStats } from '@/server/lib/storage/storage.stats'
import type {
  NewAnswerInput,
  NewSessionInput,
  QuestionRef,
  SessionPatch,
  StoredAnswer,
  StoredQuestion,
  StoredSession,
} from '@/server/lib/storage/storage.types'
import type { AnswerLetter, SessionMode, SessionStatus, StatsResult } from '@/shared/types'

/** Config the blockchain driver needs to reach the deployed contract. */
interface BlockchainDriverConfig {
  readonly rpcUrl: string
  readonly contractAddress: Address
  readonly signerPrivateKey: Hex
}

/**
 * Raw session tuple as returned by the contract.
 *
 * ponytail: field order/types must match the `Session` struct in your Solidity.
 */
interface ChainSession {
  readonly id: bigint
  readonly userId: bigint
  readonly questionIds: readonly bigint[]
  readonly mode: number
  readonly status: number
  readonly score: bigint
  readonly startedAt: bigint
  readonly finishedAt: bigint
}

/** ponytail: must match the `Answer` struct in your Solidity. */
interface ChainAnswer {
  readonly sessionId: bigint
  readonly questionId: bigint
  readonly selected: number
  readonly isCorrect: boolean
  readonly answeredAt: bigint
}

/** ponytail: must match the `Question` struct in your Solidity. */
interface ChainQuestion {
  readonly id: bigint
  readonly number: bigint
  readonly title: string
  readonly question: string
  readonly code: string
  readonly optionA: string
  readonly optionB: string
  readonly optionC: string
  readonly optionD: string
  readonly correctAnswer: number
  readonly explanation: string
}

const LETTER_BY_INDEX: readonly AnswerLetter[] = ['A', 'B', 'C', 'D']

/** Encodes an answer letter to its on-chain uint8 index. */
function letterToIndex(letter: AnswerLetter): number {
  return LETTER_BY_INDEX.indexOf(letter)
}

/** Decodes an on-chain uint8 index back to an answer letter. */
function indexToLetter(index: number): AnswerLetter {
  return LETTER_BY_INDEX[index] ?? 'A'
}

/** Encodes a session mode to its on-chain uint8. */
function modeToUint(mode: SessionMode): number {
  return match(mode)
    .with('sequential', () => 0)
    .with('random', () => 1)
    .exhaustive()
}

/** Decodes an on-chain uint8 to a session mode. */
function uintToMode(value: number): SessionMode {
  return value === 0 ? 'sequential' : 'random'
}

/** Decodes an on-chain uint8 to a session status. */
function uintToStatus(value: number): SessionStatus {
  return value === 1 ? 'completed' : 'in_progress'
}

/** Encodes a session status to its on-chain uint8. */
function statusToUint(status: SessionStatus): number {
  return match(status)
    .with('in_progress', () => 0)
    .with('completed', () => 1)
    .exhaustive()
}

/**
 * On-chain storage driver (viem).
 *
 * Reads via a `PublicClient` and writes via a `WalletClient` signed by the
 * configured account. The contract ABI lives in `storage.blockchain.abi.ts`;
 * every `ponytail:` marker flags a spot that must line up with the deployed
 * Solidity. Stats reuse the shared `computeStats` after reading raw rows.
 */
class BlockchainStorageDriver implements IStorageDriver {
  private readonly publicClient: PublicClient
  private readonly walletClient: WalletClient
  private readonly address: Address
  private readonly account: ReturnType<typeof privateKeyToAccount>

  /**
   * @param {BlockchainDriverConfig} config - RPC URL, contract address, signer.
   */
  constructor(config: BlockchainDriverConfig) {
    const transport = http(config.rpcUrl)
    this.publicClient = createPublicClient({ transport })
    this.account = privateKeyToAccount(config.signerPrivateKey)
    this.walletClient = createWalletClient({ account: this.account, transport })
    this.address = getAddress(config.contractAddress)
  }

  /** Wraps a contract interaction into a `ResultAsync`. */
  private call<T>(op: string, run: () => Promise<T>): ResultAsync<T, string> {
    return ResultAsync.fromPromise(run(), (err) =>
      StorageError.QUERY_FAILED(op, err instanceof Error ? err.message : String(err)),
    )
  }

  /** Sends a write and waits for it to be mined. */
  private async mined(hash: Promise<Hex>): Promise<void> {
    await this.publicClient.waitForTransactionReceipt({ hash: await hash })
  }

  private toStoredSession(chain: ChainSession): StoredSession {
    const status = uintToStatus(chain.status)
    return {
      id: Number(chain.id),
      userId: Number(chain.userId),
      questionIds: chain.questionIds.map(Number),
      mode: uintToMode(chain.mode),
      status,
      // ponytail: contract stores score as uint; treat unscored sessions as null.
      score: status === 'completed' ? Number(chain.score) : null,
      startedAt: new Date(Number(chain.startedAt) * 1000),
      finishedAt: chain.finishedAt > 0n ? new Date(Number(chain.finishedAt) * 1000) : null,
    }
  }

  private toStoredAnswer(chain: ChainAnswer, index: number): StoredAnswer {
    return {
      id: index,
      sessionId: Number(chain.sessionId),
      questionId: Number(chain.questionId),
      selected: indexToLetter(chain.selected),
      isCorrect: chain.isCorrect,
      answeredAt: new Date(Number(chain.answeredAt) * 1000),
    }
  }

  private toStoredQuestion(chain: ChainQuestion): StoredQuestion {
    return {
      id: Number(chain.id),
      number: Number(chain.number),
      title: chain.title,
      question: chain.question,
      code: chain.code === '' ? null : chain.code,
      optionA: chain.optionA,
      optionB: chain.optionB,
      optionC: chain.optionC,
      optionD: chain.optionD,
      correctAnswer: indexToLetter(chain.correctAnswer),
      explanation: chain.explanation,
    }
  }

  /** Common read-contract parameters, minus the per-call function + args. */
  private get base() {
    return { address: this.address, abi: quizStorageAbi } as const
  }

  listQuestionRefs(): ResultAsync<QuestionRef[], string> {
    return this.call('listQuestionRefs', async () => {
      const refs = await this.publicClient.readContract({
        ...this.base,
        functionName: 'questionRefs',
        args: [],
      })
      return refs.map((r) => ({ id: Number(r.id), number: Number(r.number) }))
    })
  }

  countQuestions(): ResultAsync<number, string> {
    return this.call('countQuestions', async () =>
      Number(
        await this.publicClient.readContract({
          ...this.base,
          functionName: 'questionCount',
          args: [],
        }),
      ),
    )
  }

  getQuestionsByIds(ids: number[]): ResultAsync<StoredQuestion[], string> {
    if (ids.length === 0) return ResultAsync.fromSafePromise(Promise.resolve([]))
    return this.call('getQuestionsByIds', async () => {
      const rows = await this.publicClient.readContract({
        ...this.base,
        functionName: 'questionsByIds',
        args: [ids.map(BigInt)],
      })
      return rows.map((r) => this.toStoredQuestion(r))
    })
  }

  createSession(input: NewSessionInput): ResultAsync<StoredSession, string> {
    return this.call('createSession', async () => {
      const args = [
        BigInt(input.userId),
        input.questionIds.map(BigInt),
        modeToUint(input.mode),
      ] as const
      // ponytail: contract assigns and returns the new session id; simulate to
      // read the return value, then commit the write.
      const { result } = await this.publicClient.simulateContract({
        address: this.address,
        abi: quizStorageAbi,
        functionName: 'createSession',
        args,
        account: this.account,
      })
      await this.mined(
        this.walletClient.writeContract({
          address: this.address,
          abi: quizStorageAbi,
          functionName: 'createSession',
          args,
          account: this.account,
          chain: null,
        }),
      )
      const created = await this.publicClient.readContract({
        ...this.base,
        functionName: 'getSession',
        args: [result],
      })
      return this.toStoredSession(created)
    })
  }

  getSession(id: number): ResultAsync<Option<StoredSession>, string> {
    return this.call('getSession', async () => {
      const exists = await this.publicClient.readContract({
        ...this.base,
        functionName: 'sessionExists',
        args: [BigInt(id)],
      })
      if (!exists) return createNone()
      const chain = await this.publicClient.readContract({
        ...this.base,
        functionName: 'getSession',
        args: [BigInt(id)],
      })
      return createSome(this.toStoredSession(chain))
    })
  }

  listSessions(userId: number): ResultAsync<StoredSession[], string> {
    return this.call('listSessions', async () => {
      const rows = await this.publicClient.readContract({
        ...this.base,
        functionName: 'sessionsByUser',
        args: [BigInt(userId)],
      })
      return rows
        .map((r) => this.toStoredSession(r))
        .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
    })
  }

  updateSession(id: number, patch: SessionPatch): ResultAsync<void, string> {
    // ponytail: single setter taking the full patch; adapt to your contract.
    return this.call('updateSession', () =>
      this.mined(
        this.walletClient.writeContract({
          address: this.address,
          abi: quizStorageAbi,
          functionName: 'updateSession',
          args: [
            BigInt(id),
            patch.status ? statusToUint(patch.status) : 0,
            BigInt(patch.score ?? 0),
            patch.finishedAt ? BigInt(Math.floor(patch.finishedAt.getTime() / 1000)) : 0n,
          ],
          account: this.account,
          chain: null,
        }),
      ),
    )
  }

  createAnswer(input: NewAnswerInput): ResultAsync<void, string> {
    return this.call('createAnswer', () =>
      this.mined(
        this.walletClient.writeContract({
          address: this.address,
          abi: quizStorageAbi,
          functionName: 'addAnswer',
          args: [
            BigInt(input.sessionId),
            BigInt(input.questionId),
            letterToIndex(input.selected),
            input.isCorrect,
          ],
          account: this.account,
          chain: null,
        }),
      ),
    )
  }

  listAnswers(sessionId: number): ResultAsync<StoredAnswer[], string> {
    return this.call('listAnswers', async () => {
      const rows = await this.publicClient.readContract({
        ...this.base,
        functionName: 'answersBySession',
        args: [BigInt(sessionId)],
      })
      return rows.map((r, i) => this.toStoredAnswer(r, i))
    })
  }

  getStats(userId: number): ResultAsync<StatsResult, string> {
    return this.call('getStats', async () => {
      const sessionRows = await this.publicClient.readContract({
        ...this.base,
        functionName: 'sessionsByUser',
        args: [BigInt(userId)],
      })
      const sessions = sessionRows.map((r) => this.toStoredSession(r))
      const answers: StoredAnswer[] = []
      for (const session of sessions) {
        const rows = await this.publicClient.readContract({
          ...this.base,
          functionName: 'answersBySession',
          args: [BigInt(session.id)],
        })
        answers.push(...rows.map((r, i) => this.toStoredAnswer(r, answers.length + i)))
      }
      const refs = await this.publicClient.readContract({
        ...this.base,
        functionName: 'questionMeta',
        args: [],
      })
      const questionMeta = new Map(
        refs.map((r) => [Number(r.id), { number: Number(r.number), title: r.title }]),
      )
      return computeStats({ totalQuestions: refs.length, sessions, answers, questionMeta })
    })
  }
}

export type { BlockchainDriverConfig }
export { BlockchainStorageDriver }
