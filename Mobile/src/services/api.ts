import axios from "axios";

export const api = axios.create({
  baseURL: "https://latch-viewing-crop.ngrok-free.dev/api",
  headers: {
    "Content-type": "application/json",
  },
});
