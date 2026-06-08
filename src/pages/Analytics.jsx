import { Doughnut } from "react-chartjs-2";
import '../styles/Dashboard.css'
import { Chart as chartjs , ArcElement , Tooltip , Legend,  } from "chart.js";
import { color } from "chart.js/helpers";

chartjs.register(ArcElement,Tooltip,Legend);
function Analytics({uploaded , shortlisted}){
   
    const percentage = uploaded == 0 ? 0 : Math.round((shortlisted / uploaded) * 100);
    const sh = shortlisted == 0 ? 0 : shortlisted;
    const data = {
        labels : ["Uploaded Cv's","Shortlisted Cv's"],
        datasets: [
            {
                data:[uploaded , shortlisted],
                backgroundColor: ["#2563eb", "#60a5fa"],
                borderWidth:2,
                cutout:"70%",
            }
        ]
    }
    return(
    <div className="Analytics_main">
        <h3 className="Analytics_heading">Analytics</h3>
        <div className="Analytics_chart">
            <Doughnut data={data} className="Analytics_shape"/>
            <h2 className="Analytics_percentage">{percentage}%</h2>
        </div>
    </div>
    );
}
export default Analytics