import Navbar from './assets/components/Navbar'
import Home from './assets/components/Home'
import Login from './assets/components/Login'
import Jobs from './assets/components/Jobs'
import Applynow from './assets/components/Applynow'
import Foundjobs from './assets/components/Foundjobs'
import Aboutus from './assets/components/Aboutus'
import Profile from './assets/components/Profile'
import Footer from './assets/components/Footer'
import AdminPanel from './assets/components/AdminPanel'
import EmployerDashboard from './assets/components/EmployerDashboard'
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
        <Route path="/admin" element={<Login />} />
        <Route path="/employer/login" element={<Login />} />
        <Route path="/admin/panel" element={<AdminPanel />} />
        <Route path="/employer/dashboard" element={<EmployerDashboard />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/aboutus" element={<Aboutus />} />
        <Route path="/applynow" element={<Applynow />} />
        <Route path="/foundjobs" element={<Foundjobs />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
      {!hideLayout && <Footer />}
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
