import '../styles/Sidebar.css'
import logo from '../images/Logo.svg'
import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react';

function Sidebar(){
    const navigate = useNavigate();
    const location = useLocation();
    const [username, setUsername] = useState(localStorage.getItem('username'));
    const [showDropdown, setShowDropdown] = useState(false);
    const [showNavMenu, setShowNavMenu] = useState(false);

    useEffect(()=>{
        const storedUser = localStorage.getItem('username');
        setUsername(storedUser);
    },[location.pathname]);

    const handleLogout = () => {
        localStorage.removeItem('username');
        setUsername(null);
        setShowDropdown(false);
        navigate('/');
    };

    return(
        <div className="Sidebar">

            {/* Logo */}
            <img src={logo} className='ProjectLogo' />

            {/* 3-dot vertical button */}
            <div className="dots-menu-wrapper">
                <button
                    className="dots-menu-btn"
                    onClick={() => setShowNavMenu(!showNavMenu)}
                    aria-label="More options"
                >
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                </button>

                {showNavMenu && (
                    <div className="dots-nav-flyout">
                        <button className="flyout-nav-btn" onClick={() => { navigate("/Home"); setShowNavMenu(false); }}>Home</button>
                        <button className="flyout-nav-btn" onClick={() => { navigate("/UploadCv"); setShowNavMenu(false); }}>Upload</button>
                        <button className="flyout-nav-btn" onClick={() => { navigate("/JobDescription"); setShowNavMenu(false); }}>Job Description</button>
                        <button className="flyout-nav-btn" onClick={() => { navigate("/Dashboard"); setShowNavMenu(false); }}>Dashboard</button>
                        <button className="flyout-nav-btn" onClick={() => { navigate("/Contact"); setShowNavMenu(false); }}>Contact</button>
                    </div>
                )}
            </div>

            {/* Avatar or Sign Up */}
            {username ? (
                <div className="avatar-wrapper">
                    <div
                        className="user-avatar"
                        onClick={() => setShowDropdown(!showDropdown)}
                        title={`Logged in as ${username}`}
                    >
                        {username.charAt(0).toUpperCase()}
                    </div>

                    {showDropdown && (
                        <div className="avatar-dropdown">
                            <div className="avatar-dropdown-header">
                                <div className="avatar-initial-large">
                                    {username.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="avatar-fullname">{username}</p>
                                </div>
                            </div>
                            <hr className="avatar-divider" />
                            <button className="logout-btn" onClick={handleLogout}>Logout</button>
                        </div>
                    )}
                </div>
            ) : (
                <button onClick={() => navigate('/SignUp')} className='Sidebar_button_6'>Sign Up</button>
            )}

        </div>
    )
}

export default Sidebar