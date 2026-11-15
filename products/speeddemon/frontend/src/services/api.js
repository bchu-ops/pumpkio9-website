const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

/**
 * Check backend health endpoint
 * @returns {Promise<{status: string, message?: string}>}
 */
export async function checkHealth() {
  const response = await fetch(`${API_BASE_URL}/health`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return await response.json()
}

/**
 * Placeholder: Get data pipeline status
 * @returns {Promise<any>}
 */
export async function getPipelineStatus() {
  const response = await fetch(`${API_BASE_URL}/pipeline/status`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return await response.json()
}

/**
 * Placeholder: Get ML model predictions
 * @param {Object} data - Input data for prediction
 * @returns {Promise<any>}
 */
export async function getPredictions(data) {
  const response = await fetch(`${API_BASE_URL}/ml/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return await response.json()
}

/**
 * Placeholder: Get reports
 * @returns {Promise<any>}
 */
export async function getReports() {
  const response = await fetch(`${API_BASE_URL}/reports`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return await response.json()
}
