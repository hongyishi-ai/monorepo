import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  parseISO,
} from 'date-fns';
import React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface CalendarProps {
  value?: string | Date | null;
  onChange?: (value: string) => void;
  min?: string | Date;
  max?: string | Date;
  className?: string;
}

function toDate(value?: string | Date | null): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  try {
    return parseISO(value);
  } catch {
    return null;
  }
}

function toValueString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export const Calendar: React.FC<CalendarProps> = ({
  value,
  onChange,
  min,
  max,
  className,
}) => {
  const initial = toDate(value) ?? new Date();
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    startOfMonth(initial)
  );

  const selectedDate = toDate(value);
  const minDate = toDate(min ?? undefined);
  const maxDate = toDate(max ?? undefined);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const weeks: Date[][] = [];
  let day = startDate;
  let done = false;
  while (!done) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(day);
      day = addDays(day, 1);
    }
    weeks.push(week);
    done = day > endDate;
  }

  const canSelect = (d: Date) => {
    if (minDate && d < minDate) return false;
    if (maxDate && d > maxDate) return false;
    return true;
  };

  return (
    <div className={cn('p-3 w-80', className)}>
      <div className='flex items-center justify-between mb-2'>
        <Button
          variant='outline'
          size='sm'
          type='button'
          onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
        >
          ‹
        </Button>
        <div className='text-sm font-medium'>
          {format(currentMonth, 'yyyy年MM月')}
        </div>
        <Button
          variant='outline'
          size='sm'
          type='button'
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          ›
        </Button>
      </div>

      <div className='grid grid-cols-7 gap-1 text-xs text-muted-foreground mb-1'>
        {['一', '二', '三', '四', '五', '六', '日'].map(d => (
          <div key={d} className='h-6 flex items-center justify-center'>
            {d}
          </div>
        ))}
      </div>

      <div className='grid grid-cols-7 gap-1'>
        {weeks.map((week, wi) =>
          week.map((date, di) => {
            const inMonth = isSameMonth(date, monthStart);
            const selected = selectedDate
              ? isSameDay(date, selectedDate)
              : false;
            const today = isToday(date);
            const disabled = !canSelect(date);
            return (
              <button
                key={`${wi}-${di}`}
                type='button'
                disabled={disabled}
                onClick={() => onChange?.(toValueString(date))}
                className={cn(
                  'h-10 w-10 rounded-md text-sm flex items-center justify-center border',
                  inMonth ? 'bg-card' : 'bg-muted/40 text-muted-foreground',
                  selected &&
                    'border-primary text-primary-foreground bg-primary',
                  !selected && today && 'border-muted-foreground',
                  disabled && 'opacity-40 cursor-not-allowed'
                )}
              >
                {format(date, 'd')}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Calendar;
