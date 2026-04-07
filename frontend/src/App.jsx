import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./component/login";
import CircularDashboard from "./pages/CircularDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<CircularDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;