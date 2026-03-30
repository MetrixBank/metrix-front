import React from 'react';
import { useLocalization } from '@/contexts/LocalizationContext';
import { format, parseISO } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { CheckCircle2 } from 'lucide-react';

const SchedulingMessageComponent = ({ date, time }) => {
  const { t, region } = useLocalization();

  if (!date) return null;

  // Format date and time based on region
  const dateObj = new Date(`${date}T${time || '00:00'}`);
  const fnsLocale = region === 'USA' ? enUS : ptBR;
  const dateFormat = region === 'USA' ? 'MM/dd/yyyy' : 'dd/MM/yyyy';
  const timeFormat = region === 'USA' ? 'hh:mm a' : 'HH:mm';

  const formattedDate = format(dateObj, dateFormat, { locale: fnsLocale });
  const formattedTime = format(dateObj, timeFormat, { locale: fnsLocale });

  const message = t('scheduling_success_message')
    .replace('{date}', formattedDate)
    .replace('{time}', formattedTime);

  return (
    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 flex items-start gap-3 mt-4 animate-in fade-in slide-in-from-bottom-2">
      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-500 mt-0.5 shrink-0" />
      <div>
        <h4 className="font-semibold text-emerald-800 dark:text-emerald-400 text-sm mb-1">
          {t('scheduling_success_title')}
        </h4>
        <p className="text-emerald-700 dark:text-emerald-500/80 text-sm">
          {message}
        </p>
      </div>
    </div>
  );
};

export default SchedulingMessageComponent;