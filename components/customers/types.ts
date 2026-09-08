export type CustomerAddressDto = {
  id: string;
  label: string | null;
  raw: string;
  zipcode: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  lat: number | null;
  lng: number | null;
  geocodingProvider: string | null;
  confidence: number | null;
  geocodedAt: string | null;
};

export type CustomerDto = {
  id: string;
  code: string | null;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  primaryAddress: CustomerAddressDto | null;
};