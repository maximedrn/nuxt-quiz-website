import is from '@sindresorhus/is'
import { Effect } from 'effect'
import { match } from 'ts-pattern'
import type { Database } from '@/server/lib/database/database.types'
import type { EnvConfig } from '@/server/lib/env/env.types'
import { HttpStatus } from '@/server/lib/http/http.status'
import { DrizzleStorageDriver } from '@/server/lib/storage/drivers/storage.drizzle.driver'
import type { IStorageService } from '@/server/lib/storage/storage.interface'
import { StorageMessage } from '@/server/lib/storage/storage.message'
import { StorageService } from '@/server/lib/storage/storage.service'
import { StorageError } from '@/server/lib/storage/storage.types'

/** Builds the Postgres-backed storage service over the shared connection. */
function buildDrizzle(db: Database): Effect.Effect<IStorageService, StorageError> {
  return Effect.succeed(new StorageService(new DrizzleStorageDriver(db)))
}

/**
 * Builds the blockchain-backed storage service.
 *
 * viem and the blockchain driver are loaded lazily (dynamic import) so the
 * default Postgres deployment never pulls the chain SDK into its module graph.
 */
function buildBlockchain(env: EnvConfig): Effect.Effect<IStorageService, StorageError> {
  return Effect.tryPromise({
    try: () =>
      Promise.all([
        import('@/server/lib/storage/drivers/storage.blockchain.driver'),
        import('viem'),
      ]),
    catch: (e): StorageError =>
      new StorageError({
        message: `Failed to load blockchain driver: ${e instanceof Error ? e.message : String(e)}`,
        status: HttpStatus.INTERNAL,
      }),
  }).pipe(
    Effect.flatMap(([{ BlockchainStorageDriver }, { isAddress, isHex }]) => {
      if (!is.nonEmptyString(env.rpcUrl)) {
        return Effect.fail(
          new StorageError({
            message: 'RPC_URL is required for the blockchain driver.',
            status: HttpStatus.INTERNAL,
          }),
        )
      }
      if (!is.nonEmptyString(env.contractAddress) || !isAddress(env.contractAddress)) {
        return Effect.fail(
          new StorageError({
            message: 'CONTRACT_ADDRESS is missing or not a valid address.',
            status: HttpStatus.INTERNAL,
          }),
        )
      }
      // isHex narrows `signerPrivateKey` to viem's `Hex` — no cast needed.
      if (!isHex(env.signerPrivateKey)) {
        return Effect.fail(
          new StorageError({
            message: StorageMessage.NOT_IMPLEMENTED,
            status: HttpStatus.INTERNAL,
          }),
        )
      }
      return Effect.succeed(
        new StorageService(
          new BlockchainStorageDriver({
            rpcUrl: env.rpcUrl,
            contractAddress: env.contractAddress,
            signerPrivateKey: env.signerPrivateKey,
          }),
        ),
      )
    }),
  )
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
 * @returns {Effect.Effect<IStorageService, StorageError>} The service, or a config error.
 *
 * @example
 * ```ts
 * const storage = await Effect.runPromise(
 *   createStorage(useEnv().config, useDatabase().db).pipe(
 *     Effect.catchAll((e) => Effect.die(createError({ statusCode: e.status, statusMessage: e.message }))),
 *   ),
 * )
 * ```
 */
function createStorage(env: EnvConfig, db: Database): Effect.Effect<IStorageService, StorageError> {
  return match(env.storageDriver)
    .with('postgres', () => buildDrizzle(db))
    .with('blockchain', () => buildBlockchain(env))
    .exhaustive()
}

export { createStorage }
