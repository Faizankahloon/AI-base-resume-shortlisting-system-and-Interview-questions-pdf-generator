import { useState, useContext } from "react"
import { useNavigate } from "react-router-dom"
import '../styles/jobDescription.css'
import { CvContext } from '../Context/CvContext'

function JobDescription() {
    const { setScoringVersion } = useContext(CvContext); 
    const [count, setCount] = useState("0")
    const [title, setTitle] = useState("")
    const [skill, setSkill] = useState("")
    const [edu, setEdu] = useState("")
    const [exp, setExp] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [done, setDone] = useState(false)
    const Navigate = useNavigate();
    const [hoverFin, setHoverFin] = useState(false);

    const handleCountChange = (e) => {
        const val = e.target.valueAsNumber;
        if (val < 0 || isNaN(val)) return;    // ← block negative & empty
        setCount(val);
    }
    const handleTitleChange = (e) => setTitle(e.target.value)
    const handleSkillChange = (e) => setSkill(e.target.value)
    const handleEduChange = (e) => setEdu(e.target.value)
    const handleExpChange = (e) => setExp(e.target.value)

    const pollShortlisted = (retries = 15, interval = 2000) => {
        const user_id = localStorage.getItem('username');
        let attempts = 0;
        const timer = setInterval(async () => {
            try {
                const res = await fetch(`http://127.0.0.1:5000/api/shortlisted?user_id=${user_id}`);
                const data = await res.json();

                if ((Array.isArray(data) && data.length > 0) || attempts >= retries) {
                    clearInterval(timer);
                    setSubmitting(false);
                    setDone(true);
                    setScoringVersion(prev => prev + 1);
                }
            } catch (err) {
                console.error("Polling error:", err);
                clearInterval(timer);
                setSubmitting(false);
            }
            attempts++;
        }, interval);
    };

    const submit = async () => {
        if (!title || !skill || !edu || !exp) {
            alert("Please fill in all fields.");
            return;
        }

        const user_id = localStorage.getItem('username');
        if (!user_id) {
            alert("You must be logged in to submit a job description.");
            return;
        }

        try {
            setSubmitting(true);
            setDone(false);
            const response = await fetch("http://127.0.0.1:5000/job_description", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ 
                    user_id,
                    count, 
                    title, 
                    skill, 
                    edu, 
                    exp 
                })
            });
            const data = await response.json();
            console.log("Response:", data);
            pollShortlisted();
        } catch (error) {
            console.log("Error", error);
            setSubmitting(false);
        }
    }

    return (
        <div>
            <div className="d1">
                <h1 className="head">Enter Job Description</h1>
            </div>
            <div className="box2">
                <div className="d2">
                    <h2 className="l1">Job Title</h2>
                    <input 
                        className="inp1" 
                        type="text" 
                        placeholder="e.g. Software Engineer" 
                        onChange={handleTitleChange} 
                    />
                    <h2 className="Req">Requirements</h2>
                    <div className="d3">
                        <input className="inp2" type="text" placeholder="-Specify Required Skills" onChange={handleSkillChange} />
                        <input className="inp3" type="text" placeholder="-Specify Qualification" onChange={handleEduChange} />
                        <input className="inp4" type="text" placeholder="-Specify Experience" onChange={handleExpChange} />
                    </div>
                    <h2 className="l2">Resume's Limit</h2>
                    <input 
                        className="inp5" 
                        type="number" 
                        value={count} 
                        min="0"
                        onChange={handleCountChange}
                        onKeyDown={(e) => {
                            if (e.key === '-' || e.key === 'e') e.preventDefault();
                        }}
                    />

                    {submitting && (
                        <p style={{ color: "white", fontSize: "14px", marginTop: "8px" }}>
                            Scoring resumes, please wait...
                        </p>
                    )}
                    {done && (
                        <p style={{ color: "white", fontSize: "14px", marginTop: "8px" }}>
                            Scoring completed!
                        </p>
                    )}

                    <button className="sub" onClick={submit} disabled={submitting}>
                        {submitting ? "Processing..." : "Submit"}
                    </button>

                    <button
                        className="fin"
                        onClick={() => Navigate("/Dashboard")}
                        onMouseEnter={() => setHoverFin(true)}
                        onMouseLeave={() => setHoverFin(false)}
                        style={{
                            width: "100%",
                            padding: "9px 22px",
                            border: "1.5px solid #1565c0",
                            borderRadius: "8px",
                            background: hoverFin ? "#1565c0" : "white",
                            color: hoverFin ? "white" : "#1565c0",
                            fontSize: "10px",
                            fontWeight: "500",
                            cursor: "pointer",
                            transition: "background 0.2s, color 0.2s",
                        }}
                    >
                        Finish
                    </button>
                </div>
            </div>
        </div>
    )
}

export default JobDescription;