'use client';

import { useState, useEffect, useRef } from 'react';
import { CalendarEvent, ViewMode } from '@/types';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { AgendaView } from './AgendaView';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List } from '@/components/ui/icons';
import { addMonths, addWeeks, addDays, subMonths, subWeeks, subDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useSettings } from '@/components/providers/settings-provider';

interface CalendarProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDayClick?: (date: Date) => void;
}

export function Calendar({ events, onEventClick, onDayClick }: CalendarProps) {
  const { settings, isLoaded } = useSettings();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | 'none'>('none');
  const viewContainerRef = useRef<HTMLDivElement>(null);

  // Set initial view mode from settings when loaded
  useEffect(() => {
    if (isLoaded) {
      setViewMode(settings.defaultView);
    }
  }, [isLoaded, settings.defaultView]);

  // Animer les transitions de date
  const animateTransition = (direction: 'left' | 'right') => {
    setSlideDirection(direction);
    setIsTransitioning(true);
    setTimeout(() => {
      setIsTransitioning(false);
      setSlideDirection('none');
    }, 200);
  };

  const handlePrevious = () => {
    animateTransition('right');
    switch (viewMode) {
      case 'month':
        setCurrentDate(subMonths(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case 'day':
      case 'agenda':
        setCurrentDate(subDays(currentDate, 1));
        break;
    }
  };

  const handleNext = () => {
    animateTransition('left');
    switch (viewMode) {
      case 'month':
        setCurrentDate(addMonths(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case 'day':
      case 'agenda':
        setCurrentDate(addDays(currentDate, 1));
        break;
    }
  };

  const handleToday = () => {
    const today = new Date();
    if (currentDate.toDateString() !== today.toDateString()) {
      animateTransition(currentDate > today ? 'right' : 'left');
    }
    setCurrentDate(today);
  };

  const getTitle = () => {
    switch (viewMode) {
      case 'month':
        return format(currentDate, 'MMMM yyyy', { locale: fr });
      case 'week':
        return `Semaine du ${format(currentDate, 'd MMMM yyyy', { locale: fr })}`;
      case 'day':
        return format(currentDate, 'd MMMM yyyy', { locale: fr });
      case 'agenda':
        return `À partir du ${format(currentDate, 'd MMMM', { locale: fr })}`;
    }
  };

  // Classes pour l'animation
  const getTransitionClasses = () => {
    if (!isTransitioning) return 'opacity-100 translate-x-0';
    if (slideDirection === 'left') return 'opacity-0 -translate-x-4';
    if (slideDirection === 'right') return 'opacity-0 translate-x-4';
    return '';
  };

  return (
    <div className="bg-notion-bg rounded-lg shadow-sm border border-notion-border flex flex-col" style={{height: '100%', maxHeight: '100%', overflow: 'hidden'}}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-notion-border" style={{flexShrink: 0}}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleToday}
              className="px-4 py-2 text-sm font-medium text-notion-text hover:bg-notion-hover rounded-lg transition-colors"
            >
              Aujourd hui
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevious}
                className="p-2 hover:bg-notion-hover rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-notion-text" />
              </button>
              <button
                onClick={handleNext}
                className="p-2 hover:bg-notion-hover rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-notion-text" />
              </button>
            </div>
            <h2 className="text-xl font-semibold text-notion-text capitalize">
              {getTitle()}
            </h2>
          </div>

          {/* View mode selector */}
          <div className="flex items-center gap-2 bg-notion-sidebar rounded-lg p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                viewMode === 'month'
                  ? 'bg-notion-bg text-notion-text shadow-sm'
                  : 'text-notion-textLight hover:text-notion-text'
              }`}
            >
              Mois
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                viewMode === 'week'
                  ? 'bg-notion-bg text-notion-text shadow-sm'
                  : 'text-notion-textLight hover:text-notion-text'
              }`}
            >
              Semaine
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                viewMode === 'day'
                  ? 'bg-notion-bg text-notion-text shadow-sm'
                  : 'text-notion-textLight hover:text-notion-text'
              }`}
            >
              Jour
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-1.5 ${
                viewMode === 'agenda'
                  ? 'bg-notion-bg text-notion-text shadow-sm'
                  : 'text-notion-textLight hover:text-notion-text'
              }`}
            >
              <List className="w-4 h-4" />
              Liste
            </button>
          </div>
        </div>
      </div>

      {/* Calendar view with transitions */}
      <div 
        ref={viewContainerRef}
        className={`relative transition-all duration-200 ease-out ${getTransitionClasses()}`} 
        style={{flex: 1, minHeight: 0, maxHeight: '100%', overflow: 'hidden'}}
      >
        {viewMode === 'month' && (
          <div style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden'}}>
            <MonthView
              currentDate={currentDate}
              events={events}
              onEventClick={onEventClick}
              onDayClick={onDayClick}
              weekStartsOn={settings.weekStartsOn}
              showWeekNumbers={settings.showWeekNumbers}
              timeFormat={settings.timeFormat}
            />
          </div>
        )}
        {viewMode === 'week' && (
          <div style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden'}}>
            <WeekView
              currentDate={currentDate}
              events={events}
              onEventClick={onEventClick}
              weekStartsOn={settings.weekStartsOn}
              timeFormat={settings.timeFormat}
            />
          </div>
        )}
        {viewMode === 'day' && (
          <div style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden'}}>
            <DayView
              currentDate={currentDate}
              events={events}
              onEventClick={onEventClick}
              timeFormat={settings.timeFormat}
            />
          </div>
        )}
        {viewMode === 'agenda' && (
          <div style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden'}}>
            <AgendaView
              currentDate={currentDate}
              events={events}
              onEventClick={onEventClick}
              timeFormat={settings.timeFormat}
            />
          </div>
        )}
      </div>
    </div>
  );
}
