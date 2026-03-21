import { useState } from 'react';
import { AlertCircle, RotateCcw, ScanLine, Clock } from 'lucide-react';
import PhotoUploader from './components/PhotoUploader';
import ResultsPanel from './components/ResultsPanel';
import HistoryPanel from './components/HistoryPanel';
import LandingPage from './components/LandingPage';
import { analyzePhoto } from './lib/api';
import { useHistory } from './lib/useHistory';
import './index.css';

const STATE = {
  IDLE:      'idle',
  ANALYZING: 'analyzing',
  RESULTS:   'results',
  ERROR:     'error'
};

function App() {
  const [page, setPage] = useState('landing'); // 'landing' | 'app'
  const [appState, setAppState]       = useState(STATE.IDLE);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMessage, setErrorMessage]     = useState(null);
  const [imageUrl, setImageUrl]             = useState(null);
  const [activeTab, setActiveTab]           = useState('analyze'); // 'analyze' | 'history'

  const { history, addScan, clearHistory } = useHistory();

  async function handleAnalyze(file, previewUrl) {
    setAppState(STATE.ANALYZING);
    setErrorMessage(null);
    setAnalysisResult(null);
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(previewUrl ?? null);

    try {
      const data = await analyzePhoto(file);
      setAnalysisResult(data);
      setAppState(STATE.RESULTS);
      addScan(data);
    } catch (err) {
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
      setAppState(STATE.ERROR);
    }
  }

  function handleReset() {
    setAppState(STATE.IDLE);
    setAnalysisResult(null);
    setErrorMessage(null);
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(null);
  }

  if (page === 'landing') {
    return <LandingPage onLaunch={() => setPage('app')} />;
  }

  return (
    <div className="min-h-screen px-4 py-10" style={{ background: 'radial-gradient(ellipse at top, #1a0a00 0%, #0a0a0a 60%)' }}>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <button
            onClick={() => setPage('landing')}
            className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-orange-400 transition-colors cursor-pointer mb-5"
          >
            <RotateCcw className="w-3 h-3" />
            Back to home
          </button>
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" style={{ boxShadow: '0 0 6px #f97316' }} />
            Powered by Claude Vision AI
          </div>
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-tight text-white"
            style={{ textShadow: '0 0 30px rgba(249,115,22,0.4)' }}
          >
            AI Photo Analyzer
          </h1>
          <p className="text-gray-500 mt-2 text-sm sm:text-base">
            Upload any photo — food, plants, receipts, and more — and get instant AI insights.
          </p>
        </div>

        {/* Main card */}
        <div
          className="rounded-3xl border border-orange-500/20 p-5 sm:p-6"
          style={{
            background: 'rgba(15,15,15,0.95)',
            boxShadow: '0 0 40px rgba(249,115,22,0.08), inset 0 1px 0 rgba(249,115,22,0.1)'
          }}
        >
          {/* Tab bar */}
          <div className="flex border-b border-white/8 mb-5">
            <button
              onClick={() => setActiveTab('analyze')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'analyze'
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <ScanLine className="w-4 h-4" />
              Analyze
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'history'
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <Clock className="w-4 h-4" />
              History
              {history.length > 0 && (
                <span className="text-xs font-bold bg-orange-500/15 border border-orange-500/25 text-orange-400 px-1.5 py-0.5 rounded-full leading-none">
                  {history.length}
                </span>
              )}
            </button>
          </div>

          {/* Analyze tab */}
          {activeTab === 'analyze' && (
            <>
              <PhotoUploader
                onAnalyze={handleAnalyze}
                isLoading={appState === STATE.ANALYZING}
              />

              {/* Analyzing */}
              {appState === STATE.ANALYZING && (
                <div className="mt-6">
                  <div
                    className="rounded-2xl border border-orange-500/20 p-6 text-center"
                    style={{ background: 'rgba(249,115,22,0.04)', boxShadow: '0 0 40px rgba(249,115,22,0.06)' }}
                  >
                    {/* Scanning box */}
                    <div className="relative w-16 h-16 mx-auto mb-5">
                      {/* Outer frame */}
                      <div className="absolute inset-0 rounded-xl border border-orange-500/25 overflow-hidden bg-black/30">
                        {/* Moving scan line */}
                        <div
                          className="animate-scan-line"
                          style={{ background: 'linear-gradient(to bottom, transparent, rgba(249,115,22,0.8), transparent)', boxShadow: '0 0 10px rgba(249,115,22,0.6)' }}
                        />
                      </div>
                      {/* Corner brackets */}
                      <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-orange-400 rounded-tl-sm" />
                      <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-orange-400 rounded-tr-sm" />
                      <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-orange-400 rounded-bl-sm" />
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-orange-400 rounded-br-sm" />
                      {/* Center icon */}
                      <div className="absolute inset-3 flex items-center justify-center">
                        <ScanLine className="w-5 h-5 text-orange-400/40" />
                      </div>
                    </div>

                    <p className="text-sm font-semibold text-orange-400 mb-1">Analyzing your photo...</p>
                    <p className="text-xs text-gray-600">Claude Vision AI is reading your image</p>

                    {/* Dot wave */}
                    <div className="flex items-end justify-center gap-1 mt-4 h-4">
                      {[0, 1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className="w-1 rounded-full bg-orange-400 animate-dot-wave"
                          style={{ height: '8px', animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {appState === STATE.ERROR && (
                <div className="mt-6">
                  <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-4">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-400">Analysis failed</p>
                      <p className="text-sm text-red-500/70 mt-0.5">{errorMessage}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleReset}
                    className="mt-3 flex items-center gap-2 text-sm text-gray-600 hover:text-orange-400 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Try a different photo
                  </button>
                </div>
              )}

              {/* Results */}
              {appState === STATE.RESULTS && analysisResult && (
                <>
                  <ResultsPanel
                    category={analysisResult.category}
                    confidence={analysisResult.confidence}
                    result={analysisResult.result}
                    imageUrl={imageUrl}
                  />
                  <div className="mt-4 text-center">
                    <button
                      onClick={handleReset}
                      className="inline-flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 font-medium transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Analyze another photo
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {/* History tab */}
          {activeTab === 'history' && (
            <HistoryPanel
              history={history}
              onClearHistory={clearHistory}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
