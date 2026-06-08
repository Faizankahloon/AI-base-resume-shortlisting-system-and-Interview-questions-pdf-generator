import {Routes,Route} from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Home from './pages/Home'
import UploadCv from './pages/UploadCv'
import JobDescription from './pages/JobDescription'
import ShortlistedCvs from './pages/Dashboard'
import Contact from './pages/Contact'
import MainPage from './pages/Mainpage'
import SignUp from './pages/SignUp'
import Login from './pages/Login'
import ProtectedRoute from './components/ProtectedRoute'
import '../src/styles/main.css'
import ResetPassword from './pages/ResetPassword'
import Footer from './pages/Footer'

function App(){
    return(
        <>
            <Sidebar></Sidebar>
            
            <Routes>
                <Route path='/' element={<MainPage/>}></Route>
                <Route path='/SignUp' element={<SignUp/>}></Route>
                <Route path='/Login' element={<Login/>}></Route>
                <Route path='/Home' element={<ProtectedRoute><Home/></ProtectedRoute>}></Route>
                <Route path='/UploadCv' element={<ProtectedRoute><UploadCv/></ProtectedRoute>}></Route>
                <Route path='/JobDescription' element={<ProtectedRoute><JobDescription/></ProtectedRoute>}></Route>
                <Route path='/Dashboard' element={<ProtectedRoute><ShortlistedCvs/></ProtectedRoute>}></Route>
                <Route path='/Contact' element={<ProtectedRoute><Contact/></ProtectedRoute>}></Route>
                <Route path='/ResetPassword' element={<ResetPassword/>}></Route>
                
                
            </Routes>
            <Footer></Footer>
        </>
    )
}
export default App