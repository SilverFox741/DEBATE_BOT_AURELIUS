// Component for Gemini API key configuration
import React, { useState } from 'react';
import { Key, AlertTriangle, ExternalLink, Eye, EyeOff } from 'lucide-react';

interface ApiKeySetupProps {
  onApiKeySet: (apiKey: string) => void;
  hasApiKey: boolean;
}

export function ApiKeySetup({ onApiKeySet, hasApiKey }: ApiKeySetupProps) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setIsSubmitting(true);
    try {
      // Basic validation
      if (!apiKey.startsWith('AIzaSy')) {
        throw new Error('Invalid API key format. Gemini API keys should start with "AIzaSy"');
      }
      
      onApiKeySet(apiKey.trim());
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Invalid API key');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasApiKey) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 text-emerald-800">
          <Key className="w-5 h-5" />
          <span className="font-medium">Gemini API Connected</span>
        </div>
        <p className="text-emerald-700 text-sm mt-1">
          AI features are now available. Remember to delete your API key after use.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <Key className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Configure Gemini API</h2>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-amber-800 mb-1">Security Warning</h3>
            <p className="text-amber-700 text-sm">
              This application runs entirely in your browser. Your API key is stored locally and only used to communicate with Google's Gemini API.
              <strong className="block mt-1">Remember to delete your API key after use for security.</strong>
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-gray-900 mb-2">How to get your Gemini API key:</h3>
          <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
            <li>Visit <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">Google AI Studio <ExternalLink className="w-3 h-3" /></a></li>
            <li>Sign in with your Google account (free account works)</li>
            <li>Click "Get API key" in the left sidebar</li>
            <li>Click "Create API key" and select "Create API key in new project"</li>
            <li>Copy the generated API key (starts with "AIzaSy")</li>
            <li>Paste the API key below to enable AI features</li>
          </ol>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
              Gemini API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!apiKey.trim() || isSubmitting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Connecting...' : 'Connect API'}
          </button>
        </form>
      </div>
    </div>
  );
}