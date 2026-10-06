import { useAccount, useConnect, useDisconnect, useBalance, useSwitchChain } from 'wagmi'
import { robinhoodTestnet } from '../config/chain'
import { formatUnits } from 'viem'
import './ConnectWallet.css'

export default function ConnectWallet() {
  const { address, isConnected, isConnecting, isReconnecting, chainId } = useAccount()
  const { connect, connectors, isPending: isConnectPending, error: connectError } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain, isPending: isSwitchPending, error: switchError } = useSwitchChain()

  const { data: balanceData, isLoading: isBalanceLoading } = useBalance({
    address,
    chainId: robinhoodTestnet.id,
    query: {
      enabled: !!address && isConnected,
    },
  })

  const isWrongNetwork = isConnected && chainId !== robinhoodTestnet.id

  const formatAddress = (addr?: string) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const formatBalance = () => {
    if (isBalanceLoading) return 'Loading...'
    if (!balanceData) return '0.0000 ETH'
    const val = parseFloat(formatUnits(balanceData.value, balanceData.decimals))
    return `${val.toFixed(4)} ${balanceData.symbol}`
  }

  const handleConnect = () => {
    // Prioritize MetaMask (EIP-6963 or Injected) or fallback to first available
    const metamaskConnector = connectors.find(
      (c) => c.id === 'io.metamask' || c.name.toLowerCase().includes('metamask')
    )
    const targetConnector = metamaskConnector ?? connectors.find((c) => c.id === 'injected') ?? connectors[0]

    if (targetConnector) {
      connect({ connector: targetConnector })
    }
  }

  const handleSwitchNetwork = () => {
    switchChain({ chainId: robinhoodTestnet.id })
  }

  const getFriendlyErrorMessage = (err: Error | null) => {
    if (!err) return ''
    const msg = err.message || ''
    if (msg.includes('Provider not found') || err.name === 'ProviderNotFoundError') {
      return 'MetaMask / Web3 provider not detected. Please install MetaMask in your browser.'
    }
    if (msg.includes('User rejected') || msg.includes('User denied') || err.name === 'UserRejectedRequestError') {
      return 'Request was rejected by user in wallet.'
    }
    if (msg.includes('already pending') || msg.includes('ResourceUnavailable')) {
      return 'A request is already pending in your wallet. Please check MetaMask.'
    }
    return msg
  }

  const isBusy = isConnecting || isReconnecting || isConnectPending

  return (
    <div className="wallet-container">
      {!isConnected ? (
        <div className="wallet-connect-wrapper">
          <button
            type="button"
            className="btn btn-connect"
            onClick={handleConnect}
            disabled={isBusy}
          >
            {isBusy ? 'Connecting...' : 'Connect Wallet'}
          </button>
          {connectError && (
            <div className="wallet-error-box">
              <p className="wallet-error">{getFriendlyErrorMessage(connectError)}</p>
              {connectError.message.includes('Provider not found') && (
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wallet-install-link"
                >
                  Download MetaMask ↗
                </a>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="wallet-info-wrapper">
          {isWrongNetwork && (
            <div className="network-warning-box">
              <div className="warning-text">
                ⚠️ <strong>Wrong Network!</strong> You are connected to chain <code>{chainId ?? 'Unknown'}</code>.
                Please switch to <strong>{robinhoodTestnet.name}</strong> (Chain ID {robinhoodTestnet.id}).
              </div>
              <button
                type="button"
                className="btn btn-switch"
                onClick={handleSwitchNetwork}
                disabled={isSwitchPending}
              >
                {isSwitchPending ? 'Switching Network...' : `Switch to ${robinhoodTestnet.name}`}
              </button>
              {switchError && (
                <p className="wallet-error">{getFriendlyErrorMessage(switchError)}</p>
              )}
            </div>
          )}

          <div className="wallet-connected-card">
            <div className="wallet-details">
              <span className={`network-badge ${isWrongNetwork ? 'badge-wrong' : 'badge-ok'}`}>
                {isWrongNetwork ? 'Wrong Network' : robinhoodTestnet.name}
              </span>
              <span className="wallet-address" title={address}>
                {formatAddress(address)}
              </span>
              {!isWrongNetwork && (
                <span className="wallet-balance">{formatBalance()}</span>
              )}
            </div>
            <button
              type="button"
              className="btn btn-disconnect"
              onClick={() => disconnect()}
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
