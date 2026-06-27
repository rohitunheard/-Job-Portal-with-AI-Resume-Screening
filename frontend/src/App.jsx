import Navbar from './assets/components/home/Navbar'
import Home from './assets/components/Home'
import Login from './assets/components/Login'
import Jobs from './assets/components/Jobs'
import Applynow from './assets/components/Applynow'
import Foundjobs from './assets/components/Foundjobs'
import Aboutus from './assets/components/Aboutus'
import Profile from './assets/components/Profile'
import Footer from './assets/components/home/Footer'
import AdminPanel from './assets/components/AdminPanel'
import AdminLogin from './assets/components/AdminLogin'
import EmployerDashboard from './assets/components/EmployerDashboard'
import EmployerProfile from './assets/components/EmployerProfile'
import EmployerLogin from './assets/components/EmployerLogin'
import ResumeScreener from './assets/components/ResumeScreener'
import Chat from './assets/components/Chat'
import ChangePassword from './assets/components/ChangePassword'
import Chatbot from './assets/components/Chatbot'
import ForgotPassword from './assets/components/ForgotPassword'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'

function Layout() {
  const location = useLocation()
  const hideLayout = location.pathname === '/employer/dashboard'

  return (
    <>
      {!hideLayout && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/panel" element={<AdminPanel />} />
        <Route path="/employer/dashboard" element={<EmployerDashboard />} />
        <Route path="/employer/profile" element={<EmployerProfile />} />
        <Route path="/employer/login" element={<EmployerLogin />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/aboutus" element={<Aboutus />} />
        <Route path="/applynow" element={<Applynow />} />
        <Route path="/resume-screener" element={<ResumeScreener />} />
        <Route path="/foundjobs" element={<Foundjobs />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
      {!hideLayout && <Footer />}
      <Chatbot />
    </>
  )
}

const App = () => {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}

export default App
