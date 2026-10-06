import LaunchFee from './components/LaunchFee'
import ConnectWallet from './components/ConnectWallet'

function App() {
  return (
    <main style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'center' }}>
      <header style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <h1>Robinhood Launchpad</h1>
        <ConnectWallet />
      </header>

      <LaunchFee />
    </main>
  )
}

export default App