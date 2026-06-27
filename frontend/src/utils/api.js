import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

export default api;

export const getJobs = async () => {
  const response = await api.get('/jobpostings');
  return response.data;
};

export const getRecommendedJobs = async () => {
  // For now, recommended jobs are the same as all jobs
  const response = await api.get('/jobpostings');
  return response.data;
};

export const searchJobs = async (searchCriteria) => {
  const response = await api.post('/jobpostings/search', searchCriteria);
  return response.data;
};
