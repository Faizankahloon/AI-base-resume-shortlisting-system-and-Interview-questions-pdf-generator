import { color } from 'chart.js/helpers'
import '../styles/Footer.css'

function Footer() {
    return (
        <div className="footer">

            <div className="footer_container">

                {/* About */}
                <div className="footer_section">
                    <h2>AI Shortlisting System</h2>

                    <p>
                        Smart AI based Resume Shortlisting and
                        Interview PDF Generator System
                    </p>

                    <p>
                        Fast, accurate and efficient recruitment solution
                    </p>
                </div>

                {/* Features */}
                <div className="footer_section">
                    <h2>Features</h2>

                    <p>✔ AI Resume Analysis</p>
                    <p>✔ Candidate Shortlisting</p>
                    <p>✔ Interview Questions PDF Generator</p>
                    <p>✔ Smart Filtering</p>
                </div>

                {/* Contact */}
                <div className="footer_section">
                    <h2>Contact Us</h2>

                    <p>
                        <i className="fa-solid fa-envelope"></i>
                        airesume@gmail.com
                    </p>

                    <p>
                        <i className="fa-solid fa-phone"></i>
                        +92 318 4695989
                    </p>

                    <div className="social_icons">
                        <a href='https://www.facebook.com/share/1A7ZyKwDxH/?mibextid=wwXIfr' target='blank' style={{color:"white"}}>
                        <i className="fa-brands fa-facebook-f"></i>
                        </a>
                        <a href="https://www.linkedin.com/profile/view?id=ADoAAE8iBB4BqGzgEtPVRw02Ue4iGdm6KWUcBrs&trk=nav_responsive_tab_profile_pic" target='blank' style={{color:"white"}}>
                        <i className="fa-brands fa-linkedin-in"></i>
                        </a>
                        
                        <a href='https://github.com/account' target='blank'><i className="fa-brands fa-github" style={{color:"white"}}></i></a>
                        {/* <a href='https://www.instagram.com/faizanjutt865474/' target='blank' style={{color:"white"}}>  <i className="fa-brands fa-instagram"></i></a> */}
                       
                    </div>
                </div>

            </div>

            <div className="F_icon">
                <i className="fa-regular fa-copyright"></i>
                <span> 2026 AI Resume System | All Rights Reserved</span>
            </div>

        </div>
    )
}

export default Footer