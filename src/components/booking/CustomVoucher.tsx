import { format } from "date-fns";

interface VoucherGuest {
  first_name: string;
  last_name: string;
  is_child?: boolean;
  age?: number;
}

interface VoucherData {
  orderId: string;
  partnerOrderId?: string;
  confirmationNumber?: string;
  createdAt?: string;
  
  // Hotel info
  hotelName: string;
  hotelAddress?: string;
  hotelCity?: string;
  hotelCountry?: string;
  hotelPhone?: string;
  hotelStars?: number;
  
  // Stay details
  checkIn: string;
  checkOut: string;
  nights: number;
  
  // Room details
  roomName?: string;
  mealPlan?: string;
  bedding?: string;
  
  // Guests
  guests: VoucherGuest[];
  leadGuest?: {
    firstName: string;
    lastName: string;
    email?: string;
  };
  
  // Pricing
  totalAmount?: number;
  currency?: string;
  
  // Cancellation
  cancellationPolicy?: string;
  freeCancellationBefore?: string;
  
  // Additional data from raw API
  fees?: Array<{
    name: string;
    amount: string;
    currency?: string;
    includedBySupplier?: boolean;
  }>;
  depositInfo?: string;
  specialRequests?: string;
  
  // Location for map
  latitude?: number;
  longitude?: number;
}

/**
 * Generates a branded voucher HTML string with eexplo styling
 */
