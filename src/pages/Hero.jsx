import Pr from '../images/Project1.png'
import Pr2 from '../images/Project2.png'
import '../styles/Hero.css'
function Hero(){
    return(
        <div className='d'>
            <div className='Slider'>
            <img src={Pr} className='P1'/>
            <img src={Pr2}  className='P2'/>
            {/* Dublicate images for infinite loop */}
            <img src={Pr} className='P3'/>
            <img src={Pr2} className='P4'/>
            </div>
        </div>
    )
}
export default Hero