import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClientProvider, QueryClient } from "@tanstack/react-query"
import Login from "@/components/pages/Login"
import SignUp from "./components/pages/Signup"
import Home from "./components/pages/Home"
import Dashboard from "./components/pages/Dashboard"
import NewGrievance from "./components/pages/NewGrievance"
import GrievancePage from "./components/pages/Grievence"
import GrievanceDetails from "./components/pages/GrievenceDetail"
import ProfilePage from "./components/pages/Profile"
import ForgotPassword from "./components/pages/ForgotPassword"
import ChatbotPage from "./components/pages/Chatbot"
import FeedbackPage  from "./components/pages/Feedback"

function App() {

  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient} >
      <ThemeProvider defaultTheme="dark">
          <Router>
            <Toaster position="bottom-right" />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/grievance/new" element={<NewGrievance />} />
              <Route path="/grievances" element={<GrievancePage />} />
              <Route path="/grievances/:id" element={<GrievanceDetails />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/chatbot" element={<ChatbotPage />} />
              <Route path="/feedback" element={<FeedbackPage />} />
            </Routes>
          </Router>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
