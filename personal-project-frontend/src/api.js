import axios from 'axios';

const API_URL = 'http://localhost:5000';

export const registerUser = async (username, password) => {
  return axios.post(`${API_URL}/register`, { username, password });
};

export const loginUser = async (username, password) => {
  return axios.post(`${API_URL}/login`, { username, password });
};

export const getTasks = async (token) => {
  return axios.get(`${API_URL}/tasks`, { headers: { Authorization: `Bearer ${token}` } });
};

export const addTask = async (token, task) => {
  return axios.post(`${API_URL}/tasks`, task, { headers: { Authorization: `Bearer ${token}` } });
};

export const updateTask = async (token, taskId, task) => {
  return axios.put(`${API_URL}/tasks/${taskId}`, task, { headers: { Authorization: `Bearer ${token}` } });
};

export const deleteTask = async (token, taskId) => {
  return axios.delete(`${API_URL}/tasks/${taskId}`, { headers: { Authorization: `Bearer ${token}` } });
};


export const setReminderIntervall = async (token, taskId, interval) => {
  return axios.put(`${API_URL}/tasks/${taskId}/reminder`, { reminder_interval: interval }, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};