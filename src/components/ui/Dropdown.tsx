import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cx } from '../../utils/chat';
import { Icon, type IconName } from './Icon';

export interface DropdownItem {
  label: string;
  icon: IconName;
  onSelect: () => void;
  danger?: boolean;
  trailing?: ReactNode;
}

interface DropdownProps {
  icon: IconName;
  label: string;
  items: DropdownItem[];
  header?: ReactNode;
  align?: 'left' | 'right';
}

export function Dropdown({ icon, label, items, header, align = 'left' }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="dropdown" ref={rootRef}>
      <button
        type="button"
        className={cx('icon-btn', open && 'icon-btn--active')}
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name={icon} />
      </button>

      {open && (
        <div className={`dropdown__menu dropdown__menu--${align}`} role="menu">
          {header && <div className="dropdown__header">{header}</div>}
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className={cx('dropdown__item', item.danger && 'dropdown__item--danger')}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
            >
              <Icon name={item.icon} size={22} />
              <span className="dropdown__label">{item.label}</span>
              {item.trailing}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
