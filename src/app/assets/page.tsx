"use client";

import { useEffect, useMemo, useState } from "react";
import type { Asset, AssetKind, AssetLocationType } from "@/lib/assetTypes";
import { createAsset, deleteAsset, updateAsset } from "@/lib/assetStore";
import { useAssets } from "@/lib/useAssets";
import { assertSmallImage, fileToDataUrl } from "@/lib/imageUtils";
import { uploadToCloudinaryUnsigned } from "@/lib/cloudinary";
import { seedMadihaaMasterDataIfEmpty } from "@/lib/assetSeed";

function kindLabel(kind: AssetKind) {
  switch (kind) {
    case "shop":
      return "Shop";
    case "office":
      return "Office";
    case "guesthouse":
      return "Guest House";
    case "godown":
      return "Godown";
    case "chiller":
      return "Chiller";
    case "freezer":
      return "Freezer";
    case "refrigerator":
      return "Refrigerator";
    case "ac":
      return "AC";
    case "it":
      return "IT Item";
    case "chair":
      return "Chair";
    default:
      return "Other";
  }
}

export default function AssetsPage() {
  const assets = useAssets();

  useEffect(() => {
    if (assets.length === 0) {
      seedMadihaaMasterDataIfEmpty();
    }
  }, [assets.length]);

  const [q, setQ] = useState("");
  const [kind, setKind] = useState<"all" | AssetKind>("all");

  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState<AssetKind>("chiller");
  const [newLocationType, setNewLocationType] = useState<AssetLocationType>("shop");
  const [newLocationName, setNewLocationName] = useState("Shop 1");
  const [newBrand, setNewBrand] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newSerial, setNewSerial] = useState("");
  const [newPurchasedDate, setNewPurchasedDate] = useState("");
  const [newWarrantyEndDate, setNewWarrantyEndDate] = useState("");
  const [newLastServicedDate, setNewLastServicedDate] = useState("");
  const [newImageDataUrl, setNewImageDataUrl] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageName, setNewImageName] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [assetImageError, setAssetImageError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<Asset>>({});

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return assets
      .filter((a) => (kind === "all" ? true : a.kind === kind))
      .filter((a) => {
        if (!query) return true;
        return (
          a.name.toLowerCase().includes(query) ||
          a.locationName.toLowerCase().includes(query) ||
          (a.serialNumber ?? "").toLowerCase().includes(query) ||
          (a.brand ?? "").toLowerCase().includes(query) ||
          (a.model ?? "").toLowerCase().includes(query)
        );
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [assets, q, kind]);

  const startEdit = (a: Asset) => {
    setEditingId(a.id);
    setEditing({ ...a });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditing({});
  };

  const saveEdit = () => {
    if (!editingId) return;
    updateAsset(editingId, {
      name: (editing.name ?? "").trim(),
      kind: editing.kind as AssetKind,
      locationType: editing.locationType as AssetLocationType,
      locationName: (editing.locationName ?? "").trim(),
      brand: (editing.brand ?? "").trim() || undefined,
      model: (editing.model ?? "").trim() || undefined,
      serialNumber: (editing.serialNumber ?? "").trim() || undefined,
      purchasedDate: (editing.purchasedDate ?? "").trim() || undefined,
      warrantyEndDate: (editing.warrantyEndDate ?? "").trim() || undefined,
      lastServicedDate: (editing.lastServicedDate ?? "").trim() || undefined,
      imageUrl: editing.imageUrl as string | undefined,
      notes: (editing.notes ?? "").trim() || undefined,
    });
    cancelEdit();
  };

  const onCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;

    createAsset({
      name,
      kind: newKind,
      locationType: newLocationType,
      locationName: newLocationName.trim() || "Unknown location",
      brand: newBrand.trim() || undefined,
      model: newModel.trim() || undefined,
      serialNumber: newSerial.trim() || undefined,
      purchasedDate: newPurchasedDate || undefined,
      warrantyEndDate: newWarrantyEndDate || undefined,
      lastServicedDate: newLastServicedDate || undefined,
      imageUrl: newImageUrl || undefined,
      notes: newNotes.trim() || undefined,
    });

    setNewName("");
    setNewBrand("");
    setNewModel("");
    setNewSerial("");
    setNewPurchasedDate("");
    setNewWarrantyEndDate("");
    setNewLastServicedDate("");
    setNewImageDataUrl("");
    setNewImageUrl("");
    setNewImageName("");
    setNewNotes("");
    setAssetImageError("");
  };

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-indigo-950">Assets</h1>
          <p className="text-sm text-indigo-700/80">
            Add all items: shop/office/guest house/godown items, chillers, freezers, IT items, AC, etc.
          </p>
          <button
            type="button"
            onClick={() => seedMadihaaMasterDataIfEmpty()}
            className="mt-3 inline-flex items-center justify-center rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
          >
            Import warehouses + outlets
          </button>
        </div>
      </div>

      <form
        onSubmit={onCreate}
        className="mt-4 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-sky-50 p-4 shadow-sm"
      >
        <div className="text-sm font-semibold text-indigo-950">Add asset</div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <div className="text-xs text-zinc-600">Name</div>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Chiller-01 / AC-Office / Router / Chair"
              className="mt-1 h-10 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div>
            <div className="text-xs text-zinc-600">Kind</div>
            <select
              value={newKind}
              onChange={(e) => setNewKind(e.target.value as AssetKind)}
              className="mt-1 h-10 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="chiller">Chiller</option>
              <option value="freezer">Freezer</option>
              <option value="refrigerator">Refrigerator</option>
              <option value="ac">AC</option>
              <option value="it">IT Item</option>
              <option value="chair">Chair</option>
              <option value="shop">Shop (entity)</option>
              <option value="office">Office (entity)</option>
              <option value="guesthouse">Guest House (entity)</option>
              <option value="godown">Godown (entity)</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <div className="text-xs text-zinc-600">Location type</div>
            <select
              value={newLocationType}
              onChange={(e) => setNewLocationType(e.target.value as AssetLocationType)}
              className="mt-1 h-10 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="shop">Shop</option>
              <option value="office">Office</option>
              <option value="guesthouse">Guest House</option>
              <option value="godown">Godown</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <div className="text-xs text-zinc-600">Location name</div>
            <input
              value={newLocationName}
              onChange={(e) => setNewLocationName(e.target.value)}
              placeholder="e.g. Shop 1 / Main Office / Guest house 2"
              className="mt-1 h-10 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div>
            <div className="text-xs text-zinc-600">Brand (optional)</div>
            <input
              value={newBrand}
              onChange={(e) => setNewBrand(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div>
            <div className="text-xs text-zinc-600">Model (optional)</div>
            <input
              value={newModel}
              onChange={(e) => setNewModel(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div className="md:col-span-2">
            <div className="text-xs text-zinc-600">Serial number (optional)</div>
            <input
              value={newSerial}
              onChange={(e) => setNewSerial(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div>
            <div className="text-xs text-zinc-600">Purchase date (optional)</div>
            <input
              type="date"
              value={newPurchasedDate}
              onChange={(e) => setNewPurchasedDate(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <div className="text-xs text-zinc-600">Warranty end date (optional)</div>
            <input
              type="date"
              value={newWarrantyEndDate}
              onChange={(e) => setNewWarrantyEndDate(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <div className="text-xs text-zinc-600">Last serviced date (optional/manual)</div>
            <input
              type="date"
              value={newLastServicedDate}
              onChange={(e) => setNewLastServicedDate(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <div className="text-xs text-zinc-600">Asset image (optional)</div>
            <label className="mt-1 flex h-10 cursor-pointer items-center justify-center rounded-lg border border-indigo-200 bg-white text-xs font-medium text-indigo-700 hover:bg-indigo-50">
              Choose image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0] ?? null;
                  e.currentTarget.value = "";
                  setAssetImageError("");
                  if (!f) return;
                  try {
                    assertSmallImage(f, 1_000_000);
                    const dataUrl = await fileToDataUrl(f);
                    setNewImageDataUrl(dataUrl);
                    setNewImageName(f.name);
                    const url = await uploadToCloudinaryUnsigned({ file: f });
                    setNewImageUrl(url);
                  } catch (err) {
                    setAssetImageError(err instanceof Error ? err.message : "Failed to load image");
                  }
                }}
              />
            </label>
          </div>

          {assetImageError ? <div className="md:col-span-2 text-xs text-red-700">{assetImageError}</div> : null}
          {newImageDataUrl ? (
            <div className="md:col-span-2 rounded-lg border border-indigo-200 bg-white p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={newImageDataUrl} alt={newImageName} className="h-36 w-full rounded-md object-cover" />
              <div className="mt-2 flex items-center justify-between">
                <div className="truncate text-xs text-zinc-600">{newImageName}</div>
                <button
                  type="button"
                  onClick={() => {
                    setNewImageDataUrl("");
                    setNewImageUrl("");
                    setNewImageName("");
                  }}
                  className="text-xs font-medium text-red-700 hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : null}

          <div className="md:col-span-2">
            <div className="text-xs text-zinc-600">Notes (optional)</div>
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600"
            >
              Add asset
            </button>
          </div>
        </div>
      </form>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="text-xs text-zinc-600">Search</div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="name, location, serial, brand..."
            className="mt-1 h-10 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <div>
          <div className="text-xs text-zinc-600">Kind</div>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
            className="mt-1 h-10 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="all">All</option>
            <option value="chiller">Chiller</option>
            <option value="freezer">Freezer</option>
            <option value="refrigerator">Refrigerator</option>
            <option value="ac">AC</option>
            <option value="it">IT Item</option>
            <option value="chair">Chair</option>
            <option value="shop">Shop (entity)</option>
            <option value="office">Office (entity)</option>
            <option value="guesthouse">Guest House (entity)</option>
            <option value="godown">Godown (entity)</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-indigo-200 bg-white shadow-sm">
        {filtered.length === 0 ? (
          <div className="p-4 text-sm text-zinc-600">No assets found.</div>
        ) : (
          <div className="divide-y divide-indigo-100">
            {filtered.map((a) => {
              const isEditing = editingId === a.id;
              return (
                <div key={a.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <input
                          value={(editing.name as string) ?? ""}
                          onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))}
                          className="h-10 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                      ) : (
                        <div className="truncate text-sm font-semibold text-indigo-950">{a.name}</div>
                      )}

                      <div className="mt-1 text-xs text-indigo-700">
                        {kindLabel(a.kind)} • {a.locationType.toUpperCase()} • {a.locationName}
                      </div>
                      <div className="mt-1 text-[11px] text-zinc-500">
                        {a.brand ? `Brand: ${a.brand}` : ""}
                        {a.model ? ` • Model: ${a.model}` : ""}
                        {a.serialNumber ? ` • Serial: ${a.serialNumber}` : ""}
                      </div>

                      {(a.code || a.outletType || a.numberOfCounters || a.address || a.phone) ? (
                        <div className="mt-1 text-[11px] text-zinc-500">
                          {a.code ? `Code: ${a.code}` : ""}
                          {a.outletType ? ` • Outlet: ${a.outletType}` : ""}
                          {a.numberOfCounters ? ` • Counters: ${a.numberOfCounters}` : ""}
                          {a.address ? ` • ${a.address}` : ""}
                          {a.phone ? ` • Phone: ${a.phone}` : ""}
                        </div>
                      ) : null}
                      <div className="mt-1 text-[11px] text-zinc-500">
                        {a.purchasedDate ? `Purchased: ${a.purchasedDate}` : "Purchased: —"}
                        {a.warrantyEndDate ? ` • Warranty end: ${a.warrantyEndDate}` : " • Warranty end: —"}
                        {a.lastServicedDate ? ` • Last serviced: ${a.lastServicedDate}` : " • Last serviced: —"}
                      </div>
                      {a.imageDataUrl || a.imageUrl ? (
                        <div className="mt-2 w-28 rounded-lg border border-indigo-100 bg-indigo-50 p-1">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={a.imageUrl ?? a.imageDataUrl}
                            alt={a.name}
                            className="h-20 w-full rounded-md object-cover"
                          />
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={saveEdit}
                            className="rounded-lg bg-indigo-700 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-600"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEdit(a)}
                            className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const ok = window.confirm(`Delete asset "${a.name}"?`);
                              if (!ok) return;
                              deleteAsset(a.id);
                            }}
                            className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div>
                        <div className="text-xs text-zinc-600">Kind</div>
                        <select
                          value={(editing.kind as AssetKind) ?? a.kind}
                          onChange={(e) => setEditing((p) => ({ ...p, kind: e.target.value as AssetKind }))}
                          className="mt-1 h-10 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                        >
                          <option value="chiller">Chiller</option>
                          <option value="freezer">Freezer</option>
                          <option value="refrigerator">Refrigerator</option>
                          <option value="ac">AC</option>
                          <option value="it">IT Item</option>
                          <option value="chair">Chair</option>
                          <option value="shop">Shop (entity)</option>
                          <option value="office">Office (entity)</option>
                          <option value="guesthouse">Guest House (entity)</option>
                          <option value="godown">Godown (entity)</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <div className="text-xs text-zinc-600">Location type</div>
                        <select
                          value={(editing.locationType as AssetLocationType) ?? a.locationType}
                          onChange={(e) =>
                            setEditing((p) => ({ ...p, locationType: e.target.value as AssetLocationType }))
                          }
                          className="mt-1 h-10 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                        >
                          <option value="shop">Shop</option>
                          <option value="office">Office</option>
                          <option value="guesthouse">Guest House</option>
                          <option value="godown">Godown</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <div className="text-xs text-zinc-600">Location name</div>
                        <input
                          value={(editing.locationName as string) ?? a.locationName}
                          onChange={(e) => setEditing((p) => ({ ...p, locationName: e.target.value }))}
                          className="mt-1 h-10 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                      </div>

                      <div>
                        <div className="text-xs text-zinc-600">Brand</div>
                        <input
                          value={(editing.brand as string) ?? a.brand ?? ""}
                          onChange={(e) => setEditing((p) => ({ ...p, brand: e.target.value }))}
                          className="mt-1 h-10 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                      </div>
                      <div>
                        <div className="text-xs text-zinc-600">Model</div>
                        <input
                          value={(editing.model as string) ?? a.model ?? ""}
                          onChange={(e) => setEditing((p) => ({ ...p, model: e.target.value }))}
                          className="mt-1 h-10 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <div className="text-xs text-zinc-600">Serial number</div>
                        <input
                          value={(editing.serialNumber as string) ?? a.serialNumber ?? ""}
                          onChange={(e) => setEditing((p) => ({ ...p, serialNumber: e.target.value }))}
                          className="mt-1 h-10 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                      </div>
                      <div>
                        <div className="text-xs text-zinc-600">Purchase date</div>
                        <input
                          type="date"
                          value={(editing.purchasedDate as string) ?? a.purchasedDate ?? ""}
                          onChange={(e) => setEditing((p) => ({ ...p, purchasedDate: e.target.value }))}
                          className="mt-1 h-10 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                      </div>
                      <div>
                        <div className="text-xs text-zinc-600">Warranty end date</div>
                        <input
                          type="date"
                          value={(editing.warrantyEndDate as string) ?? a.warrantyEndDate ?? ""}
                          onChange={(e) => setEditing((p) => ({ ...p, warrantyEndDate: e.target.value }))}
                          className="mt-1 h-10 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                      </div>
                      <div>
                        <div className="text-xs text-zinc-600">Last serviced date</div>
                        <input
                          type="date"
                          value={(editing.lastServicedDate as string) ?? a.lastServicedDate ?? ""}
                          onChange={(e) => setEditing((p) => ({ ...p, lastServicedDate: e.target.value }))}
                          className="mt-1 h-10 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                      </div>
                      <div>
                        <div className="text-xs text-zinc-600">Asset image</div>
                        <label className="mt-1 flex h-10 cursor-pointer items-center justify-center rounded-lg border border-indigo-200 bg-white text-xs font-medium text-indigo-700 hover:bg-indigo-50">
                          Change image
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const f = e.target.files?.[0] ?? null;
                              e.currentTarget.value = "";
                              if (!f) return;
                              try {
                                assertSmallImage(f, 1_000_000);
                                const dataUrl = await fileToDataUrl(f);
                                const url = await uploadToCloudinaryUnsigned({ file: f });
                                setEditing((p) => ({ ...p, imageDataUrl: dataUrl, imageUrl: url }));
                              } catch {
                                // ignore for now
                              }
                            }}
                          />
                        </label>
                      </div>
                      {(editing.imageDataUrl as string) || a.imageDataUrl || a.imageUrl ? (
                        <div className="md:col-span-2 w-36 rounded-lg border border-indigo-100 bg-indigo-50 p-1">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={(editing.imageDataUrl as string) ?? a.imageUrl ?? a.imageDataUrl}
                            alt={a.name}
                            className="h-24 w-full rounded-md object-cover"
                          />
                        </div>
                      ) : null}

                      <div className="md:col-span-2">
                        <div className="text-xs text-zinc-600">Notes</div>
                        <textarea
                          value={(editing.notes as string) ?? a.notes ?? ""}
                          onChange={(e) => setEditing((p) => ({ ...p, notes: e.target.value }))}
                          rows={3}
                          className="mt-1 w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

