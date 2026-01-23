import { format, parseISO } from 'date-fns';

interface VoucherGuest {
  first_name: string;
  last_name: string;
  is_child?: boolean;
  age?: number;
}

interface VoucherFee {
  name: string;
  amount: string;
  currency?: string;
  includedBySupplier?: boolean;
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
  // Guest counts
  adultsCount?: number;
  childrenCount?: number;
  // Bedding
  bedding?: string;
  // Fees separated
  includedFees?: VoucherFee[];
  notIncludedFees?: VoucherFee[];
  // Legacy fees field (fallback)
  fees?: VoucherFee[];
  // Deposits as array of strings
  deposits?: string[];
  depositInfo?: string; // Legacy single deposit
  // Meal details
  hasBreakfast?: boolean;
  noChildMeal?: boolean;
  // Cancellation
  cancellationPolicy?: string;
  freeCancellationBefore?: string;
  // Other
  specialRequests?: string;
  latitude?: number;
  longitude?: number;
  // Agency branding
  agencyName?: string;
  agencyPhone?: string;
  agencyEmail?: string;
  agencyWebsite?: string;
}

function formatDateShort(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    return format(date, 'MM.dd.yy');
  } catch {
    return dateStr;
  }
}

function formatTime24(timeStr?: string): string {
  if (!timeStr) return '';
  // If already in HH:mm:ss format, return as-is
  if (timeStr.match(/^\d{2}:\d{2}:\d{2}$/)) {
    return timeStr;
  }
  // If in HH:mm format, add seconds
  if (timeStr.match(/^\d{2}:\d{2}$/)) {
    return `${timeStr}:00`;
  }
  return timeStr;
}

function formatGuestOccupancy(adults?: number, children?: number): string {
  const parts: string[] = [];
  if (adults && adults > 0) {
    parts.push(`${adults} adult${adults > 1 ? 's' : ''}`);
  }
  if (children && children > 0) {
    parts.push(`${children} child${children > 1 ? 'ren' : ''}`);
  }
  return parts.length > 0 ? `for ${parts.join(', ')}` : '';
}

function formatBedding(bedding?: string | string[]): string {
  if (!bedding) return '';
  
  // Handle array directly
  if (Array.isArray(bedding)) {
    return bedding.map((b: string) => {
      const formatted = b.charAt(0).toUpperCase() + b.slice(1);
      return formatted.toLowerCase().includes('bed') ? formatted : `${formatted} bed`;
    }).join(', ');
  }
  
  // Handle string
  if (typeof bedding === 'string') {
    // Handle JSON array string
    if (bedding.startsWith('[')) {
      try {
        const arr = JSON.parse(bedding);
        return formatBedding(arr);
      } catch {
        return bedding;
      }
    }
    // Capitalize and add "bed" suffix if not present
    const formatted = bedding.charAt(0).toUpperCase() + bedding.slice(1);
    return formatted.toLowerCase().includes('bed') ? formatted : `${formatted} bed`;
  }
  
  return String(bedding);
}

/**
 * Format fee name to be human-readable (handle underscore-separated names)
 */
