import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../utils/chat';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'placeholder'> {
  label: string;
  error?: string;
  hint?: ReactNode;
  trailing?: ReactNode;
}

export function TextField({ label, error, hint, trailing, id, className, ...inputProps }: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const noteId = `${inputId}-note`;
  const note = error ?? hint;

  return (
    <div className={cx('field', error && 'field--error', trailing != null && 'field--with-trailing', className)}>
      <div className="field__control">
        <input
          id={inputId}
          className="field__input"
          placeholder=" "
          aria-invalid={error ? true : undefined}
          aria-describedby={note ? noteId : undefined}
          {...inputProps}
        />
        <label htmlFor={inputId} className="field__label">
          {label}
        </label>
        {trailing && <div className="field__trailing">{trailing}</div>}
      </div>
      {note && (
        <div id={noteId} className={error ? 'field__error' : 'field__hint'}>
          {note}
        </div>
      )}
    </div>
  );
}
