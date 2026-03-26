"use client";

import { useEffect, useMemo, useState } from "react";
import type { Asset, AssetKind, AssetLocationType } from "@/lib/assetTypes";
import { createAsset, deleteAsset, updateAsset } from "@/lib/assetStore";
import { useAssets } from "@/lib/useAssets";
import { seedMadihaaMasterDataIfEmpty } from "@/lib/assetSeed";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Input, Select, Textarea } from "@/components/ui";
import { Plus, Search, Wrench, Building2, Edit2, Trash2, Upload, X, Filter } from "lucide-react";

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
  const [newCode, setNewCode] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<Asset>>({});

  const locationNameSuggestionsByType = useMemo(() => {
    const map: Record<AssetLocationType, string[]> = {
      shop: [],
      office: [],
      guesthouse: [],
      godown: [],
      other: [],
    };

    for (const a of assets) {
      const type = a.locationType;
      const name = (a.locationName ?? "").trim();
      if (!name) continue;
      if (!map[type].includes(name)) map[type].push(name);
    }

    for (const k of Object.keys(map) as AssetLocationType[]) {
      map[k].sort((a, b) => a.localeCompare(b));
    }

    return map;
  }, [assets]);

  useEffect(() => {
    const nextSuggestions = locationNameSuggestionsByType[newLocationType] ?? [];
    if (nextSuggestions.length === 0) return;

    const current = (newLocationName ?? "").trim();
    if (!current || !nextSuggestions.includes(current)) {
      setNewLocationName(nextSuggestions[0]);
    }
  }, [locationNameSuggestionsByType, newLocationType, newLocationName]);

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
      code: (editing.code ?? "").trim() || undefined,
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
      code: newCode.trim() || undefined,
    });

    setNewName("");
    setNewCode("");
  };

  return (
    <div className="container mx-auto p-4 lg:p-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assets</h1>
          <p className="text-muted-foreground">Manage equipment, locations, and inventory</p>
        </div>
        <Button
          variant="outline"
          onClick={() => seedMadihaaMasterDataIfEmpty()}
        >
          <Building2 className="h-4 w-4 mr-2" />
          Import Warehouses & Outlets
        </Button>
      </div>

      {/* Add Asset Form */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Asset
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCreate}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  list="asset-location-name-suggestions"
                  className="mt-1 h-10 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <datalist id="asset-location-name-suggestions">
                  {locationNameSuggestionsByType[newLocationType].map((n) => (
                    <option key={`${newLocationType}:${n}`} value={n} />
                  ))}
                </datalist>
              </div>

              <div className="md:col-span-2">
                <div className="text-xs text-zinc-600">Code (optional)</div>
                <input
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="e.g. HMCGD / UH1"
                  className="mt-1 h-10 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              <div className="md:col-span-2 flex justify-end">
                <Button type="submit">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Asset
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                icon={<Search className="h-4 w-4" />}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, location, serial, brand..."
              />
            </div>
            <Select
              value={kind}
              onChange={(e) => setKind(e.target.value as typeof kind)}
              options={[
                { value: "all", label: "All Types" },
                { value: "chiller", label: "Chiller" },
                { value: "freezer", label: "Freezer" },
                { value: "refrigerator", label: "Refrigerator" },
                { value: "ac", label: "AC" },
                { value: "it", label: "IT Item" },
                { value: "chair", label: "Chair" },
                { value: "shop", label: "Shop" },
                { value: "office", label: "Office" },
                { value: "guesthouse", label: "Guest House" },
                { value: "godown", label: "Godown" },
                { value: "other", label: "Other" },
              ]}
            />
          </div>
        </CardContent>
      </Card>

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
                      <div className="md:col-span-2">
                        <div className="text-xs text-zinc-600">Name</div>
                        <input
                          value={(editing.name as string) ?? a.name}
                          onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))}
                          className="mt-1 h-10 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                      </div>

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
                          onChange={(e) => {
                            const nextType = e.target.value as AssetLocationType;
                            const nextSuggestions = locationNameSuggestionsByType[nextType] ?? [];
                            const currentName = (p: Partial<Asset>) => ((p.locationName as string) ?? a.locationName);

                            setEditing((p) => {
                              const name = (currentName(p) ?? "").trim();
                              const shouldReplace = !name || (nextSuggestions.length > 0 && !nextSuggestions.includes(name));
                              return {
                                ...p,
                                locationType: nextType,
                                locationName: shouldReplace && nextSuggestions.length > 0 ? nextSuggestions[0] : name,
                              };
                            });
                          }}
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
                          list={`asset-location-name-suggestions-${a.id}`}
                          className="mt-1 h-10 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                        <datalist id={`asset-location-name-suggestions-${a.id}`}>
                          {locationNameSuggestionsByType[
                            ((editing.locationType as AssetLocationType) ?? a.locationType) as AssetLocationType
                          ].map((n) => (
                            <option
                              key={`${((editing.locationType as AssetLocationType) ?? a.locationType) as AssetLocationType}:${n}`}
                              value={n}
                            />
                          ))}
                        </datalist>
                      </div>

                      <div className="md:col-span-2">
                        <div className="text-xs text-zinc-600">Code (optional)</div>
                        <input
                          value={(editing.code as string) ?? a.code ?? ""}
                          onChange={(e) => setEditing((p) => ({ ...p, code: e.target.value }))}
                          placeholder="e.g. HMCGD / UH1"
                          className="mt-1 h-10 w-full rounded-lg border border-indigo-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
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

