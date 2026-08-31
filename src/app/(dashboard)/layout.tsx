import Sidebar from "@/components/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { SocialPosterProvider } from "@/context/SocialPosterContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <SocialPosterProvider>
        <div className="flex min-h-screen">
          <Sidebar />
          {/* Main content offset by sidebar width */}
          <main className="flex-1 ml-56 min-h-screen p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </SocialPosterProvider>
    </ProtectedRoute>
  );
}

