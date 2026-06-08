import { createContext, useState } from "react";

export const CvContext = createContext();

export const CvProvider = ({ children }) => {
  const [cvCount, setCvCount] = useState(0);
  const [shortlistedCount, setShortlistedCount] = useState(0);
  const [scoringVersion, setScoringVersion] = useState(0);

  return (
    <CvContext.Provider value={{
      cvCount, setCvCount,
      shortlistedCount, setShortlistedCount,
      scoringVersion, setScoringVersion
    }}>
      {children}
    </CvContext.Provider>
  );
};