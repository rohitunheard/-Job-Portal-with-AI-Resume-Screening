import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer id="footer" className="bg-gray-800 text-gray-300">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white text-lg font-semibold">Job Portal</h3>
            <p className="mt-3 text-sm">
              Connecting talent with opportunity. Built with care to help you find the right role faster.
            </p>
          </div>

          <div>
            <h4 className="text-white font-medium mb-2">Quick Links</h4>
            <ul className="space-y-1 text-sm">
              <li><Link to="/" className="hover:text-white transition">Home</Link></li>
              <li><Link to="/jobs" className="hover:text-white transition">Jobs</Link></li>
              <li><Link to="/aboutus" className="hover:text-white transition">About Us</Link></li>
              <li><Link to="/profile" className="hover:text-white transition">My Profile</Link></li>
              <li><Link to="/login" className="hover:text-white transition text-slate-500">Login / Admin</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-medium mb-2">Contact</h4>
            <p className="text-sm">Jobportal@example.com</p>
            <div className="mt-4 flex space-x-3">
              <a href="#" aria-label="Twitter" className="hover:text-white">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20c7.55 0 11.68-6.26 11.68-11.68 0-.18 0-.35-.01-.53A8.36 8.36 0 0022 5.92a8.19 8.19 0 01-2.36.65 4.11 4.11 0 001.8-2.27 8.2 8.2 0 01-2.6.99A4.1 4.1 0 0015.5 4c-2.27 0-4.11 1.84-4.11 4.11 0 .32.04.63.1.93A11.65 11.65 0 013 5.15a4.1 4.1 0 001.27 5.48 4.07 4.07 0 01-1.86-.51v.05c0 1.92 1.36 3.52 3.17 3.88a4.1 4.1 0 01-1.85.07c.52 1.63 2.03 2.82 3.82 2.86A8.23 8.23 0 012 18.58 11.62 11.62 0 008.29 20" />
                </svg>
              </a>
              <a href="#" aria-label="LinkedIn" className="hover:text-white">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M19 3A2 2 0 0121 5v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14zm-9.75 7H7.5v7h1.75v-7zM8.38 7.75a1.02 1.02 0 110-2.04 1.02 1.02 0 010 2.04zM17.5 10.5c-1 0-1.75.56-2.06 1.05v-.9H13.7v7h1.75v-3.9c0-1.02.28-1.78 1.33-1.78 1.02 0 1.02 1.02 1.02 1.86V17.5H19V10.5h-1.5z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-700 pt-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Job Portal. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
