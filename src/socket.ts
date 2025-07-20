import { io } from "socket.io-client";

const URL =
	process.env.NODE_ENV === "production"
		? undefined
		: "https://tictaptoe-socket.onrender.com/";

export const socket = io(URL);
