import Home from './Home'
import Hero from './Hero'
import UploadCv from './UploadCv'
import JobDescription from './JobDescription'
import ShortlistedCvs from './Dashboard'
import Contact from './Contact'

function MainPage(){
    
    return(
        <div>
            <Home/>
            <Hero/>
            <UploadCv/>
            <JobDescription/>
            <ShortlistedCvs/>
            <Contact/>
        </div>
    )
}
export default MainPage