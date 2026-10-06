import { createConfig, http } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { robinhoodTestnet } from './chain'

export const wagmiConfig = createConfig({
  chains: [robinhoodTestnet],
  multiInjectedProviderDiscovery: true,
  connectors: [
    injected({
      shimDisconnect: true,
    }),
  ],
  transports: {
    [robinhoodTestnet.id]: http(),
  },
})