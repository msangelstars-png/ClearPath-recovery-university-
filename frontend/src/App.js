import "@/App.css";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/Dashboard";
import Schools from "@/pages/Schools";
import Programs from "@/pages/Programs";
import ProgramDetail from "@/pages/ProgramDetail";
import Pathways from "@/pages/Pathways";
import CourseDetail from "@/pages/CourseDetail";
import LiveClasses from "@/pages/LiveClasses";
import Classroom from "@/pages/Classroom";
import Events from "@/pages/Events";
import Replays from "@/pages/Replays";
import AIProfessors from "@/pages/AIProfessors";
import VoiceStudio from "@/pages/VoiceStudio";
import Journal from "@/pages/Journal";
import Plans from "@/pages/Plans";
import Roadmap from "@/pages/Roadmap";
import Support from "@/pages/Support";
import Tickets from "@/pages/Tickets";
import ContactCenter from "@/pages/ContactCenter";
import Documents from "@/pages/Documents";
import Certificates from "@/pages/Certificates";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import Preview from "@/pages/Preview";
import Admin from "@/pages/Admin";
import AdminSupport from "@/pages/AdminSupport";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/preview" element={<Preview />} />
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/schools" element={<Schools />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/programs/:programId" element={<ProgramDetail />} />
          <Route path="/pathways" element={<ProtectedRoute><Pathways /></ProtectedRoute>} />
          <Route path="/courses/:courseId" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
          <Route path="/classes" element={<ProtectedRoute><LiveClasses /></ProtectedRoute>} />
          <Route path="/classes/:classId" element={<ProtectedRoute><Classroom /></ProtectedRoute>} />
          <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
          <Route path="/replays" element={<ProtectedRoute><Replays /></ProtectedRoute>} />
          <Route path="/ai-professors" element={<AIProfessors />} />
          <Route path="/voice-studio" element={<ProtectedRoute><VoiceStudio /></ProtectedRoute>} />
          <Route path="/journal" element={<ProtectedRoute><Journal /></ProtectedRoute>} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/roadmap" element={<ProtectedRoute><Roadmap /></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
          <Route path="/tickets" element={<ProtectedRoute><Tickets /></ProtectedRoute>} />
          <Route path="/contact-center" element={<ProtectedRoute><ContactCenter /></ProtectedRoute>} />
          <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
          <Route path="/certificates" element={<ProtectedRoute><Certificates /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
          <Route path="/admin/support" element={<ProtectedRoute adminOnly><AdminSupport /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
