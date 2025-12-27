import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RosterProvider } from "@/app/context/RosterContext";

export default async function RosterLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (

    // Wrap the entire layout in our new Providers component
    <RosterProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <TopBar />

          {/* Page Content - Full Height */}
          <main className="flex-1 overflow-hidden">

            {children}

          </main>
        </div>
      </div>
    </RosterProvider>
  );
}