import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000,
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

    /**
 * Request OTP
 * @param {Object} data - { name, phone, email }
 * @returns {Promise}
 */
export const requestOTP = async (data) => {
    const response = await api.post('/auth/request-otp', data);
    return response.data;
};

/**
 * Verify OTP
 * @param {Object} data - { otpId, otp, phone }
 * @returns {Promise}
 */
export const verifyOTP = async (data) => {
    const response = await api.post('/auth/verify-otp', data);
    return response.data;
};

/**
 * Get current user
 * @returns {Promise}
 */
export const getCurrentUser = async () => {
    const response = await api.get('/auth/me');
    return response.data;
};

export default api;
