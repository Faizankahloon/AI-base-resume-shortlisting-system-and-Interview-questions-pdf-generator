import { useNavigate } from 'react-router-dom';
import '../styles/page_upload_cv.css'
import { useContext, useRef, useState } from "react";
import { CvContext } from '../Context/CvContext';
import { color } from 'chart.js/helpers';

function UploadCV() {
  const { setCvCount } = useContext(CvContext);
  const Navigate = useNavigate();

  const fileRef = useRef();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const onChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const submitHandler = async () => {
    if (files.length === 0) {
      alert("No file selected");
      return;
    }

    const user_id = localStorage.getItem('username');  // ← get logged in user
    if (!user_id) {
      alert("You must be logged in to upload CVs.");
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("user_id", user_id);               // ← attach user_id

    try {
      setUploading(true);

      const response = await fetch("http://127.0.0.1:5000/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Upload success:", data);
        setCvCount(prev => prev + files.length);
        setFiles([]);
        alert("Files uploaded successfully!");
      } else {
        alert("Upload failed on the server.");
      }
    } catch (error) {
      console.error("Error connecting to backend:", error);
      alert("Could not connect to the backend server.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div >
      <div className="u1">
      <h1 className='u3' style={{color:"white"}}>Upload Resume</h1>
      </div>
      <div className='box'>
      <div className='u2'>
        
        <input multiple type="file" ref={fileRef} style={{ display: "none" }} onChange={onChange} />
        <button className="u4" onClick={() => fileRef.current.click()}>Choose CV</button>

        <div className='u5'>
          {files.length === 0 ? (
            <p className='u5-p'>No file found</p>
          ) : (
            <ul className='u5-list'>
              {files.map((file, i) => (
                <li key={i}>{file.name}</li>
              ))}
            </ul>
          )}
        </div>

        {/* {uploading && <p style={{ color: "#888", fontSize: "14px" }}>Uploading, please wait...</p>} */}

        <button className="u6" onClick={submitHandler} disabled={uploading}>
          {uploading ? "Uploading..." : "Upload"}
        </button>
        <button className='u7' onClick={() => Navigate("/JobDescription")}>Next</button>
      </div>
    </div>
    </div>
  );
}

export default UploadCV;