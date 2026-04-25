import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, User, X } from 'lucide-react';

export default function TeamCalendarWidget({ events, onAddEvent, userRole, initials }: any) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  // Adjust for Monday as first day of week
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  
  const monthNames = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie", "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];
  const weekDays = ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du'];

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const isToday = (date: number) => {
    const today = new Date();
    return date === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
  };

  const getEventsForDay = (date: number) => {
    return events.filter((e: any) => {
      if (!e.date) return false;
      const d = new Date(e.date);
      return d.getDate() === date && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 section-reveal">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-display text-tbp-dark flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-500" />
            Calendar Disponibilitate Echipa
          </h2>
          <p className="text-sm text-gray-500 mt-1">Sesiuni de creare, vacanțe sau zile libere.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold w-32 text-center text-tbp-dark">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button onClick={nextMonth} className="p-2 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-bold text-gray-400 py-1">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="h-24 rounded-2xl bg-gray-50/30 border border-transparent"></div>
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const date = i + 1;
          const dayEvents = getEventsForDay(date);
          const currentIsToday = isToday(date);
          
          return (
            <div 
              key={date} 
              onClick={() => onAddEvent(new Date(currentDate.getFullYear(), currentDate.getMonth(), date))}
              className={`h-24 p-2 rounded-2xl border transition-all cursor-pointer group flex flex-col ${currentIsToday ? 'bg-indigo-50/30 border-indigo-200' : 'bg-white border-gray-100 hover:border-indigo-300'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${currentIsToday ? 'bg-indigo-500 text-white' : 'text-gray-500 group-hover:text-tbp-dark'}`}>
                  {date}
                </span>
                {(userRole === 'owner' || initials === 'AS' || initials === 'AR') && (
                  <span className="opacity-0 group-hover:opacity-100 text-indigo-400 hover:text-indigo-600 transition-opacity">
                    <Plus className="w-3 h-3" />
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto space-y-1 no-scrollbar mt-1">
                {dayEvents.map((evt: any, idx: number) => (
                  <div key={idx} className={`text-[9px] font-bold px-1.5 py-0.5 rounded leading-tight truncate ${evt.color || 'bg-indigo-100 text-indigo-700'}`} title={evt.title}>
                    {evt.assignee && <span className="opacity-70 mr-0.5">{evt.assignee}:</span>}
                    {evt.title.replace('[EVENT] ', '')}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
