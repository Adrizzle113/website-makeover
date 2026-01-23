import { format, parseISO } from 'date-fns';

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
  hotelName: string;
  hotelAddress?: string;
  hotelCity?: string;
  hotelCountry?: string;
  hotelPhone?: string;
  hotelImage?: string;
  checkIn: string;
  checkOut: string;
  checkInTime?: string;
  checkOutTime?: string;
  roomType: string;
  mealPlan?: string;
  guests: VoucherGuest[];
  fees?: Array<{
    name: string;
    amount: string;
    currency?: string;
    includedBySupplier?: boolean;
  }>;
  depositInfo?: string;
  cancellationPolicy?: string;
  specialRequests?: string;
  latitude?: number;
  longitude?: number;
}

function formatDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    return format(date, 'EEEE, MMMM d, yyyy');
  } catch {
    return dateStr;
  }
}

function formatTime(timeStr?: string): string {
  if (!timeStr) return '';
  if (timeStr.includes(':')) {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }
  return timeStr;
}

export function generateCustomVoucherHTML(data: VoucherData): string {
  const checkInFormatted = formatDate(data.checkIn);
  const checkOutFormatted = formatDate(data.checkOut);
  const checkInTime = formatTime(data.checkInTime) || '3:00 PM';
  const checkOutTime = formatTime(data.checkOutTime) || '11:00 AM';
  
  // Build guest list
  const guestList = data.guests
    .map((g, i) => `${g.first_name} ${g.last_name}${i === 0 ? ' (Lead Guest)' : ''}${g.is_child ? ` (Child${g.age ? `, ${g.age}y` : ''})` : ''}`)
    .join(', ');

  // Build included items
  const includedItems: string[] = [];
  if (data.mealPlan && data.mealPlan.toLowerCase() !== 'nomeal' && data.mealPlan.toLowerCase() !== 'room only') {
    includedItems.push(data.mealPlan);
  }
  
  // Build not included items (fees to pay at hotel)
  const notIncludedItems: string[] = [];
  if (data.fees && data.fees.length > 0) {
    data.fees.forEach(fee => {
      if (!fee.includedBySupplier) {
        notIncludedItems.push(`${fee.name}: ${fee.amount}${fee.currency ? ` ${fee.currency}` : ''}`);
      }
    });
  }

  // Use a placeholder if no hotel image
  const heroImage = data.hotelImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=400&fit=crop';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Travel Voucher - ${data.orderId}</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400;1,600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #F5F3EE;
      color: #5D5548;
      line-height: 1.6;
      font-size: 14px;
    }
    
    .voucher-container {
      max-width: 800px;
      margin: 0 auto;
      background: #F5F3EE;
    }
    
    .hero-image {
      width: 100%;
      height: 280px;
      object-fit: cover;
      display: block;
    }
    
    .brand-header {
      text-align: center;
      padding: 32px 40px 24px;
    }
    
    .brand-name {
      font-family: 'Playfair Display', Georgia, serif;
      font-style: italic;
      font-weight: 400;
      font-size: 28px;
      color: #5D5548;
      letter-spacing: 0.02em;
    }
    
    .content-wrapper {
      padding: 0 40px 40px;
    }
    
    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 48px;
    }
    
    .section-title {
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #8B8579;
      margin-bottom: 20px;
    }
    
    .hotel-name {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 22px;
      font-weight: 600;
      color: #5D5548;
      margin-bottom: 8px;
      line-height: 1.3;
    }
    
    .hotel-address {
      font-size: 14px;
      color: #8B8579;
      margin-bottom: 4px;
    }
    
    .hotel-phone {
      font-size: 14px;
      color: #8B8579;
    }
    
    .stay-details {
      margin-top: 32px;
    }
    
    .detail-row {
      display: flex;
      margin-bottom: 12px;
    }
    
    .detail-label {
      font-weight: 500;
      color: #5D5548;
      min-width: 90px;
    }
    
    .detail-value {
      color: #5D5548;
    }
    
    .detail-time {
      font-size: 13px;
      color: #8B8579;
      margin-left: 8px;
    }
    
    .guests-section {
      margin-top: 24px;
    }
    
    .guests-label {
      font-weight: 500;
      color: #5D5548;
      margin-bottom: 4px;
    }
    
    .guests-list {
      color: #5D5548;
    }
    
    .right-column {
      padding-left: 24px;
      border-left: 1px solid #E8E4DE;
    }
    
    .info-list {
      list-style: none;
      counter-reset: item;
    }
    
    .info-item {
      position: relative;
      padding-left: 28px;
      margin-bottom: 20px;
    }
    
    .info-item::before {
      content: counter(item) ".";
      counter-increment: item;
      position: absolute;
      left: 0;
      font-weight: 600;
      color: #5D5548;
    }
    
    .info-item-title {
      font-weight: 600;
      color: #5D5548;
      margin-bottom: 4px;
    }
    
    .info-item-content {
      color: #8B8579;
      font-size: 13px;
    }
    
    .info-item-content ul {
      list-style: disc;
      margin-left: 16px;
      margin-top: 4px;
    }
    
    .info-item-content li {
      margin-bottom: 2px;
    }
    
    .footer {
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid #E8E4DE;
      display: flex;
      justify-content: center;
      gap: 48px;
      font-size: 13px;
      color: #8B8579;
    }
    
    .footer-item {
      text-align: center;
    }
    
    .confirmation-badge {
      background: #5D5548;
      color: #F5F3EE;
      padding: 8px 16px;
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 0.05em;
      display: inline-block;
      margin-top: 8px;
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .voucher-container {
        max-width: 100%;
      }
      
      .hero-image {
        height: 250px;
      }
    }
    
    @media (max-width: 640px) {
      .content-grid {
        grid-template-columns: 1fr;
        gap: 32px;
      }
      
      .right-column {
        padding-left: 0;
        border-left: none;
        padding-top: 24px;
        border-top: 1px solid #E8E4DE;
      }
      
      .content-wrapper {
        padding: 0 24px 32px;
      }
      
      .brand-header {
        padding: 24px 24px 20px;
      }
    }
  </style>
