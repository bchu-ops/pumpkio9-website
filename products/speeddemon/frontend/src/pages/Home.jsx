import { useState } from 'react'
import { checkHealth } from '../services/api'
import './Home.css'

function Home() {
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  const handleHealthCheck = async () => {
    setStatus('loading')
    try {
      const result = await checkHealth()
      setMessage(result.message || 'Backend is healthy!')
      setStatus('success')
    } catch (error) {
      setMessage('Backend is not available. Make sure it\'s running on port 8000.')
      setStatus('error')
    }
  }

  return (
    <div className="home">
      <section className="hero">
        <h2>Welcome to SpeedDemon</h2>
        <p className="subtitle">
          Kart racing optimization platform with ML-powered lap time analysis
        </p>
      </section>

      <section className="features">
        <div className="feature-card">
          <h3>Data Pipeline</h3>
          <p>Extract, transform, and load racing telemetry data</p>
        </div>
        <div className="feature-card">
          <h3>Machine Learning</h3>
          <p>Advanced models for lap time prediction and optimization</p>
        </div>
        <div className="feature-card">
          <h3>Analytics</h3>
          <p>Comprehensive reports and insights for performance analysis</p>
        </div>
      </section>

      <section className="api-test">
        <h3>Backend Connection Test</h3>
        <button 
          onClick={handleHealthCheck}
          disabled={status === 'loading'}
          className="test-button"
        >
          {status === 'loading' ? 'Checking...' : 'Check Backend Health'}
        </button>
        {message && (
          <div className={`status-message ${status}`}>
            {message}
          </div>
        )}
      </section>
    </div>
  )
}

export default Home
