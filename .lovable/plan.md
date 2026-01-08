# Plan: Optimized Hotel Loading Strategy

## Overview

Implement a sophisticated multi-stage loading strategy that shows skeleton cards immediately, uses cached data when available, eager-loads images for visible hotels, and progressively reveals results as they become ready.

---

## Current State Analysis

**Current Flow:**
1. Search starts -> Loading spinner shown
2. API returns raw hotels -> First batch (10) added to `searchResults`
3. Enrichment starts -> Hotels only shown after enrichment completes
4. Skeleton cards shown only when `hotels.length === 0 && isEnriching`

**Problems:**
- No skeleton cards shown immediately on search
- Cached results aren't used as preview
- Images load lazily but no priority for visible ones
- Batch size is 10, not 20
- No visual feedback during the wait for first batch

---

## Proposed Solution

### Phase 1: Immediate Skeleton Display (20 cards)

**File: `src/components/search/SearchResultsSection.tsx`**

Show 20 skeleton cards immediately when:
- `isLoading` is true (search in progress)
- OR when `searchResults.length > 0` but no enriched hotels yet

```typescript
// New state to track skeleton display
const [showSkeletons, setShowSkeletons] = useState(false);

// Show skeletons immediately when loading starts
useEffect(() => {
  if (isLoading && !isFilterSearching) {
    setShowSkeletons(true);
  } else if (!isEnriching && hotels.length > 0) {
    setShowSkeletons(false);
  }
}, [isLoading, isEnriching, isFilterSearching, hotels.length]);

// In render - show 20 skeletons during initial load
{showSkeletons && hotels.length === 0 && (
  <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto">
    {Array.from({ length: 20 }).map((_, i) => (
      <HotelCardSkeleton key={`skeleton-${i}`} />
    ))}
  </div>
)}
```

---

### Phase 2: Use Cached/Preview Results

**File: `src/stores/bookingStore.ts`**

Add a method to check for cached enriched hotels that match current search:

```typescript
// Add to interface
getCachedEnrichedHotels: (hotelIds: string[]) => Hotel[];

// Implementation
getCachedEnrichedHotels: (hotelIds) => {
  const state = get();
  return hotelIds
    .map(id => state.enrichedHotels.get(id))
    .filter((h): h is Hotel => h !== undefined && !!h.mainImage);
}
```

**File: `src/components/search/SearchResultsSection.tsx`**

When new search results arrive, immediately show any that are already cached:

```typescript
// Modify hotels useMemo to prioritize showing cached hotels immediately
const hotels = useMemo(() => {
  // For hotels in searchResults, check if we already have them enriched
  let displayHotels = searchResults
    .map((h, originalIndex) => ({
      hotel: enrichedHotels.get(h.id),
      rawHotel: h, // Keep reference to raw hotel
      originalIndex
    }))
    .filter((item): item is { hotel: Hotel; rawHotel: Hotel; originalIndex: number } => 
      item.hotel !== undefined && !!item.hotel.mainImage
    );
  
  // ... rest of filtering and sorting
}, [searchResults, enrichedHotels, sortBy, filters]);
```

---

### Phase 3: Eager-Load First 6-10 Images

**File: `src/services/ratehawkApi.ts`**

Modify `enrichFromWorldOTA` to prioritize the first 10 hotels:

```typescript
// In enrichFromWorldOTA, process first 10 with higher priority
// Use parallel fetching for first 6, then sequential for rest
private async enrichFromWorldOTA(hotels: any[]): Promise<any[]> {
  // Split into priority batches
  const priorityBatch = unenrichedHotels.slice(0, 6);  // First 6 in parallel
  const secondaryBatch = unenrichedHotels.slice(6, 10); // Next 4 sequential
  
  // Fetch first 6 in parallel (fast)
  const priorityPromises = priorityBatch.map(hotel => 
    this.fetchHotelInfo(extractHid(hotel)).catch(() => null)
  );
  const priorityResults = await Promise.all(priorityPromises);
  
  // Merge priority results immediately
  // Then continue with secondary batch...
}
```

**File: `src/components/search/HotelCard.tsx`**

Add `fetchpriority` attribute for first 6 images:

```typescript
interface HotelCardProps {
  hotel: Hotel;
  compact?: boolean;
  priority?: boolean; // New prop for eager loading
  onHover?: (hotelId: string | null) => void;
  onFocus?: (hotelId: string | null) => void;
}

// In img tag
<img
  src={hotel.mainImage || fallbackImage}
  alt={hotel.name}
  loading={priority ? "eager" : "lazy"}
  fetchpriority={priority ? "high" : "auto"}
  className="w-full h-full object-cover"
  onError={handleImageError}
/>
```

