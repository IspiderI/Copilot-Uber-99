import React, { useState, useEffect, useRef, useId } from 'react';
import { formatBRLDecimal, parseBRLDecimal } from '../utils/helpers';

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number | string | undefined | null;
  onChange: (numericValue: number, formattedValue: string) => void;
  decimals?: number;
  autoSelectOnFocus?: boolean;
  prefix?: string;
  showQuickBadge?: boolean;
}

export { formatBRLDecimal, parseBRLDecimal };

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  onBlur,
  onFocus,
  onKeyDown,
  onPaste,
  decimals = 2,
  className = '',
  placeholder = '0,00',
  autoSelectOnFocus = true,
  prefix,
  showQuickBadge = false,
  ...rest
}) => {
  const inputId = useId();

  // Helper to get formatted string from incoming prop
  const getFormattedFromProp = (val: number | string | undefined | null): string => {
    if (val === undefined || val === null || val === '') return '';
    return formatBRLDecimal(val, decimals);
  };

  const [displayValue, setDisplayValue] = useState<string>(() => getFormattedFromProp(value));
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track the last value emitted by this component to avoid fighting active user typing
  const lastEmittedValueRef = useRef<{ raw: string; num: number } | null>(null);

  // Sync with external value prop whenever it changes externally (e.g. initial edit data loaded, modal open, form reset)
  useEffect(() => {
    const isOurOwnEmission =
      lastEmittedValueRef.current !== null &&
      (value === lastEmittedValueRef.current.raw ||
        value === lastEmittedValueRef.current.num ||
        (typeof value === 'number' &&
          Math.abs(value - lastEmittedValueRef.current.num) < 0.0001) ||
        (typeof value === 'string' &&
          value.trim() === lastEmittedValueRef.current.raw.trim()));

    if (!isOurOwnEmission) {
      setDisplayValue(getFormattedFromProp(value));
    }
  }, [value, decimals]);

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const commitFormatted = (raw: string) => {
    if (!raw || raw.trim() === '') {
      setDisplayValue('');
      lastEmittedValueRef.current = { raw: '', num: 0 };
      onChange(0, '');
      return;
    }
    const parsed = parseBRLDecimal(raw);
    const formatted = formatBRLDecimal(parsed, decimals);
    setDisplayValue(formatted);
    lastEmittedValueRef.current = { raw: formatted, num: parsed };
    onChange(parsed, formatted);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDisplayValue(raw);

    const parsed = parseBRLDecimal(raw);
    const formatted = formatBRLDecimal(parsed, decimals);
    lastEmittedValueRef.current = { raw, num: parsed };
    onChange(parsed, formatted);

    // If the user entered purely digits (e.g. "44281") without comma/dot,
    // automatically format it smoothly after a short pause (750ms)
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = raw.trim();
    if (/^\d{3,}$/.test(trimmed)) {
      debounceTimerRef.current = setTimeout(() => {
        setDisplayValue(formatted);
        lastEmittedValueRef.current = { raw: formatted, num: parsed };
      }, 750);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    commitFormatted(displayValue);

    if (onBlur) {
      onBlur(e);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (autoSelectOnFocus) {
      setTimeout(() => {
        inputRef.current?.select();
      }, 20);
    }
    if (onFocus) {
      onFocus(e);
    }
  };

  const handleKeyDownInternal = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitFormatted(displayValue);
    }
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  const handlePasteInternal = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText) {
      e.preventDefault();
      const parsed = parseBRLDecimal(pastedText);
      const formatted = formatBRLDecimal(parsed, decimals);
      setDisplayValue(formatted);
      lastEmittedValueRef.current = { raw: formatted, num: parsed };
      onChange(parsed, formatted);
    }
    if (onPaste) {
      onPaste(e);
    }
  };

  const numericPreview = parseBRLDecimal(displayValue);

  return (
    <div className="relative w-full">
      <input
        id={rest.id || inputId}
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDownInternal}
        onPaste={handlePasteInternal}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
        spellCheck={false}
        {...rest}
      />
      {showQuickBadge && isFocused && displayValue && (
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] bg-zinc-800/90 text-emerald-400 font-bold px-1.5 py-0.5 rounded border border-emerald-500/30 animate-in fade-in">
          R$ {formatBRLDecimal(numericPreview, decimals)}
        </div>
      )}
    </div>
  );
};
