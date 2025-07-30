import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { socket } from "../../../socket";
import { cn } from "../../../utils";

const OnlinePVPGame = ({
	roomData,
	playerSymbolProps,
	initialGameState,
	onLeaveRoom,
}) => {
	const [currentRoom, setCurrentRoom] = useState(roomData);
	const [playerSymbol, setPlayerSymbol] = useState<"X" | "O" | null>(
		playerSymbolProps,
	);
	const [gameState, setGameState] = useState(initialGameState);
	const [board, setBoard] = useState(
		Array(9).fill(initialGameState?.board || Array(9).fill(null)),
	);
	const [currentPlayer, setCurrentPlayer] = useState<string | null>(null);
	const [winner, setWinner] = useState<string | null>(null);
	const [winLine, setWinLine] = useState<number[]>([]);
	const [isMyTurn, setIsMyTurn] = useState(false);
	const [opponentId, setOpponentId] = useState<string | null>(null);

	const [isConnected, setIsConnected] = useState(socket.connected); // Initialize connection status
	const [messages, setMessages] = useState([]); // Messages should be managed here or passed down

	console.log("roomData", roomData);

	useEffect(() => {
		setCurrentRoom(roomData);
		setPlayerSymbol(playerSymbolProps);
		setGameState(initialGameState);
		setBoard(initialGameState?.board || Array(9).fill(null));

		// Determine opponent and initial turn
		if (initialGameState) {
			const opponent =
				initialGameState.playerX === socket.id
					? initialGameState.playerO
					: initialGameState.playerX;
			setOpponentId(opponent);
			setIsMyTurn(initialGameState.currentPlayer === socket.id);
			setWinner(initialGameState.winner);
			setWinLine(initialGameState.winLine || []);
		}
	}, [roomData, playerSymbolProps, initialGameState]);

	const playWinSound = useCallback(() => {
		const win = new Audio("/win.wav");
		win.play();
	}, []);

	const playDrawSound = useCallback(() => {
		const draw = new Audio("/draw.mp3");
		draw.play();
	}, []);

	const playTapSound = () => {
		const tap = new Audio("/tap.mp3");
		tap.play();
	};

	useEffect(() => {
		function onConnect() {
			setIsConnected(true);
			toast.success("Connected to server");
		}

		function onDisconnect() {
			setIsConnected(false);
			toast.error("Disconnected from server");
		}

		// Game started event - when both players join
		function onGameStarted(data) {
			console.log("Game started:", data);
			setGameState(data.gameState);
			setBoard(data.gameState.board);
			setCurrentPlayer(data.gameState.currentPlayer);
			setIsMyTurn(data.gameState.currentPlayer === socket.id);

			// Determine opponent
			const opponent =
				data.gameState.playerX === socket.id
					? data.gameState.playerO
					: data.gameState.playerX;
			setOpponentId(opponent);

			toast.success(
				"Game started! " +
					(data.gameState.currentPlayer === socket.id
						? "Your turn!"
						: "Opponent's turn"),
			);
		}

		// Game move made by opponent
		function onGameMove(data) {
			console.log("Game move:", data);
			setBoard(data.gameState.board);
			setCurrentPlayer(data.gameState.currentPlayer);
			setIsMyTurn(data.gameState.currentPlayer === socket.id);

			if (data.gameState.gameStatus === "finished") {
				handleGameEnd(data.gameState);
			}
		}

		// Player joined the room
		function onPlayerJoined(data) {
			toast.success(data.message);
			setOpponentId(data.opponentId);
		}

		// Player left the room
		function onPlayerLeft(data) {
			toast.error(data.message);
			setOpponentId(null);
			// Reset game state when opponent leaves
			resetGameState();
		}

		// Player disconnected
		function onPlayerDisconnected(data) {
			toast.error(data.message);
			setOpponentId(null);
			resetGameState();
		}

		// Set up socket listeners
		socket.on("connect", onConnect);
		socket.on("disconnect", onDisconnect);
		socket.on("gameStarted", onGameStarted);
		socket.on("gameMove", onGameMove);
		socket.on("playerJoined", onPlayerJoined);
		socket.on("playerLeft", onPlayerLeft);
		socket.on("playerDisconnected", onPlayerDisconnected);

		// Check if already connected
		if (socket.connected) {
			setIsConnected(true);
		}

		return () => {
			socket.off("connect", onConnect);
			socket.off("disconnect", onDisconnect);
			socket.off("gameStarted", onGameStarted);
			socket.off("gameMove", onGameMove);
			socket.off("playerJoined", onPlayerJoined);
			socket.off("playerLeft", onPlayerLeft);
			socket.off("playerDisconnected", onPlayerDisconnected);
		};
	}, []);

	const resetGameState = () => {
		setBoard(Array(9).fill(null));
		setCurrentPlayer(null);
		setWinner(null);
		setWinLine([]);
		setIsMyTurn(false);
		setGameState(null);
	};

	const handleGameEnd = (gameState) => {
		setWinner(gameState.winner);
		if (gameState.winner === "draw") {
			setWinLine([]);
			playDrawSound();
			toast.success("It's a draw!");
		} else {
			// Find winning line (you'll need to implement this based on your server logic)
			const winningLine = findWinningLine(gameState.board, gameState.winner);
			setWinLine(winningLine);
			playWinSound();

			if (gameState.winner === socket.id) {
				toast.success("You won! 🎉");
			} else {
				toast.error("You lost! 😢");
			}
		}
	};

	const findWinningLine = (board, winner) => {
		const lines = [
			[0, 1, 2],
			[3, 4, 5],
			[6, 7, 8], // rows
			[0, 3, 6],
			[1, 4, 7],
			[2, 5, 8], // columns
			[0, 4, 8],
			[2, 4, 6], // diagonals
		];

		for (const line of lines) {
			const [a, b, c] = line;
			if (board[a] && board[a] === board[b] && board[a] === board[c]) {
				// Convert winner socket.id to symbol
				const winnerSymbol = gameState?.playerX === winner ? "X" : "O";
				if (board[a] === winnerSymbol) {
					return line;
				}
			}
		}
		return [];
	};

	const handleCellClick = (index: number) => {
		// Prevent moves if game conditions aren't met
		if (!isMyTurn || !currentRoom || board[index] || winner || !isConnected) {
			return;
		}

		playTapSound();

		// Emit move to server
		socket.emit(
			"makeMove",
			{
				roomId: currentRoom.id,
				position: index,
				playerSymbol: playerSymbol,
			},
			(response) => {
				if (!response.success) {
					toast.error(response.message || "Invalid move");
				}
			},
		);
	};

	const handleReset = () => {
		if (!currentRoom || !isConnected) {
			toast.error("Cannot reset game");
			return;
		}

		socket.emit("resetGame", currentRoom.id, (response) => {
			if (response.success) {
				resetGameState();
				toast.success("Game reset!");
			} else {
				toast.error(response.message || "Failed to reset game");
			}
		});
	};

	const leaveRoom = () => {
		if (currentRoom) {
			socket.emit("leaveRoom", currentRoom.id);
			// Navigate back to lobby (implement based on your routing)
			// navigate('/online-pvp');
		}
	};

	// Helper function to get current turn display
	const getCurrentTurnDisplay = () => {
		if (winner) {
			if (winner === "draw") {
				return "Draw!";
			}
			const winnerSymbol =
				gameState?.playerX === winner
					? "X"
					: gameState?.playerO === winner
						? "O"
						: winner;
			const isWinner = winner === socket.id;
			return `${winnerSymbol} wins! ${isWinner ? "You won! 🎉" : "You lost 😢"}`;
		}

		if (!opponentId) {
			return "Waiting for opponent...";
		}

		return isMyTurn ? `Your turn (${playerSymbol})` : `Opponent's turn`;
	};

	console.log("board", board);
	// Show loading/waiting state if no room
	if (!currentRoom) {
		return (
			<div className="min-h-screen w-full flex items-center justify-center">
				<div className="text-white text-center">
					<h2 className="text-2xl font-press mb-4">🎮 Online Tic-Tac-Toe</h2>
					<p>Loading game...</p>
					<button
						onClick={() => window.history.back()}
						className="mt-4 bg-white text-black px-4 py-2 rounded font-press"
					>
						Back to Lobby
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen w-full flex items-center justify-center">
			<div>
				{/* Game Info */}
				<div className="text-white text-center mb-6">
					<h2 className="text-xl font-press mb-2">🏠 {currentRoom.name}</h2>
					<div className="flex justify-center gap-4 text-sm">
						<span>
							You: <strong className="text-yellow-400">{playerSymbol}</strong>
						</span>
						<span>
							Room: <strong>{currentRoom.id}</strong>
						</span>
						<span className={isConnected ? "text-green-400" : "text-red-400"}>
							{isConnected ? "🟢 Connected" : "🔴 Disconnected"}
						</span>
					</div>
				</div>

				{/* Game Board */}
				<div className="w-[240px] h-[240px] md:w-[500px] md:h-[500px] grid grid-cols-3 grid-rows-3 gap-0 border-2 container mx-auto text-3xl md:text-6xl">
					{board.map((cell, i) => (
						<button
							type="button"
							key={i}
							onClick={() => handleCellClick(i)}
							disabled={!isMyTurn || !!cell || !!winner || !opponentId}
							className={cn(
								"border-white border-2 aspect-square flex items-center justify-center font-press text-white transition-all hover:bg-gray-800",
								{
									"cursor-not-allowed opacity-50":
										!isMyTurn || !!cell || !!winner || !opponentId,
									"cursor-pointer": isMyTurn && !cell && !winner && opponentId,
									"text-gray-400": winner && !winLine.includes(i),
								},
							)}
						>
							<span
								className={cn({
									"bg-gradient-to-r from-purple-500 via-pink-400 to-orange-400 bg-clip-text  animate-pulse text-white":
										winLine.includes(i),
								})}
							>
								{cell}
							</span>
						</button>
					))}
				</div>

				{/* Game Status */}
				<div className="text-white text-xl text-center h-20 flex items-center justify-center">
					<p className="font-press font-bold">{getCurrentTurnDisplay()}</p>
				</div>

				{/* Control Buttons */}
				<div className="flex justify-center gap-4">
					<button
						type="button"
						className="bg-white text-blue-900 px-4 py-2 rounded font-bold hover:bg-blue-200 font-press disabled:opacity-50"
						onClick={handleReset}
						disabled={!isConnected || !currentRoom}
					>
						Reset Game
					</button>
					<button
						type="button"
						className="bg-red-500 text-white px-4 py-2 rounded font-bold hover:bg-red-600 font-press"
						onClick={leaveRoom}
					>
						Leave Room
					</button>
				</div>
			</div>
		</div>
	);
};

// Helper function to get current room data
// Implement this based on how you pass room data to this component
const getCurrentRoomData = () => {
	// This could come from:
	// 1. URL parameters
	// 2. Context/Redux state
	// 3. Props passed from parent component
	// 4. Local storage

	// Example implementation:
	// const params = useParams();
	// return {
	//     room: { id: params.roomId, name: params.roomName },
	//     playerSymbol: params.playerSymbol
	// };

	return null; // Implement based on your routing setup
};

export default OnlinePVPGame;
