import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5080", // All endpoints will use this base URL
  withCredentials: true, // If your backend requires credentials (cookies)
});

export default api;
