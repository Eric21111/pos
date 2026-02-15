
const PRODUCTION_URL = 'https://pos-system-w61d.onrender.com'; // TODO: Replace with your actual hosted backend URL

const LOCAL_IP = '192.168.56.1';
const PORT = 5000;

const API_BASE_URL = __DEV__
  ? `http://${LOCAL_IP}:${PORT}`
  : PRODUCTION_URL;

export const API_URL = `${API_BASE_URL}/api`;

const TIMEOUT = 30000;

export default {
  BASE_URL: API_BASE_URL,
  API_URL,
  IP: LOCAL_IP,
  PORT,
  TIMEOUT
};