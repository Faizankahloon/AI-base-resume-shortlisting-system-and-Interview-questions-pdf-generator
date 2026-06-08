import '../styles/ResetPassword.css'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

function ResetPassword() {
    const navigate = useNavigate();

    // step 1 = enter email, step 2 = enter OTP, step 3 = new password
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Step 1 — Send OTP to email
    const handleSendOtp = async () => {
        if (!email || !email.includes('@')) {
            setError('Please enter a valid email address.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const response = await fetch('http://localhost:5000/api/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await response.json();
            if (response.ok) {
                setStep(2);
            } else {
                setError(data.error || 'Email not found.');
            }
        } catch (err) {
            setError('Server error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Step 2 — Verify OTP
    const handleVerifyOtp = async () => {
        if (!otp || otp.length < 4) {
            setError('Please enter the OTP sent to your email.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const response = await fetch('http://localhost:5000/api/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
            });
            const data = await response.json();
            if (response.ok) {
                setStep(3);
            } else {
                setError(data.error || 'Invalid or expired OTP.');
            }
        } catch (err) {
            setError('Server error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Step 3 — Set new password
    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const response = await fetch('http://localhost:5000/api/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, newPassword })
            });
            const data = await response.json();
            if (response.ok) {
                setSuccess('Password reset successful!');
                setTimeout(() => navigate('/'), 2000);
            } else {
                setError(data.error || 'Failed to reset password.');
            }
        } catch (err) {
            setError('Server error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className='rp_head'>
                <h1>Reset Password</h1>
                {/* Step indicator */}
                <div className='rp_steps'>
                    <span className={step >= 1 ? 'rp_step active' : 'rp_step'}>1</span>
                    <span className='rp_step_line'></span>
                    <span className={step >= 2 ? 'rp_step active' : 'rp_step'}>2</span>
                    <span className='rp_step_line'></span>
                    <span className={step >= 3 ? 'rp_step active' : 'rp_step'}>3</span>
                </div>
            </div>

            <div className='rp_main'>
                <div className='rp_card'>

                    {error && <p className='rp_error'>{error}</p>}
                    {success && <p className='rp_success'>{success}</p>}

                    {/* STEP 1 — Email */}
                    {step === 1 && (
                        <>
                            <p className='rp_desc'>Enter your registered email address. We'll send you a one-time code.</p>
                            <label>Email Address</label>
                            <input
                                type='email'
                                placeholder='you@example.com'
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                            />
                            <button className='rp_btn' onClick={handleSendOtp} disabled={loading}>
                                {loading ? 'Sending OTP...' : 'Send OTP'}
                            </button>
                        </>
                    )}

                    {/* STEP 2 — OTP */}
                    {step === 2 && (
                        <>
                            <p className='rp_desc'>Enter the 6-digit OTP sent to <strong>{email}</strong>.</p>
                            <label>One-Time Password</label>
                            <input
                                type='text'
                                placeholder='Enter OTP'
                                maxLength={6}
                                value={otp}
                                onChange={(e) => { setOtp(e.target.value); setError(''); }}
                            />
                            <button className='rp_btn' onClick={handleVerifyOtp} disabled={loading}>
                                {loading ? 'Verifying...' : 'Verify OTP'}
                            </button>
                            <button className='rp_link' onClick={() => { setStep(1); setOtp(''); setError(''); }}>
                                ← Change email
                            </button>
                        </>
                    )}

                    {/* STEP 3 — New Password */}
                    {step === 3 && (
                        <>
                            <p className='rp_desc'>Choose a strong new password for your account.</p>
                            <label>New Password</label>
                            <input
                                type='password'
                                placeholder='Enter new password'
                                value={newPassword}
                                onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                            />
                            <label>Confirm Password</label>
                            <input
                                type='password'
                                placeholder='Confirm new password'
                                value={confirmPassword}
                                onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                            />
                            <button className='rp_btn' onClick={handleResetPassword} disabled={loading}>
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </>
                    )}

                    <button className='rp_back' onClick={() => navigate('/')}>
                        ← Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ResetPassword;