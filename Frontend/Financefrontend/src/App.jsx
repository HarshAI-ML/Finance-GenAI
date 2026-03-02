import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import PortfolioDetail from "./pages/PortfolioDetail";
import Navbar from "./components/Navbar";
import StockDetail from "./pages/StockDetail";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/portfolio/:id" element={<PortfolioDetail />} />
        <Route path="/stock/:id" element={<StockDetail />} />
      </Routes>
    </Router>
  );
}

export default App;