import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { socket } from "../../socket";
import OnlinePVPGame from "./OnlinePVPGame";
import RoomItem from "./RoomItem";

// reset game not wokring on other side

interface Message {
	id: number;
	text: string;
	timestamp: string;
}

interface GameState {
	board: null[] | string[];
	currentPlayer: string;
	gameStatus: string;
	winner: null;
	playerX: string;
	playerO: string;
}

interface UpdateGameState {
	gameState: GameState;
	playerX: string;
	playerO: string;
	currentPlayer: string;
	message?: string;
}

interface RoomData {
	id: string;
	name: string;
	creator: string;
	members: string[];
	maxMembers: number;
	isPrivate: boolean;
	createdAt: string;
	gameState: GameState;
}

interface CreateRoomResponse {
	success: boolean;
	roomId: string;
	roomData: RoomData;
	message?: string;
	playerSymbol?: "X" | "O";
}

type joinRoomResponse = CreateRoomResponse;

const OnlinePVP = () => {
	const [isConnected, setIsConnected] = useState(false);
	const [roomName, setRoomName] = useState("");
	const [rooms, setRooms] = useState([]);
	const [currentRoom, setCurrentRoom] = useState<RoomData | null>(null);
	const [playerSymbol, setPlayerSymbol] = useState<"X" | "O" | undefined>(
		undefined,
	);
	const [gameState, setGameState] = useState<GameState | null>(null);
	const [messages, setMessages] = useState<Message[] | []>([]);
	const [isLoading, setIsLoading] = useState(false);

	const addMessage = useCallback((message: string) => {
		setMessages((prev) => [
			...prev,
			{
				id: Date.now(),
				text: message,
				timestamp: new Date().toLocaleTimeString(),
			},
		]);
	}, []);

	useEffect(() => {
		function onConnect() {
			setIsConnected(true);
			toast.success("Connected to server");
		}

		function onDisconnect() {
			setIsConnected(false);
			toast.error("Disconnected from server");
		}

		function onGameStarted(data: UpdateGameState) {
			setGameState(data.gameState);
			toast.success("Game started! Player X goes first.");
		}

		function onPlayerJoined(data: UpdateGameState) {
			console.log("onPlayerJoined data", data);

			addMessage(data?.message ?? "");
			setGameState(data.gameState);
		}

		function onPlayerLeft(data: UpdateGameState) {
			console.log("onPlayerLeft data", data);

			addMessage(data?.message ?? "");
			setGameState(data.gameState);
			setPlayerSymbol("X");
		}

		function onPlayerDisconnected(data: UpdateGameState) {
			addMessage(data?.message ?? "");
			setGameState(data.gameState);
			setPlayerSymbol("X");
		}

		socket.on("connect", onConnect);
		socket.on("disconnect", onDisconnect);
		socket.on("roomList", setRooms);
		socket.on("gameStarted", onGameStarted);
		socket.on("playerJoined", onPlayerJoined);
		socket.on("playerLeft", onPlayerLeft);
		socket.on("playerDisconnected", onPlayerDisconnected);

		if (socket.connected) {
			setIsConnected(true);
		}

		return () => {
			socket.off("connect", onConnect);
			socket.off("disconnect", onDisconnect);
			socket.off("roomList", setRooms);
			socket.off("gameStarted", onGameStarted);
			socket.off("playerJoined", onPlayerJoined);
			socket.off("playerLeft", onPlayerLeft);
			socket.off("playerDisconnected", onPlayerDisconnected);
		};
	}, [addMessage]);

	const handleCreateRoom = () => {
		if (!socket || !isConnected) {
			toast.error("Not connected to server");
			return;
		}

		setIsLoading(true);

		const roomData = {
			name: roomName.trim() || undefined,
			isPrivate: false,
		};

		socket.emit("createRoom", roomData, (response: CreateRoomResponse) => {
			console.log("createRoom response", response);

			setIsLoading(false);

			if (response.success) {
				setCurrentRoom(response?.roomData);
				setPlayerSymbol("X");
				setGameState(response.roomData.gameState);
				addMessage(`Room "${response.roomData.name}" created successfully!`);
				toast.success("Room created! You are Player X");
				setRoomName("");
			} else {
				addMessage(`Failed to create room: ${response?.message}`);
				toast.error(`Failed to create room: ${response?.message}`);
			}
		});
	};

	const handleJoinRoom = (roomId: string) => {
		if (!socket || !isConnected) {
			toast.error("Not connected to server");
			return;
		}

		setIsLoading(true);
		addMessage("Joining room...");

		socket.emit("joinRoom", roomId, (response: joinRoomResponse) => {
			console.log("joinRoom", response);

			setIsLoading(false);

			if (response.success) {
				setCurrentRoom(response?.roomData);
				setPlayerSymbol(response.playerSymbol);
				setGameState(response.roomData.gameState);

				const statusMessage =
					response.roomData.members.length === 1
						? `Joined as Player ${response.playerSymbol}. Waiting for opponent...`
						: `Joined as Player ${response.playerSymbol}. Game ready!`;

				addMessage(statusMessage);
				toast.success(`Joined as Player ${response.playerSymbol}`);
			} else {
				addMessage(`Failed to join: ${response.message}`);
				toast.error(`Failed to join: ${response.message}`);
			}
		});
	};

	const handleLeaveRoom = () => {
		if (!currentRoom || !socket) return;

		socket.emit("leaveRoom", currentRoom.id, (response) => {
			console.log("leaveRoom response", response);

			if (response.success) {
				setCurrentRoom(null);
				setPlayerSymbol(null);
				setGameState(null);
				addMessage("Left the game");
				toast.success("Left the room");
			}
		});
	};

	// Show game room if player is in a room
	if (currentRoom) {
		return (
			<div className="flex items-center justify-center min-h-screen font-press">
				<div className="text-white">
					<div className="bg-gray-800 p-6 rounded-lg mb-4">
						<h2 className="text-2xl mb-4">🏠 {currentRoom.name}</h2>
						<div className="flex gap-4 mb-4">
							<span>
								You are Player:{" "}
								<strong className="text-yellow-400">{playerSymbol}</strong>
							</span>
							<span>
								Room ID: <strong>{currentRoom.id}</strong>
							</span>
							<span>
								Players: <strong>{currentRoom.members.length}/2</strong>
							</span>
						</div>
						{gameState && gameState.gameStatus === "waiting" && (
							<div className="text-yellow-400 mb-4">
								⏳ Waiting for Player O to join...
							</div>
						)}
						{gameState && gameState.gameStatus === "playing" && (
							<div className="text-green-400 mb-4">
								🎮 Game in progress!
								{gameState.currentPlayer === socket.id
									? " Your turn!"
									: " Opponent's turn"}
							</div>
						)}
						<button
							type="button"
							onClick={handleLeaveRoom}
							className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded cursor-pointer"
						>
							🚪 Leave Room
						</button>
						t
					</div>
					<OnlinePVPGame
						roomData={currentRoom}
						playerSymbolProps={playerSymbol}
						initialGameState={gameState}
						onLeaveRoom={handleLeaveRoom}
					/>
					{/* Messages */}
					<div className="bg-gray-900 p-4 rounded-lg max-h-40 overflow-y-auto">
						<h3 className="mb-2">Messages:</h3>
						{messages.map((msg) => (
							<div key={msg.id} className="text-sm mb-1">
								<span className="text-gray-400">{msg.timestamp}</span> -{" "}
								{msg.text}
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}

	// Show lobby
	return (
		<div className="flex items-center justify-center min-h-screen font-press">
			<div className="">
				{/* Connection Status */}
				<div className="mb-4 text-center">
					<span
						className={`px-3 py-1 rounded ${isConnected ? "bg-green-500" : "bg-red-500"} text-white`}
					>
						{isConnected ? "🟢 Connected" : "🔴 Disconnected"}
					</span>
				</div>

				{/* Create Room Section */}
				<div className="mb-4">
					<input
						type="text"
						placeholder="Room name (optional)"
						value={roomName}
						onChange={(e) => setRoomName(e.target.value)}
						className="w-full p-3 rounded border-2 border-gray-300 mb-2 text-white"
						maxLength={30}
					/>
					<button
						type="button"
						onClick={handleCreateRoom}
						disabled={!isConnected || isLoading}
						className={`w-full p-4 font-bold rounded ${
							!isConnected || isLoading
								? "bg-gray-400 cursor-not-allowed"
								: "bg-white hover:bg-gray-100 cursor-pointer"
						}`}
					>
						{isLoading ? "⏳ Creating..." : "🎮 Create Room"}
					</button>
				</div>

				{/* Available Rooms */}
				<div className="border-2 border-white rounded w-full text-white flex flex-col h-[400px] overflow-y-auto">
					<div className="p-4 border-b border-gray-600 bg-gray-800">
						<h2 className="text-lg font-bold">
							Available Games ({rooms.length})
						</h2>
					</div>

					{rooms.length === 0 ? (
						<div className="p-8 text-center text-gray-400">
							<p>No games available.</p>
							<p>Create one to start playing! 🚀</p>
						</div>
					) : (
						rooms.map((room) => (
							<RoomItem
								key={room.id}
								room={room}
								onJoin={handleJoinRoom}
								isLoading={isLoading}
								isConnected={isConnected}
							/>
						))
					)}
				</div>

				{/* Messages */}
				{messages.length > 0 && (
					<div className="mt-4 bg-gray-800 p-4 rounded text-white max-h-32 overflow-y-auto">
						<h3 className="text-sm font-bold mb-2">Recent Messages:</h3>
						{messages.slice(-5).map((msg) => (
							<div key={msg.id} className="text-xs mb-1">
								<span className="text-gray-400">{msg.timestamp}</span> -{" "}
								{msg.text}
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default OnlinePVP;
