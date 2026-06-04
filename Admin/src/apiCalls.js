import { userRequest } from "./requestMethods";

export const loginAPI = async (credentials) => {
  try {
    const response = await userRequest.post("/auth/admin/login", credentials);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await userRequest.get("/auth/admin/me");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const logoutAPI = async () => {
  try {
    const response = await userRequest.post("/auth/admin/logout");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserById = async (userId) => {
  try {
    const response = await userRequest.get(`/users/find/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateUserById = async (userId, data) => {
  try {
    const response = await userRequest.put(`/users/${userId}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};
