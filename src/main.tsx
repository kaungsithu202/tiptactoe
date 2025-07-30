import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import "./index.css";
import { Toaster } from "react-hot-toast";
import App from "./App.tsx";
import PatternCraftBg from "./components/common/PatternCraftBg.tsx";
import LocalPVP from "./components/LocalPVP/index.tsx";
import OnlinePVP from "./components/OnlinePVP/index.tsx";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<BrowserRouter>
			<Toaster />
			<Routes>
				<Route element={<PatternCraftBg />}>
					<Route path="/" element={<App />} />
					<Route path="online" element={<OnlinePVP />} />
					<Route path="local" element={<LocalPVP />} />
				</Route>
			</Routes>
		</BrowserRouter>
	</StrictMode>,
);
