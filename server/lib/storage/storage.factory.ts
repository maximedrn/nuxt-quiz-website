import is from '@sindresorhus/is'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import { match } from 'ts-pattern'
import type { Database } from '@/server/lib/database/database.types'
import type { EnvConfig } from '@/server/lib/env/env.types'
import { DrizzleStorageDriver } from '@/server/lib/storage/drivers/storage.drizzle.driver'
import type { IStorageService } from '@/server/lib/storage/storage.interface'
import { StorageService } from '@/server/lib/storage/storage.service'

/** Builds the Postgres-backed storage service over the shared connection. */
function buildDrizzle(db: Database): ResultAsync<IStorageService, string> {
  return okAsync(new StorageService(new DrizzleStorageDriver(db)))
}

/**
 * Builds the blockchain-backed storage service.
 *
 * viem and the blockchain driver are loaded lazily (dynamic import) so the
 * default Postgres deployment never pulls the chain SDK into its module graph.
 */
function buildBlockchain(env: EnvConfig): ResultAsync<IStorageService, string> {
  return ResultAsync.fromPromise(
    Promise.all([import('@/server/lib/storage/drivers/storage.blockchain.driver'), import('viem')]),
    (error) =>
      `Failed to load blockchain driver: ${error instanceof Error ? error.message : String(error)}`,
  ).andThen(([{ BlockchainStorageDriver }, { isAddress, isHex }]) => {
    if (!is.nonEmptyString(env.rpcUrl)) {
      return errAsync('RPC_URL is required for the blockchain driver.')
    }
    if (!is.nonEmptyString(env.contractAddress) || !isAddress(env.contractAddress)) {
      return errAsync('CONTRACT_ADDRESS is missing or not a valid address.')
    }
    // isHex narrows `signerPrivateKey` to viem's `Hex` — no cast needed.
    if (!isHex(env.signerPrivateKey)) {
      return errAsync('SIGNER_PRIVATE_KEY is missing or not a 0x-prefixed hex key.')
    }
    return okAsync(
      new StorageService(
        new BlockchainStorageDriver({
          rpcUrl: env.rpcUrl,
          contractAddress: env.contractAddress,
          signerPrivateKey: env.signerPrivateKey,
        }),
      ),
    )
  })
}

/**
 * Builds the storage service for the configured backend.
 *
 * The single entry point for storage construction. Selects the driver from
 * `STORAGE_DRIVER` with an exhaustive match; the blockchain backend is loaded
 * lazily so Postgres deployments stay free of viem.
 *
 * @param {EnvConfig} env - Validated environment configuration.
 * @param {Database} db - Shared Drizzle client (used by the Postgres backend).
 *
 * @returns {ResultAsync<IStorageService, string>} The service, or a config error.
 *
 * @example
 * ```ts
 * const result = await createStorage(useEnv().config, useDatabase().db)
 * if (result.isErr()) throw createError({ statusCode: 500, statusMessage: result.error })
 * ```
 */
function createStorage(env: EnvConfig, db: Database): ResultAsync<IStorageService, string> {
  return match(env.storageDriver)
    .with('postgres', () => buildDrizzle(db))
    .with('blockchain', () => buildBlockchain(env))
    .exhaustive()
}

export { createStorage }
