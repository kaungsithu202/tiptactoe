import { Outlet } from "react-router";

const PatternCraftBg = () => {
	return (
		<div className="min-h-screen w-full bg-[#020617] relative">
			{/* Purple Radial Glow Background */}
			<div
				className="absolute inset-0 z-0"
				style={{
					backgroundImage: `radial-gradient(circle 500px at 50% 100px, rgba(139,92,246,0.4), transparent)`,
				}}
			/>
			<div className="z-50 relative">
				<Outlet />
			</div>
			{/* Your Content/Components */}
		</div>
	);
};

export default PatternCraftBg;
