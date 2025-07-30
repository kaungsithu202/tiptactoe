import { io } from "socket.io-client";

const URL =
	process.env.NODE_ENV === "production"
		? "https://tictaptoe-socket.onrender.com/"
		: "http://localhost:3500";

export const socket = io(URL);
