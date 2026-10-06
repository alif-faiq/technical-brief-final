import type { PublicClient } from 'viem'
import {
  LAUNCH_FACTORY_ADDRESS,
  launchFactoryAbi,
} from '../contracts/LaunchFactory'
import type { DiscoveredToken } from '../models/token.model'

const FACTORY_DEPLOY_BLOCK = 129157568n
const MAX_BLOCK_RANGE = 50_000n

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export async function discoverTokens(
  publicClient: Pick<PublicClient, 'getBlockNumber' | 'getContractEvents'>,
): Promise<DiscoveredToken[]> {
  let latestBlock: bigint
  try {
    latestBlock = await publicClient.getBlockNumber()
  } catch (error) {
    throw new Error(
      `Failed to read the latest block from Robinhood Chain Testnet: ${getErrorMessage(error)}`,
      { cause: error },
    )
  }

  const tokens: DiscoveredToken[] = []

  let fromBlock = FACTORY_DEPLOY_BLOCK

  while (fromBlock <= latestBlock) {
    const toBlock =
      fromBlock + MAX_BLOCK_RANGE - 1n > latestBlock
        ? latestBlock
        : fromBlock + MAX_BLOCK_RANGE - 1n

    let logs
    try {
      logs = await publicClient.getContractEvents({
        address: LAUNCH_FACTORY_ADDRESS,
        abi: launchFactoryAbi,
        eventName: 'TokenLaunched',
        fromBlock,
        toBlock,
      })
    } catch (error) {
      throw new Error(
        `Failed to fetch TokenLaunched logs for blocks ${fromBlock}-${toBlock}: ${getErrorMessage(error)}`,
        { cause: error },
      )
    }

    for (const log of logs) {
      if (!log.args.token || !log.args.curve || !log.args.deployer) {
        continue
      }

      tokens.push({
        token: log.args.token,
        curve: log.args.curve,
        deployer: log.args.deployer,
        pairToken: log.args.pairToken ?? '0x0000000000000000000000000000000000000000',
        launchConfigId: log.args.launchConfigId ?? 0n,
        graduationThreshold: log.args.graduationThreshold ?? 0n,
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
      })
    }

    fromBlock = toBlock + 1n
  }

  return tokens
}