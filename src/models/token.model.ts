import type { Address } from 'viem'

export interface DiscoveredToken {
  token: Address
  curve: Address
  deployer: Address
  pairToken: Address
  launchConfigId: bigint
  graduationThreshold: bigint
  blockNumber: bigint
  transactionHash: string
}

export type TokenDataField =
  | 'name'
  | 'symbol'
  | 'logo'
  | 'reserves'
  | 'realQuoteReserve'
  | 'graduationTarget'
  | 'phase'
  | 'graduationProgress'

export interface TokenDetails extends DiscoveredToken {
  name?: string
  symbol?: string
  logo?: string
  quoteReserve?: bigint
  tokenReserve?: bigint
  realQuoteReserve?: bigint
  graduationTarget?: bigint
  phase?: bigint
  dataErrors?: Partial<Record<TokenDataField, string>>
}