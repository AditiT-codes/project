import axios from 'axios';

const API_URL = 'http://localhost:5000';

// Helper function to get authorization config
const getConfig = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});

// Registers a new user
export const registerUser = async (username, password) => {
  return axios.post(`${API_URL}/register`, { username, password });
};

// Logs in a user
export const loginUser = async (username, password) => {
  return axios.post(`${API_URL}/login`, { username, password });
};

// Gets all tasks for the logged-in user
export const getTasks = async (token) => {
  return axios.get(`${API_URL}/tasks`, getConfig(token));
};

// Adds a new task
export const addTask = async (token, task) => {
  return axios.post(`${API_URL}/tasks`, task, getConfig(token));
};

// Updates a task
export const updateTask = async (token, taskId, task) => {
  return axios.put(`${API_URL}/tasks/${taskId}`, task, getConfig(token));
};

// Deletes a task
export const deleteTask = async (token, taskId) => {
  return axios.delete(`${API_URL}/tasks/${taskId}`, getConfig(token));
};

// Sets a reminder interval for a task
export const setReminderInterval = async (token, taskId, interval) => {
  return axios.put(`${API_URL}/tasks/${taskId}/reminder`, { reminder_interval: interval }, getConfig(token));
};
