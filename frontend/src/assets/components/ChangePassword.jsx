import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    let token = null;
    let user = null;
    let role = null;

    if (localStorage.getItem('jobPortalUser')) {
      token = localStorage.getItem('jobPortalToken');
      user = JSON.parse(localStorage.getItem('jobPortalUser'));
      role = 'seeker';
    } else if (localStorage.getItem('employerUser')) {
      token = localStorage.getItem('jobPortalToken');
      user = JSON.parse(localStorage.getItem('employerUser'));
      role = 'employer';
    } else if (sessionStorage.getItem('adminUser')) {
      token = localStorage.getItem('adminToken');
      user = JSON.parse(sessionStorage.getItem('adminUser'));
      role = 'admin';
    }

    if (!token || !role || !user) {
      setError('You are not logged in.');
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/update-password`,
        { oldPassword, newPassword, role, email: user.email },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessage(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-white sm:px-10 lg:px-12 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-950/20 backdrop-blur">
          <h2 className="text-2xl font-bold mb-6 text-center text-white">Change Password</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-slate-300 text-sm font-bold mb-2" htmlFor="oldPassword">
                Old Password
              </label>
              <input
                type="password"
                id="oldPassword"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="input-style w-full"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-slate-300 text-sm font-bold mb-2" htmlFor="newPassword">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-style w-full"
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="w-full rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-white transition hover:bg-cyan-400 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                Change Password
              </button>
            </div>
            {message && <p className="text-emerald-400 text-sm mt-4 text-center">{message}</p>}
            {error && <p className="text-rose-400 text-sm mt-4 text-center">{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
