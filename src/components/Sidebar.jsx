import '../styles/Sidebar.css'
import logo from '../images/Logo.svg'
import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react';

function Sidebar(){
    const navigate = useNavigate();
    const location = useLocation();
    const [username, setUsername] = useState(localStorage.getItem('username'));
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(()=>{
        const storedUser=localStorage.getItem('username');
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
            <img src={logo} className='ProjectLogo' />
            {/* <h2 className='heading'>AI CV Shortlisting</h2> */}
            <div className='Sidebar_button'>
                <button className='Sidebar_button_1' onClick={() => navigate("/Home")}>Home</button>
                <button className='Sidebar_button_2' onClick={() => navigate("/UploadCv")}>Upload</button>
                <button className='Sidebar_button_3' onClick={() => navigate("/JobDescription")}>Job Description</button>
                <button className='Sidebar_button_4' onClick={() => navigate("/Dashboard")}>Dashboard</button>
                <button className='Sidebar_button_5' onClick={() => navigate("/Contact")}>Contact</button>

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
        </div>
    )
}
export default Sidebar