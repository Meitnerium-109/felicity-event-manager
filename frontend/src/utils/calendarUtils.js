// src/utils/calendarUtils.js

const formatTimeDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().replace(/-|:|\.\d+/g, '');
};

export const getGoogleCalendarUrl = (event) => {
    const start = formatTimeDate(event.startDate || event.date);
    const end = formatTimeDate(event.endDate || event.date);
    const title = encodeURIComponent(event.eventName || event.title);
    const description = encodeURIComponent(event.description || '');
    const location = encodeURIComponent(event.venue || '');

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${description}&location=${location}`;
};

export const getOutlookCalendarUrl = (event) => {
    const start = formatTimeDate(event.startDate || event.date);
    const end = formatTimeDate(event.endDate || event.date);
    const title = encodeURIComponent(event.eventName || event.title);
    const description = encodeURIComponent(event.description || '');
    const location = encodeURIComponent(event.venue || '');

    return `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&startdt=${start}&enddt=${end}&subject=${title}&body=${description}&location=${location}`;
};

export const downloadIcsFile = (event) => {
    const start = formatTimeDate(event.startDate || event.date);
    const end = formatTimeDate(event.endDate || event.date);
    const title = event.eventName || event.title || 'Event';
    const description = event.description || '';
    const location = event.venue || '';

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Felicity//Calendar//EN',
        'BEGIN:VEVENT',
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:${description}`,
        `LOCATION:${location}`,
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const safeEventName = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    link.href = url;
    link.setAttribute('download', `${safeEventName}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
