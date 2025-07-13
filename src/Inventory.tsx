import React from 'react';
import type { Item, DragSource, SlotType, Part, WeightClass } from './types/types';

interface InventoryProps {
  open: boolean;
  inventory: (Item | null)[];
  renderSlot: (
    item: Item | null,
    onDrop: (type: SlotType, idx: number) => void,
    onDragStart: (item: Item, source: DragSource) => void,
    idx: number,
    type: SlotType,
    onClick?: () => void,
    extraStyle?: React.CSSProperties
  ) => React.ReactNode;
  handleDrop: (type: SlotType, idx: number) => void;
  handleDragStart: (item: Item, source: DragSource) => void;
  onToggle: () => void;
  filterPart: Part | 'All';
  setFilterPart: (cat: Part | 'All') => void;
  filterWeightClass: WeightClass | 'All';
  setFilterWeightClass: (w: WeightClass | 'All') => void;
  allItems: Item[];
}

const sidebarPadding = 32;
const sidebarContentWidth = 320;
const tabWidth = 32;
const sidebarWidth = sidebarContentWidth + tabWidth;
const tabHeight = 64;

const Inventory: React.FC<InventoryProps> = ({ open, inventory, renderSlot, handleDrop, handleDragStart, onToggle, filterPart, setFilterPart, filterWeightClass, setFilterWeightClass, allItems }) => {
  // Filtered items
  const filtered = allItems.filter(item =>
    (filterPart === 'All' || item.part === filterPart) &&
    (filterWeightClass === 'All' || item.weightClass === filterWeightClass)
  );
  // Ensure exactly 99 slots
  const slots = filtered.length >= 99 ? filtered.slice(0, 99) : [...filtered, ...Array(99 - filtered.length).fill(null)];
  return (
    <>
      {/* Sidebar */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: sidebarWidth,
          background: 'var(--color-modal-bg)',
          color: 'var(--color-text)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          borderRadius: 0,
          boxShadow: '-2px 0 12px rgba(0,0,0,0.12)',
          transform: open ? 'translateX(0)' : `translateX(${sidebarWidth + sidebarPadding}px)`,
          transition: 'transform 0.35s cubic-bezier(.4,1.3,.5,1)',
          pointerEvents: open ? 'auto' : 'none',
          zIndex: 100,
        }}
      >
        {/* Title at the top */}
        <div style={{ width: sidebarContentWidth, padding: sidebarPadding, paddingBottom: 0 }}>
          <div className="title" style={{ fontSize: 24, color: '#fff', textAlign: 'center', marginBottom: 16 }}>Inventory</div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, justifyContent: 'center' }}>
            <select value={filterPart} onChange={e => setFilterPart(e.target.value as Part | 'All')} style={{ fontSize: 16 }}>
              <option value="All">All Parts</option>
              <option value="Frame">Frame</option>
              <option value="Chassis">Chassis</option>
              <option value="Systems">Systems</option>
              <option value="Module">Module</option>
            </select>
            <select value={filterWeightClass} onChange={e => setFilterWeightClass(e.target.value as WeightClass | 'All')} style={{ fontSize: 16 }}>
              <option value="All">All Weight Classes</option>
              <option value="Light">Light</option>
              <option value="Medium">Medium</option>
              <option value="Heavy">Heavy</option>
              <option value="Super Heavy">Super Heavy</option>
            </select>
          </div>
        </div>
        {/* Scrollable slots area, centered */}
        <div style={{
          width: sidebarContentWidth,
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 0,
            background: 'var(--color-modal-bg)',
            padding: 0,
            borderRadius: 0,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            color: 'var(--color-text)',
            maxHeight: '100%',
            overflowY: 'auto',
            width: '100%',
            margin: 0,
            borderSpacing: 0,
          }}>
            {slots.map((item, idx) =>
              renderSlot(item, handleDrop, handleDragStart, idx, 'inventory')
            )}
          </div>
        </div>
      </div>
      {/* Arrow tab - always visible, outside sidebar, attached to sidebar's left edge when open, right edge of screen when closed */}
      <div
        onClick={onToggle}
        style={{
          position: 'absolute',
          right: open ? sidebarWidth : 0,
          top: `calc(50vh - ${tabHeight / 2}px)`,
          width: tabWidth,
          height: tabHeight,
          background: '#222',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
          boxShadow: '-2px 0 8px rgba(0,0,0,0.12)',
          zIndex: 101,
          userSelect: 'none',
          transition: 'right 0.35s cubic-bezier(.4,1.3,.5,1)',
        }}
      >
        <span style={{ fontSize: 28, lineHeight: 1, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>&#x25C0;</span>
      </div>
    </>
  );
};

export default Inventory; 