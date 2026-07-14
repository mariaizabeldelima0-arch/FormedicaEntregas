import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
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
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 280 });
  const pickerRef = useRef(null);
  const buttonRef = useRef(null);
  const calendarRef = useRef(null);

  const selectedDate = value ? new Date(value + 'T00:00:00') : null;

  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      const insideTrigger = pickerRef.current && pickerRef.current.contains(event.target);
      const insideCalendar = calendarRef.current && calendarRef.current.contains(event.target);
      if (!insideTrigger && !insideCalendar) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openCalendar = () => {
    if (disabled) return;
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // position: fixed → coordenadas relativas ao viewport (sem scrollY)
      const top = spaceBelow >= 320 ? rect.bottom + 4 : rect.top - 324;
      setDropdownPos({ top, left: rect.left, width: Math.max(rect.width, 280) });
    }
    setIsOpen(prev => !prev);
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDay = firstDay.getDay();
    const days = [];
    for (let i = 0; i < startingDay; i++) days.push(null);
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
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
      onChange(date.toISOString().split('T')[0]);
      setIsOpen(false);
    }
  };

  const isToday = (date) => {
    if (!date) return false;
    return date.toDateString() === new Date().toDateString();
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
      <div ref={pickerRef}>
        <button
          ref={buttonRef}
          type="button"
          onClick={openCalendar}
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
          <Calendar size={18} style={{ color: '#64748b', flexShrink: 0, marginLeft: '0.5rem' }} />
        </button>

        {isOpen && !disabled && ReactDOM.createPortal(
          <div
            ref={calendarRef}
            style={{
              position: 'fixed',
              zIndex: 99999,
              width: `${dropdownPos.width}px`,
              top: `${dropdownPos.top}px`,
              left: `${dropdownPos.left}px`,
              backgroundColor: 'white',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              border: '1px solid #e2e8f0',
              borderRadius: '0.5rem',
              padding: '1rem'
            }}
          >
            {/* Navegação mês */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={handlePrevMonth}
                style={{ padding: '0.5rem', borderRadius: '0.375rem', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <ChevronLeft size={20} color="#64748b" />
              </button>
              <span style={{ fontWeight: '600', color: '#334155', fontSize: '0.9rem' }}>
                {MESES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                style={{ padding: '0.5rem', borderRadius: '0.375rem', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <ChevronRight size={20} color="#64748b" />
              </button>
            </div>

            {/* Dias da semana */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem', marginBottom: '0.5rem' }}>
              {DIAS_SEMANA.map((dia) => (
                <div key={dia} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', padding: '0.25rem' }}>
                  {dia}
                </div>
              ))}
            </div>

            {/* Dias */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem' }}>
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
                    backgroundColor: isSelected(date) ? '#376295' : isToday(date) ? '#dce8f5' : 'transparent',
                    color: isSelected(date) ? 'white' : date ? '#334155' : 'transparent',
                    cursor: date ? 'pointer' : 'default',
                    fontSize: '0.875rem',
                    fontWeight: isToday(date) || isSelected(date) ? '600' : 'normal',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => { if (date && !isSelected(date)) e.target.style.backgroundColor = '#dce8f5'; }}
                  onMouseLeave={(e) => { if (date && !isSelected(date)) e.target.style.backgroundColor = isToday(date) ? '#dce8f5' : 'transparent'; }}
                >
                  {date ? date.getDate() : ''}
                </button>
              ))}
            </div>

            {/* Botão Hoje */}
            <button
              type="button"
              onClick={() => handleDateClick(new Date())}
              style={{
                width: '100%',
                marginTop: '0.75rem',
                padding: '0.5rem',
                borderRadius: '0.375rem',
                border: '1px solid #e2e8f0',
                backgroundColor: 'white',
                color: '#376295',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => { e.target.style.backgroundColor = '#dce8f5'; }}
              onMouseLeave={(e) => { e.target.style.backgroundColor = 'white'; }}
            >
              Hoje
            </button>
          </div>,
          document.body
        )}
      </div>
      {error && (
        <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{error}</p>
      )}
    </div>
  );
}

export default CustomDatePicker;
