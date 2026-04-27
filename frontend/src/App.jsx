import { Navigate, Route, Routes } from "react-router-dom";
import Login from "@/pages/auth/login";
import InboxPage from "@/pages/mail/InboxPage";
import SentPage from "@/pages/mail/SentPage";
import DraftsPage from "@/pages/drafts/DraftsPage";
import ArchivePage from "@/pages/circular/ArchivePage";
import NewCircularPage from "@/pages/circular/NewCircularPage";
import AllCircularsPage from "@/pages/circular/AllCircularsPage";

import ProtectedRoute from "@/components/layout/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* PUBLIC - no login needed */}
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/inbox" replace />} />
      <Route path="/inbox" element={<InboxPage />} />
      <Route path="/archive" element={<ArchivePage />} />
      <Route path="/all-circulars" element={<AllCircularsPage />} />
    
      {/* PROTECTED - login required */}
      <Route path="/sent" element={<ProtectedRoute><SentPage /></ProtectedRoute>} />
      <Route path="/drafts" element={<ProtectedRoute><DraftsPage /></ProtectedRoute>} />
      <Route path="/new-circular" element={<ProtectedRoute><NewCircularPage /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;