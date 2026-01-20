import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

export function CustomDropdown({
  options,
  value,
  onChange,
  placeholder = 'Selecione...',
  label,
  error,
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  return (
    <div style={{ position: 'relative' }}>
      {label && (
        <label style={{
          display: 'block',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#334155',
          marginBottom: '0.5rem'
        }}>
          {label}
        </label>
      )}
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: error ? '1px solid #ef4444' : '1px solid #e2e8f0',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            backgroundColor: disabled ? '#f1f5f9' : 'white',
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            textAlign: 'left',
            color: selectedOption ? '#334155' : '#94a3b8',
            opacity: disabled ? 0.7 : 1
          }}
        >
          <span>{displayText}</span>
          <ChevronDown
            size={18}
            style={{
              color: '#64748b',
              transition: 'transform 0.2s',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              flexShrink: 0,
              marginLeft: '0.5rem'
            }}
          />
        </button>

        {isOpen && !disabled && (
          <div
            style={{
              position: 'absolute',
              zIndex: 50,
              width: '100%',
              marginTop: '0.5rem',
              backgroundColor: 'white',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              overflow: 'hidden',
              border: '2px solid #93c5fd',
              borderRadius: '0.625rem',
              maxHeight: '200px',
              overflowY: 'auto'
            }}
          >
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                style={{
                  padding: '0.75rem 1rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: '#334155',
                  backgroundColor: value === option.value ? '#dbeafe' : 'white',
                  fontWeight: value === option.value ? '600' : 'normal',
                  transition: 'background-color 0.15s'
                }}
                onMouseEnter={(e) => {
                  if (value !== option.value) {
                    e.target.style.backgroundColor = '#eff6ff';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = value === option.value ? '#dbeafe' : 'white';
                }}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>
      {error && (
        <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
          {error}
        </p>
      )}
    </div>
  );
}

export default CustomDropdown;
