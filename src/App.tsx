import { Routes, Route, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './App.css';
import './index.css';
import Livery from './Livery';
import Inventory from './Inventory';
import Tooltip from './Tooltip';
import type { Item, DragSource, SlotType, Part, WeightClass, RoleClass } from './types/types';

const INVENTORY_SIZE = 9;
const LEFT_SLOTS_SIZE = 3;

function Home() {
  const navigate = useNavigate();
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'var(--color-main-bg)',
      color: 'var(--color-text)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 48,
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
    }}>
      <h1 style={{ fontSize: 48, marginBottom: 32 }}>Mech Game</h1>
      <div style={{ display: 'flex', gap: 48 }}>
        <button style={{ fontSize: 32, padding: '24px 64px' }} onClick={() => navigate('/livery')}>Livery</button>
        <button style={{ fontSize: 32, padding: '24px 64px' }} onClick={() => navigate('/codex')}>Codex</button>
      </div>
    </div>
  );
}

function CodexPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/info.json')
      .then(res => res.json())
      .then(data => {
        setEntries(data);
        setSelected(data[0] || null);
      });
  }, []);

  // Get unique types for filter dropdown
  const types = Array.from(new Set(entries.map(e => e.type)));
  const filteredEntries = typeFilter === 'All' ? entries : entries.filter(e => e.type === typeFilter);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'var(--color-main-bg)',
      color: 'var(--color-text)',
      display: 'flex',
      alignItems: 'stretch',
      justifyContent: 'flex-start',
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
    }}>
      {/* Sidebar */}
      <div style={{
        width: 320,
        background: 'rgba(30,40,60,0.95)',
        borderRight: '2px solid #222',
        overflowY: 'auto',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        position: 'relative',
      }}>
        {/* Sticky header */}
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'rgba(30,40,60,0.98)',
          display: 'flex',
          alignItems: 'center',
          borderBottom: '2px solid #222',
          padding: '0 0 0 0',
          height: 72,
        }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: 28,
              cursor: 'pointer',
              marginLeft: 16,
              marginRight: 12,
              padding: 0,
              height: 48,
              width: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Back to Home"
          >
            &#8592;
          </button>
          <span style={{ fontWeight: 900, fontSize: 28, letterSpacing: 2, color: '#fff', fontFamily: 'Aldrich, sans-serif' }}>CODEX</span>
        </div>
        {/* Filter dropdown */}
        <div style={{ padding: '16px 24px 0 24px', background: 'rgba(30,40,60,0.98)', position: 'sticky', top: 72, zIndex: 9 }}>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            style={{ width: '100%', fontSize: 16, padding: '8px', borderRadius: 4, border: '1px solid #333', background: '#222', color: '#fff', fontFamily: 'Lato, sans-serif' }}
          >
            <option value="All">All Types</option>
            {types.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div style={{ padding: '32px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredEntries.map((entry, idx) => (
            <div
              key={entry.name}
              onClick={() => setSelected(entry)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '12px 24px',
                cursor: 'pointer',
                background: selected && selected.name === entry.name ? '#333' : 'none',
                borderLeft: selected && selected.name === entry.name ? '4px solid #4fa3ff' : '4px solid transparent',
                transition: 'background 0.2s, border 0.2s',
                minHeight: 64,
                height: 64,
              }}
            >
              <img src={entry.icon} alt={entry.name} style={{ width: 40, height: 40, objectFit: 'contain', background: '#222', borderRadius: 8 }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 18, lineHeight: 1, fontFamily: 'Aldrich, sans-serif' }}>{entry.name}</div>
                <div style={{ fontSize: 13, opacity: 0.7, textTransform: 'uppercase', fontWeight: 600, marginTop: 2, fontFamily: 'Lato, sans-serif' }}>{entry.type}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Details panel pinned right */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'flex-end',
      }}>
        {selected && (
          <div style={{
            background: '#333',
            borderRadius: 0,
            minWidth: 400,
            maxWidth: 600,
            width: 480,
            height: '100%',
            boxShadow: '0 4px 32px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            padding: '48px 48px 0 48px',
            gap: 16,
          }}>
            {/* Title and icon at top */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 0 }}>
              <img src={selected.icon} alt={selected.name} style={{ width: 64, height: 64, objectFit: 'contain', background: '#222', borderRadius: 8 }} />
              <span style={{ fontWeight: 800, fontSize: 32, fontFamily: 'Aldrich, sans-serif' }}>{selected.name}</span>
            </div>
            {/* Type pinned left under name/icon */}
            <div style={{ fontSize: 13, opacity: 0.7, fontWeight: 600, textTransform: 'uppercase', margin: '8px 0 16px 0', alignSelf: 'flex-start', fontFamily: 'Lato, sans-serif' }}>{selected.type}</div>
            {/* Description in black box */}
            <div style={{
              background: '#000',
              color: '#fff',
              borderRadius: 8,
              padding: '24px 24px',
              fontSize: 18,
              lineHeight: 1.5,
              width: '100%',
              boxSizing: 'border-box',
              marginBottom: 32,
              fontFamily: 'Lato, sans-serif'
            }}>{selected.description}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  // Items loaded from items.json
  const [allItems, setAllItems] = useState<Item[]>([]);
  useEffect(() => {
    fetch('/items.json')
      .then((res) => res.json())
      .then((data) => setAllItems(data));
  }, []);

  // State: slots contain either null or { id, name, description, icon }
  const [inventory, setInventory] = useState<(Item | null)[]>(Array(INVENTORY_SIZE).fill(null));
  const [leftSlots, setLeftSlots] = useState<(Item | null)[]>(Array(LEFT_SLOTS_SIZE).fill(null));
  const [draggedItem, setDraggedItem] = useState<Item | null>(null);
  const [dragSource, setDragSource] = useState<DragSource | null>(null);
  const [tooltip, setTooltip] = useState<{ item: Item; x: number; y: number } | null>(null);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [filterPart, setFilterPart] = useState<Part | 'All'>('All');
  const [filterWeightClass, setFilterWeightClass] = useState<WeightClass | 'All'>('All');
  const [mechWeightClass, setMechWeightClass] = useState<WeightClass>('Light');
  const [roleClass, setRoleClass] = useState<RoleClass>('Striker');
  const [mechName, setMechName] = useState<string>('');
  const cycleRoleClass = () => {
    setRoleClass((prev) => {
      if (prev === 'Striker') return 'Artillery';
      if (prev === 'Artillery') return 'Utility';
      return 'Striker';
    });
  };
  const cycleMechWeightClass = () => {
    setMechWeightClass((prev) => {
      if (prev === 'Light') return 'Medium';
      if (prev === 'Medium') return 'Heavy';
      if (prev === 'Heavy') return 'Super Heavy';
      return 'Light';
    });
    setLeftSlots(Array(LEFT_SLOTS_SIZE).fill(null));
    if (inventoryOpen) setFilterWeightClass((prev) => {
      if (prev === 'Light') return 'Medium';
      if (prev === 'Medium') return 'Heavy';
      if (prev === 'Heavy') return 'Super Heavy';
      return 'Light';
    });
  };

  // Initialize inventory with first items when loaded
  useEffect(() => {
    if (allItems.length > 0 && (inventory.every((i) => i === null) || inventory.filter(Boolean).length === 0)) {
      setInventory([
        allItems[0] || null,
        allItems[1] || null,
        ...Array(INVENTORY_SIZE - 2).fill(null),
      ]);
    }
  }, [allItems]);

  // Drag handlers
  const handleDragStart = (item: Item, source: DragSource) => {
    setDraggedItem(item);
    setDragSource(source);
  };

  type LocalSlotType = SlotType | 'hardpoint';
  const [hardpointItems, setHardpointItems] = useState<(Item | null)[]>([]);
  const handleDrop = (targetType: LocalSlotType, targetIndex: number) => {
    if (!draggedItem || !dragSource) return;
    let newInventory = [...inventory];
    let newLeftSlots = [...leftSlots];
    let newHardpointItems = [...hardpointItems];
    if (dragSource.type === 'inventory') {
      newInventory[dragSource.index] = null;
    } else if (dragSource.type === 'primary part') {
      newLeftSlots[dragSource.index] = null;
    } else if (dragSource.type === 'hardpoint') {
      newHardpointItems[dragSource.index] = null;
    }
    if (targetType === 'inventory') {
      newInventory[targetIndex] = draggedItem;
    } else if (targetType === 'primary part') {
      newLeftSlots[targetIndex] = draggedItem;
      // If dropping a frame into the frame slot (index 0), reset hardpoints
      if (targetIndex === 0 && draggedItem.part === 'Frame' && Array.isArray(draggedItem.hardpointSizes)) {
        newHardpointItems = Array(draggedItem.hardpointSizes.length).fill(null);
      }
    } else if (targetType === 'hardpoint') {
      newHardpointItems[targetIndex] = draggedItem;
    }
    setInventory(newInventory);
    setLeftSlots(newLeftSlots);
    setHardpointItems(newHardpointItems);
    setDraggedItem(null);
    setDragSource(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragSource(null);
  };

  // Helper for drop zone click
  const handleDropZoneClick = (part: Part) => {
    setInventoryOpen(true);
    setFilterPart(part);
    setFilterWeightClass(mechWeightClass);
  };

  const handleHardpointClick = () => {
    setInventoryOpen(true);
    setFilterPart('Module');
    setFilterWeightClass('All');
  };

  // Dynamically update hardpointItems when a Frame is equipped
  useEffect(() => {
    const frame = leftSlots[0];
    const sizes = frame && frame.part === 'Frame' && Array.isArray(frame.hardpointSizes) ? frame.hardpointSizes : [];
    setHardpointItems((prev) => {
      if (sizes.length === prev.length) return prev;
      // If new frame, clear all modules
      return Array(sizes.length).fill(null);
    });
  }, [leftSlots[0]]);

  // When part filter is set to Module, set weight class filter to All
  useEffect(() => {
    if (filterPart === 'Module' && filterWeightClass !== 'All') {
      setFilterWeightClass('All');
    }
  }, [filterPart]);

  // Slot rendering
  const renderSlot = (
    item: Item | null,
    onDrop: (type: SlotType, idx: number) => void,
    onDragStart: (item: Item, source: DragSource) => void,
    idx: number,
    type: SlotType,
    onClick?: () => void,
    extraStyle?: React.CSSProperties
  ) => {
    // If this is an inventory slot, remove all margin and border, and make it fill the grid cell
    const isInventory = type === 'inventory';
    const isDropZone = type === 'primary part';
    // For drop zones, restrict what can be dropped
    let canDrop = true;
    if (isDropZone && draggedItem) {
      const expectedPart = ['Frame', 'Chassis', 'Systems'][idx];
      canDrop = draggedItem.part === expectedPart && draggedItem.weightClass === mechWeightClass;
    }
    return (
      <div
        key={idx}
        className={`slot${item ? ' filled' : ''}`}
        onDrop={canDrop ? () => onDrop(type, idx) : undefined}
        onDragOver={canDrop ? handleDragOver : (e) => e.preventDefault()}
        onDragEnd={handleDragEnd}
        draggable={!!item}
        onDragStart={item ? () => onDragStart(item, { type, index: idx }) : undefined}
        style={{
          minWidth: isDropZone ? 96 : 64,
          minHeight: isDropZone ? 96 : 64,
          width: isInventory ? '100%' : (isDropZone ? '100%' : undefined),
          height: isInventory ? '100%' : (isDropZone ? '100%' : undefined),
          aspectRatio: isInventory ? '1 / 1' : undefined,
          margin: isInventory ? 0 : 8,
          border: isInventory ? 'none' : '2px solid #fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: canDrop ? 'var(--color-slot-bg)' : '#888',
          opacity: canDrop ? 1 : 0.5,
          position: 'relative',
          cursor: onClick ? 'pointer' : 'default',
          ...extraStyle,
        }}
        onMouseMove={item ? (e) => setTooltip({ item, x: e.clientX, y: e.clientY }) : undefined}
        onMouseLeave={() => setTooltip(null)}
        onClick={onClick}
      >
        {item && (
          <img src={item.icon} alt={item.name} style={{ width: 48, height: 48, pointerEvents: 'none' }} />
        )}
      </div>
    );
  };

  // For hardpoint drop zones only
  const renderHardpointSlot = (
    item: Item | null,
    onDrop: (type: 'hardpoint', idx: number) => void,
    onDragStart: (item: Item, source: DragSource) => void,
    idx: number,
    onClick?: () => void,
    extraStyle?: React.CSSProperties
  ) => {
    // Get the size of this hardpoint
    const frame = leftSlots[0];
    const sizes = frame && frame.part === 'Frame' && Array.isArray(frame.hardpointSizes) ? frame.hardpointSizes : [];
    const size = sizes[idx] || 'normal';
    // Only modules can be dropped, and only if size matches
    let canDrop = false;
    if (!draggedItem) {
      canDrop = true;
    } else if (draggedItem.part === 'Module') {
      if (size === 'large') {
        canDrop = draggedItem.size === 'large' || draggedItem.size === 'normal';
      } else {
        canDrop = draggedItem.size === 'normal';
      }
    }
    return (
      <div
        key={idx}
        className={`slot${item ? ' filled' : ''}`}
        onDrop={canDrop ? () => onDrop('hardpoint', idx) : undefined}
        onDragOver={canDrop ? handleDragOver : (e) => e.preventDefault()}
        onDragEnd={handleDragEnd}
        draggable={!!item}
        onDragStart={item ? () => onDragStart(item, { type: 'hardpoint', index: idx }) : undefined}
        style={{
          minWidth: 96,
          minHeight: 96,
          border: size === 'large' ? '2px solid #ff0400' : '2px solid #fff',
          borderRadius: 0,
          width: 96,
          height: 96,
          background: canDrop ? 'var(--color-slot-bg)' : '#888',
          opacity: canDrop ? 1 : 0.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: onClick ? 'pointer' : 'default',
          ...extraStyle,
        }}
        onMouseMove={item ? (e) => setTooltip({ item, x: e.clientX, y: e.clientY }) : undefined}
        onMouseLeave={() => setTooltip(null)}
        onClick={onClick}
      >
        {item && (
          <img src={item.icon} alt={item.name} style={{ width: 48, height: 48, pointerEvents: 'none' }} />
        )}
        {/* Show size label */}
        {!item && (
          <span style={{
            position: 'absolute',
            bottom: 4,
            right: 4,
            fontSize: 12,
            color: size === 'large' ? '#ff0400' : '#fff',
            fontWeight: 700,
            background: 'rgba(0,0,0,0.7)',
            borderRadius: 4,
            padding: '1px 6px',
            pointerEvents: 'none',
          }}>{size === 'large' ? 'LARGE' : 'NORMAL'}</span>
        )}
      </div>
    );
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/livery" element={
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'var(--color-main-bg)', color: 'var(--color-text)', overflow: 'hidden' }}>
            {/* Livery UI (existing UI) */}
            <Livery
              leftSlots={leftSlots}
              renderSlot={(item: Item | null, onDrop: (type: SlotType, idx: number) => void, onDragStart: (item: Item, source: DragSource) => void, idx: number, type: SlotType) =>
                renderSlot(
                  item,
                  onDrop,
                  onDragStart,
                  idx,
                  type,
                  () => handleDropZoneClick(['Frame', 'Chassis', 'Systems'][idx] as Part)
                )
              }
              renderHardpointSlot={renderHardpointSlot}
              handleDrop={handleDrop}
              handleDragStart={handleDragStart}
              width="33.333vw"
              mechWeightClass={mechWeightClass}
              cycleMechWeightClass={cycleMechWeightClass}
              roleClass={roleClass}
              cycleRoleClass={cycleRoleClass}
              mechName={mechName}
              setMechName={setMechName}
              hardpointItems={hardpointItems}
              onHardpointClick={handleHardpointClick}
              draggedItem={draggedItem}
            />
            <Inventory
              open={inventoryOpen}
              inventory={inventory}
              renderSlot={renderSlot}
              handleDrop={handleDrop}
              handleDragStart={handleDragStart}
              onToggle={() => {
                setInventoryOpen((open) => {
                  if (!open) setFilterWeightClass(mechWeightClass);
                  return !open;
                });
              }}
              filterPart={filterPart}
              setFilterPart={setFilterPart}
              filterWeightClass={filterWeightClass}
              setFilterWeightClass={setFilterWeightClass}
              allItems={allItems}
            />
            <Tooltip tooltip={tooltip} />
          </div>
        } />
        <Route path="/codex" element={<CodexPage />} />
      </Routes>
    </>
  );
}

export default App;
