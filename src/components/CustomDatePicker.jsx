import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function CustomDatePicker({
  value,
  onChange,
  label,
  error,
  disabled = false,
  placeholder = 'Selecione a data'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const pickerRef = useRef(null);

  // Parse the value to Date object
  const selectedDate = value ? new Date(value + 'T00:00:00') : null;

  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date + 'T00:00:00');
    return d.toLocaleDateString('pt-BR');
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    // Days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (date) => {
    if (date) {
      const formattedDate = date.toISOString().split('T')[0];
      onChange(formattedDate);
      setIsOpen(false);
    }
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const days = getDaysInMonth(currentMonth);

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
      <div ref={pickerRef} style={{ position: 'relative' }}>
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
            color: value ? '#334155' : '#94a3b8',
            opacity: disabled ? 0.7 : 1
          }}
        >
          <span>{value ? formatDate(value) : placeholder}</span>
          <Calendar
            size={18}
            style={{
              color: '#64748b',
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
              width: '280px',
              marginTop: '0.25rem',
              backgroundColor: 'white',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0',
              borderRadius: '0.5rem',
              padding: '1rem'
            }}
          >
            {/* Header - Month/Year Navigation */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem'
            }}>
              <button
                type="button"
                onClick={handlePrevMonth}
                style={{
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <ChevronLeft size={20} color="#64748b" />
              </button>
              <span style={{
                fontWeight: '600',
                color: '#334155',
                fontSize: '0.9rem'
              }}>
                {MESES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                style={{
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <ChevronRight size={20} color="#64748b" />
              </button>
            </div>

            {/* Days of Week Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '0.25rem',
              marginBottom: '0.5rem'
            }}>
              {DIAS_SEMANA.map((dia) => (
                <div
                  key={dia}
                  style={{
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#64748b',
                    padding: '0.25rem'
                  }}
                >
                  {dia}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '0.25rem'
            }}>
              {days.map((date, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDateClick(date)}
                  disabled={!date}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    backgroundColor: isSelected(date)
                      ? '#3b82f6'
                      : isToday(date)
                        ? '#dbeafe'
                        : 'transparent',
                    color: isSelected(date)
                      ? 'white'
                      : date
                        ? '#334155'
                        : 'transparent',
                    cursor: date ? 'pointer' : 'default',
                    fontSize: '0.875rem',
                    fontWeight: isToday(date) || isSelected(date) ? '600' : 'normal',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    if (date && !isSelected(date)) {
                      e.target.style.backgroundColor = '#e3f2fd';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (date && !isSelected(date)) {
                      e.target.style.backgroundColor = isToday(date) ? '#dbeafe' : 'transparent';
                    }
                  }}
                >
                  {date ? date.getDate() : ''}
                </button>
              ))}
            </div>

            {/* Today Button */}
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                handleDateClick(today);
              }}
              style={{
                width: '100%',
                marginTop: '0.75rem',
                padding: '0.5rem',
                borderRadius: '0.375rem',
                border: '1px solid #e2e8f0',
                backgroundColor: 'white',
                color: '#3b82f6',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#e3f2fd';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'white';
              }}
            >
              Hoje
            </button>
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

export default CustomDatePicker;
