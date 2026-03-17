import { useEffect, useRef, useState } from 'react';
import StatusBadge from '../ui/StatusBadge.jsx';

const FIELDS = [
  { key: 'traceLabel',    label: 'trace_label',    mono: true },
  { key: 'traceCategory', label: 'trace_category', mono: true },
  { key: 'traceInfo',     label: 'trace_info',     mono: false },
  { key: 'notes',         label: '備註',            mono: false },
];

const PLATFORM_STATUS = [
  { key: 'webStatus',     label: 'Web' },
  { key: 'iosStatus',     label: 'iOS' },
  { key: 'androidStatus', label: 'Android' },
];

function buildCode(platform, hotspot) {
  const { traceLabel: l, traceCategory: c, traceInfo: i } = hotspot;
  if (platform === 'web') {
    const params = [
      l && `  trace_label: '${l}'`,
      c && `  trace_category: '${c}'`,
      i && `  trace_info: '${i}'`,
    ].filter(Boolean);
    return `gtag('event', 'click', {\n${params.join(',\n')}\n});`;
  }
  if (platform === 'ios') {
    const params = [
      l && `  "trace_label": "${l}"`,
      c && `  "trace_category": "${c}"`,
      i && `  "trace_info": "${i}"`,
    ].filter(Boolean);
    return `Analytics.logEvent("click", parameters: [\n${params.join(',\n')}\n])`;
  }
  if (platform === 'android') {
    const params = [
      l && `  param("trace_label", "${l}")`,
      c && `  param("trace_category", "${c}")`,
      i && `  param("trace_info", "${i}")`,
    ].filter(Boolean);
    return `firebaseAnalytics.logEvent("click") {\n${params.join('\n')}\n}`;
  }
}

export default function HotspotPopover({ hotspot, index, position, containerRef, onClose, zoom = 1 }) {
  const ref = useRef();
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  function handleCopy(platform) {
    const code = buildCode(platform, hotspot);
    const el = document.createElement('textarea');
    el.value = code;
    el.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
    document.body.appendChild(el);
    el.focus();
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    setCopied(platform);
    setTimeout(() => setCopied(null), 1500);
  }

  const style = computePos(position, containerRef, zoom);

  return (
    <div ref={ref} style={{ ...style, transform: `scale(${1 / zoom})`, transformOrigin: '0 0' }} className="absolute z-20 w-[272px] bg-white rounded-xl shadow-[0_4px_20px_rgba(0,17,42,0.12)] border border-[#EBEEF3]" onMouseDown={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[#EBEEF3]">
        <span className="w-5 h-5 rounded-full bg-[#00112A] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">{index + 1}</span>
        <button onClick={onClose} className="text-[#B4B8C1] hover:text-[#636E82] text-xl leading-none ml-2">×</button>
      </div>
      <div className="px-4 py-3 space-y-3">
        {FIELDS.map(({ key, label, mono }) => {
          const val = hotspot[key];
          if (!val) return null;
          return (
            <div key={key}>
              <div className="text-[10px] font-semibold text-[#B4B8C1] uppercase tracking-wide mb-0.5">{label}</div>
              {mono
                ? <span className="inline-block px-2 py-0.5 bg-[#EBEEF3] rounded text-xs text-[#636E82] font-mono break-all">{val}</span>
                : <p className="text-xs text-[#2C3659] leading-relaxed">{val}</p>}
            </div>
          );
        })}
        <div>
          <div className="text-[10px] font-semibold text-[#B4B8C1] uppercase tracking-wide mb-1.5">實作狀態</div>
          <div className="space-y-1.5">
            {PLATFORM_STATUS.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-xs text-[#636E82]">{label}</span>
                <StatusBadge status={hotspot[key] || 'pending'} />
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-semibold text-[#B4B8C1] uppercase tracking-wide mb-1.5">複製事件代碼</div>
          <div className="flex gap-2">
            {['web', 'ios', 'android'].map(p => (
              <button key={p} onClick={() => handleCopy(p)}
                className="flex-1 text-xs py-1 rounded-md border border-[#EBEEF3] text-[#636E82] hover:bg-[#EBEEF3] transition-colors">
                {copied === p ? '✓ 已複製' : p === 'web' ? 'Web' : p === 'ios' ? 'iOS' : 'Android'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function computePos(pos, containerRef, zoom = 1) {
  if (!containerRef?.current) return { left: pos.x + 14, top: pos.y - 10 };
  const r = containerRef.current.getBoundingClientRect();
  // All calculations in CSS pixel space (divide viewport px by zoom)
  const containerW = r.width / zoom;
  const containerH = r.height / zoom;
  const W = 272, H = 360;
  const popW = W / zoom;  // CSS footprint after counter-scale
  const popH = H / zoom;
  let left = pos.x + 14, top = pos.y - 10;
  if (left + popW > containerW - 8) left = pos.x - popW - 14;
  if (top + popH > containerH - 8) top = pos.y - popH + 10;
  return { left: Math.max(4, left), top: Math.max(4, top) };
}
