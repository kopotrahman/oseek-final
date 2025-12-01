import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setToken(localStorage.getItem("token"));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    setToken(null);
    navigate("/");
  };

  if (!mounted) return null;

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
