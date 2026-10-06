import {
  formatEther,
  type PublicClient,
} from 'viem'
import {
  LAUNCH_FACTORY_ADDRESS,
  launchFactoryAbi,
} from '../contracts/LaunchFactory'
import type {
  DiscoveredToken,
  TokenDataField,
  TokenDetails,
} from '../models/token.model'

const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11'
const CALLS_PER_TOKEN = 7

const launcherTokenAbi = [
  {
    type: 'function',
    name: 'name',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'logo',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
] as const

const bondingCurveAbi = [
  {
    type: 'function',
    name: 'getReserves',
    inputs: [],
    outputs: [
      { name: 'quoteReserve_', type: 'uint256' },
      { name: 'tokenReserve_', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'realQuoteReserve',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'graduationThreshold',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}

function asBigInt(value: unknown): bigint | undefined {
  if (typeof value === 'bigint') return value
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) {
    return BigInt(value)
  }
  return undefined
}

function asReserves(value: unknown): [bigint, bigint] | undefined {
  if (
    Array.isArray(value) &&
    typeof value[0] === 'bigint' &&
    typeof value[1] === 'bigint'
  ) {
    return [value[0], value[1]]
  }
  return undefined
}

function readPhase(value: unknown): bigint | undefined {
  let tuple = value
  if (Array.isArray(tuple) && tuple.length === 1) {
    tuple = tuple[0]
  }

  const launchedToken = asRecord(tuple)
  if (launchedToken) {
    return asBigInt(launchedToken.phase)
  }

  if (Array.isArray(tuple)) {
    return asBigInt(tuple[10])
  }

  return undefined
}

function describeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

export async function loadTokenData(
  publicClient: Pick<PublicClient, 'multicall'>,
  tokens: readonly DiscoveredToken[],
): Promise<TokenDetails[]> {
  if (tokens.length === 0) return []

  const contracts = tokens.flatMap((token) => [
    {
      address: token.token,
      abi: launcherTokenAbi,
      functionName: 'name',
    },
    {
      address: token.token,
      abi: launcherTokenAbi,
      functionName: 'symbol',
    },
    {
      address: token.token,
      abi: launcherTokenAbi,
      functionName: 'logo',
    },
    {
      address: token.curve,
      abi: bondingCurveAbi,
      functionName: 'getReserves',
    },
    {
      address: token.curve,
      abi: bondingCurveAbi,
      functionName: 'realQuoteReserve',
    },
    {
      address: token.curve,
      abi: bondingCurveAbi,
      functionName: 'graduationThreshold',
    },
    {
      address: LAUNCH_FACTORY_ADDRESS,
      abi: launchFactoryAbi,
      functionName: 'getLaunchedToken',
      args: [token.token],
    },
  ] as const)

  try {
    const results = await publicClient.multicall({
      contracts,
      allowFailure: true,
      multicallAddress: MULTICALL3_ADDRESS,
    })

    return tokens.map((token, tokenIndex) => {
      const offset = tokenIndex * CALLS_PER_TOKEN
      const dataAt = (callIndex: number): unknown => {
        const result = results[offset + callIndex]
        return result?.status === 'success' ? result.result : undefined
      }
      const errorAt = (
        callIndex: number,
        field: TokenDataField,
      ): string | undefined => {
        const result = results[offset + callIndex]
        if (result?.status === 'failure') {
          return `Could not read ${field}: ${describeError(result.error)}`
        }
        return undefined
      }

      const dataErrors: Partial<Record<TokenDataField, string>> = {}
      const nameData = dataAt(0)
      const symbolData = dataAt(1)
      const logoData = dataAt(2)
      const reserves = asReserves(dataAt(3))
      const realQuoteReserve = asBigInt(dataAt(4))
      const graduationTarget = asBigInt(dataAt(5))
      const phase = readPhase(dataAt(6))

      const name = typeof nameData === 'string' ? nameData : undefined
      const symbol = typeof symbolData === 'string' ? symbolData : undefined
      const logo = typeof logoData === 'string' ? logoData : undefined

      if (name === undefined) {
        dataErrors.name = errorAt(0, 'name') ?? 'Could not decode token name.'
      }
      if (symbol === undefined) {
        dataErrors.symbol = errorAt(1, 'symbol') ?? 'Could not decode token symbol.'
      }
      if (logo === undefined) {
        dataErrors.logo = errorAt(2, 'logo') ?? 'Could not decode token logo.'
      }
      if (!reserves) {
        dataErrors.reserves = errorAt(3, 'reserves') ?? 'Could not decode curve reserves.'
      }
      if (realQuoteReserve === undefined) {
        dataErrors.realQuoteReserve =
          errorAt(4, 'realQuoteReserve') ?? 'Could not decode ETH collected.'
      }
      if (graduationTarget === undefined) {
        dataErrors.graduationTarget =
          errorAt(5, 'graduationTarget') ?? 'Could not decode graduation target.'
      } else if (graduationTarget === 0n) {
        dataErrors.graduationProgress = 'Graduation progress is unavailable because the target is zero.'
      }
      if (phase === undefined) {
        dataErrors.phase =
          errorAt(6, 'phase') ?? 'Could not decode phase from getLaunchedToken.'
      }

      return {
        ...token,
        name,
        symbol,
        logo,
        quoteReserve: reserves?.[0],
        tokenReserve: reserves?.[1],
        realQuoteReserve,
        graduationTarget,
        phase,
        dataErrors,
      }
    })
  } catch (error) {
    throw new Error(
      `Multicall3 could not load token data: ${describeError(error)}`,
      { cause: error },
    )
  }
}

export function formatEth(value: bigint): string {
  return `${formatEther(value)} ETH`
}

export function formatPrice(
  quoteReserve: bigint,
  tokenReserve: bigint,
): string {
  if (tokenReserve === 0n) return 'Unavailable (zero token reserve)'
  if (quoteReserve === 0n) return '0 ETH per token'

  const significantDigits = 6
  let exponent =
    quoteReserve.toString().length - tokenReserve.toString().length
  const belowEstimatedPower = exponent >= 0
    ? quoteReserve < tokenReserve * (10n ** BigInt(exponent))
    : quoteReserve * (10n ** BigInt(-exponent)) < tokenReserve
  if (belowEstimatedPower) exponent--

  const scale = significantDigits - 1 - exponent
  const scaledNumerator = scale >= 0
    ? quoteReserve * (10n ** BigInt(scale))
    : quoteReserve
  const scaledDenominator = scale >= 0
    ? tokenReserve
    : tokenReserve * (10n ** BigInt(-scale))
  let rounded = (scaledNumerator + scaledDenominator / 2n) / scaledDenominator

  if (rounded >= 10n ** BigInt(significantDigits)) {
    rounded /= 10n
    exponent++
  }

  const digits = rounded.toString().padStart(significantDigits, '0')
  const fraction = digits.slice(1).replace(/0+$/, '')
  const mantissa = fraction ? `${digits[0]}.${fraction}` : digits[0]
  return `${mantissa}e${exponent} ETH per token`
}

export function getGraduationProgressBps(
  realQuoteReserve: bigint,
  graduationTarget: bigint,
): bigint | undefined {
  if (graduationTarget === 0n) return undefined
  const basisPoints = (realQuoteReserve * 10_000n) / graduationTarget
  return basisPoints > 10_000n ? 10_000n : basisPoints
}

export function formatGraduationProgress(basisPoints: bigint): string {
  const wholePercent = basisPoints / 100n
  const fractionalPercent = (basisPoints % 100n).toString().padStart(2, '0')
  return `${wholePercent}.${fractionalPercent}%`
}
