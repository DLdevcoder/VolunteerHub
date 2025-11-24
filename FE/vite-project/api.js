// src/api.js
import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:5000/api", // BE của bạn
  headers: {
    "Content-Type": "application/json",
  },
});
