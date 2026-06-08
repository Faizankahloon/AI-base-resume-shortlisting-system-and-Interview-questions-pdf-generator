import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/SignUp.css'

function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setTimeout(() => navigate('/Login'), 1500);
      }
    } catch (err) {
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className='heading_sign'>
        <h2 >Sign Up</h2>
      </div>
    <div className="sign1">
      <div className='sign2'>
        

        <label className='label1'>User Name</label>
        <input
          type='text'
          name='username'
          placeholder='Enter user name'
          className='input_1'
          value={formData.username}
          onChange={handleChange}
        />

        <label className='label2'>Email</label>
        <input
          type='email'
          name='email'
          placeholder='Enter your email'
          className='input_2'
          value={formData.email}
          onChange={handleChange}
        />

        <label className='label3'>Password</label>
        <input
          type='password'
          name='password'
          placeholder='Enter strong password'
          className='input_3'
          value={formData.password}
          onChange={handleChange}
        />

        <button className='sign_but1' onClick={handleSubmit} disabled={loading}>
          {loading ? 'Submitting...' : 'SignUp'}
        </button>
        <button className='sign_but2' onClick={() => navigate('/Login')}>Login</button>
      </div>
    </div>
    </div>
  );
}

export default SignUp;