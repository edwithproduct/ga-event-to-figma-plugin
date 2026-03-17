import Modal from './Modal.jsx';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title = '確認刪除', message }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} width="max-w-sm">
      <p className="text-sm text-[#636E82] mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 rounded-lg bg-[#EBEEF3] text-[#2C3659] text-sm font-medium hover:bg-[#D3D7E0]">取消</button>
        <button onClick={() => { onConfirm(); onClose(); }} className="px-4 py-2 rounded-lg bg-[#FC3258] text-white text-sm font-medium hover:bg-[#e02a4d]">刪除</button>
      </div>
    </Modal>
  );
}
