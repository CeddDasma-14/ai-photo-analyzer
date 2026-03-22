import { useState, useEffect } from 'react';
import { CheckCircle, Clock, Store, Calendar, CreditCard, Receipt, MapPin, Flame, Leaf, AlertTriangle, Droplets, Sun, Wind, Sprout, FlaskConical, Car, Wrench, ShieldAlert, CircleCheck, CircleX, Navigation, ExternalLink, Loader, Sofa, Star, TrendingUp, Lightbulb, Ruler } from 'lucide-react';

const MODULE_META = {
  food:       { label: 'Food Calorie Counter',   emoji: '🍽️' },
  plant:      { label: 'Plant Health Detector',  emoji: '🌿' },
  receipt:    { label: 'Receipt Scanner',         emoji: '🧾' },
  room:       { label: 'Room Interior Estimator', emoji: '🛋️' },
  math:       { label: 'Math Problem Solver',     emoji: '📐' },
  car_damage: { label: 'Car Damage Estimator',   emoji: '🚗' },
  waste:      { label: 'Waste Classifier',        emoji: '♻️' }
};

function ConfidenceBar({ confidence }) {
  const pct = Math.round(confidence * 100);
  const barColor = pct >= 80 ? '#f97316' : pct >= 50 ? '#eab308' : '#ef4444';
  const label = pct >= 80 ? 'High' : pct >= 50 ? 'Medium' : 'Low';
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: barColor }}>{label} Confidence</span>
        <span className="text-sm font-bold" style={{ color: barColor }}>{pct}%</span>
      </div>
      <div className="relative bg-white/5 rounded-full h-2 overflow-hidden">
        {/* Animated shimmer track */}
        <div className="absolute inset-0 rounded-full" style={{ background: 'rgba(255,255,255,0.03)' }} />
        <div
          className="h-2 rounded-full animate-bar-fill"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${barColor}99, ${barColor})`, boxShadow: `0 0 10px ${barColor}80` }}
        />
      </div>
    </div>
  );
}


function Row({ label, value }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex justify-between items-start py-2.5 border-b border-white/5 last:border-0">
      <span className="text-xs text-gray-500 uppercase tracking-wider flex-shrink-0 mr-4">{label}</span>
      <span className="text-sm text-gray-200 text-right">{value}</span>
    </div>
  );
}

function ReceiptResult({ data }) {
  const hasItems = Array.isArray(data.items) && data.items.length > 0;
  const cur = data.currency ?? '';

  return (
    <div className="space-y-4">
      {data.note && (
        <div className="text-xs text-yellow-500/70 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
          {data.note}
        </div>
      )}

      {/* Store info */}
      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 space-y-1">
        {data.merchant && (
          <div className="flex items-center gap-2 mb-2">
            <Store className="w-4 h-4 text-orange-400/60 flex-shrink-0" />
            <span className="text-base font-bold text-white">{data.merchant}</span>
          </div>
        )}
        {data.address && (
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-orange-400/40 flex-shrink-0 mt-0.5" />
            <span className="text-xs text-gray-500">{data.address}</span>
          </div>
        )}
        {data.date && (
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-orange-400/40 flex-shrink-0" />
            <span className="text-xs text-gray-400">{data.date}</span>
          </div>
        )}
      </div>

      {/* Receipt identifiers */}
      <div className="bg-white/[0.02] border border-white/5 rounded-xl px-4 py-1">
        <Row label="TN#" value={data.tn_number} />
        <Row label="INV#" value={data.invoice_number} />
        <Row label="Transaction#" value={data.transaction_number} />
        <Row label="Cashier" value={data.cashier} />
        <Row label="Customer #" value={data.customer_number} />
      </div>

      {/* Line items */}
      {hasItems && (
        <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
          <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2">
            <Receipt className="w-3.5 h-3.5 text-orange-400/60" />
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Items</span>
          </div>
          <div className="divide-y divide-white/5">
            {data.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-orange-400/60 font-mono flex-shrink-0">x{item.qty ?? 1}</span>
                  <span className="text-sm text-gray-300 truncate">{item.name}</span>
                </div>
                <span className="text-sm font-medium text-white flex-shrink-0 ml-3">
                  {cur} {Number(item.price).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment breakdown */}
      <div className="bg-white/[0.02] border border-orange-500/15 rounded-xl px-4 py-1">
        <Row label="VAT Sales" value={data.vat_sales !== null ? `${cur} ${Number(data.vat_sales).toFixed(2)}` : null} />
        <Row label="VAT (12%)" value={data.vat_amount !== null ? `${cur} ${Number(data.vat_amount).toFixed(2)}` : null} />
        <Row label="Amount Payable" value={data.amount_payable !== null ? `${cur} ${Number(data.amount_payable).toFixed(2)}` : null} />
        <Row label="Cash" value={data.cash !== null ? `${cur} ${Number(data.cash).toFixed(2)}` : null} />
        <Row label="Change" value={data.change !== null ? `${cur} ${Number(data.change).toFixed(2)}` : null} />
        <div className="flex justify-between items-center py-3">
          <span className="text-sm font-bold text-orange-400">Total</span>
          <span className="text-base font-bold text-orange-400" style={{ textShadow: '0 0 12px rgba(249,115,22,0.5)' }}>
            {cur} {data.total !== null ? Number(data.total).toFixed(2) : '—'}
          </span>
        </div>
      </div>

      {/* Payment method */}
      {data.payment_method && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CreditCard className="w-4 h-4 text-orange-400/40" />
          <span>Paid by <span className="text-gray-400 capitalize">{data.payment_method}</span></span>
        </div>
      )}
    </div>
  );
}

function MacroBar({ protein, carbs, fat }) {
  const total = (protein ?? 0) + (carbs ?? 0) + (fat ?? 0);
  if (total === 0) return null;
  const p = ((protein ?? 0) / total) * 100;
  const c = ((carbs ?? 0) / total) * 100;
  const f = ((fat ?? 0) / total) * 100;
  return (
    <div className="flex rounded-full overflow-hidden h-1.5 mt-2">
      <div style={{ width: `${p}%`, background: '#60a5fa' }} />
      <div style={{ width: `${c}%`, background: '#facc15' }} />
      <div style={{ width: `${f}%`, background: '#f97316' }} />
    </div>
  );
}

function FoodResult({ data }) {
  const hasItems = Array.isArray(data.items) && data.items.length > 0;

  return (
    <div className="space-y-4">
      {data.note && (
        <div className="text-xs text-yellow-500/70 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
          {data.note}
        </div>
      )}

      {/* Calorie hero */}
      <div
        className="rounded-xl border border-orange-500/20 p-4 text-center"
        style={{ background: 'rgba(249,115,22,0.05)' }}
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <Flame className="w-5 h-5 text-orange-400" />
          <span className="text-xs text-orange-400/60 uppercase tracking-wider font-semibold">Total Calories</span>
        </div>
        <span
          className="text-2xl sm:text-3xl lg:text-4xl font-bold text-orange-400"
          style={{ textShadow: '0 0 20px rgba(249,115,22,0.5)' }}
        >
          {data.total_calories ?? '—'}
        </span>
        <span className="text-orange-400/50 text-sm ml-1">kcal</span>
        {data.meal_type && (
          <p className="text-xs text-gray-600 mt-1 capitalize">{data.meal_type}</p>
        )}
        {/* Total macro bar */}
        <div className="mt-3">
          <MacroBar protein={data.total_protein_g} carbs={data.total_carbs_g} fat={data.total_fat_g} />
          <div className="flex justify-center gap-4 mt-2 text-xs text-gray-500">
            <span><span className="inline-block w-2 h-2 rounded-full bg-blue-400 mr-1" />P {data.total_protein_g ?? '—'}g</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-yellow-400 mr-1" />C {data.total_carbs_g ?? '—'}g</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-orange-400 mr-1" />F {data.total_fat_g ?? '—'}g</span>
          </div>
        </div>
      </div>

      {/* Per-item breakdown */}
      {hasItems && (
        <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
          <div className="px-4 py-2 border-b border-white/5">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Items</span>
          </div>
          <div className="divide-y divide-white/5">
            {data.items.map((item, i) => (
              <div key={i} className="px-4 py-3">
                <div className="flex justify-between items-start">
                  <div className="min-w-0 mr-3">
                    <p className="text-sm font-medium text-white">{item.name}</p>
                    {item.portion && <p className="text-xs text-gray-600 mt-0.5">{item.portion}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-sm font-bold text-orange-400">{item.calories ?? '—'}</span>
                    <span className="text-xs text-gray-600 ml-0.5">kcal</span>
                  </div>
                </div>
                <MacroBar protein={item.protein_g} carbs={item.carbs_g} fat={item.fat_g} />
                <div className="flex gap-3 mt-1.5 text-xs text-gray-600">
                  <span>P {item.protein_g ?? '—'}g</span>
                  <span>C {item.carbs_g ?? '—'}g</span>
                  <span>F {item.fat_g ?? '—'}g</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const WASTE_BADGE = {
  recyclable:    { label: '♻️ Recyclable',    bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.3)',  text: '#4ade80' },
  biodegradable: { label: '🌱 Biodegradable', bg: 'rgba(180,83,9,0.15)', border: 'rgba(217,119,6,0.3)',  text: '#d97706' },
  hazardous:     { label: '⚠️ Hazardous',     bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)',  text: '#f87171' },
  residual:      { label: '🗑️ Residual',      bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.3)', text: '#9ca3af' }
};

function WasteResult({ data }) {
  const hasItems = Array.isArray(data.items) && data.items.length > 0;

  return (
    <div className="space-y-4">
      {data.note && (
        <div className="text-xs text-yellow-500/70 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
          {data.note}
        </div>
      )}

      {/* Items */}
      {hasItems && (
        <div className="space-y-3">
          {data.items.map((item, i) => {
            const badge = WASTE_BADGE[item.waste_type] ?? WASTE_BADGE.residual;
            return (
              <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-sm font-semibold text-white">{item.name}</p>
                    {item.material && (
                      <p className="text-xs text-gray-600 mt-0.5 capitalize">{item.material}</p>
                    )}
                  </div>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{ background: badge.bg, border: `1px solid ${badge.border}`, color: badge.text }}
                  >
                    {badge.label}
                  </span>
                </div>
                {item.disposal && (
                  <p className="text-xs text-gray-400 leading-relaxed">{item.disposal}</p>
                )}
                {item.bin_color && (
                  <p className="text-xs text-gray-600 mt-1.5">
                    Bin: <span className="text-gray-400 capitalize">{item.bin_color}</span>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {data.summary && (
        <div
          className="rounded-xl border border-orange-500/15 p-4"
          style={{ background: 'rgba(249,115,22,0.05)' }}
        >
          <p className="text-xs font-semibold text-orange-400/60 uppercase tracking-wider mb-1">Summary</p>
          <p className="text-sm text-gray-300">{data.summary}</p>
        </div>
      )}

      {/* Environmental note */}
      {data.environmental_note && (
        <p className="text-xs text-gray-600 italic px-1">{data.environmental_note}</p>
      )}
    </div>
  );
}

function MathResult({ data }) {
  const hasSteps = Array.isArray(data.steps) && data.steps.length > 0;

  return (
    <div className="space-y-4">
      {data.note && (
        <div className="text-xs text-yellow-500/70 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
          {data.note}
        </div>
      )}

      {/* Problem */}
      {data.problem && (
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">Problem</p>
              <p className="text-base font-mono text-white">{data.problem}</p>
            </div>
            {data.problem_type && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 bg-orange-500/10 border border-orange-500/20 text-orange-400 capitalize">
                {data.problem_type}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Steps */}
      {hasSteps && (
        <div className="space-y-2">
          <p className="text-xs text-gray-600 uppercase tracking-wider px-1">Solution Steps</p>
          {data.steps.map((s, i) => (
            <div key={i} className="flex gap-3 bg-white/[0.02] border border-white/5 rounded-xl p-3">
              <div
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-black"
                style={{ background: '#f97316', boxShadow: '0 0 8px rgba(249,115,22,0.4)' }}
              >
                {s.step}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 mb-1">{s.description}</p>
                {s.expression && (
                  <p className="text-sm font-mono text-white bg-black/30 rounded px-2 py-1 inline-block">
                    {s.expression}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Answer */}
      {data.answer !== null && (
        <div
          className="rounded-xl border border-orange-500/25 p-4 text-center"
          style={{ background: 'rgba(249,115,22,0.05)', boxShadow: '0 0 20px rgba(249,115,22,0.08)' }}
        >
          <p className="text-xs text-orange-400/60 uppercase tracking-wider mb-1">Answer</p>
          <p
            className="text-xl sm:text-2xl lg:text-3xl font-bold font-mono text-orange-400"
            style={{ textShadow: '0 0 20px rgba(249,115,22,0.5)' }}
          >
            {data.answer}
            {data.answer_unit && <span className="text-lg ml-1 text-orange-400/60">{data.answer_unit}</span>}
          </p>
        </div>
      )}

      {/* Explanation */}
      {data.explanation && (
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
          <p className="text-xs text-gray-600 uppercase tracking-wider mb-1.5">Explanation</p>
          <p className="text-sm text-gray-400 leading-relaxed">{data.explanation}</p>
        </div>
      )}
    </div>
  );
}

const HEALTH_COLOR = {
  healthy:  '#4ade80',
  stressed: '#facc15',
  diseased: '#fb923c',
  dying:    '#f87171',
};

const SEVERITY_STYLE = {
  mild:     { bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.3)',  text: '#4ade80' },
  moderate: { bg: 'rgba(250,204,21,0.1)',  border: 'rgba(250,204,21,0.3)',  text: '#facc15' },
  severe:   { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)', text: '#f87171' },
};

function HealthArc({ score, status }) {
  const color = HEALTH_COLOR[status] ?? '#6b7280';
  const radius = 50;
  const circumference = Math.PI * radius; // half-circle
  const filled = score !== null ? (score / 100) * circumference : 0;

  return (
    <div className="flex flex-col items-center py-2">
      <svg width="120" height="72" viewBox="0 0 120 72">
        {/* Track */}
        <path
          d="M 10 65 A 50 50 0 0 1 110 65"
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Fill */}
        <path
          d="M 10 65 A 50 50 0 0 1 110 65"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="text-center -mt-2">
        <span className="text-2xl sm:text-3xl font-bold" style={{ color, textShadow: `0 0 16px ${color}80` }}>
          {score ?? '—'}
        </span>
        <span className="text-gray-500 text-sm ml-1">/100</span>
        <p className="text-xs font-semibold uppercase tracking-wider mt-0.5 capitalize" style={{ color }}>
          {status ?? 'Unknown'}
        </p>
      </div>
    </div>
  );
}

const CARE_ITEMS = [
  { key: 'watering',   label: 'Watering',   Icon: Droplets },
  { key: 'light',      label: 'Light',       Icon: Sun },
  { key: 'soil',       label: 'Soil',        Icon: Sprout },
  { key: 'fertilizer', label: 'Fertilizer',  Icon: FlaskConical },
  { key: 'humidity',   label: 'Humidity',    Icon: Wind },
];

function PlantResult({ data }) {
  const hasIssues = Array.isArray(data.issues) && data.issues.length > 0;
  const showUrgency = data.urgency === 'medium' || data.urgency === 'high';
  const urgencyStyle = data.urgency === 'high'
    ? { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', text: '#f87171', label: 'Urgent Care Required' }
    : { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', text: '#fbbf24', label: 'Attention Needed' };

  return (
    <div className="space-y-4">
      {data.note && (
        <div className="text-xs text-yellow-500/70 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
          {data.note}
        </div>
      )}

      {/* Plant name */}
      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="bg-green-500/10 border border-green-500/20 rounded-full p-2 flex-shrink-0">
            <Leaf className="w-4 h-4 text-green-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-base font-bold text-white">{data.plant_name}</p>
              {data.identification_confidence && (() => {
                const confStyle = {
                  high:   { bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.3)',  text: '#4ade80' },
                  medium: { bg: 'rgba(250,204,21,0.1)',  border: 'rgba(250,204,21,0.3)',  text: '#facc15' },
                  low:    { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)', text: '#f87171' },
                }[data.identification_confidence] ?? {};
                return (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 capitalize"
                    style={{ background: confStyle.bg, border: `1px solid ${confStyle.border}`, color: confStyle.text }}>
                    {data.identification_confidence} confidence
                  </span>
                );
              })()}
            </div>
            {data.scientific_name && (
              <p className="text-xs text-gray-500 italic mt-0.5">{data.scientific_name}</p>
            )}
            {data.identification_notes && (
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">{data.identification_notes}</p>
            )}
          </div>
        </div>
      </div>

      {/* Health arc */}
      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider text-center mb-1">Health Score</p>
        <HealthArc score={data.health_score} status={data.health_status} />
      </div>

      {/* Urgency banner */}
      {showUrgency && (
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-3"
          style={{ background: urgencyStyle.bg, border: `1px solid ${urgencyStyle.border}` }}
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: urgencyStyle.text }} />
          <span className="text-sm font-semibold" style={{ color: urgencyStyle.text }}>{urgencyStyle.label}</span>
        </div>
      )}

      {/* Issues */}
      <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
        <div className="px-4 py-2 border-b border-white/5">
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Issues Detected</span>
        </div>
        {hasIssues ? (
          <div className="divide-y divide-white/5">
            {data.issues.map((item, i) => {
              const style = SEVERITY_STYLE[item.severity] ?? SEVERITY_STYLE.moderate;
              return (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <p className="text-sm font-medium text-white capitalize">{item.issue}</p>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 capitalize"
                      style={{ background: style.bg, border: `1px solid ${style.border}`, color: style.text }}
                    >
                      {item.severity}
                    </span>
                  </div>
                  {item.cause && <p className="text-xs text-gray-500">{item.cause}</p>}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-gray-600 px-4 py-3">No issues detected</p>
        )}
      </div>

      {/* Care recommendations */}
      <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
        <div className="px-4 py-2 border-b border-white/5">
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Care Guide</span>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-white/5">
          {CARE_ITEMS.map(({ key, label, Icon }) => {
            const value = data.care?.[key];
            if (!value) return null;
            return (
              <div key={key} className="p-3 flex gap-2 items-start">
                <Icon className="w-3.5 h-3.5 text-orange-400/60 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-600 uppercase tracking-wider mb-0.5">{label}</p>
                  <p className="text-xs text-gray-300 leading-relaxed">{value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div className="rounded-xl border border-orange-500/15 p-4" style={{ background: 'rgba(249,115,22,0.05)' }}>
          <p className="text-xs font-semibold text-orange-400/60 uppercase tracking-wider mb-1">Summary</p>
          <p className="text-sm text-gray-300 leading-relaxed">{data.summary}</p>
        </div>
      )}
    </div>
  );
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function NearbyShops() {
  const [state, setState] = useState('idle'); // idle | locating | loading | done | error
  const [shops, setShops] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [userCoords, setUserCoords] = useState(null);

  async function findShops() {
    setState('locating');
    setErrorMsg('');

    let coords;
    try {
      coords = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          err => reject(err),
          { timeout: 10000 }
        );
      });
    } catch {
      setState('error');
      setErrorMsg('Location access denied. Please allow location permission and try again.');
      return;
    }

    setUserCoords(coords);
    setState('loading');

    try {
      const query = `
        [out:json][timeout:20];
        (
          node["shop"="car_repair"](around:5000,${coords.lat},${coords.lng});
          node["amenity"="car_repair"](around:5000,${coords.lat},${coords.lng});
          node["shop"="vehicle_repair"](around:5000,${coords.lat},${coords.lng});
        );
        out body 10;
      `;
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
      });
      const json = await res.json();
      const elements = json.elements ?? [];

      const results = elements
        .map(el => ({
          id: el.id,
          name: el.tags?.name ?? 'Car Repair Shop',
          address: [el.tags?.['addr:street'], el.tags?.['addr:city']].filter(Boolean).join(', ') || null,
          phone: el.tags?.phone ?? el.tags?.['contact:phone'] ?? null,
          lat: el.lat,
          lng: el.lon,
          distance: haversineKm(coords.lat, coords.lng, el.lat, el.lon),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5);

      setShops(results);
      setState('done');
    } catch {
      setState('error');
      setErrorMsg('Could not fetch nearby shops. Please try again.');
    }
  }

  function directionsUrl(shop) {
    return `https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${shop.lat},${shop.lng}&travelmode=driving`;
  }

  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation className="w-3.5 h-3.5 text-orange-400/60" />
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Nearest Repair Shops</span>
        </div>
        {state === 'idle' || state === 'error' ? (
          <button
            onClick={findShops}
            className="text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors cursor-pointer bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full"
          >
            Find Near Me
          </button>
        ) : null}
      </div>

      <div className="px-4 py-3">
        {state === 'idle' && (
          <p className="text-xs text-gray-600">Click "Find Near Me" to locate car repair shops within 5km of you.</p>
        )}

        {(state === 'locating' || state === 'loading') && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Loader className="w-3.5 h-3.5 animate-spin text-orange-400" />
            {state === 'locating' ? 'Getting your location...' : 'Searching nearby shops...'}
          </div>
        )}

        {state === 'error' && (
          <p className="text-xs text-red-400">{errorMsg}</p>
        )}

        {state === 'done' && shops.length === 0 && (
          <p className="text-xs text-gray-600">No car repair shops found within 5km. Try a wider search on Google Maps.</p>
        )}

        {state === 'done' && shops.length > 0 && (
          <div className="space-y-2">
            {shops.map(shop => (
              <div key={shop.id} className="flex items-start justify-between gap-3 py-2 border-b border-white/5 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{shop.name}</p>
                  {shop.address && <p className="text-xs text-gray-600 mt-0.5 truncate">{shop.address}</p>}
                  {shop.phone && <p className="text-xs text-gray-600">{shop.phone}</p>}
                  <p className="text-xs text-orange-400/70 mt-0.5">{shop.distance.toFixed(1)} km away</p>
                </div>
                <a
                  href={directionsUrl(shop)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-semibold text-orange-400 hover:text-orange-300 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1.5 rounded-lg flex-shrink-0 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Directions
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const DAMAGE_SEVERITY_STYLE = {
  minor:      { bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.3)',  text: '#4ade80' },
  moderate:   { bg: 'rgba(250,204,21,0.1)',  border: 'rgba(250,204,21,0.3)',  text: '#facc15' },
  severe:     { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)', text: '#f87171' },
  total_loss: { bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.5)',   text: '#ef4444' },
};

const DAMAGE_TYPE_LABEL = {
  dent: 'Dent', scratch: 'Scratch', crack: 'Crack', shatter: 'Shatter',
  broken: 'Broken', missing: 'Missing', paint_damage: 'Paint Damage', deformation: 'Deformation'
};

function CarDamageResult({ data }) {
  const hasDamage = Array.isArray(data.damage_areas) && data.damage_areas.length > 0;
  const severityStyle = DAMAGE_SEVERITY_STYLE[data.overall_severity] ?? DAMAGE_SEVERITY_STYLE.moderate;
  const vehicleLabel = [data.vehicle?.color, data.vehicle?.make, data.vehicle?.model].filter(Boolean).join(' ');

  const [phpRate, setPhpRate] = useState(null);
  const [rateLoading, setRateLoading] = useState(true);

  useEffect(() => {
    fetch('https://api.frankfurter.app/latest?from=USD&to=PHP')
      .then(r => r.json())
      .then(json => setPhpRate(json.rates?.PHP ?? null))
      .catch(() => setPhpRate(null))
      .finally(() => setRateLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      {data.note && (
        <div className="text-xs text-yellow-500/70 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
          {data.note}
        </div>
      )}

      {/* Vehicle info */}
      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 flex items-center gap-3">
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-full p-2 flex-shrink-0">
          <Car className="w-4 h-4 text-orange-400" />
        </div>
        <div>
          <p className="text-base font-bold text-white capitalize">{vehicleLabel || 'Unknown Vehicle'}</p>
          {data.vehicle?.type && (
            <p className="text-xs text-gray-500 capitalize mt-0.5">{data.vehicle.type}</p>
          )}
        </div>
      </div>

      {/* Overall severity + driveability */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-600 uppercase tracking-wider mb-1.5">Overall Severity</p>
          <span
            className="text-sm font-bold px-3 py-1 rounded-full capitalize"
            style={{ background: severityStyle.bg, border: `1px solid ${severityStyle.border}`, color: severityStyle.text }}
          >
            {data.overall_severity?.replace('_', ' ') ?? '—'}
          </span>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-600 uppercase tracking-wider mb-1.5">Driveable</p>
          {data.is_driveable === true && (
            <div className="flex items-center justify-center gap-1.5 text-green-400">
              <CircleCheck className="w-4 h-4" />
              <span className="text-sm font-bold">Yes</span>
            </div>
          )}
          {data.is_driveable === false && (
            <div className="flex items-center justify-center gap-1.5 text-red-400">
              <CircleX className="w-4 h-4" />
              <span className="text-sm font-bold">No</span>
            </div>
          )}
          {data.is_driveable === null && (
            <span className="text-sm text-gray-600">Unknown</span>
          )}
        </div>
      </div>

      {/* Airbag warning */}
      {data.airbags_deployed === true && (
        <div className="flex items-center gap-2 rounded-xl px-4 py-3 bg-red-500/10 border border-red-500/30">
          <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="text-sm font-semibold text-red-400">Airbags deployed — do not drive</span>
        </div>
      )}

      {/* Repair estimate */}
      {(data.repair_estimate?.min !== null || data.repair_estimate?.max !== null) && (
        <div
          className="rounded-xl border border-orange-500/25 p-4"
          style={{ background: 'rgba(249,115,22,0.05)', boxShadow: '0 0 20px rgba(249,115,22,0.06)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-orange-400/60" />
              <p className="text-xs font-semibold text-orange-400/60 uppercase tracking-wider">Estimated Repair Cost</p>
            </div>
            {phpRate && (
              <span className="text-xs text-gray-600">
                Live rate: <span className="text-gray-500">₱{phpRate.toFixed(2)}/USD</span>
              </span>
            )}
          </div>

          {/* USD */}
          <p className="text-2xl font-bold text-orange-400" style={{ textShadow: '0 0 16px rgba(249,115,22,0.4)' }}>
            ${data.repair_estimate.min?.toLocaleString()} – ${data.repair_estimate.max?.toLocaleString()}
            <span className="text-sm text-orange-400/50 ml-1">USD</span>
          </p>

          {/* PHP conversion */}
          {rateLoading ? (
            <p className="text-xs text-gray-600 mt-1">Fetching live PHP rate...</p>
          ) : phpRate ? (
            <p className="text-base font-semibold text-gray-400 mt-0.5">
              ≈ ₱{Math.round(data.repair_estimate.min * phpRate).toLocaleString()} – ₱{Math.round(data.repair_estimate.max * phpRate).toLocaleString()}
              <span className="text-xs text-gray-600 ml-1">PHP</span>
            </p>
          ) : (
            <p className="text-xs text-gray-600 mt-1">PHP conversion unavailable</p>
          )}

          {data.repair_estimate.note && (
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">{data.repair_estimate.note}</p>
          )}
        </div>
      )}

      {/* Damage areas */}
      <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
        <div className="px-4 py-2 border-b border-white/5">
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Damage Breakdown</span>
        </div>
        {hasDamage ? (
          <div className="divide-y divide-white/5">
            {data.damage_areas.map((item, i) => {
              const style = DAMAGE_SEVERITY_STYLE[item.severity] ?? DAMAGE_SEVERITY_STYLE.moderate;
              return (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-sm font-medium text-white capitalize">{item.part}</p>
                      {item.damage_type && (
                        <span className="text-xs text-gray-600 bg-white/5 px-1.5 py-0.5 rounded">
                          {DAMAGE_TYPE_LABEL[item.damage_type] ?? item.damage_type}
                        </span>
                      )}
                    </div>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 capitalize"
                      style={{ background: style.bg, border: `1px solid ${style.border}`, color: style.text }}
                    >
                      {item.severity}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-gray-600 px-4 py-3">No damage detected</p>
        )}
      </div>

      {/* Summary */}
      {data.summary && (
        <div className="rounded-xl border border-orange-500/15 p-4" style={{ background: 'rgba(249,115,22,0.05)' }}>
          <p className="text-xs font-semibold text-orange-400/60 uppercase tracking-wider mb-1">Summary</p>
          <p className="text-sm text-gray-300 leading-relaxed">{data.summary}</p>
        </div>
      )}

      {/* Nearby repair shops */}
      <NearbyShops />
    </div>
  );
}

const CONDITION_STYLE = {
  excellent: { text: '#4ade80', label: 'Excellent' },
  good:      { text: '#a3e635', label: 'Good' },
  fair:      { text: '#facc15', label: 'Fair' },
  poor:      { text: '#f87171', label: 'Poor' },
};

const PRIORITY_STYLE = {
  high:   { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)', text: '#f87171' },
  medium: { bg: 'rgba(250,204,21,0.1)',  border: 'rgba(250,204,21,0.3)',  text: '#facc15' },
  low:    { bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.3)',  text: '#4ade80' },
};

function DesignScoreBar({ score }) {
  if (score === null) return null;
  const color = score >= 80 ? '#4ade80' : score >= 60 ? '#facc15' : score >= 40 ? '#fb923c' : '#f87171';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-white/5 rounded-full h-2.5">
        <div
          className="h-2.5 rounded-full transition-all"
          style={{ width: `${score}%`, background: color, boxShadow: `0 0 8px ${color}80` }}
        />
      </div>
      <span className="text-sm font-bold w-10 text-right" style={{ color }}>{score}</span>
    </div>
  );
}

function RoomResult({ data }) {
  const hasItems        = Array.isArray(data.items)        && data.items.length > 0;
  const hasStrengths    = Array.isArray(data.strengths)    && data.strengths.length > 0;
  const hasImprovements = Array.isArray(data.improvements) && data.improvements.length > 0;
  const hasColors       = Array.isArray(data.color_palette) && data.color_palette.length > 0;
  const condStyle       = CONDITION_STYLE[data.condition] ?? { text: '#6b7280', label: data.condition };

  const [phpRate, setPhpRate] = useState(null);
  const [manualPrices, setManualPrices] = useState({});

  useEffect(() => {
    fetch('https://api.frankfurter.app/latest?from=USD&to=PHP')
      .then(r => r.json())
      .then(json => setPhpRate(json.rates?.PHP ?? null))
      .catch(() => null);
  }, []);

  function setManualPrice(i, val) {
    setManualPrices(prev => ({ ...prev, [i]: val }));
  }

  // Compute total PHP incorporating live prices + manual entries + AI estimates
  const computedTotalPhp = (() => {
    if (!hasItems) return null;
    const rate = phpRate ?? 56;
    let total = 0;
    data.items.forEach((item, i) => {
      if (item.ph_price?.avg_php) {
        total += item.ph_price.avg_php;
      } else if (manualPrices[i] !== undefined && manualPrices[i] !== '') {
        const parsed = parseFloat(String(manualPrices[i]).replace(/,/g, ''));
        if (!isNaN(parsed) && parsed > 0) total += parsed;
        else if (item.estimated_value_usd) total += Math.round(item.estimated_value_usd * rate);
      } else if (item.estimated_value_usd) {
        total += Math.round(item.estimated_value_usd * rate);
      }
    });
    return total || null;
  })();

  const hasManualEntry = Object.values(manualPrices).some(v => v !== '' && !isNaN(parseFloat(String(v).replace(/,/g, ''))));

  return (
    <div className="space-y-4">
      {data.note && (
        <div className="text-xs text-yellow-500/70 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
          {data.note}
        </div>
      )}

      {/* Room header */}
      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-full p-2 flex-shrink-0">
              <Sofa className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <p className="text-base font-bold text-white capitalize">{data.room_type ?? 'Room'}</p>
              {data.style && (
                <p className="text-xs text-gray-500 capitalize mt-0.5">{data.style} style</p>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            {data.condition && (
              <span className="text-xs font-semibold capitalize" style={{ color: condStyle.text }}>
                {condStyle.label} condition
              </span>
            )}
            {data.natural_light && (
              <p className="text-xs text-gray-600 mt-0.5 capitalize">{data.natural_light} natural light</p>
            )}
          </div>
        </div>

        {/* Color palette */}
        {hasColors && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
            <span className="text-xs text-gray-600">Palette:</span>
            <div className="flex items-center gap-1.5">
              {data.color_palette.map((color, i) => (
                <span key={i} className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded-full capitalize">{color}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Design score */}
      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Star className="w-3.5 h-3.5 text-orange-400/60" />
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Design Score</span>
        </div>
        <DesignScoreBar score={data.design_score} />
      </div>

      {/* Measurements */}
      {data.measurements && (data.measurements.estimated_area_sqm || data.measurements.estimated_length_m) && (
        <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
          <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ruler className="w-3.5 h-3.5 text-orange-400/60" />
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Room Measurements</span>
            </div>
            {data.measurements.confidence && (() => {
              const confStyle = {
                high:   { bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.3)',  text: '#4ade80' },
                medium: { bg: 'rgba(250,204,21,0.1)',  border: 'rgba(250,204,21,0.3)',  text: '#facc15' },
                low:    { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)', text: '#f87171' },
              }[data.measurements.confidence] ?? {};
              return (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                  style={{ background: confStyle.bg, border: `1px solid ${confStyle.border}`, color: confStyle.text }}>
                  {data.measurements.confidence} confidence
                </span>
              );
            })()}
          </div>

          <div className="grid grid-cols-2 divide-x divide-y divide-white/5">
            {data.measurements.estimated_length_m && (
              <div className="p-3 text-center">
                <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">Length</p>
                <p className="text-xl font-bold text-white">{data.measurements.estimated_length_m}<span className="text-sm text-gray-500 ml-1">m</span></p>
              </div>
            )}
            {data.measurements.estimated_width_m && (
              <div className="p-3 text-center">
                <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">Width</p>
                <p className="text-xl font-bold text-white">{data.measurements.estimated_width_m}<span className="text-sm text-gray-500 ml-1">m</span></p>
              </div>
            )}
            {data.measurements.estimated_height_m && (
              <div className="p-3 text-center">
                <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">Ceiling Height</p>
                <p className="text-xl font-bold text-white">{data.measurements.estimated_height_m}<span className="text-sm text-gray-500 ml-1">m</span></p>
              </div>
            )}
            {data.measurements.estimated_area_sqm && (
              <div className="p-3 text-center">
                <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">Floor Area</p>
                <p className="text-xl font-bold text-orange-400" style={{ textShadow: '0 0 12px rgba(249,115,22,0.4)' }}>
                  {data.measurements.estimated_area_sqm}<span className="text-sm text-orange-400/50 ml-1">m²</span>
                </p>
              </div>
            )}
          </div>

          {/* Per-element measurements */}
          {Array.isArray(data.measurements.elements) && data.measurements.elements.length > 0 && (
            <div className="border-t border-white/5">
              <div className="px-4 py-2 border-b border-white/5">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Element Measurements</span>
              </div>
              <div className="divide-y divide-white/5">
                {data.measurements.elements.map((el, i) => {
                  const typeColor = {
                    window: '#60a5fa', door: '#a78bfa', wall: '#fb923c',
                    ceiling: '#34d399', floor: '#facc15', archway: '#f472b6'
                  }[el.type] ?? '#9ca3af';
                  return (
                    <div key={i} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize flex-shrink-0"
                              style={{ background: `${typeColor}18`, border: `1px solid ${typeColor}40`, color: typeColor }}
                            >
                              {el.type}
                            </span>
                            <p className="text-sm font-medium text-white capitalize truncate">{el.element}</p>
                          </div>
                          {el.location && <p className="text-xs text-gray-600 mt-0.5">{el.location}</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          {el.width_m && el.height_m && (
                            <p className="text-sm font-bold text-white">{el.width_m}m × {el.height_m}m</p>
                          )}
                          {el.area_sqm && (
                            <p className="text-xs text-orange-400">{el.area_sqm} m²</p>
                          )}
                        </div>
                      </div>
                      {el.notes && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{el.notes}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {data.measurements.reference_used && (
            <div className="px-4 py-2 border-t border-white/5">
              <p className="text-xs text-gray-600 italic">{data.measurements.reference_used}</p>
            </div>
          )}
          <div className="px-4 py-2 border-t border-white/5 bg-yellow-500/5">
            <p className="text-xs text-yellow-500/60">⚠ AI estimates only — use a measuring tape for accurate construction measurements.</p>
          </div>
        </div>
      )}

      {/* Estimated value */}
      {data.total_estimated_value_usd !== null && (
        <div
          className="rounded-xl border border-orange-500/25 p-4"
          style={{ background: 'rgba(249,115,22,0.05)', boxShadow: '0 0 20px rgba(249,115,22,0.06)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-orange-400/60" />
            <p className="text-xs font-semibold text-orange-400/60 uppercase tracking-wider">Estimated Room Value</p>
          </div>
          <p className="text-2xl font-bold text-orange-400" style={{ textShadow: '0 0 16px rgba(249,115,22,0.4)' }}>
            ${data.total_estimated_value_usd.toLocaleString()}
            <span className="text-sm text-orange-400/50 ml-1">USD</span>
          </p>
          {computedTotalPhp ? (
            <p className="text-base font-semibold text-gray-400 mt-0.5">
              ≈ ₱{computedTotalPhp.toLocaleString()}
              <span className="text-xs ml-1" style={{ color: hasManualEntry ? '#fb923c' : data.total_estimated_value_php ? '#4ade80' : '#6b7280' }}>
                {hasManualEntry ? '● Includes your prices' : data.total_estimated_value_php ? '● Live PH prices' : 'PHP'}
              </span>
            </p>
          ) : null}
        </div>
      )}

      {/* Strengths */}
      {hasStrengths && (
        <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
          <div className="px-4 py-2 border-b border-white/5">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Strengths</span>
          </div>
          <div className="px-4 py-2 space-y-2">
            {data.strengths.map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-300">{s}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Items */}
      {hasItems && (
        <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
          <div className="px-4 py-2 border-b border-white/5">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Items Detected</span>
          </div>
          <div className="divide-y divide-white/5">
            {data.items.map((item, i) => {
              const cond = CONDITION_STYLE[item.condition];
              return (
                <div key={i} className="flex items-center justify-between px-4 py-2.5 gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-200 capitalize">{item.name}</p>
                    {item.condition && (
                      <p className="text-xs mt-0.5" style={{ color: cond?.text ?? '#6b7280' }}>{cond?.label ?? item.condition}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {item.ph_price ? (
                      <>
                        <p className="text-sm font-semibold text-orange-400">
                          ₱{item.ph_price.avg_php.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-600">
                          ₱{item.ph_price.min_php.toLocaleString()} – ₱{item.ph_price.max_php.toLocaleString()}
                        </p>
                        <p className="text-xs text-green-500/60">● Live PH price</p>
                      </>
                    ) : (
                      <div className="flex flex-col items-end gap-1">
                        {item.estimated_value_usd != null && (
                          <p className="text-xs text-gray-600">${item.estimated_value_usd.toLocaleString()} AI est.</p>
                        )}
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-600">₱</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="Enter price"
                            value={manualPrices[i] ?? ''}
                            onChange={e => setManualPrice(i, e.target.value)}
                            className="w-24 bg-white/[0.04] border border-white/10 rounded px-2 py-1 text-xs text-gray-200 placeholder-gray-700 focus:outline-none focus:border-orange-500/50 text-right"
                          />
                        </div>
                        {manualPrices[i] && !isNaN(parseFloat(String(manualPrices[i]).replace(/,/g, ''))) && parseFloat(String(manualPrices[i]).replace(/,/g, '')) > 0 && (
                          <p className="text-xs text-orange-400/70">● Your price</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Improvement suggestions */}
      {hasImprovements && (
        <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
          <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2">
            <Lightbulb className="w-3.5 h-3.5 text-orange-400/60" />
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Improvement Suggestions</span>
          </div>
          <div className="divide-y divide-white/5">
            {data.improvements.map((item, i) => {
              const pStyle = PRIORITY_STYLE[item.priority] ?? PRIORITY_STYLE.medium;
              return (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <p className="text-sm text-gray-200">{item.suggestion}</p>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 capitalize"
                      style={{ background: pStyle.bg, border: `1px solid ${pStyle.border}`, color: pStyle.text }}
                    >
                      {item.priority}
                    </span>
                  </div>
                  {item.estimated_cost_usd != null && (
                    <p className="text-xs text-gray-600">
                      Est. cost: <span className="text-gray-400">${item.estimated_cost_usd.toLocaleString()} USD
                      {phpRate && ` (≈ ₱${Math.round(item.estimated_cost_usd * phpRate).toLocaleString()})`}
                      </span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary */}
      {data.summary && (
        <div className="rounded-xl border border-orange-500/15 p-4" style={{ background: 'rgba(249,115,22,0.05)' }}>
          <p className="text-xs font-semibold text-orange-400/60 uppercase tracking-wider mb-1">Summary</p>
          <p className="text-sm text-gray-300 leading-relaxed">{data.summary}</p>
        </div>
      )}

    </div>
  );
}

function ModuleResult({ category, result, imageUrl }) {
  if (!result) return null;

  if (result.status === 'coming_soon') {
    return (
      <div className="text-center py-4">
        <p className="text-gray-600 text-sm">{result.data?.message}</p>
        <div
          className="mt-3 inline-flex items-center gap-1.5 text-orange-400 text-xs font-semibold px-3 py-1.5 rounded-full border border-orange-500/20"
          style={{ background: 'rgba(249,115,22,0.08)' }}
        >
          <Clock className="w-3 h-3" />
          Coming in Phase 2
        </div>
      </div>
    );
  }

  if (category === 'receipt' && result.status === 'success') {
    return <ReceiptResult data={result.data} />;
  }

  if (category === 'food' && result.status === 'success') {
    return <FoodResult data={result.data} />;
  }

  if (category === 'waste' && result.status === 'success') {
    return <WasteResult data={result.data} />;
  }

  if (category === 'math' && result.status === 'success') {
    return <MathResult data={result.data} />;
  }

  if (category === 'plant' && result.status === 'success') {
    return <PlantResult data={result.data} />;
  }

  if (category === 'car_damage' && result.status === 'success') {
    return <CarDamageResult data={result.data} />;
  }

  if (category === 'room' && result.status === 'success') {
    return <RoomResult data={result.data} />;
  }

  return (
    <pre className="text-xs text-gray-400 bg-black/30 rounded-lg p-3 overflow-auto">
      {JSON.stringify(result.data, null, 2)}
    </pre>
  );
}

function ResultsPanel({ category, confidence, result, imageUrl }) {
  const meta = MODULE_META[category] ?? { label: category, emoji: '🔍' };

  return (
    <div className="w-full max-w-xl mx-auto mt-6 space-y-3">
      {/* Detection card */}
      <div
        className="rounded-2xl border border-orange-500/25 overflow-hidden animate-fade-up-1"
        style={{ background: 'rgba(249,115,22,0.05)', boxShadow: '0 0 32px rgba(249,115,22,0.1)' }}
      >
        {/* Top stripe */}
        <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, #f97316, transparent)' }} />

        <div className="p-5">
          {/* Module identity row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* Emoji in a glowing badge */}
              <div
                className="w-12 h-12 flex items-center justify-center rounded-2xl text-2xl flex-shrink-0"
                style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)', boxShadow: '0 0 20px rgba(249,115,22,0.1)' }}
              >
                {meta.emoji}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-orange-500/50 mb-0.5">AI Detected</p>
                <h2 className="text-lg font-bold text-white leading-tight">{meta.label}</h2>
              </div>
            </div>
            <div
              className="flex items-center gap-1.5 text-xs font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full"
              style={{ boxShadow: '0 0 12px rgba(249,115,22,0.1)' }}
            >
              <CheckCircle className="w-3.5 h-3.5" style={{ filter: 'drop-shadow(0 0 4px #f97316)' }} />
              Complete
            </div>
          </div>

          {/* Confidence */}
          <ConfidenceBar confidence={confidence} />
        </div>
      </div>

      {/* Result card */}
      {result && (
        <div
          className="rounded-2xl border border-white/5 p-5 animate-fade-up-2"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          {/* Section header */}
          <div className="flex items-center gap-2 mb-5 pb-3 border-b border-white/5">
            <div
              className="w-1.5 h-4 rounded-full"
              style={{ background: 'linear-gradient(to bottom, #f97316, #c2410c)', boxShadow: '0 0 8px rgba(249,115,22,0.5)' }}
            />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Analysis Result</span>
          </div>
          <ModuleResult category={category} result={result} imageUrl={imageUrl} />
        </div>
      )}
    </div>
  );
}

export default ResultsPanel;
