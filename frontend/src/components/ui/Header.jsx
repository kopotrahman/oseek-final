import { LogOut, Briefcase } from "lucide-react";
import { useSyncExternalStore, useCallback } from "react";
import { useNavigate } from "react-router-dom";

function subscribeToStorage(callback) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getTokenSnapshot() {
  return localStorage.getItem("token");
}

function getServerSnapshot() {
  return null;
}

export default function Header() {
  const navigate = useNavigate();
  const token = useSyncExternalStore(
    subscribeToStorage,
    getTokenSnapshot,
    getServerSnapshot
  );

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("storage"));
    navigate("/");
  }, [navigate]);

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center">
        <div
          onClick={() => navigate("/")}
          className="text-2xl font-bold cursor-pointer gradient-text"
        >
          OSEEK
        </div>

        <nav className="flex items-center gap-8">
          <button
            onClick={() => navigate("/jobs")}
            className="flex items-center gap-2 text-text-secondary hover:text-text transition"
          >
            <Briefcase className="w-4 h-4" />
            Jobs
          </button>
          {token ? (
            <>
              <button
                onClick={() => navigate("/dashboard")}
                className="text-text-secondary hover:text-text transition"
              >
                Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-surface transition"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate("/auth/login")}
                className="text-text-secondary hover:text-text transition"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate("/auth/signup")}
                className="px-4 py-2 bg-primary text-background rounded-lg font-semibold hover:bg-primary-dark transition"
              >
                Sign Up
              </button>
              
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