</head>
<body>
  <div class="voucher-container">
    <img src="${heroImage}" alt="${data.hotelName}" class="hero-image" />
    
    <div class="brand-header">
      <h1 class="brand-name">BookingJa</h1>
      <div class="confirmation-badge">Confirmation #${data.confirmationNumber || data.orderId}</div>
    </div>
    
    <div class="content-wrapper">
      <div class="content-grid">
        <div class="left-column">
          <h2 class="section-title">Trip details</h2>
          
          <h3 class="hotel-name">${data.hotelName}</h3>
          ${data.hotelAddress ? `<p class="hotel-address">${data.hotelAddress}${data.hotelCity ? `, ${data.hotelCity}` : ''}${data.hotelCountry ? `, ${data.hotelCountry}` : ''}</p>` : ''}
          ${data.hotelPhone ? `<p class="hotel-phone">${data.hotelPhone}</p>` : ''}
          
          <div class="stay-details">
            <h2 class="section-title">Stay details</h2>
            
            <div class="detail-row">
              <span class="detail-label">Check-in</span>
              <span class="detail-value">${checkInFormatted}<span class="detail-time">${checkInTime}</span></span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Check-out</span>
              <span class="detail-value">${checkOutFormatted}<span class="detail-time">${checkOutTime}</span></span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Room</span>
              <span class="detail-value">${data.roomType}</span>
            </div>
          </div>
          
          <div class="guests-section">
            <p class="guests-label">Guests</p>
            <p class="guests-list">${guestList}</p>
          </div>
        </div>
        
        <div class="right-column">
          <h2 class="section-title">What's included vs not</h2>
          
          <ol class="info-list">
            <li class="info-item">
              <p class="info-item-title">Included</p>
              <div class="info-item-content">
                ${includedItems.length > 0 
                  ? `<ul>${includedItems.map(item => `<li>${item}</li>`).join('')}</ul>` 
                  : 'Room only (no meals included)'}
              </div>
            </li>
            
            <li class="info-item">
              <p class="info-item-title">Not included (pay at hotel)</p>
              <div class="info-item-content">
                ${notIncludedItems.length > 0 
                  ? `<ul>${notIncludedItems.map(item => `<li>${item}</li>`).join('')}</ul>` 
                  : 'No additional fees'}
              </div>
            </li>
            
            <li class="info-item">
              <p class="info-item-title">Deposits</p>
              <div class="info-item-content">
                ${data.depositInfo || 'No deposit required'}
              </div>
            </li>
            
            <li class="info-item">
              <p class="info-item-title">Cancellation</p>
              <div class="info-item-content">
                ${data.cancellationPolicy || 'Please refer to your booking confirmation for cancellation terms.'}
              </div>
            </li>
          </ol>
        </div>
      </div>
      
      ${data.specialRequests ? `
      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #E8E4DE;">
        <h2 class="section-title">Special Requests</h2>
        <p style="color: #8B8579; font-size: 13px;">${data.specialRequests}</p>
        <p style="color: #8B8579; font-size: 12px; margin-top: 8px; font-style: italic;">Note: Special requests are subject to availability and cannot be guaranteed.</p>
      </div>
      ` : ''}
      
      <div class="footer">
        <div class="footer-item">hello@bookingja.com</div>
        <div class="footer-item">bookingja.com</div>
        <div class="footer-item">+1 (876) 555-0123</div>
      </div>
    </div>
  </div>
</body>
</html>
`;
}

export function openCustomVoucher(data: VoucherData): void {
  const html = generateCustomVoucherHTML(data);
  const newWindow = window.open('', '_blank');
  if (newWindow) {
    newWindow.document.write(html);
    newWindow.document.close();
  }
}

export function downloadCustomVoucher(data: VoucherData): void {
  const html = generateCustomVoucherHTML(data);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `voucher-${data.orderId}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export type { VoucherData, VoucherGuest };
