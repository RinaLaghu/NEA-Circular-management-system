import { Navigate, Route, Routes } from "react-router-dom";
import Login from "@/pages/auth/login";
import InboxPage from "@/pages/mail/InboxPage";
import SentPage from "@/pages/mail/SentPage";
import DraftsPage from "@/pages/drafts/DraftsPage";
import ArchivePage from "@/pages/circular/ArchivePage";
import NewCircularPage from "@/pages/circular/NewCircularPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/inbox" element={<InboxPage />} />
      <Route path="/sent" element={<SentPage />} />
      <Route path="/drafts" element={<DraftsPage />} />
      <Route path="/archive" element={<ArchivePage />} />
      <Route path="/new-circular" element={<NewCircularPage />} />
    </Routes>
  );
}

export default App;