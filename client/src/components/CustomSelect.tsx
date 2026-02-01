import { useState, useRef, useEffect } from 'react';
import styles from './CustomSelect.module.css';

interface Option {
  value: string | number;
  label: string;
}

interface Props {
  value: string | number;
  onChange: (value: string | number) => void;
  options: Option[];
  disabled?: boolean;
}

function CustomSelect({ value, onChange, options, disabled = false }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string | number) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''} ${disabled ? styles.triggerDisabled : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span className={styles.selectedValue}>{selectedOption?.label || 'Select...'}</span>
        <span className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownInner}>
            {options.map((option) => (
              <button
                key={option.value}
                className={`${styles.option} ${option.value === value ? styles.optionSelected : ''}`}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
                {option.value === value && <span className={styles.checkmark}>✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomSelect;
