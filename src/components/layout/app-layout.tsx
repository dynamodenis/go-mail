import { Outlet } from "@tanstack/react-router";
import { Suspense } from "react";
import Loader from "../global/loader";
import Footer from "./footer";
import { SecondaryNav } from "./secondary-nav";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

export function AppLayout() {
	return (
		<div className="flex h-screen overflow-hidden">
			<Sidebar />
			<SecondaryNav />
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
