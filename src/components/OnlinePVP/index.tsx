import { useCallback, useEffect, useState } from "react";
import { socket } from "../../socket";
import { cn } from "../../utils";

const OnlinePVP = () => {
	const [isConnected, setIsConnected] = useState(false);
	const [value, setValue] = useState(0);

	const [board, setBoard] = useState(Array(9).fill(""));
	const [turn, setTurn] = useState("X");
	const [winner, setWinner] = useState<string | null>(null);
	const [winLine, setWinLine] = useState<number[] | []>([]);

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
		}

		function onDisconnect() {
			setIsConnected(false);
		}

		function onFooEvent(value) {
			setValue(value);
		}

		socket.on("connect", onConnect);

		socket.on("disconnect", onDisconnect);
		socket.on("gameUpdate", onFooEvent);

		return () => {
			socket.off("connect", onConnect);
			socket.off("disconnect", onDisconnect);
			socket.off("gameUpdate", onFooEvent);
			socket.off("gameUpdate", onFooEvent);
		};
	}, []);

	useEffect(() => {
		socket.on("move", ({ i, value }) => {
			console.log("i", i, value);
			const newBoard = [...board];
			newBoard[i] = value;
			setBoard(newBoard);
		});

		return () => {
			socket.off("move");
		};
	}, [board]);

	useEffect(() => {
		socket.on("winnerData", ({ win, winLine }) => {
			setWinner(win);
			setWinLine(winLine);
		});

		return () => {
			socket.off("winnerData");
		};
	}, []);

	useEffect(() => {
		socket.on("reset", ({ board, turn, winner }) => {
			setBoard(board);
			setTurn(turn);
			setWinner(winner);

			console.log("board turn winner", board, turn, winner);
		});

		return () => {
			socket.off("reset");
		};
	}, []);

	useEffect(() => {
		if (winner === "X" || winner === "O") {
			playWinSound();
		}
	}, [winner, playWinSound]);

	useEffect(() => {
		if (winner === "Draw") {
			playDrawSound();
		}
	}, [winner, playDrawSound]);

	const checkWinner = (board: string[]) => {
		const lines = [
			[0, 1, 2],
			[3, 4, 5],
			[6, 7, 8],
			[0, 3, 6],
			[1, 4, 7],
			[2, 5, 8],
			[0, 4, 8],
			[2, 4, 6],
		];
		for (const line of lines) {
			const [a, b, c] = line;
			if (board[a] && board[a] === board[b] && board[a] === board[c]) {
				return { winner: board[a], winLine: line };
			}
		}
		if (!board.includes("")) {
			return { winner: "Draw", winLine: [] };
		}

		return { winner: null, winLine: [] };
	};

	const handleCellClick = (i: number) => {
		if (board[i]) return;

		playTapSound();

		const newBoard = [...board];
		newBoard[i] = turn;
		setBoard(newBoard);
		const { winner: win, winLine } = checkWinner(newBoard);
		setWinner(win);
		setWinLine(winLine);
		socket.emit("winnerData", { win, winLine });
		if (!win) setTurn(turn === "X" ? "O" : "X");
		setTurn(turn === "X" ? "O" : "X");
		socket.emit("move", { i, value: turn });
	};

	const handleReset = () => {
		const defaultBoard = Array(9).fill("");
		setBoard(defaultBoard);
		setTurn("X");
		setWinner(null);

		socket.emit("reset", { board: defaultBoard, turn: "X", winner: null });
	};

	return (
		<div className=" bg-blue-950 h-full w-full flex  items-center justify-center">
			<div>
				<div className="w-[240px] h-[240px] md:w-[500px] md:h-[500px] grid grid-cols-3 grid-rows-3 gap-0 border-2  container mx-auto text-3xl  md:text-6xl ">
					{board.map((x, i) => (
						<button
							type="button"
							key={i}
							onClick={() => handleCellClick(i)}
							disabled={!!x || !!winner}
							className={cn(
								" border-white border-2 aspect-square  flex items-center justify-center font-press text-white",
								{
									"": winLine.includes(i),
									"text-gray-400": winner && !winLine.includes(i),
								},
							)}
						>
							<span
								className={cn({
									"bg-gradient-to-r from-purple-500 via-pink-400 to-orange-400 bg-clip-text text-transparent animate-blink":
										winLine.includes(i),
								})}
							>
								{x}
							</span>
						</button>
					))}
				</div>
				<div className=" text-white text-xl text-center h-20 flex items-center justify-center">
					{winner ? (
						winner === "Draw" ? (
							<span className="font-bold text-yellow-400 font-press ">
								Draw!
							</span>
						) : (
							<span className="font-bold text-green-400 font-press">
								<span className="">{winner}</span> wins!
							</span>
						)
					) : (
						<p className="font-press font-bold">
							Turn: <span className=" ">{turn}</span>
						</p>
					)}
				</div>
				<div className="flex justify-center">
					<button
						type="button"
						className="bg-white text-blue-900 px-4 py-2 rounded font-bold hover:bg-blue-200 font-press"
						onClick={handleReset}
					>
						Reset
					</button>
				</div>
			</div>
		</div>
	);
};

export default OnlinePVP;
