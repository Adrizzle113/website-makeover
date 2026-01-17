# Frontend Documentation

## Overview

This is a **React + TypeScript** travel booking application built with Vite, Tailwind CSS, and shadcn/ui components. The app enables users to search for hotels, view details, and complete bookings.

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool & dev server |
| Tailwind CSS | Utility-first styling |
| shadcn/ui | Component library |
| React Router | Client-side routing |
| TanStack Query | Server state management |
| Zustand | Client state management |
| Supabase | Backend (auth, database, edge functions) |
| Mapbox GL | Maps integration |

---

## Project Structure

```
src/
├── assets/              # Static images
├── components/
│   ├── auth/            # Authentication components
│   ├── booking/         # Booking flow components
│   ├── clients/         # Client management (admin)
│   ├── dashboard/       # Dashboard widgets
│   ├── documents/       # PDF viewer
│   ├── hotel/           # Hotel detail components
│   ├── layout/          # Header, Footer
│   ├── reporting/       # Reports & analytics
│   ├── search/          # Search & filters
│   ├── trips/           # Trip management
│   └── ui/              # shadcn/ui primitives
├── config/              # App configuration
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
├── pages/               # Route pages
├── services/            # API service layers
├── stores/              # Zustand stores
├── types/               # TypeScript interfaces
└── integrations/        # Supabase client
```

---

## Core Flows

### 1. Hotel Search Flow

```
Index.tsx → SearchBar → useHotelSearch → ratehawkApi.searchHotels()
                              ↓
                    SearchResultsSection → HotelCard
```

**Key Components:**
- `src/components/search/SearchBar.tsx` - Main search form
- `src/components/search/HotelCard.tsx` - Hotel result card
- `src/components/search/filters/` - Filter components
- `src/hooks/useHotelSearch.ts` - Search state & API calls
- `src/services/ratehawkApi.ts` - API service layer

**Search Types:**
1. **Destination** - Text search resolved to `region_id`
2. **Geo** - Latitude/longitude radius search
3. **POI** - Point of interest search
4. **Hotel IDs** - Direct hotel ID lookup

### 2. Hotel Details Flow

```
HotelDetailsPage → HotelHeroSection
                 → RoomSelectionSection → RateOptionsList
                 → BookingSidebar
```

**Key Components:**
- `src/pages/HotelDetailsPage.tsx` - Main page
- `src/components/hotel/RoomSelectionSection.tsx` - Room picker
- `src/components/hotel/BookingSidebar.tsx` - Booking summary

### 3. Booking Flow

```
BookingPage → GuestFormPanel → PaymentPage → ProcessingPage → BookingConfirmationPage
```

**Key Components:**
- `src/pages/BookingPage.tsx` - Guest details form
- `src/pages/PaymentPage.tsx` - Payment form
- `src/pages/ProcessingPage.tsx` - Payment processing
- `src/components/booking/` - All booking UI components
- `src/stores/bookingStore.ts` - Booking state (Zustand)

---

## State Management

### Zustand Store: `bookingStore.ts`

Manages the entire booking session:

```typescript
interface BookingState {
  hotel: Hotel | null;
  selectedRate: Rate | null;
  guestInfo: GuestInfo | null;
  paymentMethod: PaymentMethod;
  // ... actions
  setHotel: (hotel: Hotel) => void;
  setSelectedRate: (rate: Rate) => void;
  resetBooking: () => void;
}
```

### TanStack Query

