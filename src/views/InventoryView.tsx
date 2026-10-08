import React, { useState } from 'react';
import { InventoryItem } from '../types.ts';
import {
  Package,
  AlertTriangle,
  Search,
  Plus,
  Minus,
  RotateCcw,
  ShieldAlert
} from 'lucide-react';

interface InventoryViewProps {
  inventory: InventoryItem[];
  onRefresh: () => void;
  onOpenRestock: (itemId?: number) => void;
  onOpenConsume: (itemId?: number) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  inventory,
  onRefresh,
  onOpenRestock,
  onOpenConsume
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const categories = Array.from(new Set(inventory.map(i => i.category)));

  const filtered = inventory.filter(item => {
    if (categoryFilter && item.category !== categoryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        item.item_name.toLowerCase().includes(q) ||
        item.sku_code.toLowerCase().includes(q) ||
        item.supplier.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-teal-600" />
            <span>Pharmacy &amp; Medical Consumables Inventory</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated minimum safety threshold alerts, lot expiry tracking, and real-time dispensation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenRestock()}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Restock Inventory</span>
          </button>
          <button
            onClick={() => onOpenConsume()}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Minus className="w-4 h-4 text-slate-600" />
            <span>Dispense Consumable</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search supply, SKU, or pharmaceutical vendor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-xs border-none focus:outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            title="Refresh inventory"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Supply Item &amp; SKU</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Stock Level</th>
                <th className="px-4 py-3.5">Safety Min</th>
                <th className="px-4 py-3.5">Storage Location</th>
                <th className="px-4 py-3.5">Batch / Expiry</th>
                <th className="px-5 py-3.5 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(item => {
                const isLow = item.quantity <= item.minimum_stock;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{item.item_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{item.sku_code} · {item.supplier}</div>
                    </td>

                    <td className="px-4 py-3.5 font-medium text-slate-700">
                      {item.category}
                    </td>

                    <td className="px-4 py-3.5 font-mono">
                      <span className={`font-bold text-sm ${isLow ? 'text-amber-600' : 'text-slate-900'}`}>
                        {item.quantity}
                      </span>
                      <span className="text-slate-400 text-[11px] ml-1">{item.unit}</span>
                      {isLow && (
                        <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                          <AlertTriangle className="w-3 h-3" />
                          LOW STOCK
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-slate-500">
                      {item.minimum_stock} {item.unit}
                    </td>

                    <td className="px-4 py-3.5 text-slate-700">
                      {item.storage_location}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[11px]">
                      <div>{item.batch_number}</div>
                      <div className="text-slate-400">Exp: {item.expiry_date}</div>
                    </td>

                    <td className="px-5 py-3.5 text-right space-x-1">
                      <button
                        onClick={() => onOpenRestock(item.id)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-md transition-colors"
                      >
                        Restock
                      </button>
                      <button
                        onClick={() => onOpenConsume(item.id)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                      >
                        Dispense
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                    No medical supplies found matching search filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
