import { useState, useEffect, useRef } from 'react';
import {
  ScanLine, Upload, Zap, ArrowRight, Camera, Sparkles,
  Flame, Leaf, Receipt, Sofa, Calculator, Car, Recycle,
  CheckCircle, ChevronDown, Star, Shield, Clock,
  Droplets, Sun, Wind,
} from 'lucide-react';

/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */
const MODULES = [
  {
    key: 'food', emoji: '🍽️', label: 'Food Calorie Counter',
    desc: 'Identify dishes and get instant calorie counts, macros, and nutritional insights.',
    color: '#f97316', glow: 'rgba(249,115,22,0.18)',
    preview: { type: 'food', calories: 485, protein: 28, carbs: 52, fat: 14, items: ['Grilled Chicken', 'Steamed Rice'] },
  },
  {
    key: 'plant', emoji: '🌿', label: 'Plant Health Detector',
    desc: 'PlantNet AI identifies species, Claude diagnoses diseases with expert care tips.',
    color: '#4ade80', glow: 'rgba(74,222,128,0.18)',
    preview: { type: 'plant', name: 'Shield Aralia', health: 82, status: 'Healthy' },
  },
  {
    key: 'receipt', emoji: '🧾', label: 'Receipt Scanner',
    desc: 'Extract merchant, itemized list, taxes, totals, and payment details from any receipt.',
    color: '#a78bfa', glow: 'rgba(167,139,250,0.18)',
    preview: { type: 'receipt', merchant: 'Jollibee', total: '₱ 245.00', items: 3 },
  },
  {
    key: 'room', emoji: '🛋️', label: 'Room Interior Estimator',
    desc: 'Assess style, design score, item values, and get personalized improvement suggestions.',
    color: '#38bdf8', glow: 'rgba(56,189,248,0.18)',
    preview: { type: 'room', style: 'Modern', score: 74, value: '$3,200' },
  },
  {
    key: 'math', emoji: '📐', label: 'Math Problem Solver',
    desc: 'Photograph any equation — get step-by-step solutions powered by Claude Sonnet.',
    color: '#facc15', glow: 'rgba(250,204,21,0.18)',
    preview: { type: 'math', problem: '2x + 5 = 11', answer: 'x = 3' },
  },
  {
    key: 'car', emoji: '🚗', label: 'Car Damage Estimator',
    desc: 'Assess damage severity, repair costs in USD & PHP, and find nearby repair shops.',
    color: '#fb923c', glow: 'rgba(251,146,60,0.18)',
    preview: { type: 'car', severity: 'Moderate', min: 800, max: 2400 },
  },
  {
    key: 'waste', emoji: '♻️', label: 'Waste Classifier',
    desc: 'Identify waste type — recyclable, biodegradable, hazardous — with disposal tips.',
    color: '#34d399', glow: 'rgba(52,211,153,0.18)',
    preview: { type: 'waste', category: 'Recyclable', bin: 'Blue' },
  },
];

const STEPS = [
  { icon: Upload,   title: 'Upload or Capture',     desc: 'Drag & drop a photo, browse your files, or use your camera for a real-time shot.' },
  { icon: Zap,      title: 'AI Analyzes Instantly',  desc: 'Claude Vision reads the image, identifies the subject, and runs the right module.' },
  { icon: Sparkles, title: 'Get Deep Insights',      desc: 'Structured results — data, scores, costs, steps, and recommendations — in seconds.' },
];

const STATS = [
  { value: 7,     suffix: '',    label: 'AI Modules' },
  { value: 5,     suffix: 's',   label: 'Avg. Analysis', prefix: '< ' },
  { value: 0,     suffix: '',    label: 'Sign-ups Needed' },
  { value: 100,   suffix: '%',   label: 'Free to Use' },
];

const FAQ_ITEMS = [
  {
    q: 'Is it really free?',
    a: 'Yes — completely free. No subscription, no credit card, no sign-up. Just open the app and start analyzing.',
  },
  {
    q: 'What image formats are supported?',
    a: 'JPEG, PNG, WebP, and GIF up to 10MB. You can also take a photo directly from your camera.',
  },
  {
    q: 'How accurate is the AI?',
    a: 'Plant identification uses PlantNet\'s specialized botanical model. Math solving uses Claude Sonnet. Other modules use Claude Vision with module-specific prompts — accuracy varies by photo quality.',
  },
  {
    q: 'Are my photos stored or shared?',
    a: 'No. Photos are sent to the AI for analysis and immediately discarded. Nothing is saved on any server.',
  },
];

