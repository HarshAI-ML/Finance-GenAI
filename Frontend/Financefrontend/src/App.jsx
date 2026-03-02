import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import PortfolioDetail from "./pages/PortfolioDetail";
import Navbar from "./components/Navbar";
import StockDetail from "./pages/StockDetail";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portfolio/:id"
          element={
            <ProtectedRoute>
              <PortfolioDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stock/:id"
          element={
            <ProtectedRoute>
              <StockDetail />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
