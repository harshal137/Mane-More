import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4001/api/v1";
const BASE_URL1 = import.meta.env.VITE_PAYMENT_URL || "http://localhost:9100/api";

export const userRequest = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

export const paymentRequest = axios.create({
  baseURL: BASE_URL1,
  withCredentials: true,
});

export const stripeRequest = axios.create({
  baseURL: `${BASE_URL}/stripe`,
  withCredentials: true,
});

