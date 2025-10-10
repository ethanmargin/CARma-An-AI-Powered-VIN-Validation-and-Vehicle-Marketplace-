import axios from 'axios';

// Use production backend URL when deployed, localhost when developing locally
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://carma-an-ai-powered-vin-validation-and.onrender.com/api'
  : 'http://localhost:5000/api';

const API = axios.create({
  baseURL: API_BASE_URL,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;