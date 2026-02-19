import { Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

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
					<Outlet />
				</main>
			</div>
		</div>
	);
}
