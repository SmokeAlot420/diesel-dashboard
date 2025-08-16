import React from 'react';
import { AlertCircle, Key, Globe, Rocket, ExternalLink } from 'lucide-react';

interface SetupGuideProps {
  isConnected: boolean;
  error?: string;
}

const SetupGuide: React.FC<SetupGuideProps> = ({ isConnected, error }) => {
  if (isConnected) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle className="w-8 h-8 text-yellow-400" />
            <h1 className="text-3xl font-bold text-white">Connect to Alkanes Mainnet</h1>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-400 rounded-lg">
              <p className="text-red-300">{error}</p>
            </div>
          )}

          <div className="space-y-6 text-white">
            <div className="bg-white/5 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Key className="w-5 h-5 text-blue-400" />
                Step 1: Get Your Sandshrew API Key
              </h2>
              <ol className="space-y-3 text-gray-300">
                <li className="flex gap-2">
                  <span className="text-blue-400">1.</span>
                  <span>
                    Visit{' '}
                    <a 
                      href="https://www.sandshrew.io" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1"
                    >
                      www.sandshrew.io
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400">2.</span>
                  <span>Click "Sign Up" and create your account</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400">3.</span>
                  <span>Navigate to Dashboard → API Keys</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400">4.</span>
                  <span>Create and copy your API key (starts with sandshrew_k1_)</span>
                </li>
              </ol>
            </div>

            <div className="bg-white/5 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-green-400" />
                Step 2: Configure Your Environment
              </h2>
              <div className="bg-black/30 rounded-lg p-4 font-mono text-sm">
                <p className="text-gray-400 mb-2"># In your api/.env file:</p>
                <p className="text-green-400">SANDSHREW_API_KEY=sandshrew_k1_YOUR_KEY_HERE</p>
                <p className="text-green-400">SANDSHREW_NETWORK=mainnet</p>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Rocket className="w-5 h-5 text-purple-400" />
                Step 3: Restart Your API Server
              </h2>
              <div className="bg-black/30 rounded-lg p-4 font-mono text-sm">
                <p className="text-gray-400 mb-2"># Restart the API to load new config:</p>
                <p className="text-green-400">cd E:\v2 repo\diesel\api</p>
                <p className="text-green-400">npm run dev</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-6 border border-white/10">
              <h3 className="text-lg font-semibold mb-2">📊 What You'll See</h3>
              <ul className="space-y-1 text-gray-300">
                <li>• Real-time DIESEL token distribution data</li>
                <li>• Live participant counts and rewards</li>
                <li>• Distribution inequality metrics (Gini coefficient)</li>
                <li>• Total Value Locked (TVL) analytics</li>
                <li>• Smart alerts for whale movements</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <a 
                href="https://docs.sandshrew.io" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold text-center transition-colors flex items-center justify-center gap-2"
              >
                Sandshrew Docs
                <ExternalLink className="w-4 h-4" />
              </a>
              <a 
                href="https://alkanes.build" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-lg font-semibold text-center transition-colors flex items-center justify-center gap-2"
              >
                Alkanes Docs
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="text-center text-gray-400 text-sm">
              <p>Free tier includes 100,000 requests/month</p>
              <p>Perfect for moderate traffic with caching enabled</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupGuide;