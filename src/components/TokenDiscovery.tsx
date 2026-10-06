import { useState } from 'react'
import { usePublicClient } from 'wagmi'

import { robinhoodTestnet } from '../config/chain'
import { discoverTokens } from '../services/tokenDiscovery.service'
import {
  formatEth,
  formatGraduationProgress,
  formatPrice,
  getGraduationProgressBps,
  loadTokenData,
} from '../services/tokenData.service'
import type { TokenDetails } from '../models/token.model'

const DATA_FIELD_LABELS = {
  name: 'Name',
  symbol: 'Symbol',
  logo: 'Logo',
  reserves: 'Curve reserves',
  realQuoteReserve: 'ETH collected',
  graduationTarget: 'Graduation target',
  phase: 'Phase',
  graduationProgress: 'Graduation progress',
} as const

function getPhaseLabel(phase: bigint | undefined): string {
  switch (phase) {
    case 0n:
      return 'Trading'
    case 1n:
      return 'Bought Out / Awaiting Pool'
    case 2n:
      return 'Graduated'
    case 3n:
      return 'Cancelled'
    default:
      return 'Unknown'
  }
}

function getGraduationProgressLabel(token: TokenDetails): string {
  if (token.realQuoteReserve === undefined || token.graduationTarget === undefined) {
    return 'Unavailable'
  }

  const basisPoints = getGraduationProgressBps(
    token.realQuoteReserve,
    token.graduationTarget,
  )
  return basisPoints === undefined
    ? 'Unavailable (zero target)'
    : formatGraduationProgress(basisPoints)
}

function getDataFieldLabel(field: string): string {
  return Object.entries(DATA_FIELD_LABELS).find(([key]) => key === field)?.[1] ?? field
}