**File: `src/components/search/SearchResultsSection.tsx`**

Pass `priority` prop to first 6 hotel cards:

```typescript
{hotels.map((hotel, index) => (
  <HotelCard 
    key={`${hotel.id}-${index}`} 
    hotel={hotel}
    priority={index < 6} // Eager load first 6
  />
))}
```

---

### Phase 4: Progressive Loading - Show 20 When First 10 Ready

**File: `src/stores/bookingStore.ts`**

Change batch size from 10 to 20:

```typescript
const DISPLAY_BATCH_SIZE = 20;
```

**File: `src/components/search/SearchResultsSection.tsx`**

Show cards progressively as they become enriched (not wait for all 20):

```typescript
// New threshold for showing results
const MIN_HOTELS_TO_SHOW = 10;

// Modify the render condition
const showHotelCards = hotels.length >= MIN_HOTELS_TO_SHOW || 
  (!isEnriching && hotels.length > 0);

// Mixed skeleton + real cards while loading more
{showHotelCards && effectiveViewMode === "list" && (
  <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto">
    {hotels.map((hotel, index) => (
      <HotelCard key={`${hotel.id}-${index}`} hotel={hotel} priority={index < 6} />
    ))}
    
    {/* Show remaining skeletons for hotels still enriching */}
    {isEnriching && hotels.length < searchResults.length && (
      Array.from({ length: Math.min(20 - hotels.length, 10) }).map((_, i) => (
        <HotelCardSkeleton key={`remaining-skeleton-${i}`} />
      ))
    )}
    
    {/* Infinite scroll sentinel */}
    <div ref={listSentinelRef} className="h-4" />
  </div>
)}
```

---

### Phase 5: Paginate 20 at a Time

**File: `src/stores/bookingStore.ts`**

Already set `DISPLAY_BATCH_SIZE = 20` in Phase 4.

**File: `src/components/search/SearchResultsSection.tsx`**

The infinite scroll already works with `getNextBatchToDisplay()` which uses `DISPLAY_BATCH_SIZE`. Just ensure the "Load More" shows skeletons:

```typescript
{/* Loading more indicator with skeletons */}
{isLoadingMore && (
  <div className="space-y-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <HotelCardSkeleton key={`loadmore-skeleton-${i}`} />
    ))}
  </div>
)}
```

---

### Phase 6: Revalidate and Swap to Live Results

**File: `src/components/search/SearchResultsSection.tsx`**

The current implementation already handles this well:
- `enrichedHotels` Map caches enriched data
- As enrichment completes, hotels get updated in the cache
- The `hotels` useMemo automatically picks up enriched versions

No changes needed - the current reactive pattern handles revalidation.

---

## Summary of Changes

| File | Changes |
|------|---------|
| `src/stores/bookingStore.ts` | Change `DISPLAY_BATCH_SIZE` from 10 to 20, add `getCachedEnrichedHotels` helper |
| `src/components/search/SearchResultsSection.tsx` | Show 20 skeletons immediately, progressive reveal at 10+ ready, mixed skeleton+cards during load, skeleton loaders for "load more" |
| `src/components/search/HotelCard.tsx` | Add `priority` prop for eager loading first 6 images |
| `src/services/ratehawkApi.ts` | Parallel fetch for first 6 hotels in WorldOTA enrichment |

## Expected User Experience

1. **Instant** - 20 skeleton cards appear immediately on search
2. **Fast** - If any hotels are cached, they appear within milliseconds
3. **Progressive** - As soon as 10 hotels are enriched, they appear (mixed with skeletons)
4. **Visual feedback** - Top loading bar shows progress throughout
5. **Smooth pagination** - Scrolling loads 20 more, with skeletons shown during enrichment
6. **Seamless updates** - Cached hotels get revalidated and swapped silently

---

## Critical Files for Implementation

- `src/components/search/SearchResultsSection.tsx` - Main changes for skeleton display and progressive loading
- `src/stores/bookingStore.ts` - Batch size change and cache helper
- `src/components/search/HotelCard.tsx` - Priority loading prop
- `src/services/ratehawkApi.ts` - Parallel image fetching for first batch
- `src/components/search/HotelCardSkeleton.tsx` - No changes needed, already works
