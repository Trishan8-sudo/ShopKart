import axios from 'axios'

export const axiosInstance = axios.create({
  baseURL: 'http://localhost:8067/',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

export default axiosInstance
