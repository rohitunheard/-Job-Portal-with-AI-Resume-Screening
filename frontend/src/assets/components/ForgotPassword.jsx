import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: Enter email, 2: Enter OTP and new password
    const [email, setEmail] = useState('');
    const [userType, setUserType] = useState('seeker');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState({ msg: '', ok: true });
    const [loading, setLoading] = useState(false);

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ msg: '', ok: true });
        try {
            await api.post('/password-reset/request', { email, userType });
            setStatus({ msg: 'An OTP has been sent to your email.', ok: true });
            setStep(2);
        } catch (err) {
            setStatus({ msg: 'Error sending OTP. Please try again.', ok: false });
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return setStatus({ msg: 'Passwords do not match.', ok: false });
        }
        setLoading(true);
        setStatus({ msg: '', ok: true });
        try {
            await api.post('/password-reset/verify-and-reset', { email, userType, otp, password });
            setStatus({ msg: 'Password has been reset successfully. You can now log in.', ok: true });
        } catch (err) {
            setStatus({ msg: 'Error resetting password. The OTP may be invalid or expired.', ok: false });
        } finally {
            setLoading(false);
        }
    };

    const inputClass = 'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20';

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6 py-12 text-white">
            <div className="w-full max-w-md">
                <Link to="/login" className="mb-6 flex items-center gap-2 text-sm text-slate-400 hover:text-white transition w-fit">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Login
                </Link>

                <div className="rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl shadow-cyan-950/20 backdrop-blur overflow-hidden p-8">
                    <h2 className="text-3xl font-semibold text-white text-center">Forgot Password</h2>
                    <p className="text-sm text-slate-400 text-center mt-2 mb-6">
                        {step === 1 ? 'Enter your email to receive an OTP.' : 'Enter the OTP and your new password.'}
                    </p>

                    {status.msg && (
                        <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${status.ok ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-rose-500/30 bg-rose-500/10 text-rose-200'}`}>
                            {status.msg}
                        </div>
                    )}

                    {step === 1 && (
                        <form onSubmit={handleRequestOtp} className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-200">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className={inputClass}
                                    placeholder="you@example.com"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-200">I am a...</label>
                                <select value={userType} onChange={(e) => setUserType(e.target.value)} className={inputClass}>
                                    <option value="seeker">Job Seeker</option>
                                    <option value="employer">Employer</option>
                                </select>
                            </div>
                            <button type="submit" disabled={loading} className="w-full rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-white transition hover:bg-cyan-400 disabled:opacity-70 disabled:cursor-not-allowed">
                                {loading ? 'Sending...' : 'Send OTP'}
                            </button>
                        </form>
                    )}

                    {step === 2 && !status.ok && status.msg.includes('success') ? (
                        <Link to="/login" className="w-full block text-center rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-white transition hover:bg-cyan-400">
                            Back to Login
                        </Link>
                    ) : step === 2 && (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-200">OTP</label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                    className={inputClass}
                                    placeholder="6-digit code"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-200">New Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className={inputClass}
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-200">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className={inputClass}
                                    placeholder="••••••••"
                                />
                            </div>
                            <button type="submit" disabled={loading} className="w-full rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-white transition hover:bg-cyan-400 disabled:opacity-70 disabled:cursor-not-allowed">
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
