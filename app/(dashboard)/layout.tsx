import UnifiedSidebar from "@/components/nav-bar comps/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen w-full bg-white dark:bg-zinc-950">
            {/* Unified Navigation - Handles all nav */}
            <UnifiedSidebar />

            {/* Main Content - NO PADDING, pages control their own spacing */}
            <main className="w-full min-h-screen">
                {children}
            </main>
        </div>
    );
}