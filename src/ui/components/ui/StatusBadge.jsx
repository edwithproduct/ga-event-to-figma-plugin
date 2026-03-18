const STATUS_CONFIG = {
  pending:        { label: '待實作', className: 'bg-[#B4B8C1] text-white' },
  implemented:    { label: '已實作', className: 'bg-[#FBB100] text-white' },
  tested:         { label: '已測試', className: 'bg-[#2770E7] text-white' },
  live:           { label: '已上線', className: 'bg-[#00C853] text-white' },
  deprecated:     { label: '已棄用', className: 'bg-[#FC3258] text-white opacity-60' },
  no_requirement: { label: '無需求', className: 'bg-[#EBEEF3] text-[#636E82]' },
};

export const STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({ value, label }));
export const STATUS_DOT_COLORS = { pending: '#B4B8C1', implemented: '#FBB100', tested: '#2770E7', live: '#00C853', deprecated: '#FC3258', no_requirement: '#EBEEF3' };

export default function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.className}`}>{c.label}</span>;
}
