import { Link } from "react-router";

function App() {
	return (
		<div className="w-full h-screen font-press z-50">
			<div className="flex items-center h-full justify-center">
				<div>
					<Link
						to="/local"
						className="bg-white font-bold block w-[500px] p-8 cursor-pointer  rounded"
					>
						Player Vs Player (Local)
					</Link>
					<Link
						to="/online"
						className="bg-white font-bold block w-[500px] mt-6 p-8 cursor-pointer  rounded"
					>
						Player Vs Player (Online)
					</Link>
				</div>
			</div>
		</div>
	);
}

export default App;
