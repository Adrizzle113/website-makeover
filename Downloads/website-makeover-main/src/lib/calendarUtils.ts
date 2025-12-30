// Calendar utilities for generating .ics files

export interface CalendarEvent {
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
  url?: string;
}

/**
 * Format date for ICS file (YYYYMMDD format)
 */
function formatICSDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

/**
 * Escape special characters for ICS format
 */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Generate a unique UID for the calendar event
 */
function generateUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}@travelhub.com`;
}

/**
 * Generate ICS file content for a calendar event
 */
export function generateICSContent(event: CalendarEvent): string {
  const now = new Date();
  const dtstamp = formatICSDate(now) + "T" + 
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0") +
    String(now.getSeconds()).padStart(2, "0") + "Z";

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TravelHub//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${generateUID()}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;VALUE=DATE:${formatICSDate(event.startDate)}`,
    `DTEND;VALUE=DATE:${formatICSDate(event.endDate)}`,
    `SUMMARY:${escapeICS(event.title)}`,
    `DESCRIPTION:${escapeICS(event.description)}`,
    `LOCATION:${escapeICS(event.location)}`,
  ];

  if (event.url) {
    lines.push(`URL:${event.url}`);
  }

  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.join("\r\n");
}

/**
 * Download ICS file for a booking
 */
export function downloadICSFile(event: CalendarEvent, filename: string): void {
  const content = generateICSContent(event);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Create calendar event from booking data
 */
export function createBookingCalendarEvent(booking: {
  hotelName: string;
  address: string;
  city: string;
  country: string;
  checkIn: string | Date;
  checkOut: string | Date;
  confirmationNumber: string;
  roomType?: string;
  guestName?: string;
}): CalendarEvent {
  const checkInDate = typeof booking.checkIn === "string" 
    ? new Date(booking.checkIn) 
    : booking.checkIn;
  
  // Add one day to checkout for end date (ICS uses exclusive end date)
  const checkOutDate = typeof booking.checkOut === "string" 
    ? new Date(booking.checkOut) 
    : booking.checkOut;
  const endDate = new Date(checkOutDate);
  endDate.setDate(endDate.getDate() + 1);

  const description = [
    `Confirmation: ${booking.confirmationNumber}`,
    booking.roomType ? `Room: ${booking.roomType}` : "",
    booking.guestName ? `Guest: ${booking.guestName}` : "",
    "",
    "Check-in: " + checkInDate.toLocaleDateString(),
    "Check-out: " + checkOutDate.toLocaleDateString(),
  ].filter(Boolean).join("\\n");

  return {
    title: `Hotel Stay: ${booking.hotelName}`,
    description,
    location: `${booking.hotelName}, ${booking.address || ""}, ${booking.city}, ${booking.country}`.replace(/,\s*,/g, ","),
    startDate: checkInDate,
    endDate,
  };
}
