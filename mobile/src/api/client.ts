import axios from 'axios';

/**
 * API Client for Kryptes Mobile
 * Using the computer's local IP address for communication with the Express backend
 * when running on a mobile simulator or physical device.
 */
const API_BASE_URL = 'http://192.168.0.110:4000'; // Local IP of the machine

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
