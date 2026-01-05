export interface FilterValueOption {
  value: string;
  desc: string;
}

export interface FilterValuesData {
  countries: FilterValueOption[];
  languages: FilterValueOption[];
  serpFilters: FilterValueOption[];
  hotelKinds: FilterValueOption[];
  starRatings: number[];
}

export interface FilterValuesResponse {
  success: boolean;
  data: FilterValuesData;
  cached: boolean;
  expiresAt?: string;
  fallback?: boolean;
  error?: string;
}
