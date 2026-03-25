export type AssetKind =
  | "shop"
  | "office"
  | "guesthouse"
  | "godown"
  | "chiller"
  | "freezer"
  | "refrigerator"
  | "ac"
  | "it"
  | "chair"
  | "other";

export type AssetLocationType = "shop" | "office" | "guesthouse" | "godown" | "other";

export type Asset = {
  id: string;
  name: string;
  kind: AssetKind;

  code?: string; // warehouse/outlet code (optional)
  locationType: AssetLocationType;
  locationName: string; // e.g. "Shop 1", "Guest house 2"

  address?: string;
  phone?: string;
  outletType?: "RETAIL" | "WHOLE SALE" | "OTHER";
  numberOfCounters?: string;

  brand?: string;
  model?: string;
  serialNumber?: string;
  imageDataUrl?: string; // local MVP
  imageUrl?: string; // Cloudinary future
  purchasedDate?: string; // YYYY-MM-DD
  warrantyEndDate?: string; // YYYY-MM-DD
  lastServicedDate?: string; // YYYY-MM-DD (manual or from task)

  notes?: string;

  createdAt: number;
  updatedAt: number;
};