export default function TokenDiscovery() {
  const publicClient = usePublicClient({
    chainId: robinhoodTestnet.id,
  })

  const [tokens, setTokens] = useState<TokenDetails[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dataError, setDataError] = useState<string | null>(null)

  async function handleDiscoverTokens() {
    try {
      setLoading(true)
      setError(null)
      setDataError(null)

      if (!publicClient) {
        throw new Error('No public client is configured for Robinhood Chain Testnet.')
      }

      const discoveredTokens = await discoverTokens(publicClient)
      setTokens(discoveredTokens)

      if (discoveredTokens.length > 0) {
        setLoadingData(true)
        try {
          const detailedTokens = await loadTokenData(publicClient, discoveredTokens)
          setTokens(detailedTokens)
        } catch (err) {
          console.error('Failed to load data for discovered tokens:', err)
          setDataError(
            err instanceof Error
              ? err.message
              : `Failed to load token data: ${String(err)}`,
          )
        } finally {
          setLoadingData(false)
        }
      }
    } catch (err) {
      console.error(err)
      setError(
        err instanceof Error
          ? err.message
          : `Failed to load token list: ${String(err)}`,
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="token-discovery">
      <div className="section-heading">
        <div>
          <span className="eyebrow">LAUNCH FACTORY FEED</span>
          <h2>Recently launched</h2>
          <p className="section-description">Tokens and live bonding curve metrics, read directly from the chain.</p>
        </div>
        <button
          className="discover-button"
          onClick={handleDiscoverTokens}
          disabled={loading || loadingData}
        >
          <span aria-hidden="true">{loading || loadingData ? '◌' : '↻'}</span>
          {loading
            ? 'Discovering...'
            : loadingData
              ? 'Loading data...'
              : 'Discover tokens'}
        </button>
      </div>

      {error && (
        <p className="notice notice-error" role="alert">{error}</p>
      )}

      {loadingData && (
        <p className="notice notice-loading" role="status">Loading token details from the chain...</p>
      )}

      {dataError && (
        <p className="notice notice-error" role="alert">{dataError} Discovered tokens are still listed below.</p>
      )}

      {!loading && !error && tokens.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon" aria-hidden="true">◇</span>
          <h3>No launches loaded yet</h3>
          <p>Discover tokens to load launch events and their latest curve data.</p>
        </div>
      )}

      {tokens.length > 0 && (
        <>
          <div className="results-bar">
            <p><strong>{tokens.length}</strong> {tokens.length === 1 ? 'token found' : 'tokens found'}</p>
            <span className="live-indicator"><span className="status-dot" /> LIVE CHAIN DATA</span>
          </div>

          <div className="token-grid">
            {tokens.map((token) => (
              <article className="token-card" key={`${token.token}-${token.transactionHash}`}>
                <div className="token-card-heading">
                  {token.logo ? (
                    <img
                      className="token-logo"
                      src={token.logo}
                      alt={`${token.name ?? 'Token'} logo`}
                    />
                  ) : (
                    <span className="token-logo token-logo-placeholder" aria-hidden="true">
                      {token.symbol?.slice(0, 1) ?? '◇'}
                    </span>
                  )}
                  <div className="token-title">
                    <h3>{token.name ?? 'Token data unavailable'}</h3>
                    <span>{token.symbol ?? '—'}</span>
                  </div>
                  <span className={`phase-badge phase-${token.phase?.toString() ?? 'unknown'}`}>
                    {getPhaseLabel(token.phase)}
                  </span>
                </div>

                <div className="price-panel">
                  <span className="metric-label">CURRENT PRICE</span>
                  <strong>
                    {token.quoteReserve !== undefined && token.tokenReserve !== undefined
                      ? formatPrice(token.quoteReserve, token.tokenReserve)
                      : 'Unavailable'}
                  </strong>
                </div>

                <div className="progress-section">
                  <div className="progress-label">
                    <span>Graduation progress</span>
                    <strong>{getGraduationProgressLabel(token)}</strong>
                  </div>
                  <div
                    className="progress-track"
                    role="progressbar"
                    aria-label={`${token.name ?? token.symbol ?? 'Token'} graduation progress`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={token.realQuoteReserve !== undefined && token.graduationTarget !== undefined
                      ? Number(getGraduationProgressBps(token.realQuoteReserve, token.graduationTarget) ?? 0n) / 100
                      : 0}
                  >
                    <span
                      className="progress-fill"
                      style={{
                        width: `${token.realQuoteReserve !== undefined && token.graduationTarget !== undefined
                          ? formatGraduationProgress(
                              getGraduationProgressBps(token.realQuoteReserve, token.graduationTarget) ?? 0n,
                            ).replace('%', '')
                          : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="metrics-grid">
                  <div className="metric-item">
                    <span className="metric-label">ETH COLLECTED</span>
                    <strong>{token.realQuoteReserve !== undefined ? formatEth(token.realQuoteReserve) : 'Unavailable'}</strong>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">GRADUATION TARGET</span>
                    <strong>{token.graduationTarget !== undefined ? formatEth(token.graduationTarget) : 'Unavailable'}</strong>
                  </div>
                </div>

                <details className="token-addresses">
                  <summary>Contract details</summary>
                  <dl>
                    <dt>Token</dt>
                    <dd title={token.token}>{token.token}</dd>
                    <dt>Curve</dt>
                    <dd title={token.curve}>{token.curve}</dd>
                    <dt>Deployer</dt>
                    <dd title={token.deployer}>{token.deployer}</dd>
                    <dt>Pair</dt>
                    <dd>{token.pairToken === '0x0000000000000000000000000000000000000000'
                      ? 'ETH'
                      : token.pairToken}</dd>
                    <dt>Launched at</dt>
                    <dd>{token.blockNumber.toString()}</dd>
                  </dl>
                </details>

                {token.dataErrors && Object.entries(token.dataErrors).length > 0 && (
                  <div className="token-data-errors" role="status">
                    {Object.entries(token.dataErrors).map(([field, message]) => (
                      <p key={field}>
                        {getDataFieldLabel(field)}: {message}
                      </p>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  )
}