function formatFeeName(name: string): string {
  if (!name) return 'Fee';
  // Replace underscores with spaces and capitalize each word
  return name
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function generateCustomVoucherHTML(data: VoucherData): string {
  const checkInDateFormatted = formatDateShort(data.checkIn);
  const checkOutDateFormatted = formatDateShort(data.checkOut);
  const checkInTime = formatTime24(data.checkInTime) || '14:00:00';
  const checkOutTime = formatTime24(data.checkOutTime) || '12:00:00';
  const createdAtFormatted = data.createdAt ? formatDateShort(data.createdAt) : '';
  
  // Build guest list
  const guestList = data.guests
    .map(g => `${g.first_name} ${g.last_name}`)
    .join(', ');

  // Guest occupancy text
  const occupancyText = formatGuestOccupancy(data.adultsCount, data.childrenCount);
  
  // Bedding formatted
  const beddingText = formatBedding(data.bedding);

  // Build included fees list and format names
  const includedFees = (data.includedFees || data.fees?.filter(f => f.includedBySupplier) || [])
    .map(f => ({ ...f, name: formatFeeName(f.name) }));
  const notIncludedFees = (data.notIncludedFees || data.fees?.filter(f => !f.includedBySupplier) || [])
    .map(f => ({ ...f, name: formatFeeName(f.name) }));
  
  // Build deposits list
  const depositsList = data.deposits || (data.depositInfo ? [data.depositInfo] : []);

  // Meal type text
  let mealTypeText = 'No meals included';
  if (data.mealPlan && data.mealPlan.toLowerCase() !== 'nomeal' && data.mealPlan.toLowerCase() !== 'room only') {
    mealTypeText = data.mealPlan;
  }
  if (data.noChildMeal) {
    mealTypeText += ', no meals for children included';
  }

  // Use a placeholder if no hotel image
  const heroImage = data.hotelImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=400&fit=crop';

  // Agency branding with defaults
  const agencyName = data.agencyName || 'BookingJa';
  const agencyPhone = data.agencyPhone || '888-269-6087';
  const agencyEmail = data.agencyEmail || 'hello@bookingja.com';
  const agencyWebsite = data.agencyWebsite || 'bookingja.com';

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
    
    .header-section {
      padding: 24px 40px;
      border-bottom: 1px solid #E8E4DE;
    }
    
    .brand-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }
    
    .brand-name {
      font-family: 'Playfair Display', Georgia, serif;
      font-style: italic;
      font-weight: 400;
      font-size: 28px;
      color: #5D5548;
      letter-spacing: 0.02em;
    }
    
    .agency-phone {
      font-size: 14px;
      color: #8B8579;
    }
    
    .reservation-info {
      font-size: 13px;
      color: #8B8579;
    }
    
    .partner-notice {
      margin-top: 16px;
      font-size: 13px;
      color: #8B8579;
      font-style: italic;
    }
    
    .content-wrapper {
      padding: 32px 40px 40px;
    }
    
    .hotel-section {
      margin-bottom: 32px;
    }
    
    .hotel-name {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 22px;
      font-weight: 600;
      color: #5D5548;
      margin-bottom: 8px;
      line-height: 1.3;
    }
    
    .hotel-details {
      font-size: 14px;
      color: #8B8579;
    }
    
    .hotel-address {
      margin-bottom: 4px;
    }
    
    .stay-section {
      margin-bottom: 32px;
    }
    
    .stay-line {
      font-size: 14px;
      color: #5D5548;
      margin-bottom: 8px;
    }
    
    .stay-line strong {
      font-weight: 600;
    }
    
    .room-info {
      margin-top: 16px;
    }
    
    .bedding-line {
      font-size: 14px;
      color: #8B8579;
      margin-top: 4px;
    }
    
    .guests-line {
      font-size: 14px;
      color: #8B8579;
      margin-top: 8px;
    }
    
    .section-title {
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      font-size: 15px;
      color: #5D5548;
      margin-bottom: 12px;
      margin-top: 32px;
    }
    
    .important-notice {
      background: #FFFDF5;
      border-left: 3px solid #D4A574;
      padding: 16px 20px;
      margin: 24px 0;
      font-size: 13px;
      color: #5D5548;
      line-height: 1.7;
    }
    
    .important-notice strong {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
    }
    
    .policy-section {
      margin: 24px 0;
      padding: 16px 0;
      border-top: 1px solid #E8E4DE;
    }
    
    .policy-text {
      font-size: 13px;
      color: #8B8579;
      line-height: 1.7;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-top: 24px;
    }
    
    .info-block h4 {
      font-weight: 600;
      font-size: 14px;
      color: #5D5548;
      margin-bottom: 8px;
    }
    
    .info-list {
      list-style: none;
      font-size: 13px;
      color: #8B8579;
    }
    
    .info-list li {
      margin-bottom: 4px;
    }
    
    .deposit-section {
      margin-top: 24px;
      padding: 16px 20px;
      background: #F9F7F4;
      border-radius: 4px;
    }
    
    .deposit-section h4 {
      font-weight: 600;
      font-size: 14px;
      color: #5D5548;
      margin-bottom: 8px;
    }
    
    .deposit-list {
      font-size: 13px;
      color: #8B8579;
      line-height: 1.7;
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
    
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .voucher-container {
        max-width: 100%;
      }
      
      .hero-image {
        height: 200px;
      }
    }
    
    @media (max-width: 640px) {
      .info-grid {
        grid-template-columns: 1fr;
        gap: 24px;
      }
      
      .content-wrapper {
        padding: 24px;
      }
      
      .header-section {
        padding: 20px 24px;
      }
      
      .brand-row {
        flex-direction: column;
        gap: 8px;
      }
    }
  </style>
</head>
<body>
  <div class="voucher-container">
    <img src="${heroImage}" alt="${data.hotelName}" class="hero-image" />
    
    <div class="header-section">
      <div class="brand-row">
        <h1 class="brand-name">${agencyName}</h1>
        <span class="agency-phone">${agencyPhone}</span>
      </div>
      <p class="reservation-info">
        Reservation ${data.orderId} made on ${createdAtFormatted}
      </p>
      <p class="partner-notice">This accommodation is booked by our partner</p>
    </div>
    
    <div class="content-wrapper">
      <div class="hotel-section">
        <h2 class="hotel-name">${data.hotelName}</h2>
        <div class="hotel-details">
          ${data.hotelAddress ? `<p class="hotel-address">${data.hotelAddress}${data.hotelCity ? `, ${data.hotelCity}` : ''}</p>` : ''}
          ${data.hotelPhone ? `<p>${data.hotelPhone}</p>` : ''}
        </div>
      </div>
      
      <div class="stay-section">
        <p class="stay-line"><strong>Check-in</strong> ${checkInDateFormatted}, from ${checkInTime}</p>
        <p class="stay-line"><strong>Check-out:</strong> ${checkOutDateFormatted}, until ${checkOutTime}</p>
        
        <div class="room-info">
          <p class="stay-line">${data.roomType}${occupancyText ? `, ${occupancyText}` : ''}</p>
          ${beddingText ? `<p class="bedding-line">Bedding: ${beddingText}</p>` : ''}
          <p class="guests-line">Guests: ${guestList}</p>
        </div>
      </div>
      
      <div class="important-notice">
        <strong>Important. Please Note</strong>
        Hotels may charge additional mandatory fees payable by the guest directly at the property, 
        including but not exclusively: resort fee, facility fee, city tax, fee for the stay of foreign citizens. 
        The guest can be also asked to provide a credit card or cash deposit as a guarantee of payment 
        for additional services such as: mini-bar, payTV, etc. Agency is not responsible for the quality 
        of services provided by the hotel. Client can contact administration of hotel directly to claim 
        on volume and quality of provided services. In case of any issues during check-in or check-out, 
        please contact the Agency.
      </div>
      
      <div class="policy-section">
        <h3 class="section-title">Amendment & Cancellation Policy</h3>
        <p class="policy-text">
          An alteration of Reservation by the Customer is considered as a cancellation of Reservation 
          and making new Reservation. We'll try to negotiate the order amendment with the supplier 
          but we cannot guarantee it will be approved. Cancellation of reservation or no-show may 
          result in penalties, according to rate and contract terms.
          ${data.cancellationPolicy ? `<br><br>${data.cancellationPolicy}` : ''}
          ${data.freeCancellationBefore ? `<br><br>Free cancellation before: ${formatDateShort(data.freeCancellationBefore)}` : ''}
        </p>
        <p class="policy-text" style="margin-top: 12px; font-style: italic;">
          Please notify in advance if you expect to check-in after 6 pm. Hotel may cancel the 
          reservation and charge the no-show fee in case you don't show up by that time.
        </p>
      </div>
      
      <h3 class="section-title">Meal type</h3>
      <p class="policy-text">${mealTypeText}</p>
      
      <div class="info-grid">
        <div class="info-block">
          <h4>Included in the price</h4>
          <ul class="info-list">
            ${includedFees.length > 0 
              ? includedFees.map(fee => `<li>${fee.name}: ${fee.amount} ${fee.currency || ''}</li>`).join('')
              : '<li>No additional fees included</li>'}
          </ul>
        </div>
        
        <div class="info-block">
          <h4>Not included</h4>
          <ul class="info-list">
            ${notIncludedFees.length > 0 
              ? notIncludedFees.map(fee => `<li>${fee.name}: ${fee.amount} ${fee.currency || ''}</li>`).join('')
              : '<li>No additional fees to pay at hotel</li>'}
          </ul>
        </div>
      </div>
      
      ${depositsList.length > 0 ? `
      <div class="deposit-section">
        <h4>Deposit</h4>
        <div class="deposit-list">
          ${depositsList.map(d => `<p>${d}</p>`).join('')}
        </div>
      </div>
      ` : ''}
      
      ${data.specialRequests ? `
      <div class="policy-section">
        <h3 class="section-title">Special Requests</h3>
        <p class="policy-text">${data.specialRequests}</p>
        <p class="policy-text" style="margin-top: 8px; font-style: italic;">
          Note: Special requests are subject to availability and cannot be guaranteed.
        </p>
      </div>
      ` : ''}
      
      <div class="footer">
        <div class="footer-item">${agencyEmail}</div>
        <div class="footer-item">${agencyWebsite}</div>
        <div class="footer-item">${agencyPhone}</div>
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

export type { VoucherData, VoucherGuest, VoucherFee };
