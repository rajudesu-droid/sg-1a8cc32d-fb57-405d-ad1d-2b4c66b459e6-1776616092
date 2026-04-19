/**
 * Asset Search Component
 * Network-aware token search and selection
 * 
 * CRITICAL: Shows same-symbol assets on different networks as separate entries
 */

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { groupAssetsBySymbol, getAssetDisplayName } from "@/core/utils/assetIdentity";
import type { Asset } from "@/core/contracts";

interface AssetSearchProps {
  assets: Asset[];
  onSelect: (asset: Asset) => void;
  placeholder?: string;
}

export function AssetSearch({ assets, onSelect, placeholder }: AssetSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Filter assets by symbol or name
  const filteredAssets = query.length > 0
    ? assets.filter(asset => 
        asset.symbol.toLowerCase().includes(query.toLowerCase()) ||
        asset.name?.toLowerCase().includes(query.toLowerCase()) ||
        asset.network.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  // Group by symbol to show network separation
  const groupedAssets = groupAssetsBySymbol(filteredAssets);

  const handleSelect = (asset: Asset) => {
    onSelect(asset);
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(e.target.value.length > 0);
          }}
          onFocus={() => setIsOpen(query.length > 0)}
          placeholder={placeholder || "Search tokens..."}
          className="pl-9 pr-9"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && filteredAssets.length > 0 && (
        <div className="absolute z-50 mt-2 w-full bg-card border border-border rounded-lg shadow-lg max-h-[300px] overflow-y-auto">
          {Array.from(groupedAssets.entries()).map(([symbol, symbolAssets]) => (
            <div key={symbol} className="border-b border-border last:border-b-0">
              {symbolAssets.length > 1 && (
                <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/50">
                  {symbol} ({symbolAssets.length} networks)
                </div>
              )}
              {symbolAssets.map((a) => {
                const asset = a as Asset;
                return (
                <button
                  key={asset.id}
                  onClick={() => handleSelect(asset)}
                  className="w-full px-3 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
                      {asset.symbol.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium">{asset.symbol}</div>
                      <div className="text-xs text-muted-foreground">
                        {asset.name || "Unknown"}
                      </div>
                      {asset.contractAddress && (
                        <div className="text-xs text-muted-foreground font-mono">
                          {asset.contractAddress.slice(0, 6)}...{asset.contractAddress.slice(-4)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className="capitalize">
                      {asset.network}
                    </Badge>
                    {asset.balance && (
                      <div className="text-xs text-muted-foreground">
                        {parseFloat(asset.balance).toFixed(4)}
                      </div>
                    )}
                  </div>
                </button>
              )})}
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {isOpen && query.length > 0 && filteredAssets.length === 0 && (
        <div className="absolute z-50 mt-2 w-full bg-card border border-border rounded-lg shadow-lg p-4 text-center text-sm text-muted-foreground">
          No assets found for "{query}"
        </div>
      )}
    </div>
  );
}