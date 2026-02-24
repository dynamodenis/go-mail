import { Outlet } from "@tanstack/react-router";
import { Suspense, useState } from "react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import Loader from "../global/loader";
import Footer from "./footer";

export function AppLayout() {
	const [isCollapsed, setIsCollapsed] = useState(false);

	return (
		<div className="flex h-screen overflow-hidden">
			<Sidebar
				isCollapsed={isCollapsed}
				onToggle={() => setIsCollapsed(!isCollapsed)}
			/>
			<div className="flex flex-1 flex-col overflow-hidden">
				<TopBar />
				<main className="flex-1 overflow-y-auto p-6">
					<Suspense fallback={<Loader size={300} />}>
						<Outlet />
					</Suspense>
				</main>
				<Footer />

			</div>
		</div>
	);
}
