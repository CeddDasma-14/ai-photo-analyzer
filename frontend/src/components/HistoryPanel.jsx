import { useState } from 'react';
import { Clock, Trash2, ScanLine, ChevronDown, ChevronUp } from 'lucide-react';
import ResultsPanel from './ResultsPanel';

const MODULE_META = {
  food:       { label: 'Food Calorie Counter',   emoji: '🍽️' },
  plant:      { label: 'Plant Health Detector',  emoji: '🌿' },
  receipt:    { label: 'Receipt Scanner',         emoji: '🧾' },
  room:       { label: 'Room Interior Estimator', emoji: '🛋️' },
  math:       { label: 'Math Problem Solver',     emoji: '📐' },
  car_damage: { label: 'Car Damage Estimator',    emoji: '🚗' },
  waste:      { label: 'Waste Classifier',        emoji: '♻️' },
};

function formatRelative(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  <  1) return 'just now';
  if (mins  < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function MiniConfidenceBar({ confidence }) {
  const pct      = Math.round(confidence * 100);
  const barColor = pct >= 80 ? '#f97316' : pct >= 50 ? '#eab308' : '#ef4444';
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 bg-white/5 rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
      <span className="text-xs font-medium w-8 text-right" style={{ color: barColor }}>{pct}%</span>
    </div>
  );
}

function confidenceBorderColor(confidence) {
  const pct = Math.round(confidence * 100);
  if (pct >= 80) return '#f97316';
  if (pct >= 50) return '#eab308';
  return '#ef4444';
}

function ScanCard({ scan, isExpanded, onToggle }) {
  const meta = MODULE_META[scan.category] ?? { label: scan.category, emoji: '🔍' };
  const borderColor = confidenceBorderColor(scan.confidence);

  return (
    <div
      className="rounded-xl border border-white/5 overflow-hidden transition-all duration-200 animate-fade-up"
      style={{
        background: isExpanded ? 'rgba(249,115,22,0.04)' : 'rgba(255,255,255,0.02)',
        borderColor: isExpanded ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.05)',
        boxShadow: isExpanded ? '0 0 20px rgba(249,115,22,0.06)' : 'none',
      }}
    >
      {/* Colored left accent bar */}
      <div className="flex">
        <div
          className="w-0.5 flex-shrink-0 rounded-l-xl transition-all duration-200"
          style={{ background: isExpanded ? borderColor : 'transparent', boxShadow: isExpanded ? `0 0 8px ${borderColor}60` : 'none' }}
        />

        {/* Card header — always visible */}
        <button
          onClick={onToggle}
          className="flex-1 flex items-center gap-3 px-4 py-3.5 transition-colors cursor-pointer text-left group"
        >
          {/* Emoji badge */}
          <div
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl text-xl transition-all duration-200"
            style={{
              background: isExpanded ? 'rgba(249,115,22,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isExpanded ? 'rgba(249,115,22,0.25)' : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            {meta.emoji}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate group-hover:text-orange-100 transition-colors">
              {meta.label}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Clock className="w-3 h-3 text-gray-600 flex-shrink-0" />
              <p className="text-xs text-gray-500">{formatRelative(scan.timestamp)}</p>
              {scan.from_cache && (
                <span className="text-xs text-orange-400/40 ml-1">· cached</span>
              )}
            </div>
          </div>

          <div className="w-16 sm:w-20 flex-shrink-0">
            <MiniConfidenceBar confidence={scan.confidence} />
          </div>

          <div
            className="flex-shrink-0 ml-1 transition-all duration-200"
            style={{ color: isExpanded ? '#f97316' : '#4b5563' }}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>
      </div>

      {/* Expanded result */}
      {isExpanded && (
        <div className="border-t border-white/5 px-2 py-2 animate-fade-up">
          <ResultsPanel
            category={scan.category}
            confidence={scan.confidence}
            result={scan.result}
            imageUrl={null}
          />
        </div>
      )}
    </div>
  );
}

export default function HistoryPanel({ history, onClearHistory }) {
  const [expandedId, setExpandedId] = useState(null);

  function toggle(id) {
    setExpandedId(prev => prev === id ? null : id);
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-400/60" />
          <span className="text-sm font-semibold text-gray-400">Scan History</span>
          {history.length > 0 && (
            <span className="text-xs font-semibold bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
              {history.length}
            </span>
          )}
        </div>
        {history.length > 0 && (
          <button
            onClick={() => { if (window.confirm('Clear all scan history?')) onClearHistory(); }}
            className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-red-400 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear all
          </button>
        )}
      </div>

      {/* Empty state */}
      {history.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-up">
          {/* Animated icon with orbiting rings */}
          <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
            {/* Orbit rings */}
            <div className="absolute inset-0 rounded-full border border-orange-500/10 animate-orbit" />
            <div className="absolute inset-3 rounded-full border border-orange-500/15 animate-orbit-2" />
            <div className="absolute inset-6 rounded-full border border-orange-500/20 animate-orbit-3" />
            {/* Center */}
            <div
              className="relative z-10 bg-white/[0.03] border border-white/8 rounded-full p-4"
              style={{ boxShadow: '0 0 24px rgba(249,115,22,0.08)' }}
            >
              <ScanLine className="w-7 h-7 text-gray-700" />
            </div>
          </div>
          <p className="text-sm font-semibold text-gray-500">No scans yet</p>
          <p className="text-xs text-gray-700 mt-1.5 max-w-[200px] leading-relaxed">
            Upload a photo to start — results will be saved here automatically
          </p>
        </div>
      )}

      {/* Scan list */}
      {history.length > 0 && (
        <div className="space-y-2 max-h-72 sm:max-h-[60vh] overflow-y-auto pr-1">
          {history.map(scan => (
            <ScanCard
              key={scan.id}
              scan={scan}
              isExpanded={expandedId === scan.id}
              onToggle={() => toggle(scan.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
