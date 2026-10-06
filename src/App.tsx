import LaunchFee from './components/LaunchFee'
import ConnectWallet from './components/ConnectWallet'
import TokenDiscovery from './components/TokenDiscovery'
import './App.css'

function App() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="Robinhood Launchpad home">
          <span className="brand-mark" aria-hidden="true">R</span>
          <span className="brand-copy">
            <strong>ROBINHOOD</strong>
            <span>LAUNCHPAD</span>
          </span>
        </a>
        <ConnectWallet />
      </header>

      <main className="dashboard">
        <section className="hero-panel">
          <div className="hero-copy">
            <span className="eyebrow"><span className="status-dot" /> ON-CHAIN TOKEN DISCOVERY</span>
            <h1>Discover the next<br /><span>on-chain opportunity.</span></h1>
            <p>Explore tokens launched on Robinhood Chain Testnet, with live curve data and graduation progress.</p>
          </div>
          <div className="hero-orbit" aria-hidden="true">
            <span className="orbit orbit-one" />
            <span className="orbit orbit-two" />
            <span className="orbit-token">R</span>
          </div>
        </section>

        <div className="dashboard-toolbar">
          <div>
            <span className="eyebrow">NETWORK</span>
            <p className="network-name"><span className="status-dot" /> Robinhood Chain Testnet</p>
          </div>
          <LaunchFee />
        </div>

        <TokenDiscovery />
        <footer className="site-footer">
          <span>Robinhood Chain Testnet</span>
          <span>On-chain data · Refresh to discover new launches</span>
        </footer>
      </main>
    </div>
  )
}

export default App