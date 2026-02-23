'use client';

import { useState, useEffect, useRef } from 'react';
import { CalendarEvent, ViewMode } from '@/types';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { AgendaView } from './AgendaView';
import { ArbreView } from './ArbreView';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List, Network } from '@/components/ui/icons';
import { addMonths, addWeeks, addDays, subMonths, subWeeks, subDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useSettings } from '@/components/providers/settings-provider';

interface CalendarProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDayClick?: (date: Date) => void;
  onOpenArbre?: () => void;
}

export function Calendar({ events, onEventClick, onDayClick, onOpenArbre }: CalendarProps) {
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
    if (currentDate.toDateString() !== today.toDateString() && viewMode !== 'arbre') {
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
      case 'arbre':
        return 'Arbres de préparation';
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
    <div className="bg-notion-bg rounded-lg shadow-sm border border-notion-border flex flex-col" style={{ height: '100%', maxHeight: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div className="p-3 lg:px-6 lg:py-4 border-b border-notion-border" style={{ flexShrink: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-4 w-full sm:w-auto">
            <button
              onClick={handleToday}
              className="px-3 py-1.5 lg:px-4 lg:py-2 text-sm font-medium text-notion-text hover:bg-notion-hover rounded-lg transition-colors"
            >
              Aujourd'hui
            </button>
            <div className="flex items-center gap-1 lg:gap-2">
              <button
                onClick={handlePrevious}
                className="p-1.5 lg:p-2 hover:bg-notion-hover rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-notion-text" />
              </button>
              <button
                onClick={handleNext}
                className="p-1.5 lg:p-2 hover:bg-notion-hover rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-notion-text" />
              </button>
            </div>
            <h2 className="text-sm lg:text-base font-medium text-notion-text capitalize truncate max-w-[120px] sm:max-w-none">
              {getTitle()}
            </h2>
          </div>

          {/* Separator - Hidden on mobile */}
          <div className="hidden sm:block h-6 w-px bg-notion-border mx-2" />

          {/* View mode selector */}
          <div className="flex items-center gap-2 mt-2 sm:mt-0 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
            <div className="relative">
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as ViewMode)}
                className="appearance-none bg-notion-bg text-sm font-medium text-notion-text border border-notion-border rounded-md px-3 py-1.5 pr-8 hover:bg-notion-hover focus:outline-none focus:ring-1 focus:ring-notion-blue transition-colors cursor-pointer"
              >
                <option value="month">Mois</option>
                <option value="week">Semaine</option>
                <option value="day">Jour</option>
                <option value="agenda">Liste</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-notion-textLight">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>

            <button
              onClick={() => setViewMode('arbre')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'arbre'
                ? 'text-notion-bg bg-notion-text'
                : 'text-notion-blue bg-notion-blue/10 hover:bg-notion-blue/20'
                }`}
              title="Voir les arbres de préparation"
            >
              <Network className="w-4 h-4" /> Arbre
            </button>
          </div>
        </div>
      </div>

      {/* Calendar view with transitions */}
      <div
        ref={viewContainerRef}
        className={`relative transition-all duration-200 ease-out ${getTransitionClasses()}`}
        style={{ flex: 1, minHeight: 0, maxHeight: '100%', overflow: 'hidden' }}
      >
        {viewMode === 'month' && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
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
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
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
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
            <DayView
              currentDate={currentDate}
              events={events}
              onEventClick={onEventClick}
              timeFormat={settings.timeFormat}
            />
          </div>
        )}
        {viewMode === 'agenda' && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
            <AgendaView
              currentDate={currentDate}
              events={events}
              onEventClick={onEventClick}
              timeFormat={settings.timeFormat}
            />
          </div>
        )}
        {viewMode === 'arbre' && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
            <ArbreView />
          </div>
        )}
      </div>
    </div>
  );
}
