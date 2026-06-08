import UploadCv from '../images/UploadCv.png'
import ShortlistedCv from '../images/ShortlistedCvs.png'
import '../styles/Dashboard.css'
import { useContext, useEffect, useState, useCallback } from 'react'
import { CvContext } from '../Context/CvContext.jsx'
import Analytics from './Analytics.jsx'
import '@fortawesome/fontawesome-free/css/all.min.css';

function ShortlistedCvs() {
    const { cvCount, scoringVersion } = useContext(CvContext);
    const [shortlisted, setShortlisted] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [pdfError, setPdfError] = useState(null);

    const fetchShortlisted = useCallback(() => {
        const user_id = localStorage.getItem('username');
        if (!user_id) {
            console.warn("No user logged in");
            setShortlisted([]);
            return;
        }
        setLoading(true);
        fetch(`http://127.0.0.1:5000/api/shortlisted?user_id=${user_id}`)
            .then(res => {
                if (!res.ok) throw new Error("API Error");
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    const qualified = data.filter(item => item.score >= 20);
                    setShortlisted(qualified);
                } else {
                    setShortlisted([]);
                }
            })
            .catch(err => {
                console.error("Fetch error:", err);
                setShortlisted([]);
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchShortlisted();
    }, [scoringVersion, fetchShortlisted]);

    const handleDownloadPdf = async () => {
        const user_id = localStorage.getItem('username');
        if (!user_id) { alert("You must be logged in."); return; }
        setPdfLoading(true);
        setPdfError(null);
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/interview_questions?user_id=${user_id}`);
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Failed to generate PDF");
            }
            const disposition = response.headers.get("Content-Disposition") || "";
            const match = disposition.match(/filename="?([^"]+)"?/);
            const filename = match ? match[1] : "Interview_Questions.pdf";
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("PDF download error:", err);
            setPdfError(err.message);
        } finally {
            setPdfLoading(false);
        }
    };

    const handleDownloadCv = async (filename) => {
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/download_cv/${encodeURIComponent(filename)}`);
            if (!response.ok) throw new Error("Download failed");
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("CV download error:", err);
            alert("Failed to download file.");
        }
    };

    const handleDelete = (index) => {
        setShortlisted(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div>
            <div className='d_head'>
                <h1>Dashboard</h1>
            </div>
        <div className='Dashboard_d1'>
            

            {/* ── Top row: stat cards ── */}
            <div className='Dashboard_d2'>
                <img src={UploadCv} className='Dashboard_img1' />
                <h5 className='Dashboard_h5'>Upload Cv's</h5>
                <p className='Dashboard_p1'>{Math.floor(cvCount)}</p>
            </div>

            <div className='Dashboard_d3'>
                <img src={ShortlistedCv} className='Dashboard_img2' />
                <h5 className='Dashboard_h2'>Shortlisted Cv's</h5>
                <p className='Dashboard_p2'>{shortlisted.length}</p>
            </div>

            <div className='interview_pdf'>
                <h5 className='interview_heading'>Interview Questions PDF</h5>
                <button
                    className='download_button'
                    onClick={handleDownloadPdf}
                    disabled={pdfLoading}
                >
                    <i className={`fa-solid ${pdfLoading ? 'fa-spinner fa-spin' : 'fa-arrow-down'} download_icon`}></i>
                    {pdfLoading ? 'Generating...' : 'Download Interview Pdf'}
                </button>
                {pdfError && (
                    <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{pdfError}</p>
                )}
            </div>

            {/* ── Bottom row: list + analytics ── */}
            <div className='Dashboard_bottom'>

                <div className='Dashboard_d4'>
                    <h2 className='Shortlisted_h2'>Shortlisted</h2>
                    <div className='Dashboard_d5'>
                        <div className='Dashboard_d6'>
                            <p className='Dashboard_p3' style={{ flex: 1 }}>Files</p>
                            <p className='Dashboard_p4'>Scores</p>
                        </div>

                        {loading ? (
                            <p style={{ padding: "10px" }}>Loading...</p>
                        ) : shortlisted.length === 0 ? (
                            <p style={{ padding: "10px" }}>No resume Shortlisted</p>
                        ) : (
                            shortlisted.map((item, index) => (
                                <div key={index} className='Dashboard_d6' style={{ alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: '10px', marginRight: '10px' }}>
                                        <i
                                            className="fa-solid fa-download"
                                            title="Download CV"
                                            onClick={() => handleDownloadCv(item.name)}
                                            style={{ cursor: 'pointer', color: 'Black', fontSize: '16px' }}
                                        />
                                        <i
                                            className="fa-solid fa-trash"
                                            title="Remove from list"
                                            onClick={() => handleDelete(index)}
                                            style={{ cursor: 'pointer', color: 'Black', fontSize: '16px' }}
                                        />
                                    </div>
                                    <p className='Dashboard_p5' style={{ flex: 1 }}>{item.name}</p>
                                    <p className='Dashboard_p6'>{item.score}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <Analytics
                    uploaded={Math.floor(cvCount)}
                    shortlisted={shortlisted.length}
                    percentage={Math.floor(cvCount) > 0
                        ? parseFloat(((shortlisted.length / Math.floor(cvCount)) * 100).toFixed(1)) : 0}
                />

            </div>
        </div>
        </div>
    );
}

export default ShortlistedCvs;