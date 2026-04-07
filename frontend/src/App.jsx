import { Navigate, Route, Routes } from "react-router-dom";
import InboxPage from "./pages/InboxPage";
import SentPage from "./pages/SentPage";
import DraftsPage from "./pages/DraftsPage";
import ArchivePage from "./pages/ArchivePage";
import NewCircularPage from "./pages/NewCircularPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/inbox" replace />} />
      <Route path="/inbox" element={<InboxPage />} />
      <Route path="/sent" element={<SentPage />} />
      <Route path="/drafts" element={<DraftsPage />} />
      <Route path="/archive" element={<ArchivePage />} />
      <Route path="/new-circular" element={<NewCircularPage />} />
    </Routes>
  );
}

export default App;