export function generateCustomVoucherHTML(data: VoucherData): string {
  const checkInDate = new Date(data.checkIn);
  const checkOutDate = new Date(data.checkOut);
  const createdDate = data.createdAt ? new Date(data.createdAt) : new Date();
  
  // Format dates nicely
  const formattedCheckIn = format(checkInDate, "EEEE, MMMM d, yyyy");
  const formattedCheckOut = format(checkOutDate, "EEEE, MMMM d, yyyy");
  const formattedCreated = format(createdDate, "MMMM d, yyyy 'at' h:mm a");
  
  // Generate star rating HTML
  const starsHTML = data.hotelStars 
    ? Array(data.hotelStars).fill('★').join('') 
    : '';
  
  // Generate guest list HTML
  const guestsHTML = data.guests.map((guest, index) => {
    const isLead = index === 0;
    const ageLabel = guest.is_child && guest.age ? ` (Child, ${guest.age} years)` : guest.is_child ? ' (Child)' : '';
    return `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">
          ${guest.first_name} ${guest.last_name}${ageLabel}
          ${isLead ? '<span style="background: #E9EDC9; color: #1B4332; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-left: 8px; font-weight: 600;">LEAD GUEST</span>' : ''}
        </td>
      </tr>
    `;
  }).join('');
  
  // Generate fees table HTML
  const feesHTML = data.fees && data.fees.length > 0 
    ? data.fees.map(fee => `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${fee.name}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
            ${fee.amount} ${fee.currency || data.currency || 'USD'}
            ${fee.includedBySupplier ? '<span style="color: #52796F; font-size: 11px;"> (Included)</span>' : '<span style="color: #B45309; font-size: 11px;"> (Pay at hotel)</span>'}
          </td>
        </tr>
      `).join('')
    : '';
  
  // Generate Mapbox static map URL if coordinates available
  const mapImageHTML = data.latitude && data.longitude
    ? `
      <div style="margin-top: 30px;">
        <h3 style="font-family: 'Playfair Display', Georgia, serif; font-size: 18px; color: #1B4332; margin-bottom: 15px; border-bottom: 2px solid #E9EDC9; padding-bottom: 8px;">
          📍 Location
        </h3>
        <img 
          src="https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-l+1B4332(${data.longitude},${data.latitude})/${data.longitude},${data.latitude},14,0/600x300@2x?access_token=pk.eyJ1IjoiYm91Z2llYmFja3BhY2tlciIsImEiOiJjbWphZWgyZG4wNHN4M2RweWVjdzVpY3kyIn0.otTqyXhQRvR8qYCHhD8wqg" 
          alt="Hotel Location" 
          style="width: 100%; border-radius: 8px; border: 1px solid #e5e7eb;"
        />
        <p style="font-size: 12px; color: #6B7280; margin-top: 8px; text-align: center;">
          ${data.hotelAddress || ''} ${data.hotelCity ? `, ${data.hotelCity}` : ''} ${data.hotelCountry ? `, ${data.hotelCountry}` : ''}
        </p>
      </div>
    `
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Voucher - ${data.orderId}</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.6;
      color: #1F2937;
      margin: 0;
      padding: 0;
      background: #F9FAFB;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #1B4332 0%, #2D5A45 100%);
      color: white;
      padding: 30px 40px;
      text-align: center;
    }
    .header h1 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 28px;
      font-weight: 600;
      margin: 0 0 5px 0;
      letter-spacing: 0.05em;
    }
    .header p {
      margin: 0;
      opacity: 0.9;
      font-size: 14px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .confirmation-banner {
      background: #E9EDC9;
      padding: 20px 40px;
      text-align: center;
      border-bottom: 3px solid #C9D4A5;
    }
    .confirmation-banner .label {
      font-size: 12px;
      color: #52796F;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin-bottom: 5px;
    }
    .confirmation-banner .number {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 24px;
      font-weight: 700;
      color: #1B4332;
      letter-spacing: 0.05em;
    }
    .content {
      padding: 30px 40px;
    }
    .section {
      margin-bottom: 25px;
    }
    .section-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 18px;
      color: #1B4332;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #E9EDC9;
    }
    .hotel-header {
      display: flex;
      align-items: flex-start;
      gap: 15px;
      margin-bottom: 10px;
    }
    .hotel-name {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 22px;
      font-weight: 600;
      color: #1B4332;
      margin: 0;
    }
    .hotel-stars {
      color: #D4A574;
      font-size: 16px;
      letter-spacing: 2px;
    }
    .hotel-address {
      color: #6B7280;
      font-size: 14px;
      margin: 5px 0;
    }
    .hotel-phone {
      color: #52796F;
      font-size: 14px;
      font-weight: 500;
    }
    .dates-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 15px;
    }
    .date-box {
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
    }
    .date-box .label {
      font-size: 11px;
      color: #52796F;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 5px;
    }
    .date-box .date {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 16px;
      font-weight: 600;
      color: #1B4332;
    }
    .date-box .time {
      font-size: 13px;
      color: #6B7280;
      margin-top: 3px;
    }
    .nights-badge {
      background: #1B4332;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      display: inline-block;
      margin-bottom: 15px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: 8px;
      font-size: 14px;
    }
    .info-label {
      color: #6B7280;
      font-weight: 500;
    }
    .info-value {
      color: #1F2937;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    th {
      background: #F3F4F6;
      text-align: left;
      padding: 10px 12px;
      font-weight: 600;
      color: #374151;
      border-bottom: 2px solid #E5E7EB;
    }
    .policy-box {
      background: #FEF3C7;
      border: 1px solid #FCD34D;
      border-radius: 8px;
      padding: 15px;
      font-size: 13px;
      color: #92400E;
    }
    .policy-box.success {
      background: #D1FAE5;
      border-color: #34D399;
      color: #065F46;
    }
    .notes-box {
      background: #F3F4F6;
      border-radius: 8px;
      padding: 15px;
      font-size: 13px;
      color: #4B5563;
    }
    .notes-box ul {
      margin: 0;
      padding-left: 20px;
    }
    .notes-box li {
      margin-bottom: 5px;
    }
    .footer {
      background: #1B4332;
      color: white;
      padding: 25px 40px;
      text-align: center;
    }
    .footer p {
      margin: 5px 0;
      font-size: 13px;
      opacity: 0.9;
    }
    .footer .booking-date {
      font-size: 12px;
      opacity: 0.7;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>TravelHub</h1>
      <p>Booking Confirmation Voucher</p>
    </div>
    
    <!-- Confirmation Number -->
    <div class="confirmation-banner">
      <div class="label">Reservation Number</div>
      <div class="number">${data.confirmationNumber || data.partnerOrderId || data.orderId}</div>
    </div>
    
    <div class="content">
      <!-- Hotel Information -->
      <div class="section">
        <h3 class="section-title">🏨 Hotel Information</h3>
        <div class="hotel-header">
          <div>
            <h2 class="hotel-name">${data.hotelName}</h2>
            ${starsHTML ? `<div class="hotel-stars">${starsHTML}</div>` : ''}
          </div>
        </div>
        ${data.hotelAddress ? `<p class="hotel-address">📍 ${data.hotelAddress}${data.hotelCity ? `, ${data.hotelCity}` : ''}${data.hotelCountry ? `, ${data.hotelCountry}` : ''}</p>` : ''}
        ${data.hotelPhone ? `<p class="hotel-phone">📞 ${data.hotelPhone}</p>` : ''}
      </div>
      
      <!-- Stay Details -->
      <div class="section">
        <h3 class="section-title">📅 Stay Details</h3>
        <div class="dates-grid">
          <div class="date-box">
            <div class="label">Check-in</div>
            <div class="date">${formattedCheckIn}</div>
            <div class="time">From 14:00</div>
          </div>
          <div class="date-box">
            <div class="label">Check-out</div>
            <div class="date">${formattedCheckOut}</div>
            <div class="time">Until 11:00</div>
          </div>
        </div>
        <span class="nights-badge">${data.nights} Night${data.nights > 1 ? 's' : ''}</span>
      </div>
      
      <!-- Room Details -->
      <div class="section">
        <h3 class="section-title">🛏️ Room Details</h3>
        <div class="info-grid">
          ${data.roomName ? `<span class="info-label">Room Type:</span><span class="info-value">${data.roomName}</span>` : ''}
          ${data.mealPlan ? `<span class="info-label">Meal Plan:</span><span class="info-value">${data.mealPlan}</span>` : ''}
          ${data.bedding ? `<span class="info-label">Bedding:</span><span class="info-value">${data.bedding}</span>` : ''}
        </div>
      </div>
      
      <!-- Guest List -->
      <div class="section">
        <h3 class="section-title">👥 Guests (${data.guests.length})</h3>
        <table>
          <thead>
            <tr>
              <th>Guest Name</th>
            </tr>
          </thead>
          <tbody>
            ${guestsHTML}
          </tbody>
        </table>
      </div>
      
      ${data.fees && data.fees.length > 0 ? `
      <!-- Fees & Taxes -->
      <div class="section">
        <h3 class="section-title">💰 Fees & Taxes</h3>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${feesHTML}
          </tbody>
        </table>
      </div>
      ` : ''}
      
      ${data.depositInfo ? `
      <!-- Deposit Information -->
      <div class="section">
        <h3 class="section-title">💳 Deposit Requirements</h3>
        <div class="notes-box">
          <p style="margin: 0;">${data.depositInfo}</p>
        </div>
      </div>
      ` : ''}
      
      <!-- Cancellation Policy -->
      <div class="section">
        <h3 class="section-title">📋 Cancellation Policy</h3>
        ${data.freeCancellationBefore ? `
          <div class="policy-box success">
            <strong>✓ Free cancellation</strong> before ${format(new Date(data.freeCancellationBefore), "MMMM d, yyyy 'at' h:mm a")}
          </div>
        ` : data.cancellationPolicy ? `
          <div class="policy-box">
            ${data.cancellationPolicy}
          </div>
        ` : `
          <div class="policy-box">
            Please refer to your booking confirmation email for cancellation terms.
          </div>
        `}
      </div>
      
      ${data.specialRequests ? `
      <!-- Special Requests -->
      <div class="section">
        <h3 class="section-title">✨ Special Requests</h3>
        <div class="notes-box">
          <p style="margin: 0;">${data.specialRequests}</p>
        </div>
      </div>
      ` : ''}
      
      <!-- Important Notes -->
      <div class="section">
        <h3 class="section-title">ℹ️ Important Information</h3>
        <div class="notes-box">
          <ul>
            <li>Please present this voucher at check-in along with a valid photo ID.</li>
            <li>The hotel may require a credit card for incidentals.</li>
            <li>Check-in and check-out times are subject to availability.</li>
            <li>Additional services not mentioned may incur extra charges.</li>
          </ul>
        </div>
      </div>
      
      ${mapImageHTML}
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p><strong>Thank you for booking with TravelHub!</strong></p>
      <p>For assistance, contact our support team.</p>
      <p class="booking-date">Booking made on ${formattedCreated}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Opens the voucher in a new window for printing/saving as PDF
 */
export function openCustomVoucher(data: VoucherData): void {
  const html = generateCustomVoucherHTML(data);
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

/**
 * Downloads the voucher as an HTML file
 */
export function downloadCustomVoucher(data: VoucherData): void {
  const html = generateCustomVoucherHTML(data);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `voucher-${data.partnerOrderId || data.orderId}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export type { VoucherData, VoucherGuest };
