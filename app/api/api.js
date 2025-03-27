import axios from "axios";

const apiUrl = "/choreo-apis/awbo/backend/rest-api-be2/v1.0";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_API_PORT || "http://localhost:8000/",
});

// Request interceptor to include the access token
api.interceptors.request.use(
  (config) => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;
    // Directly accessing the access token
    console.log("Adding Authorization Header:", token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh when 401 is encountered
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 (Unauthorized) and it's not already trying to refresh the token
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken =
          typeof window !== "undefined"
            ? localStorage.getItem("refreshToken")
            : null; // Directly accessing the refresh token
        if (!refreshToken) {
          return Promise.reject(error);
        }

        // Attempt to refresh the token
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_API_PORT}/api/token/refresh/`,
          {
            refresh: refreshToken,
          }
        );

        const { access } = response.data; // Assuming the new access token is returned here

        // Save the new access token to localStorage
        localStorage.setItem("accessToken", access);

        // Update the original request with the new token and retry it
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // If refreshing the token fails, reject the request
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
