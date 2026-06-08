import '../styles/page_home.css';
import hero from '../images/hero.png'
import { useNavigate } from 'react-router-dom';
function Home() {
    const Navigate=useNavigate();
    return(
        <div className='Home'>
            <h1 className='h1'>AI-Powered Resume</h1>
            <h1 className='h2'>Shortlisting</h1>
            <p className='p1'>Intelligently analyze and rank candidate resumes against defined job</p>
            <p className='p2'> requirements — eliminating manual screening and ensuring only the</p>
            <p className='p3'>most qualified applicants</p>
            <button className='but' onClick={()=>Navigate("/UploadCv")}>Get Started</button>
            <img src={hero} className='i1'></img>
            <div className='transition'>
            <p className='h3'>AI Based </p>
            <span className='i2'>✦</span>
            <p className='h3'>Resume Shortlisting System </p>
            <span className='i2'>✦</span>
            <p className='h3'> & </p>
            <span className='i2'>✦</span>
            <p className='h3'> Interview Question's PDF Generator</p>
            </div>
        </div>
    )
}
export default Home