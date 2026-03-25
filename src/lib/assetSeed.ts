"use client";

import { db } from "@/lib/firebaseClient";
import type { Asset, AssetKind } from "@/lib/assetTypes";
import { collection, doc, getDocs, writeBatch } from "firebase/firestore";

type AssetSeedInput = Omit<Asset, "createdAt" | "updatedAt">;

function guessKindFromName(name: string): AssetKind {
  const n = name.toLowerCase();
  if (n.includes("freezer")) return "freezer";
  if (n.includes("chiller")) return "chiller";
  if (n.includes("refrigerator")) return "refrigerator";
  if (n.includes("ac")) return "ac";
  if (n.includes("router") || n.includes("pc") || n.includes("printer") || n.includes("cctv")) return "it";
  if (n.includes("chair")) return "chair";
  if (n.includes("godown") || n.includes("go down") || n.includes("container")) return "godown";
  return "other";
}

export async function seedMadihaaMasterDataIfEmpty() {
  const existingSnap = await getDocs(collection(db, "assets"));
  if (!existingSnap.empty) return;

  const now = Date.now();

  const push = (items: AssetSeedInput[]): Asset[] => {
    // Add createdAt/updatedAt for seed items.
    return items.map((x) => ({ ...x, createdAt: now, updatedAt: now }));
  };

  const godownLocationType = "godown" as const;

  const hulhumaleGodownCode = "HMCGD";
  const maleCentralGodownCode = "MCGD";

  const baseGodownLocationName = (code: string) => `Godown • ${code}`;

  const seedAssets: Asset[] = [];

  // HULHUMALE GODOWN
  seedAssets.push(
    ...push([
      {
        id: "seed-hmcgd-dry",
        name: "HULHUMALE GODOWN - Dry godown",
        kind: "godown" as const,
        code: hulhumaleGodownCode,
        locationType: godownLocationType,
        locationName: baseGodownLocationName(hulhumaleGodownCode),
      },
      ...Array.from({ length: 30 }).map((_, i) => ({
        id: `seed-hmcgd-container-${String(i + 1).padStart(2, "0")}`,
        name: `HULHUMALE GODOWN - Container ${String(i + 1).padStart(2, "0")}`,
        kind: "godown" as const,
        code: hulhumaleGodownCode,
        locationType: godownLocationType,
        locationName: baseGodownLocationName(hulhumaleGodownCode),
      })),
    ]),
  );

  // MALE CENTRAL GODOWN
  const maleCentralLocations: string[] = [
    "Male' Chocolate Godown",
    "Male' Salsa Godown",
    "Male' Dharavandhoo Godown",
    "Male' Kurahaage Chiller1",
    "Male' Kurahaage Chiller2",
    "Male' Dushin Godown",
    "Male' Zeibi Godown",
    "Male' Doores Godown",
    "Male' Aroma Chiller1",
    "Male' Aroma Chiller2",
    "Male' Doores Chiller",
    "Male' Doores Freezer",
    "Male' Banana Container",
    "Male' Dhannage Go down",
  ];

  seedAssets.push(
    ...push(
      maleCentralLocations.map((loc, idx) => ({
        id: `seed-mcg-${idx + 1}`,
        name: `MALE CENTRAL GODOWN - ${loc}`,
        kind: guessKindFromName(loc),
        code: maleCentralGodownCode,
        locationType: godownLocationType,
        locationName: baseGodownLocationName(maleCentralGodownCode),
      })),
    ),
  );

  // SHOPS / OUTLETS (as assets of kind shop)
  const outlets: Array<{
    code: string;
    name: string;
    outletType: Asset["outletType"];
    numberOfCounters: string;
    address: string;
    phone: string;
  }> = [
    {
      code: "UMR",
      name: "UFANVELI MALE RETAIL",
      outletType: "RETAIL",
      numberOfCounters: "03",
      address: "M. Ufanveli / Ground floor, Orchid Magu 20223, K. Male', Maldives",
      phone: "3008883/ 7248827",
    },
    {
      code: "UMW",
      name: "UFANVELI MALE WHOLESALE",
      outletType: "WHOLE SALE",
      numberOfCounters: "02",
      address: "M. Dharavandhooge Uthuruge, Ground Floor, Lainoofaru Magu 20223, K. Male', Maldives",
      phone: "3328883/ 7258825",
    },
    {
      code: "UH1",
      name: "UFANVELI HULHUMALE SHOP 01",
      outletType: "WHOLE SALE",
      numberOfCounters: "WHOLESALE 01, RETAIL 02",
      address: "Hulhumale Goathi No 11176, Chanbeylee Magu, 06 No Goalhi 23000, K. Hulhumale', Maldives",
      phone: "3358883/ 7208827",
    },
    {
      code: "UH2",
      name: "UFANVELI HULHUMALE SHOP 02",
      outletType: "WHOLE SALE",
      numberOfCounters: "WHOLESALE 01, RETAIL 02",
      address: "Hulhumale Lot No 10491, Ground Floor, Nirolhu Magu 23000, K. Hulhumale', Maldives",
      phone: "3308883/ 7378827",
    },
    {
      code: "UGS",
      name: "UFANVELI GALOLHU SHOP",
      outletType: "WHOLE SALE",
      numberOfCounters: "WHOLESALE 01, RETAIL 02",
      address: "Majeedhee Magu Block 132 (Polco Building), Majeedhee Magu 20132, K. Male', Maldives",
      phone: "3398883/ 7838827",
    },
    {
      code: "UAS",
      name: "UFANVELI ATHOLHU SHOP",
      outletType: "WHOLE SALE",
      numberOfCounters: "WHOLESALE 01, RETAIL 01",
      address: "HA. Atholhu Fihaara, Boduthakurufaanu Magu 20215, K. Male', Maldives",
      phone: "3348827/ 7428827",
    },
    {
      code: "UBS",
      name: "UFANVELI BAZARU SHOP",
      outletType: "WHOLE SALE",
      numberOfCounters: "WHOLESALE 02",
      address: "Crescent No. 7, Husainee Goalhi 20206, K. Male', Maldives",
      phone: "3348883/ 7318827",
    },
  ];

  seedAssets.push(
    ...push(
      outlets.map((o, idx) => ({
        id: `seed-outlet-${o.code}-${idx + 1}`,
        name: `${o.name} (${o.code})`,
        kind: "shop" as const,
        code: o.code,
        locationType: "shop" as const,
        locationName: `Outlet • ${o.code}`,
        outletType: o.outletType,
        numberOfCounters: o.numberOfCounters,
        address: o.address,
        phone: o.phone,
      })),
    ),
  );

  // Persist to Firestore
  const batch = writeBatch(db);
  const ref = collection(db, "assets");
  for (const a of seedAssets) {
    batch.set(doc(ref, a.id), a);
  }
  await batch.commit();
}

