import { Component } from 'react'

// Catches render-time and lazy-chunk-load errors that would otherwise
// unmount the whole tree and leave a blank screen with no signal why.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[NOVEE OS] Runtime error caught by ErrorBoundary:', error, info)
  }

  handleReload = () => {
    // A stale service-worker cache or a code-split chunk that no longer
    // exists after a redeploy are the most common causes of this — a hard
    // reload re-fetches the current index.html and current chunk hashes.
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16,
        background: '#0a0805', color: '#f1e6c8', padding: 24, textAlign: 'center',
        fontFamily: '"Hanken Grotesk", sans-serif',
      }}>
        <h1 style={{ color: '#d4af37', fontSize: 22, margin: 0 }}>NOVEE OS hit a snag</h1>
        <p style={{ maxWidth: 480, color: '#cbb98f', fontSize: 14, lineHeight: 1.6 }}>
          {this.state.error?.message || 'An unexpected error occurred while loading this screen.'}
        </p>
        <button
          onClick={this.handleReload}
          style={{
            border: '1px solid rgba(212,175,55,0.4)', background: 'rgba(212,175,55,0.1)',
            color: '#d4af37', borderRadius: 24, padding: '10px 24px', cursor: 'pointer',
            fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700,
          }}
        >
          Reload
        </button>
      </div>
    )
  }
}
