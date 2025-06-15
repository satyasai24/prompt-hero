import React from 'react';
import { useLocation } from 'react-router-dom'; // Import useLocation
import PromptBuilder from '../components/PromptBuilder/PromptBuilder';

const PromptBuilderPage = () => {
  const location = useLocation(); // Get location object
  const initialPromptData = location.state?.initialPromptData; // Get data from state

  return (
    <div className="w-full flex justify-center py-8">
      {/* Pass initialPromptData to PromptBuilder */}
      <PromptBuilder initialPromptData={initialPromptData} />
    </div>
  );
};
export default PromptBuilderPage;