Used for server state (API responses):

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['hotels', searchParams],
  queryFn: () => ratehawkApi.searchHotels(searchParams),
});
```

---

## API Integration

### Edge Functions (Backend)

Located in `supabase/functions/`:

| Function | Purpose |
|----------|---------|
| `travelapi-search` | Main hotel search |
| `travelapi-search-geo` | Geo-based search |
| `travelapi-search-poi` | POI-based search |
| `travelapi-search-ids` | Search by hotel IDs |
| `travelapi-destination` | Destination autocomplete |
| `travelapi-enrich` | Hotel data enrichment |
| `travelapi-filter-values` | Filter options |
| `worldota-hotel-info` | Additional hotel data |

### API Service: `ratehawkApi.ts`

Central API service with methods:

```typescript
class RateHawkApiService {
  searchHotels(params: SearchParams): Promise<SearchResponse>
  searchByGeo(params: GeoSearchParams): Promise<SearchResponse>
  searchByPOI(params: POISearchParams): Promise<SearchResponse>
  searchByIds(ids: string[]): Promise<SearchResponse>
  getDestinations(query: string): Promise<Destination[]>
}
```

---

## Routing

Defined in `src/App.tsx`:

| Path | Page | Description |
|------|------|-------------|
| `/` | Index | Landing & search |
| `/search` | SearchPage | Search results |
| `/hotel/:id` | HotelDetailsPage | Hotel details |
| `/booking` | BookingPage | Guest form |
| `/payment` | PaymentPage | Payment form |
| `/processing` | ProcessingPage | Payment processing |
| `/confirmation/:id` | BookingConfirmationPage | Success page |
| `/my-bookings` | MyBookingsPage | User bookings |
| `/dashboard` | Dashboard | Admin dashboard |

---

## Design System

### Tailwind Configuration

Custom theme tokens in `tailwind.config.ts`:

```typescript
colors: {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  muted: "hsl(var(--muted))",
  accent: "hsl(var(--accent))",
  // ...
}
```

### CSS Variables

Defined in `src/index.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  /* ... */
}
```

### Component Usage

Always use semantic tokens:

```tsx
// ✅ Correct
<div className="bg-primary text-primary-foreground" />

// ❌ Avoid
<div className="bg-blue-500 text-white" />
```

---

## Custom Hooks

| Hook | Purpose |
|------|---------|
| `useHotelSearch` | Hotel search state & API |
| `useDestinationAutocomplete` | Destination suggestions |
| `useDebounce` | Debounced values |
| `useLanguage` | i18n language context |
| `useTimezone` | User timezone detection |
| `useClockFormat` | 12/24h format preference |
| `useMobile` | Mobile breakpoint detection |
| `useFilterValues` | Search filter state |
| `useURLSync` | URL ↔ state synchronization |

---

## Key Types

### Hotel

```typescript
interface Hotel {
  id: string;
  hid: string;
  name: string;
  star_rating: number;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  images: string[];
  amenities: string[];
  rates: Rate[];
  price: number;
  currency: string;
}
```

### Rate

```typescript
interface Rate {
  rate_id: string;
  room_name: string;
  price: number;
  currency: string;
  meal_plan: string;
  cancellation_type: 'free' | 'non_refundable';
  free_cancellation_before?: string; // ISO date
  payment_type: 'pay_now' | 'pay_at_hotel';
}
```

### SearchParams

```typescript
interface SearchParams {
  destination?: string;
  regionId?: number;
  checkin: string;  // YYYY-MM-DD
  checkout: string;
  guests: GuestRoom[];
  residency: string;
  currency: string;
}
```

---

## Testing Tools

### Frontend Booking Test

`public/test-frontend-booking.html` - Standalone test tool to trace the booking flow:

1. **Destination Resolution** - Resolves text to `region_id`
2. **Hotel Search** - Finds available hotels
3. **Rate Extraction** - Extracts `free_cancellation_before`
4. **Prebook** - Tests prebook API
5. **Order Form** - Tests payment form
6. **Order Finish** - Tests booking completion

Access at: `/test-frontend-booking.html`

---

## Environment Variables

Required in `.env`:

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_MAPBOX_TOKEN=xxx (optional)
```

---

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Common Patterns

### API Error Handling

```typescript
try {
  const data = await ratehawkApi.searchHotels(params);
} catch (error) {
  if (error instanceof ApiError) {
    toast.error(error.message);
  }
}
```

### Loading States

```tsx
{isLoading ? (
  <HotelCardSkeleton />
) : (
  <HotelCard hotel={hotel} />
)}
```

### Form Validation

Uses `react-hook-form` + `zod`:

```typescript
const schema = z.object({
  email: z.string().email(),
  firstName: z.string().min(2),
});

const form = useForm<FormData>({
  resolver: zodResolver(schema),
});
```

---

## Troubleshooting

### No Hotels Found
- Check destination resolves to valid `region_id`
- Verify dates have availability
- Check API endpoint connectivity

### Booking Fails
- Verify `free_cancellation_before` is passed correctly
- Check guest validation
- Inspect network requests in browser devtools

### Maps Not Loading
- Verify `VITE_MAPBOX_TOKEN` is set
- Check Mapbox GL CSS is imported
