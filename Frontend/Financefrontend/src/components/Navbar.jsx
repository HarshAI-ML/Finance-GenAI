import { Link } from "react-router-dom";

function Navbar() {
  return (
    <div className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="logo">
          📈 Stock Portfolio
        </Link>
      </div>
    </div>
  );
}

export default Navbar;