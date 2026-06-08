import '../styles/Login.css'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

function Login() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('username', formData.username);
                navigate('/Home');
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Server error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className='login_head'>
                <h1>Login</h1>
            </div>
            <div className='login_main'>
                <div className='login2'>
                    <label className='login_l1'>User Name</label>
                    <input
                        type='text'
                        name='username'
                        placeholder='Enter user name'
                        className='login_i1'
                        value={formData.username}
                        onChange={handleChange}
                    />
                    <label className='login_l2'>Password</label>
                    <input
                        type='password'
                        name='password'
                        placeholder='Enter your password'
                        className='login_i2'
                        value={formData.password}
                        onChange={handleChange}
                    />

                    {/* ← Forgot Password navigates to /reset-password */}
                    <button
                        className='forgot_link'
                        onClick={() => navigate('/ResetPassword')}
                    >
                        Forgot password?
                    </button>

                    {error && (
                        <p style={{ color: 'black', fontSize: '16px', position: 'absolute', top: '0px' }}>
                            {error}
                        </p>
                    )}

                    <button className='login_b' onClick={handleLogin} disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Login;