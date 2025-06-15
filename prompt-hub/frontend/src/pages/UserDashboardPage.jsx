import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom'; // Import Link

const UserPromptsList = () => {
  const { idToken, currentUser } = useAuth(); // Get currentUser for plan_tier
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [promptCount, setPromptCount] = useState(0);
  const [promptLimit, setPromptLimit] = useState(5); // Default, will be updated by API
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [apiPlanTier, setApiPlanTier] = useState('free'); // Store plan tier from API

  const fetchPrompts = useCallback(async () => {
    if (!idToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.append('search', searchTerm);
      if (filterTag) queryParams.append('tag', filterTag);

      const response = await fetch(`/api/prompts?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      const data = await response.json();
      setPrompts(data.prompts);
      setPromptCount(data.promptCount);
      setPromptLimit(data.promptLimit === Infinity ? 'Unlimited' : data.promptLimit);
      setApiPlanTier(data.planTier || 'free');
    } catch (err) {
      setError(err.message);
      console.error("Error fetching prompts:", err);
    } finally {
      setIsLoading(false);
    }
  }, [idToken, searchTerm, filterTag]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  useEffect(() => {
    const handlePromptsUpdated = () => fetchPrompts();
    window.addEventListener('promptsUpdated', handlePromptsUpdated);
    return () => window.removeEventListener('promptsUpdated', handlePromptsUpdated);
  }, [fetchPrompts]);

  // This effect listens for changes in currentUser from AuthContext, which might get updated by refreshUserData
  useEffect(() => {
    if (currentUser?.plan_tier) {
        setApiPlanTier(currentUser.plan_tier);
        setPromptLimit(currentUser.plan_tier === 'pro' ? 'Unlimited' : 5); // Update limit based on context too
    }
  }, [currentUser?.plan_tier]);


  if (isLoading && prompts.length === 0 && !searchTerm && !filterTag) return <p className="text-center text-slate-400">Loading prompts...</p>;
  if (error) return <p className="text-center text-red-500">Error loading prompts: {error}</p>;

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search prompts by title or content..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow p-3 bg-slate-700 text-white border border-slate-600 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 transition"
        />
        <input
          type="text"
          placeholder="Filter by a single tag..."
          value={filterTag}
          onChange={(e) => setFilterTag(e.target.value)}
          className="flex-grow p-3 bg-slate-700 text-white border border-slate-600 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 transition"
        />
      </div>

      <div className="mb-6 p-4 bg-slate-800 rounded-md shadow-md text-center">
        <p className="text-lg text-slate-300">
          Your current plan: <span className="font-semibold text-sky-400 capitalize">{apiPlanTier}</span>
        </p>
        <p className="text-slate-400">
          Saved Prompts: {promptCount} / {promptLimit === 'Unlimited' ? 'Unlimited' : promptLimit}
        </p>
        {apiPlanTier === 'free' && promptCount >= (promptLimit === 'Unlimited' ? Infinity : promptLimit) && (
          <p className="text-yellow-500 mt-1">Prompt limit reached.</p>
        )}
        {apiPlanTier === 'free' && (
          <Link to="/pricing" className="mt-2 inline-block text-purple-400 hover:text-purple-300 transition font-semibold">
            Upgrade to Pro for unlimited prompts!
          </Link>
        )}
      </div>

      {isLoading && <p className="text-center text-slate-400 py-4">Filtering prompts...</p>}

      {!isLoading && prompts.length === 0 && (
        <p className="text-center text-slate-400 py-4">
          No prompts found matching your criteria.
          {(!searchTerm && !filterTag) ? " Go to the Builder to create one!" : " Try different filters or create a new prompt."}
        </p>
      )}
      <div className="space-y-4">
        {prompts.map(prompt => (
          <div key={prompt.id} className="bg-slate-700/50 p-4 rounded-md shadow-lg hover:shadow-sky-700/50 transition-shadow">
            <h3 className="text-lg font-semibold text-sky-400 truncate" title={prompt.title}>{prompt.title}</h3>
            <p className="text-xs text-slate-500 mb-2">Model: {prompt.model_used} | Created: {new Date(prompt.created_at).toLocaleDateString()}</p>
            <p className="text-slate-300 text-sm line-clamp-2" title={prompt.prompt_text}>{prompt.prompt_text}</p>
            <div className="mt-3 flex justify-between items-center">
              <div>
                {prompt.tags && prompt.tags.length > 0 ? (
                  prompt.tags.map(tag => (
                    <span key={tag} className="inline-block bg-sky-600 text-white text-xs px-2 py-1 rounded-full mr-2 mb-1">
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic">No tags</span>
                )}
              </div>
              <button
                onClick={() => navigate('/builder', { state: { initialPromptData: prompt } })}
                className="text-sm bg-sky-500 hover:bg-sky-600 text-white py-1 px-3 rounded-md transition whitespace-nowrap"
              >
                Remix
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const UserDashboardPage = () => {
  const { currentUser } = useAuth();
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-sky-400 mb-8 text-center">
        {currentUser?.displayName ? `${currentUser.displayName}'s Dashboard` : "User Dashboard"}
      </h1>
      <UserPromptsList />
    </div>
  );
};
export default UserDashboardPage;
