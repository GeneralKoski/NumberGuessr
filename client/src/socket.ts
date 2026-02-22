import { io } from "socket.io-client";

let token = localStorage.getItem("numberguessr_token");
if (!token) {
  token = crypto.randomUUID();
  localStorage.setItem("numberguessr_token", token);
}

const socket = io("/", {
  path: "/socket.io",
  auth: { token },
});

export default socket;
