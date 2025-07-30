// RoomItem.jsx
const RoomItem = ({ room, onJoin, isLoading, isConnected }) => {
	const isFull = room.memberCount >= 2;
	const isDisabled = !isConnected || isLoading || isFull;

	return (
		<div className="p-4 border-b border-gray-600 flex justify-between items-center hover:bg-gray-800">
			<div className="flex-1">
				<h3 className="font-bold text-lg">{room.name}</h3>
				<div className="text-sm text-gray-400 flex gap-4">
					<span>🆔 {room.id}</span>
					<span>👥 {room.memberCount}/2 players</span>
					<span className={`status ${room.gameStatus}`}>
						{room.gameStatus === "waiting"
							? "⏳ Waiting"
							: room.gameStatus === "playing"
								? "🎮 Playing"
								: "✅ Finished"}
					</span>
				</div>
			</div>

			<button
				onClick={() => onJoin(room.id)}
				disabled={isDisabled}
				className={`px-4 py-2 rounded font-bold ${
					isFull
						? "bg-red-500 text-white cursor-not-allowed"
						: isDisabled
							? "bg-gray-500 text-gray-300 cursor-not-allowed"
							: "bg-green-500 hover:bg-green-600 text-white cursor-pointer"
				}`}
			>
				{isFull ? "🔒 Full" : isLoading ? "⏳ Joining..." : "🚪 Join"}
			</button>
		</div>
	);
};

export default RoomItem;
