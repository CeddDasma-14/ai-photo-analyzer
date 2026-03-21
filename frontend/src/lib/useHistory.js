import { useState } from 'react';

const STORAGE_KEY = 'ai_photo_analyzer_history';
const MAX_SCANS   = 20;

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

export function useHistory() {
  const [history, setHistory] = useState(loadHistory);

  function addScan({ category, confidence, result, from_cache }) {
    const entry = {
      id:         String(Date.now()),
      timestamp:  new Date().toISOString(),
      category,
      confidence,
      result,
      from_cache: from_cache ?? false,
    };
    setHistory(prev => {
      const updated = [entry, ...prev].slice(0, MAX_SCANS);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }

  function clearHistory() {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  return { history, addScan, clearHistory };
}
