import axios from 'axios';

const client = axios.create({});

client.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);

export default client;
