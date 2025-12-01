import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Landing from "./pages/Landing"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import JobSeekerProfile from "./pages/profile/JobSeekerProfile"
import CompanyProfile from "./pages/profile/CompanyProfile"
import Dashboard from "./pages/Dashboard"
import Jobs from "./pages/Jobs"
import ProtectedRoute from "./components/ProtectedRoute"

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/signup" element={<Signup />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/profile/seeker" element={<JobSeekerProfile />} />
          <Route path="/profile/company" element={<CompanyProfile />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </Router>
  )
}
