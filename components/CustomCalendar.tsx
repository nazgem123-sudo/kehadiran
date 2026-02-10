
import React, { useState, useMemo, useEffect } from 'react';
import { getLocalISOString } from '../App';

interface CustomCalendarProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  recordedDates: Set<string>;
}

const CustomCalendar: React.FC<CustomCalendarProps> = ({ selectedDate, onDateChange, recordedDates }) => {
  // Sync viewDate when selectedDate changes to a different month
  const [viewDate, setViewDate] = useState(new Date(selectedDate));

  useEffect(() => {
    const currentViewMonth = viewDate.getMonth();
    const currentViewYear = viewDate.getFullYear();
    const selected = new Date(selectedDate);
    
    if (selected.getMonth() !== currentViewMonth || selected.getFullYear() !== currentViewYear) {
      setViewDate(new Date(selected.getFullYear(), selected.getMonth(), 1));
    }
  }, [selectedDate]);

  const daysInMonth = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Padding for first week
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Actual days
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [viewDate]);

  const monthName = viewDate.toLocaleString('ms-MY', { month: 'long' });
  const year = viewDate.getFullYear();

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const isToday = (date: Date) => {
    const todayStr = getLocalISOString();
    const dateStr = getLocalISOString(date);
    return todayStr === dateStr;
  };

  const isSelected = (date: Date) => {
    const dStr = getLocalISOString(date);
    return dStr === selectedDate;
  };

  const hasData = (date: Date) => {
    const dStr = getLocalISOString(date);
    return recordedDates.has(dStr);
  };

  return (
    <div className="bg-white border border-slate-100 rounded-[32px] shadow-sm p-6 w-full max-w-[340px] select-none">
      {/* Header: Month Year + Arrows */}
      <div className="flex justify-between items-center mb-8 px-1">
        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">
          {monthName} {year}
        </h4>
        <div className="flex gap-2">
          <button 
            onClick={handlePrevMonth} 
            className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 rounded-full text-slate-400 transition-colors"
          >
            <i className="fas fa-chevron-left text-xs"></i>
          </button>
          <button 
            onClick={handleNextMonth} 
            className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 rounded-full text-slate-400 transition-colors"
          >
            <i className="fas fa-chevron-right text-xs"></i>
          </button>
        </div>
      </div>

      {/* Week Headers */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {['A', 'I', 'S', 'R', 'K', 'J', 'S'].map(d => (
          <div key={d} className="text-[11px] font-black text-slate-300 text-center py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-y-2 gap-x-1">
        {daysInMonth.map((date, idx) => {
          if (!date) return <div key={`empty-${idx}`} />;
          
          const selected = isSelected(date);
          const active = hasData(date);
          const today = isToday(date);

          return (
            <button
              key={idx}
              onClick={() => onDateChange(getLocalISOString(date))}
              className={`
                relative h-11 flex flex-col items-center justify-center rounded-2xl text-[13px] transition-all
                ${selected ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 font-bold z-10' : 'hover:bg-slate-50 text-slate-500'}
                ${today && !selected ? 'border border-indigo-100 bg-indigo-50/30' : ''}
              `}
            >
              <span className={`
                ${active ? 'font-black text-slate-950 scale-105' : 'font-medium'} 
                ${selected ? 'text-white font-black' : ''}
              `}>
                {date.getDate()}
              </span>
              {active && (
                <span className={`
                  absolute bottom-1.5 w-1.5 h-1.5 rounded-full 
                  ${selected ? 'bg-white shadow-sm' : 'bg-indigo-600'}
                `}></span>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Footer / Legend */}
      <div className="mt-8 pt-5 border-t border-slate-50 flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 shadow-sm shadow-indigo-100"></div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ada Rekod</span>
        </div>
        <button 
          onClick={() => onDateChange(getLocalISOString())}
          className="text-[10px] font-black text-indigo-600 uppercase hover:text-indigo-800 transition-colors tracking-widest"
        >
          Hari Ini
        </button>
      </div>
    </div>
  );
};

export default CustomCalendar;
