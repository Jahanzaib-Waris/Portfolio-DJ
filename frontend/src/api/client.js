import axios from 'axios'

const apiClient = axios.create({
  baseURL: '/api',
})

export default apiClient

export const getProfile = () => apiClient.get('/profile/').then((res) => res.data)

export const getSkills = () => apiClient.get('/profile/skills/').then((res) => res.data)

export const getBlogPosts = (params) => apiClient.get('/blog/posts/', { params }).then((res) => res.data)

export const getBlogPost = (slug) => apiClient.get(`/blog/posts/${slug}/`).then((res) => res.data)

export const getProjects = (params) => apiClient.get('/projects/', { params }).then((res) => res.data)

export const submitQuoteRequest = (payload) => apiClient.post('/quotes/', payload).then((res) => res.data)

export const resumeDownloadUrl = '/api/profile/resume/'
