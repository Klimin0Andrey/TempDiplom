import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, FileText, Users, Shield, Zap, CheckCircle2, ArrowRight } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-blue-100">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg shadow-md shadow-blue-600/20">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900 tracking-tight">IntelliConf</span>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/login')}
                className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={() => navigate('/login?mode=register')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md"
              >
                Create Organization
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white">
        <div className="absolute inset-y-0 w-full h-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
              Intelligent Audio Conferences with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Auto-Protocols</span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
              Focus on the conversation, not the notes. Our platform automatically records, transcribes, and generates actionable meeting minutes using advanced AI.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <button 
                onClick={() => navigate('/login?mode=register')}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl text-lg font-medium transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 hover:-translate-y-0.5"
              >
                <span>Start for Free</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-8 py-3.5 rounded-xl text-lg font-medium transition-all shadow-sm"
              >
                <span>View Demo</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Everything your team needs</h2>
            <p className="mt-4 text-lg text-gray-600">Built for modern organizations that value time and clarity.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Mic className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Crystal Clear Audio</h3>
              <p className="text-gray-600 leading-relaxed">Low-latency WebRTC peer-to-peer connections ensure your voice is heard without interruptions.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                <FileText className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI-Generated Protocols</h3>
              <p className="text-gray-600 leading-relaxed">Automatic transcription and LLM-powered summaries extract key decisions and action items instantly.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Enterprise Security</h3>
              <p className="text-gray-600 leading-relaxed">Role-based access control, secure JWT authentication, and isolated organization workspaces.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Simple, transparent pricing</h2>
            <p className="mt-4 text-lg text-gray-600">Choose the plan that best fits your organization's needs.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Light Tier */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8 flex flex-col">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Light</h3>
              <p className="text-gray-500 text-sm mb-6">Perfect for small teams getting started.</p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-gray-900">$0</span>
                <span className="text-gray-500">/month</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center text-gray-600"><CheckCircle2 className="w-5 h-5 text-green-500 mr-3 shrink-0" /> Up to 10 users</li>
                <li className="flex items-center text-gray-600"><CheckCircle2 className="w-5 h-5 text-green-500 mr-3 shrink-0" /> Unlimited audio calls</li>
                <li className="flex items-center text-gray-600"><CheckCircle2 className="w-5 h-5 text-green-500 mr-3 shrink-0" /> Basic text chat</li>
                <li className="flex items-center text-gray-400"><CheckCircle2 className="w-5 h-5 text-gray-300 mr-3 shrink-0" /> No AI features</li>
              </ul>
              <button onClick={() => navigate('/login?mode=register')} className="w-full py-3 px-4 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-medium transition-colors">
                Get Started
              </button>
            </div>

            {/* Pro Tier */}
            <div className="bg-blue-600 rounded-3xl shadow-xl border border-blue-600 p-8 flex flex-col relative transform md:-translate-y-4">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-400 to-indigo-400 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Most Popular
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
              <p className="text-blue-100 text-sm mb-6">For growing organizations needing AI power.</p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-white">$29.99</span>
                <span className="text-blue-200">/month</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center text-white"><CheckCircle2 className="w-5 h-5 text-blue-300 mr-3 shrink-0" /> Up to 100 users</li>
                <li className="flex items-center text-white"><CheckCircle2 className="w-5 h-5 text-blue-300 mr-3 shrink-0" /> Auto-recording</li>
                <li className="flex items-center text-white"><CheckCircle2 className="w-5 h-5 text-blue-300 mr-3 shrink-0" /> AI Transcriptions (STT)</li>
                <li className="flex items-center text-white"><CheckCircle2 className="w-5 h-5 text-blue-300 mr-3 shrink-0" /> AI Summaries & Action Items</li>
              </ul>
              <button onClick={() => navigate('/login?mode=register')} className="w-full py-3 px-4 bg-white text-blue-600 hover:bg-gray-50 rounded-xl font-bold transition-colors shadow-sm">
                Start Free Trial
              </button>
            </div>

            {/* Business Tier */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8 flex flex-col">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Business</h3>
              <p className="text-gray-500 text-sm mb-6">For large enterprises with advanced needs.</p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-gray-900">$99.99</span>
                <span className="text-gray-500">/month</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center text-gray-600"><CheckCircle2 className="w-5 h-5 text-green-500 mr-3 shrink-0" /> Up to 1000 users</li>
                <li className="flex items-center text-gray-600"><CheckCircle2 className="w-5 h-5 text-green-500 mr-3 shrink-0" /> Everything in Pro</li>
                <li className="flex items-center text-gray-600"><CheckCircle2 className="w-5 h-5 text-green-500 mr-3 shrink-0" /> Priority Support</li>
                <li className="flex items-center text-gray-600"><CheckCircle2 className="w-5 h-5 text-green-500 mr-3 shrink-0" /> Custom Integrations</li>
              </ul>
              <button onClick={() => navigate('/login?mode=register')} className="w-full py-3 px-4 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-medium transition-colors">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
