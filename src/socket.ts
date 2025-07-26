import { io } from "socket.io-client";

// const URL =
// 	process.env.NODE_ENV === "production"
// 		? undefined
// 		: "https://tictaptoe-socket.onrender.com/";
const URL =
	process.env.NODE_ENV === "production"
		? "https://tictaptoe-socket.onrender.com/"
		: "http://localhost:3000";

export const socket = io(URL);
