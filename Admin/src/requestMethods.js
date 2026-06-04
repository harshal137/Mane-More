import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4001/api/v1";

export const userRequest = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "X-Auth-Scope": "admin",
  },
});

