import axios from 'axios'

// In local dev this stays '/api' and Vite's dev-server proxy forwards it to
// Django. In production (Vercel), the frontend and backend are on different
// domains, so VITE_API_BASE_URL must point at the deployed Render API, e.g.
// https://your-api.onrender.com/api
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
})

export default apiClient

export const getProfile = () => apiClient.get('/profile/').then((res) => res.data)

export const getSkills = () => apiClient.get('/profile/skills/').then((res) => res.data)

export const getBlogPosts = (params) => apiClient.get('/blog/posts/', { params }).then((res) => res.data)

export const getBlogPost = (slug) => apiClient.get(`/blog/posts/${slug}/`).then((res) => res.data)

export const getProjects = (params) => apiClient.get('/projects/', { params }).then((res) => res.data)

export const submitQuoteRequest = (payload) => apiClient.post('/quotes/', payload).then((res) => res.data)

export const resumeDownloadUrl = `${API_BASE_URL}/profile/resume/`