/* ─────────────────────────────────────────────
   SCROLL ANIMATION HOOK
───────────────────────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ─────────────────────────────────────────────
   NOISE OVERLAY
───────────────────────────────────────────── */
function NoiseOverlay() {
  return <div className="noise-overlay" aria-hidden="true" />;
}

/* ─────────────────────────────────────────────
   MARQUEE TICKER
───────────────────────────────────────────── */
const TICKER_ITEMS = [
  { emoji: '🍽️', label: 'Food Calorie Counter' },
  { emoji: '🌿', label: 'Plant Health Detector' },
  { emoji: '🧾', label: 'Receipt Scanner' },
  { emoji: '🛋️', label: 'Room Interior Estimator' },
  { emoji: '📐', label: 'Math Problem Solver' },
  { emoji: '🚗', label: 'Car Damage Estimator' },
  { emoji: '♻️', label: 'Waste Classifier' },
];

function MarqueeTicker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS]; // duplicate for seamless loop
  return (
    <div
      className="overflow-hidden py-4 border-y"
      style={{
        borderColor: 'rgba(249,115,22,0.12)',
        background: 'rgba(249,115,22,0.02)',
        position: 'relative', zIndex: 2,
      }}
    >
      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 w-24 pointer-events-none" style={{ background: 'linear-gradient(to right, #080808, transparent)', zIndex: 1 }} />
      <div className="absolute inset-y-0 right-0 w-24 pointer-events-none" style={{ background: 'linear-gradient(to left, #080808, transparent)', zIndex: 1 }} />

      <div className="animate-marquee gap-8" style={{ display: 'flex', alignItems: 'center' }}>
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2.5 flex-shrink-0 px-4">
            <span className="text-lg">{item.emoji}</span>
            <span className="text-sm font-semibold text-gray-500 whitespace-nowrap">{item.label}</span>
            <span className="text-orange-500/30 text-lg font-thin mx-2">·</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ANIMATED STAT COUNTER
───────────────────────────────────────────── */
function AnimatedStat({ stat, visible }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!visible || typeof stat.value !== 'number') return;
    let start = null;
    const duration = 1200;
    const target = stat.value;

    function step(ts) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [visible, stat.value]);

  const shown = typeof stat.value === 'number' ? display : stat.value;

  return (
    <div>
      <p
        className="text-2xl font-black text-orange-400 mb-0.5"
        style={{ textShadow: '0 0 20px rgba(249,115,22,0.4)', fontVariantNumeric: 'tabular-nums' }}
      >
        {stat.prefix ?? ''}{shown}{stat.suffix}
      </p>
      <p className="text-xs text-gray-600 font-medium">{stat.label}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   FAQ
───────────────────────────────────────────── */
function FAQ() {
  const [open, setOpen] = useState(null);
  const [ref, visible] = useInView(0.15);

  return (
    <section className="py-20 px-6" style={{ position: 'relative', zIndex: 2 }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center gap-2 text-xs font-bold px-4 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', color: '#f97316' }}
          >
            FAQ
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white">Common questions</h2>
        </div>

        {/* Items */}
        <div ref={ref} className="space-y-2">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className="rounded-2xl border overflow-hidden transition-all duration-200"
                style={{
                  background: isOpen ? 'rgba(249,115,22,0.05)' : 'rgba(255,255,255,0.02)',
                  borderColor: isOpen ? 'rgba(249,115,22,0.25)' : 'rgba(255,255,255,0.07)',
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'none' : 'translateY(16px)',
                  transition: `opacity 0.45s ease ${i * 80}ms, transform 0.45s ease ${i * 80}ms, background 0.2s, border-color 0.2s`,
                }}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer"
                >
                  <span className="text-sm font-semibold text-white pr-4">{item.q}</span>
                  <div
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200"
                    style={{
                      background: isOpen ? '#f97316' : 'rgba(255,255,255,0.06)',
                      transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                    }}
                  >
                    <span className="text-xs font-bold" style={{ color: isOpen ? 'black' : '#6b7280' }}>+</span>
                  </div>
                </button>
                {isOpen && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-gray-400 leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   STATS BAR (with animated counters)
───────────────────────────────────────────── */
function StatsBar() {
  const [ref, visible] = useInView(0.5);
  return (
    <div
      ref={ref}
      className="py-6 px-6"
      style={{ position: 'relative', zIndex: 2, background: 'rgba(249,115,22,0.04)', borderTop: '1px solid rgba(249,115,22,0.1)', borderBottom: '1px solid rgba(249,115,22,0.1)' }}
    >
      <div className="max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
        {STATS.map((s) => (
          <AnimatedStat key={s.label} stat={s} visible={visible} />
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCANNER BACKGROUND
───────────────────────────────────────────── */
function ScannerBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    let scanY = -200;

    const GRID = 36, SPEED = 1.2, BEAM_H = 180, WAKE_H = 60;

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let x = GRID / 2; x < canvas.width; x += GRID) {
        for (let y = GRID / 2; y < canvas.height; y += GRID) {
          const dist = y - scanY;
          let alpha = 0.06;
          if (dist > -BEAM_H && dist < WAKE_H) {
            const t = dist < 0 ? 1 - Math.abs(dist) / BEAM_H : 1 - dist / WAKE_H;
            alpha = 0.06 + t * 0.45;
          }
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(249,115,22,${alpha})`;
          ctx.fill();
        }
      }

      const grad = ctx.createLinearGradient(0, scanY - BEAM_H, 0, scanY + WAKE_H);
      grad.addColorStop(0,    'rgba(249,115,22,0)');
      grad.addColorStop(0.6,  'rgba(249,115,22,0.04)');
      grad.addColorStop(0.88, 'rgba(249,115,22,0.12)');
      grad.addColorStop(1,    'rgba(249,115,22,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, scanY - BEAM_H, canvas.width, BEAM_H + WAKE_H);

      const lineGrad = ctx.createLinearGradient(0, 0, canvas.width, 0);
      lineGrad.addColorStop(0,    'rgba(249,115,22,0)');
      lineGrad.addColorStop(0.08, 'rgba(249,115,22,0.7)');
      lineGrad.addColorStop(0.5,  'rgba(251,191,36,1)');
      lineGrad.addColorStop(0.92, 'rgba(249,115,22,0.7)');
      lineGrad.addColorStop(1,    'rgba(249,115,22,0)');
      ctx.strokeStyle = lineGrad;
      ctx.lineWidth   = 1.5;
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur  = 16;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(canvas.width, scanY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      scanY += SPEED;
      if (scanY > canvas.height + 80) scanY = -BEAM_H;
      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />
      {[
        { top: 20, left: 20,  borderTop: 2, borderLeft: 2,  borderRadius: '6px 0 0 0' },
        { top: 20, right: 20, borderTop: 2, borderRight: 2, borderRadius: '0 6px 0 0' },
      ].map((s, i) => (
        <div key={i} className="fixed pointer-events-none w-8 h-8 hidden sm:block" style={{
          ...s,
          borderColor: 'rgba(249,115,22,0.4)', borderStyle: 'solid', borderWidth: 0,
          borderTopWidth: s.borderTop ?? 0, borderRightWidth: s.borderRight ?? 0,
          borderBottomWidth: s.borderBottom ?? 0, borderLeftWidth: s.borderLeft ?? 0,
          boxShadow: '0 0 8px rgba(249,115,22,0.2)', zIndex: 1,
        }} />
      ))}
    </>
  );
}

/* ─────────────────────────────────────────────
   APP MOCKUP  (hero preview)
───────────────────────────────────────────── */
function AppMockup() {
  return (
    <div
      className="relative mx-auto mt-16 w-full"
      style={{ maxWidth: 520, perspective: 1200 }}
    >
      {/* Glow behind the card */}
      <div
        className="absolute -inset-6 rounded-3xl pointer-events-none blur-3xl opacity-40"
        style={{ background: 'radial-gradient(ellipse at 50% 60%, rgba(249,115,22,0.35), transparent 70%)' }}
      />

      {/* Main app window */}
      <div
        className="relative rounded-2xl overflow-hidden border"
        style={{
          background: 'rgba(12,12,12,0.98)',
          borderColor: 'rgba(249,115,22,0.25)',
          boxShadow: '0 0 0 1px rgba(249,115,22,0.1), 0 40px 80px rgba(0,0,0,0.6), 0 0 60px rgba(249,115,22,0.08)',
          transform: 'perspective(1200px) rotateX(6deg)',
          transformOrigin: 'top center',
        }}
      >
        {/* Top orange stripe */}
        <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, #f97316 30%, #fbbf24 50%, #f97316 70%, transparent)' }} />

        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-white/5 px-3 py-1 rounded-full">
              <ScanLine className="w-3 h-3 text-orange-400/60" />
              AI Photo Analyzer
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-b px-4 pt-2" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-orange-400 border-b-2 border-orange-500">
            <ScanLine className="w-3 h-3" /> Analyze
          </div>
          <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600">
            <Clock className="w-3 h-3" /> History
          </div>
        </div>

        {/* Result card — food */}
        <div className="p-4 space-y-3">

          {/* Detection header */}
          <div className="rounded-xl border p-3" style={{ background: 'rgba(249,115,22,0.06)', borderColor: 'rgba(249,115,22,0.2)' }}>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 flex items-center justify-center rounded-lg text-lg" style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)' }}>🍽️</div>
                <div>
                  <p className="text-[10px] text-orange-400/60 uppercase tracking-wider font-bold">AI Detected</p>
                  <p className="text-xs font-bold text-white">Food Calorie Counter</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-1 rounded-full">
                <CheckCircle className="w-2.5 h-2.5" /> Complete
              </div>
            </div>
            {/* Confidence bar */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">High Confidence</span>
                <span className="text-[10px] font-bold text-orange-400">92%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="h-full rounded-full w-[92%]" style={{ background: 'linear-gradient(90deg, #f9731699, #f97316)', boxShadow: '0 0 8px rgba(249,115,22,0.5)' }} />
              </div>
            </div>
          </div>

          {/* Calorie hero */}
          <div className="rounded-xl border p-3 text-center" style={{ background: 'rgba(249,115,22,0.04)', borderColor: 'rgba(255,255,255,0.05)' }}>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame className="w-3 h-3 text-orange-400" />
              <span className="text-[10px] text-orange-400/60 uppercase tracking-wider font-bold">Total Calories</span>
            </div>
            <span className="text-3xl font-black text-orange-400" style={{ textShadow: '0 0 20px rgba(249,115,22,0.5)' }}>485</span>
            <span className="text-orange-400/50 text-xs ml-0.5">kcal</span>
            {/* Macro bar */}
            <div className="flex rounded-full overflow-hidden h-1.5 mt-2 mx-4">
              <div style={{ width: '35%', background: '#60a5fa' }} />
              <div style={{ width: '42%', background: '#facc15' }} />
              <div style={{ width: '23%', background: '#f97316' }} />
            </div>
            <div className="flex justify-center gap-3 mt-1.5 text-[10px] text-gray-600">
              <span><span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mr-1" />P 28g</span>
              <span><span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-400 mr-1" />C 52g</span>
              <span><span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-400 mr-1" />F 14g</span>
            </div>
          </div>

          {/* Items */}
          <div className="rounded-xl border overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}>
            {['Grilled Chicken', 'Steamed Rice'].map((name, i) => (
              <div key={i} className="flex justify-between items-center px-3 py-2 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                <span className="text-[11px] text-gray-300">{name}</span>
                <span className="text-[11px] font-bold text-orange-400">{i === 0 ? '280' : '205'} kcal</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reflection / ground glow */}
      <div
        className="absolute left-8 right-8 -bottom-4 h-8 rounded-full blur-xl opacity-30 pointer-events-none"
        style={{ background: '#f97316' }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────
   BENTO CARD
───────────────────────────────────────────── */
function BentoCard({ mod, size = 'sm' }) {
  const [hovered, setHovered] = useState(false);
  const isFeatured = size === 'featured';
  const isWide = size === 'wide';

  return (
    <div
      className="relative rounded-2xl border overflow-hidden cursor-default transition-all duration-300"
      style={{
        background: hovered ? mod.glow : 'rgba(255,255,255,0.025)',
        borderColor: hovered ? `${mod.color}45` : 'rgba(255,255,255,0.07)',
        boxShadow: hovered ? `0 0 40px ${mod.glow}` : 'none',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        padding: isFeatured ? '20px' : '16px',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${mod.color}, transparent)`, opacity: hovered ? 1 : 0 }}
      />

      {/* Corner glow */}
      {hovered && (
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none blur-2xl opacity-30"
          style={{ background: mod.color }} />
      )}

      {/* Header */}
      <div className={`flex items-start gap-3 ${isFeatured ? 'mb-4' : 'mb-2'}`}>
        <div
          className="flex items-center justify-center rounded-xl flex-shrink-0 transition-all duration-300"
          style={{
            width: isFeatured ? 48 : 36, height: isFeatured ? 48 : 36,
            fontSize: isFeatured ? 24 : 18,
            background: hovered ? mod.glow : 'rgba(255,255,255,0.05)',
            border: `1px solid ${hovered ? mod.color + '50' : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          {mod.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`font-bold text-white ${isFeatured ? 'text-base' : 'text-sm'}`}>{mod.label}</p>
          <p className={`text-gray-500 leading-relaxed mt-0.5 ${isFeatured ? 'text-sm' : 'text-xs'}`}>{mod.desc}</p>
        </div>
      </div>

      {/* Preview data — shown in featured/wide cards */}
      {(isFeatured || isWide) && mod.preview && (
        <BentoPreview preview={mod.preview} color={mod.color} wide={isWide} />
      )}

      {/* Color tag */}
      <div
        className="inline-flex items-center gap-1 mt-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
        style={{ background: `${mod.color}15`, color: mod.color, border: `1px solid ${mod.color}30` }}
      >
        <span className="w-1 h-1 rounded-full" style={{ background: mod.color }} />
        AI Module
      </div>
    </div>
  );
}

function BentoPreview({ preview, color, wide }) {
  if (preview.type === 'food') return (
    <div className="rounded-xl p-3 mt-1" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="text-center mb-2">
        <span className="text-2xl font-black" style={{ color }}>485</span>
        <span className="text-xs ml-0.5" style={{ color: `${color}80` }}>kcal</span>
      </div>
      <div className="flex rounded-full overflow-hidden h-1 mb-1.5">
        <div style={{ width: '35%', background: '#60a5fa' }} />
        <div style={{ width: '42%', background: '#facc15' }} />
        <div style={{ width: '23%', background: color }} />
      </div>
      <div className="flex justify-between text-[10px] text-gray-600">
        <span>P 28g</span><span>C 52g</span><span>F 14g</span>
      </div>
    </div>
  );
  if (preview.type === 'plant') return (
    <div className="rounded-xl p-3 mt-1 flex items-center gap-3" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div>
        <p className="text-xs font-bold text-white">{preview.name}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <div className="flex-1 bg-white/5 rounded-full h-1" style={{ width: 80 }}>
            <div className="h-1 rounded-full" style={{ width: `${preview.health}%`, background: color }} />
          </div>
          <span className="text-[10px] font-bold" style={{ color }}>{preview.health}%</span>
        </div>
      </div>
      <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>{preview.status}</span>
    </div>
  );
  if (preview.type === 'math') return (
    <div className="rounded-xl p-3 mt-1" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <p className="text-xs font-mono text-gray-400 mb-1">{preview.problem}</p>
      <p className="text-base font-black font-mono" style={{ color }}>{preview.answer}</p>
    </div>
  );
  if (preview.type === 'car') return (
    <div className="rounded-xl p-3 mt-1 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div>
        <p className="text-[10px] text-gray-600 uppercase tracking-wider">Severity</p>
        <p className="text-xs font-bold" style={{ color }}>{preview.severity}</p>
      </div>
      <div className="text-right">
        <p className="text-[10px] text-gray-600 uppercase tracking-wider">Repair Est.</p>
        <p className="text-xs font-bold text-white">${preview.min}–${preview.max}</p>
      </div>
    </div>
  );
  if (preview.type === 'room') return (
    <div className="rounded-xl p-3 mt-1 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div>
        <p className="text-[10px] text-gray-600 uppercase tracking-wider">Style</p>
        <p className="text-xs font-bold" style={{ color }}>{preview.style}</p>
      </div>
      <div className="text-right">
        <p className="text-[10px] text-gray-600 uppercase tracking-wider">Design Score</p>
        <p className="text-xs font-bold text-white">{preview.score}/100</p>
      </div>
    </div>
  );
  if (preview.type === 'waste') return (
    <div className="rounded-xl p-3 mt-1 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div>
        <p className="text-[10px] text-gray-600 uppercase tracking-wider">Category</p>
        <p className="text-xs font-bold" style={{ color }}>{preview.category}</p>
      </div>
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
        {preview.bin} Bin
      </span>
    </div>
  );
  if (preview.type === 'receipt') return (
    <div className="rounded-xl p-3 mt-1 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div>
        <p className="text-xs font-bold text-white">{preview.merchant}</p>
        <p className="text-[10px] text-gray-600 mt-0.5">{preview.items} items detected</p>
      </div>
      <p className="text-sm font-black" style={{ color }}>{preview.total}</p>
    </div>
  );
  return null;
}

/* ─────────────────────────────────────────────
   BENTO GRID  (7 cards, asymmetric)
   4-col desktop layout:
     food(2×2)  plant(1×1) receipt(1×1)
     food(2×2)  math(1×1)  waste(1×1)
     car(2×1)   room(1×1)  [empty]  <- room spans 2 rows on right?

   Simpler approach: 3-col grid with varied spans
───────────────────────────────────────────── */
function BentoGrid({ mods }) {
  const [ref, visible] = useInView(0.1);

  // map key → card config
  const food    = mods.find(m => m.key === 'food');
  const plant   = mods.find(m => m.key === 'plant');
  const receipt = mods.find(m => m.key === 'receipt');
  const room    = mods.find(m => m.key === 'room');
  const math    = mods.find(m => m.key === 'math');
  const car     = mods.find(m => m.key === 'car');
  const waste   = mods.find(m => m.key === 'waste');

  const fadeStyle = (delay) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(24px)',
    transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
  });

  return (
    <div
      ref={ref}
      style={{
        gridTemplateColumns: 'repeat(4, 1fr)',
        gridTemplateRows: 'auto auto auto',
        gridTemplateAreas: `
          "food food plant receipt"
          "food food math  waste"
          "car  car  room  room"
        `,
        gap: 12,
      }}
      className="bento-desktop"
    >
      <div style={{ gridArea: 'food',    ...fadeStyle(0)   }}><BentoCard mod={food}    size="featured" /></div>
      <div style={{ gridArea: 'plant',   ...fadeStyle(80)  }}><BentoCard mod={plant}   size="sm" /></div>
      <div style={{ gridArea: 'receipt', ...fadeStyle(120) }}><BentoCard mod={receipt} size="sm" /></div>
      <div style={{ gridArea: 'math',    ...fadeStyle(160) }}><BentoCard mod={math}    size="sm" /></div>
      <div style={{ gridArea: 'waste',   ...fadeStyle(200) }}><BentoCard mod={waste}   size="sm" /></div>
      <div style={{ gridArea: 'car',     ...fadeStyle(240) }}><BentoCard mod={car}     size="wide" /></div>
      <div style={{ gridArea: 'room',    ...fadeStyle(280) }}><BentoCard mod={room}    size="wide" /></div>
    </div>
  );
}

/* Mobile fallback: simple 2-col grid */
function MobileModuleGrid({ mods }) {
  const [ref, visible] = useInView(0.05);
  return (
    <div ref={ref} className="bento-mobile grid grid-cols-1 sm:grid-cols-2 gap-3">
      {mods.map((mod, i) => (
        <div key={mod.key} style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'none' : 'translateY(20px)',
          transition: `opacity 0.5s ease ${i * 70}ms, transform 0.5s ease ${i * 70}ms`,
        }}>
          <BentoCard mod={mod} size="sm" />
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   STEP
───────────────────────────────────────────── */
function Step({ step, index, visible }) {
  return (
    <div
      className="flex flex-col items-center text-center"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.5s ease ${index * 120}ms, transform 0.5s ease ${index * 120}ms`,
      }}
    >
      <div className="relative mb-5">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center animate-step-glow"
          style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)' }}>
          <step.icon className="w-7 h-7 text-orange-400" />
        </div>
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-black"
          style={{ background: '#f97316', boxShadow: '0 0 12px rgba(249,115,22,0.5)' }}>
          {index + 1}
        </div>
      </div>
      <p className="text-base font-bold text-white mb-2">{step.title}</p>
      <p className="text-sm text-gray-500 leading-relaxed max-w-[220px]">{step.desc}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN LANDING PAGE
───────────────────────────────────────────── */
export default function LandingPage({ onLaunch }) {
  const featuresRef = useRef(null);
  const [stepsRef, stepsVisible] = useInView(0.2);
  const [trustRef, trustVisible] = useInView(0.2);
  const [ctaRef,   ctaVisible]   = useInView(0.3);

  function scrollToFeatures() {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen text-white" style={{ background: '#080808', fontFamily: "'Inter', system-ui, sans-serif", overflowX: 'clip' }}>

      <NoiseOverlay />
      <ScannerBackground />

      {/* ── Nav ── */}
      <nav
        className="fixed top-0 left-0 right-0 flex items-center justify-between px-6 py-4"
        style={{ background: 'linear-gradient(135deg, rgba(28,8,0,0.92) 0%, rgba(12,4,0,0.90) 100%)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(249,115,22,0.18)', boxShadow: '0 1px 24px rgba(249,115,22,0.08)', zIndex: 50 }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)' }}>
            <ScanLine className="w-4 h-4 text-orange-400" />
          </div>
          <span className="text-sm font-bold text-white tracking-tight">AI Photo Analyzer</span>
        </div>
        <div className="hidden sm:flex items-center gap-6 text-xs font-medium text-orange-200/40">
          <button onClick={scrollToFeatures} className="hover:text-orange-300 transition-colors cursor-pointer">Features</button>
          <button onClick={scrollToFeatures} className="hover:text-orange-300 transition-colors cursor-pointer">How it works</button>
        </div>
        <button
          onClick={onLaunch}
          className="flex items-center gap-2 text-sm font-bold text-black px-4 py-2 rounded-xl cursor-pointer transition-all active:scale-95"
          style={{ background: '#f97316', boxShadow: '0 0 20px rgba(249,115,22,0.35)' }}
        >
          Launch App <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </nav>

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center pt-24 sm:pt-36 pb-16 px-4 sm:px-6 text-center overflow-hidden" style={{ position: 'relative', zIndex: 2 }}>
        {/* Orbs */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none blur-3xl animate-float"
          style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 70%)' }} />
        <div className="absolute top-40 -left-20 w-64 h-64 rounded-full pointer-events-none blur-3xl animate-float-2 opacity-60"
          style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 70%)' }} />
        <div className="absolute top-32 -right-10 w-48 h-48 rounded-full pointer-events-none blur-3xl animate-float opacity-40"
          style={{ background: 'radial-gradient(circle, rgba(251,146,60,0.12) 0%, transparent 70%)' }} />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full mb-7 animate-fade-up"
          style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)', color: '#fb923c' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" style={{ boxShadow: '0 0 6px #f97316' }} />
          Powered by Claude Vision AI · 7 Modules
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6 animate-fade-up-1" style={{ maxWidth: 720 }}>
          Analyze Any Photo
          <br />
          <span className="animate-shimmer-text" style={{
            background: 'linear-gradient(90deg, #f97316, #fb923c, #fbbf24, #f97316)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            with AI Vision
          </span>
        </h1>

        {/* Sub */}
        <p className="text-base sm:text-lg text-gray-500 leading-relaxed mb-10 animate-fade-up-2" style={{ maxWidth: 540 }}>
          Upload a photo of food, plants, receipts, rooms, math problems, car damage, or waste —
          and get instant, structured AI insights in seconds.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 animate-fade-up-3">
          <button
            onClick={onLaunch}
            className="cta-btn-glow flex items-center gap-2.5 text-sm font-bold text-black px-7 py-3.5 rounded-2xl cursor-pointer transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', boxShadow: '0 0 32px rgba(249,115,22,0.4), 0 4px 16px rgba(0,0,0,0.3)' }}
          >
            <Camera className="w-4 h-4" />
            Start Analyzing — It's Free
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={scrollToFeatures}
            className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white px-5 py-3.5 rounded-2xl transition-colors cursor-pointer"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            See what it can do <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* ── App Mockup ── */}
        <div className="w-full animate-fade-up-3">
          <AppMockup />
        </div>
      </section>

      {/* ── Marquee ticker ── */}
      <MarqueeTicker />

      {/* ── Stats bar ── */}
      <StatsBar />

      {/* ── Features / Bento ── */}
      <section ref={featuresRef} className="py-12 sm:py-24 px-4 sm:px-6" style={{ position: 'relative', zIndex: 2 }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 text-xs font-bold px-4 py-1.5 rounded-full mb-4"
              style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', color: '#f97316' }}>
              <Sparkles className="w-3 h-3" /> 7 AI MODULES
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">One app. Seven superpowers.</h2>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Each module is purpose-built with a dedicated AI prompt, structured output, and a polished result display.
            </p>
          </div>
          <BentoGrid mods={MODULES} />
          <MobileModuleGrid mods={MODULES} />
        </div>
      </section>

      {/* ── How it works ── */}
      <section
        className="py-12 sm:py-24 px-4 sm:px-6"
        style={{ position: 'relative', zIndex: 2, background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-xs font-bold px-4 py-1.5 rounded-full mb-4"
              style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', color: '#f97316' }}>
              <Zap className="w-3 h-3" /> HOW IT WORKS
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">Three steps to insights</h2>
            <p className="text-gray-500 text-sm">No setup. No API keys. No account required.</p>
          </div>
          <div ref={stepsRef} className="grid sm:grid-cols-3 gap-6 sm:gap-10 relative">
            <div className="hidden sm:block absolute top-8 left-[calc(16.66%+16px)] right-[calc(16.66%+16px)] h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(249,115,22,0.3), transparent)' }} />
            {STEPS.map((step, i) => (
              <Step key={step.title} step={step} index={i} visible={stepsVisible} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust signals ── */}
      <section className="py-12 sm:py-20 px-4 sm:px-6" style={{ position: 'relative', zIndex: 2 }}>
        <div className="max-w-3xl mx-auto">
          <div ref={trustRef} className="grid sm:grid-cols-3 gap-5">
            {[
              { icon: Shield, title: 'Privacy First',   desc: 'Photos are never stored. Each analysis is processed in memory and discarded immediately.' },
              { icon: Clock,  title: 'Instant Results', desc: 'Powered by Claude\'s vision API — most analyses complete in under 5 seconds.' },
              { icon: Star,   title: 'High Accuracy',   desc: 'Plant ID uses PlantNet\'s specialist model. Math uses Claude Sonnet for verified answers.' },
            ].map((item, i) => (
              <div key={item.title} className="rounded-2xl border p-5"
                style={{
                  background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)',
                  opacity: trustVisible ? 1 : 0,
                  transform: trustVisible ? 'none' : 'translateY(20px)',
                  transition: `opacity 0.5s ease ${i * 100}ms, transform 0.5s ease ${i * 100}ms`,
                }}>
                <div className="w-9 h-9 flex items-center justify-center rounded-xl mb-3"
                  style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
                  <item.icon className="w-4 h-4 text-orange-400" />
                </div>
                <p className="text-sm font-bold text-white mb-1.5">{item.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <FAQ />

      {/* ── Final CTA ── */}
      <section className="py-16 sm:py-28 px-4 sm:px-6 text-center relative overflow-hidden" style={{ position: 'relative', zIndex: 2 }}>
        <div className="absolute w-80 h-80 top-0 left-1/2 -translate-x-1/2 rounded-full pointer-events-none blur-3xl animate-float opacity-70"
          style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.2) 0%, transparent 70%)' }} />
        <div ref={ctaRef} className="relative z-10 max-w-xl mx-auto" style={{
          opacity: ctaVisible ? 1 : 0,
          transform: ctaVisible ? 'none' : 'translateY(24px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}>
          <div className="inline-flex items-center gap-2 text-xs font-bold px-4 py-1.5 rounded-full mb-6"
            style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', color: '#f97316' }}>
            <CheckCircle className="w-3 h-3" /> No sign-up · No credit card · Always free
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight"
            style={{ textShadow: '0 0 60px rgba(249,115,22,0.2)' }}>
            Ready to see what<br />
            <span style={{ color: '#f97316' }}>AI sees?</span>
          </h2>
          <p className="text-gray-500 text-sm mb-10">Upload your first photo and get results in seconds.</p>
          <button
            onClick={onLaunch}
            className="cta-btn-glow inline-flex items-center gap-3 text-base font-bold text-black px-8 py-4 rounded-2xl cursor-pointer transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', boxShadow: '0 0 48px rgba(249,115,22,0.45), 0 8px 24px rgba(0,0,0,0.4)' }}
          >
            <ScanLine className="w-5 h-5" />
            Start Analyzing Now
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="pt-10 pb-16 sm:pb-10 px-6" style={{ position: 'relative', zIndex: 2, background: 'linear-gradient(to top, rgba(28,8,0,0.85) 0%, transparent 100%)', borderTop: '1px solid rgba(249,115,22,0.18)', boxShadow: '0 -1px 40px rgba(249,115,22,0.06)' }}>
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-8 sm:gap-6">

          {/* App branding */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)' }}>
              <ScanLine className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-orange-200/70">AI Photo Analyzer</p>
              <p className="text-xs text-orange-400/40">Powered by Claude Vision AI</p>
            </div>
          </div>

          {/* Divider (desktop only) */}
          <div className="hidden sm:block h-10 w-px" style={{ background: 'rgba(249,115,22,0.15)' }} />

          {/* Signature */}
          <div className="text-center sm:text-right">
            <p className="text-xs text-orange-400/40 mb-1">Project by</p>
            <p className="text-sm font-bold text-orange-100">Cedd Dasma</p>
            <div className="flex items-center justify-center sm:justify-end gap-3 mt-2">
              <a
                href="mailto:cedd.dasma@gmail.com"
                className="text-xs text-orange-300/50 hover:text-orange-400 transition-colors"
              >
                cedd.dasma@gmail.com
              </a>
              <span className="text-orange-400/20 text-xs">·</span>
              <a
                href="https://github.com/CeddDasma-14"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-orange-300/50 hover:text-orange-400 transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                GitHub
              </a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
