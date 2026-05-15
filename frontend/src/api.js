import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const resumesApi = {
  getAll:     ()       => api.get('/resumes/'),
  getOne:     (id)     => api.get(`/resumes/${id}`),
  upload:     (fd)     => api.post('/resumes/upload', fd),
  createText: (data)   => api.post('/resumes/text', data),
  delete:     (id)     => api.delete(`/resumes/${id}`),
};

export const jobsApi = {
  parseUrl:   (data)   => api.post('/jobs/parse-url', data),
  createText: (data)   => api.post('/jobs/text', data),
};

export const analyzeApi = {
  run: (data) => api.post('/analyze/', data),
};

export const applicationsApi = {
  getAll:  ()         => api.get('/applications/'),
  getOne:  (id)       => api.get(`/applications/${id}`),
  update:  (id, data) => api.patch(`/applications/${id}`, data),
  delete:  (id)       => api.delete(`/applications/${id}`),
};
