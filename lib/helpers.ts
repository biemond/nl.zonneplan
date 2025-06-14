'use strict';

export function formatDateTime(clock: any, dateString: string) {
  const date = new Date(dateString);

  const options = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: clock.getTimezone(),
  } as Intl.DateTimeFormatOptions;

  return new Intl.DateTimeFormat('nl-NL', options).format(date).replace(',', '');
}
