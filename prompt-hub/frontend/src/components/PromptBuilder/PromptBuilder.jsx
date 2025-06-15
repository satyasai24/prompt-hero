import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const AI_MODELS = [
  { id: 'chatgpt', name: 'ChatGPT (OpenAI)' },
  { id: 'claude', name: 'Claude (Anthropic)' },
  { id: 'gemini', name: 'Gemini (Google)' }, // Add this line
];

const PromptBuilder = ({ initialPromptData }) => {
  const [promptText, setPromptText] = useState('');
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0].id);
  const [tagsInput, setTagsInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [promptResult, setPromptResult] = useState('');
  const { idToken } = useAuth();
  const [saveStatus, setSaveStatus] = useState('');
  const [isRemixMode, setIsRemixMode] = useState(false);
  const [originalTitle, setOriginalTitle] = useState('');

  useEffect(() => {
    if (initialPromptData) {
      setPromptText(initialPromptData.prompt_text || '');
      // Ensure the model from initialPromptData is valid, otherwise default
      const modelExists = AI_MODELS.some(model => model.id === initialPromptData.model_used);
      setSelectedModel(modelExists ? initialPromptData.model_used : AI_MODELS[0].id);
      setTagsInput((initialPromptData.tags || []).join(', '));
      setPromptResult('');
      setSaveStatus('');
      setIsRemixMode(true);
      setOriginalTitle(initialPromptData.title || 'Untitled');
    }
  }, [initialPromptData]);

  const handleTestPrompt = async () => {
    if (!promptText.trim() || !idToken) {
      setPromptResult('Prompt text cannot be empty or user not authenticated.');
      setTimeout(() => setPromptResult(''), 3000);
      return;
    }
    setIsTesting(true);
    setPromptResult('');
    try {
      const response = await fetch('/api/prompts/test-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          prompt_text: promptText,
          model_id: selectedModel,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      setPromptResult(data.response);
    } catch (error) {
      console.error('Error testing prompt:', error);
      setPromptResult(`Error: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSavePrompt = async () => {
    if (!promptText.trim() || !idToken) {
      setSaveStatus('Prompt text cannot be empty or user not authenticated.');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }
    setSaveStatus('Saving...');
    setIsSaving(true);
    const tagsArray = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

    try {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          prompt_text: promptText,
          model_used: selectedModel,
          tags: tagsArray,
        }),
      });

      setSaveStatus('');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to save prompt. Unknown error.' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const newPrompt = await response.json();
      console.log('Prompt saved:', newPrompt);
      setPromptText('');
      setTagsInput('');
      setIsRemixMode(false);
      setOriginalTitle('');
      setSaveStatus('Prompt saved successfully!');
      window.dispatchEvent(new CustomEvent('promptsUpdated'));
    } catch (error) {
      console.error('Error saving prompt:', error);
      setSaveStatus(`Error: ${error.message}`);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-slate-800 rounded-lg shadow-xl">
      <h2 className="text-2xl font-semibold text-sky-400 mb-2 text-center">Prompt Builder</h2>
      {isRemixMode && (
        <p className="text-center text-yellow-400 mb-4 text-sm">
          Remixing "{originalTitle}". Modifying and saving will create a new prompt.
        </p>
      )}

      <div className="mb-6">
        <label htmlFor="aiModel" className="block text-sm font-medium text-slate-300 mb-1">
          Select AI Model
        </label>
        <select
          id="aiModel"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="w-full p-3 bg-slate-700 text-white border border-slate-600 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 transition"
          disabled={isTesting || isSaving}
        >
          {AI_MODELS.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <label htmlFor="promptText" className="block text-sm font-medium text-slate-300 mb-1">
          Enter your prompt
        </label>
        <textarea
          id="promptText"
          rows="8"
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder="e.g., Write a short story about a robot who discovers music..."
          className="w-full p-3 bg-slate-700 text-white border border-slate-600 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 transition resize-y"
          disabled={isTesting || isSaving}
        />
      </div>

      <div className="mb-6">
        <label htmlFor="tagsInput" className="block text-sm font-medium text-slate-300 mb-1">
          Tags (comma-separated)
        </label>
        <input
          type="text"
          id="tagsInput"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="e.g., story, marketing, code"
          className="w-full p-3 bg-slate-700 text-white border border-slate-600 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500"
          disabled={isTesting || isSaving}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <button
          onClick={handleTestPrompt}
          disabled={isTesting || isSaving || !promptText.trim()}
          className="flex-1 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-semibold py-3 px-4 rounded-md shadow-md transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isTesting ? 'Testing...' : 'Test Prompt'}
        </button>
        <button
          onClick={handleSavePrompt}
          disabled={isTesting || isSaving || !promptText.trim()}
          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-md shadow-md transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Prompt'}
        </button>
      </div>

      {saveStatus && <p className="text-sm text-center my-3 text-yellow-300">{saveStatus}</p>}

      {promptResult && (
        <div className="mt-6 p-4 bg-slate-700 rounded-md">
          <h3 className="text-lg font-semibold text-sky-400 mb-2">Result from AI:</h3>
          <p className="text-slate-200 whitespace-pre-wrap">{promptResult}</p>
        </div>
      )}
    </div>
  );
};

export default PromptBuilder;
