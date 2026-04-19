import axios from 'axios'

const baseURL = (import.meta as { env: Record<string, string> }).env.VITE_API_URL || '/api'

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bytestream_token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('bytestream_token')
      localStorage.removeItem('bytestream_user')
      window.location.href = '/auth'
    }
    return Promise.reject(error)
  }
)

export default api
