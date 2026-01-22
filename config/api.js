
const YOUR_COMPUTER_IP = '172.18.55.168';
const PORT = 5000;


const TIMEOUT = 30000;

const API_BASE_URL = `http://${YOUR_COMPUTER_IP}:${PORT}`;

export const API_URL = `${API_BASE_URL}/api`;

export default {
  BASE_URL: API_BASE_URL,
  API_URL,
  IP: YOUR_COMPUTER_IP,
  PORT,
  TIMEOUT
};