import React, { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  isBefore,
  startOfDay
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  blockedDates?: string[]; // Array de strings "YYYY-MM-DD"
  closedDays?: number[];   // Array de números 0-6
  minDate?: Date;
}

export const Calendar: React.FC<CalendarProps> = ({ 
  selectedDate, 
  onDateSelect, 
  blockedDates = [], 
  closedDays = [],
  minDate = startOfDay(new Date())
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const renderHeader = () => {
    return (
      <div className="calendar-header">
        <button className="calendar-nav-btn" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft size={20} />
        </button>
        <span className="calendar-month-name">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </span>
        <button className="calendar-nav-btn" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight size={20} />
        </button>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    return (
      <div className="calendar-days-grid">
        {days.map((day, i) => (
          <div key={i} className="calendar-day-name">{day}</div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd');
        const cloneDay = day;
        const dateKey = format(day, 'yyyy-MM-dd');
        
        const isBlocked = blockedDates.includes(dateKey);
        const isClosed = closedDays.includes(day.getDay());
        const isPast = isBefore(day, minDate) && !isSameDay(day, minDate);
        const isDisabled = isBlocked || isClosed || isPast;
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;

        days.push(
          <div
            key={day.toString()}
            className={`calendar-cell ${
              !isCurrentMonth ? "disabled" : isDisabled ? "blocked" : isSelected ? "selected" : ""
            }`}
            onClick={() => !isDisabled && isCurrentMonth && onDateSelect(cloneDay)}
          >
            <span className="calendar-cell-number">{formattedDate}</span>
            {isBlocked && <span className="calendar-blocked-dot" />}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="calendar-row" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="calendar-body">{rows}</div>;
  };

  return (
    <div className="calendar-container glass-panel">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </div>
  );
};
