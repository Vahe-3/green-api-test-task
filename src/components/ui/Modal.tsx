import { useEffect, useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ title, onClose, children }: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return createPortal(
    <div
      className="modal-overlay"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId} className="modal__title">
          {title}
        </h2>
        {children}
      </div>
    </div>,
    document.body,
  );
}

interface ConfirmDialogProps {
  title: string;
  text: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({ title, text, confirmLabel, onConfirm, onClose }: ConfirmDialogProps) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="modal__text">{text}</p>
      <div className="modal__actions">
        <button type="button" className="btn btn--text" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn--text btn--danger"
          autoFocus
          onClick={() => {
            onClose();
            onConfirm();
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
