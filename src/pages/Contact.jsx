import '../styles/contact.css'
import { useState } from 'react'
import image from '../images/Contact_logo.svg'

function Contact() {
    const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
    const [error, setError] = useState('')

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const sendMsg = () => {
        setError('')

        if (!form.name || !form.email || !form.message) {
            setError('Please fill in your name, email, and message.')
            return
        }

        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRe.test(form.email)) {
            setError('Please enter a valid email address.')
            return
        }

        const subject = encodeURIComponent('New contact from ' + form.name)
        const body = encodeURIComponent(
            'Name: ' + form.name + '\n' +
            'Email: ' + form.email + '\n' +
            'Phone: ' + (form.phone || 'Not provided') + '\n\n' +
            'Message:\n' + form.message
        )

        window.location.href = `mailto:faizankahloon80@gmail.com?subject=${subject}&body=${body}`
    }

    return (
        <div>
            {/* Header */}
            <div className="contact_heading">
                <h1>Contact</h1>
            </div>

            {/* Main row: form left, logo right */}
            <div className='c_box'>

                {/* Form column */}
                <div className='c_form'>
                    <div className='c1'>
                        <input
                            type='text'
                            name='name'
                            placeholder='Enter your name'
                            value={form.name}
                            onChange={handleChange}
                        />
                    </div>

                    <div className='c1'>
                        <input
                            type='email'
                            name='email'
                            placeholder='Enter your email'
                            value={form.email}
                            onChange={handleChange}
                        />
                    </div>

                    <div className='c1'>
                        <input
                            type='tel'
                            name='phone'
                            placeholder='Enter your phone number'
                            value={form.phone}
                            onChange={handleChange}
                        />
                    </div>

                    <div className='c1'>
                        <textarea
                            name='message'
                            placeholder='Enter your message'
                            value={form.message}
                            onChange={handleChange}
                        />
                    </div>

                    {error && <p className='error_msg'>{error}</p>}

                    <div className='c1'>
                        <button onClick={sendMsg}>Send Message</button>
                    </div>
                </div>

                {/* Logo on the right */}
                <img src={image} className='con_logo' alt="AI Resume Shortlisting System Logo" />

            </div>
        </div>
    )
}

export default Contact