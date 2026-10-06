import { defineChain } from 'viem'

export const robinhoodTestnet = defineChain({
  id: 46630,
  name: 'Robinhood Chain Testnet',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://robinhood-sepolia-rpc.publicnode.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Robinhood Explorer',
      url: 'https://explorer.testnet.chain.robinhood.com',
    },
  },
  testnet: true,
})