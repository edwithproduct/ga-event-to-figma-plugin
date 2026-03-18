import { useState, useEffect } from 'react';
import Modal from '../ui/Modal.jsx';
import { STATUS_OPTIONS } from '../ui/StatusBadge.jsx';

const EMPTY = { eventName: '', traceLabel: '', traceCategory: '', traceInfo: '', webStatus: 'pending', iosStatus: 'pending', androidStatus: 'pending', notes: '' };

const PLATFORM_STATUS_FIELDS = [
  { key: 'webStatus',     label: 'Web 狀態' },
  { key: 'iosStatus',     label: 'iOS 狀態' },
  { key: 'androidStatus', label: 'Android 狀態' },
];

export default function HotspotEditModal({ isOpen, onClose, onSave, initialData, mode = 'add' }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (isOpen) setForm(initialData
      ? { eventName: initialData.eventName || '', traceLabel: initialData.traceLabel || '', traceCategory: initialData.traceCategory || '', traceInfo: initialData.traceInfo || '', webStatus: initialData.webStatus || 'pending', iosStatus: initialData.iosStatus || 'pending', androidStatus: initialData.androidStatus || 'pending', notes: initialData.notes || '' }
      : { ...EMPTY }
    );
  }, [isOpen, initialData]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'add' ? '新增熱點' : '編輯熱點'}>
      <form onSubmit={e => { e.preventDefault(); onSave(form); onClose(); }} className="space-y-4">
        {[
          { key: 'eventName',     label: '事件名稱',       ph: 'e.g. 查看點數歷程按鈕' },
          { key: 'traceLabel',    label: 'trace_label',    ph: 'e.g. point_history_view' },
          { key: 'traceCategory', label: 'trace_category', ph: 'e.g. points_center' },
          { key: 'traceInfo',     label: 'trace_info',     ph: 'e.g. 查看點數歷程' },
        ].map(({ key, label, ph }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-[#636E82] mb-1">{label}</label>
            <input value={form[key]} onChange={e => set(key, e.target.value)} placeholder={ph} className="input-field" />
          </div>
        ))}
        <div>
          <label className="block text-xs font-medium text-[#636E82] mb-2">實作狀態</label>
          <div className="space-y-2">
            {PLATFORM_STATUS_FIELDS.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs text-[#636E82] w-20 flex-shrink-0">{label}</span>
                <select value={form[key]} onChange={e => set(key, e.target.value)} className="input-field flex-1">
                  {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#636E82] mb-1">備註</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} className="input-field resize-none" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-[#EBEEF3] text-[#2C3659] text-sm font-medium">取消</button>
          <button type="submit" className="px-4 py-2 rounded-lg bg-[#2770E7] text-white text-sm font-medium hover:bg-[#1a5cc4]">{mode === 'add' ? '新增' : '儲存'}</button>
        </div>
      </form>
    </Modal>
  );
}
