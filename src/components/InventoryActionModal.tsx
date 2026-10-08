import React, { useState } from 'react';
import { InventoryItem } from '../types.ts';
import { api } from '../services/api.ts';
import { X, Package, AlertCircle } from 'lucide-react';

interface InventoryActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  defaultItemId?: number;
  mode: 'RESTOCK' | 'CONSUME';
  onSuccess: () => void;
}

export const InventoryActionModal: React.FC<InventoryActionModalProps> = ({
  isOpen,
  onClose,
  items,
  defaultItemId,
  mode,
  onSuccess
}) => {
  const [selectedItemId, setSelectedItemId] = useState<number | ''>(defaultItemId || (items[0]?.id || ''));
  const [quantity, setQuantity] = useState(10);
  const [notes, setNotes] = useState(mode === 'RESTOCK' ? 'Supplier Scheduled Delivery Batch' : 'ICU Bedside Clinical Dispensation');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentItem = items.find(i => i.id === Number(selectedItemId));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || quantity <= 0) {
      setError('Please select an item and provide a positive quantity.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (mode === 'RESTOCK') {
        await api.restockInventory(Number(selectedItemId), quantity, notes);
      } else {
        await api.consumeInventory(Number(selectedItemId), quantity, notes);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-100 text-teal-700">
              <Package className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {mode === 'RESTOCK' ? 'Restock Medical Supplies' : 'Dispense Consumable'}
              </h3>
              <p className="text-xs text-slate-500">
                {mode === 'RESTOCK' ? 'Increases warehouse ledger' : 'Debits inventory and verifies safety thresholds'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Supply Item *
            </label>
            <select
              value={selectedItemId}
              onChange={e => setSelectedItemId(Number(e.target.value))}
              required
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              {items.map(item => (
                <option key={item.id} value={item.id}>
                  {item.item_name} ({item.sku_code}) · In Stock: {item.quantity} {item.unit}
                </option>
              ))}
            </select>
            {currentItem && (
              <div className="mt-1.5 text-[11px] text-slate-500 flex justify-between font-mono">
                <span>Location: {currentItem.storage_location}</span>
                <span>Min Threshold: {currentItem.minimum_stock} {currentItem.unit}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Quantity to {mode === 'RESTOCK' ? 'Add' : 'Dispense'} ({currentItem?.unit || 'Units'}) *
            </label>
            <input
              type="number"
              required
              min={1}
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Transaction Reason / Batch Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 text-xs font-semibold text-white rounded-lg transition-colors shadow-xs ${
                mode === 'RESTOCK' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              {isSubmitting ? 'Recording...' : mode === 'RESTOCK' ? 'Confirm Restock' : 'Confirm Dispensation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
