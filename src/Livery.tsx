import React from 'react';
import type { Item, DragSource, SlotType } from './types/types';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Add 'hardpoint' to SlotType for local use
type LocalSlotType = SlotType | 'hardpoint';

interface MainDropZonesProps {
  leftSlots: (Item | null)[];
  renderSlot: (
    item: Item | null,
    onDrop: (type: SlotType, idx: number) => void,
    onDragStart: (item: Item, source: DragSource) => void,
    idx: number,
    type: SlotType,
    onClick?: () => void,
    extraStyle?: React.CSSProperties
  ) => React.ReactNode;
  renderHardpointSlot: (
    item: Item | null,
    onDrop: (type: 'hardpoint', idx: number) => void,
    onDragStart: (item: Item, source: DragSource) => void,
    idx: number,
    onClick?: () => void,
    extraStyle?: React.CSSProperties
  ) => React.ReactNode;
  handleDrop: (type: SlotType | 'hardpoint', idx: number) => void;
  handleDragStart: (item: Item, source: DragSource) => void;
  width?: string;
  mechWeightClass: 'Light' | 'Medium' | 'Heavy' | 'Super Heavy';
  cycleMechWeightClass: () => void;
  roleClass: 'Striker' | 'Artillery' | 'Utility';
  cycleRoleClass: () => void;
  mechName: string;
  setMechName: (name: string) => void;
  hardpointItems?: (Item | null)[];
  onHardpointClick?: () => void;
  draggedItem?: Item | null;
}

// Increase sidebar width and adjust layout
const boxGap = 4; // slightly larger gap for clarity
const sidebarPadding = 32; // match Inventory sidebar padding
const boxHeight = 96; // height for main boxes
const statBoxHeight = 64; // height for stat boxes

// Set a single mainContentWidth for all main components (wider for hardpoints)
const mainContentWidth = 4 * 112 + 3 * boxGap; // 4 columns for hardpoints
const sidebarWidth = mainContentWidth + 2 * sidebarPadding;
// Calculate hardpoint box size so up to 4 fit in mainContentWidth with 3 gaps
const hardpointBoxSize = (mainContentWidth - 3 * boxGap) / 4;
const statBoxWidth = (mainContentWidth - 3 * boxGap) / 4; // width for stat boxes

const Livery: React.FC<MainDropZonesProps> = (props) => {
  const navigate = useNavigate();
  const weightColors = {
    Light: 'var(--color-mech-light)',
    Medium: 'var(--color-mech-medium)',
    Heavy: 'var(--color-mech-heavy)',
    'Super Heavy': '#ee00a3',
  };
  const classColors = {
    Striker: 'var(--color-class-striker)',
    Artillery: 'var(--color-class-artillery)',
    Utility: 'var(--color-class-utility)',
  };
  const [weightTooltip, setWeightTooltip] = useState(false);
  const [classTooltip, setClassTooltip] = useState(false);
  const weightTooltipText = 'Cycle your mech weight class (Light, Medium, Heavy).';
  const classTooltipText = 'Cycle your mech role (Striker, Artillery, Utility).';
  const weightTooltipTexts = {
    Light: 'Light Mechs have low Hull, and must use their low number of hardpoints to select modules wisely. They are extremely fast, also having the MOVE SURGE ability.',
    Medium: 'Medium Mechs have a balance between armor and speed. They have enough hardpoints for a choice of weaponry. This balance gives them the HEAT SINK ability.',
    Heavy: 'Heavy Mechs have reinforced frames, able to bear greater armor and heavy hardpoints, at the cost of limited maneuverability. They have the LOCK DOWN ability.',
    'Super Heavy': 'Super Heavy Mechs are rare, massive war machines with unmatched durability and firepower, but are extremely slow and costly to deploy.'
  };
  const statTooltipTexts = {
    Agility: 'Movement speed, evasion',
    Might: 'Melee damage, blocking',
    Intellect: 'Ability strength, talents',
    Tech: 'Ranged accuracy, energy generation',
  };
  const [statTooltip, setStatTooltip] = useState<string | null>(null);
  // Calculate stat totals from the three equipped items
  const equipped = props.leftSlots.filter(Boolean) as Item[];
  const statTotals = {
    Agility: equipped.reduce((sum, item) => sum + (item.agility || 0), 0),
    Might: equipped.reduce((sum, item) => sum + (item.might || 0), 0),
    Tech: equipped.reduce((sum, item) => sum + (item.tech || 0), 0),
    Intellect: equipped.reduce((sum, item) => sum + (item.intellect || 0), 0),
  };
  const statLabels: Record<string, string> = {
    Agility: 'AGIL',
    Might: 'MGHT',
    Tech: 'TECH',
    Intellect: 'INTL',
  };
  // After the stat row, render hardpoint drop zones if a Frame is equipped
  const equippedFrame = props.leftSlots[0] as Item | null;
  const hardpoints = equippedFrame && equippedFrame.hardpoints ? equippedFrame.hardpoints : 0;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: sidebarWidth,
        height: '100vh',
        background: 'var(--color-modal-bg)',
        color: 'var(--color-text)',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 0,
        boxShadow: '2px 0 12px rgba(0,0,0,0.12)',
        padding: sidebarPadding,
        justifyContent: 'flex-start',
        boxSizing: 'border-box',
        // Removed alignItems: 'center' to restore original layout
      }}
    >
      {/* Title bar */}
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', marginBottom: 16 }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: 28,
            cursor: 'pointer',
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
        <span style={{ fontWeight: 900, fontSize: 28, letterSpacing: 2, color: '#fff', fontFamily: 'Aldrich, sans-serif' }}>Livery</span>
      </div>
      {/* Main content wrapper with original width/layout */}
      <div style={{ width: mainContentWidth, display: 'flex', flexDirection: 'column', gap: boxGap, flex: 1 }}>
        {/* Mech Name field */}
        <input
          type="text"
          value={props.mechName}
          onChange={e => props.setMechName(e.target.value)}
          placeholder="Mech Name"
          style={{
            fontWeight: 'bold',
            fontSize: 22,
            textAlign: 'center',
            width: '100%',
            margin: 0,
            padding: '8px 0',
            background: '#000',
            color: 'var(--color-text)',
            border: 'none',
            outline: 'none',
            borderRadius: 0,
            marginBottom: 8,
          }}
        />
        <div style={{ display: 'flex', gap: boxGap, width: '100%', margin: 0, position: 'relative', height: 48 }}>
          <button
            onClick={props.cycleMechWeightClass}
            style={{
              width: '50%',
              height: '100%',
              fontSize: 20,
              fontWeight: 600,
              background: weightColors[props.mechWeightClass],
              color: 'var(--color-text-dark)',
              border: 'none',
              borderRadius: 0,
              cursor: 'pointer',
              transition: 'background 0.2s',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {props.mechWeightClass}
          </button>
          <button
            onClick={props.cycleRoleClass}
            style={{
              width: '50%',
              height: '100%',
              fontSize: 20,
              fontWeight: 600,
              background: classColors[props.roleClass],
              color: 'var(--color-text-dark)',
              border: 'none',
              borderRadius: 0,
              cursor: 'pointer',
              transition: 'background 0.2s',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {props.roleClass}
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', gap: boxGap, alignItems: 'flex-start', justifyContent: 'space-between', width: '100%' }}>
          {['Frame', 'Chassis', 'Systems'].map((label, idx) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, width: (mainContentWidth - 2 * boxGap) / 3, minWidth: 0 }}>
              {props.renderSlot(
                props.leftSlots[idx],
                props.handleDrop,
                props.handleDragStart,
                idx,
                'primary part',
                undefined,
                {
                  border: 'none',
                  borderRadius: 0,
                  margin: 0,
                }
              )}
              {/* Display manufacturer + model as the name for Frame, Chassis, Systems */}
              <div style={{
                marginTop: 0,
                fontSize: 16,
                fontWeight: 500,
                background: '#111',
                color: 'var(--color-text)',
                border: '2px solid var(--color-slot-border)',
                borderTop: 'none',
                borderRadius: 0,
                width: (mainContentWidth - 2 * boxGap) / 3,
                textAlign: 'center',
                padding: '6px 0 4px 0',
                boxSizing: 'border-box',
                position: 'relative',
                top: -2,
              }}>
                {props.leftSlots[idx] && ['Frame', 'Chassis', 'Systems'].includes(props.leftSlots[idx]?.part)
                  ? `${props.leftSlots[idx]?.manufacturer || ''} ${props.leftSlots[idx]?.model || ''}`.trim()
                  : label}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', gap: boxGap, alignItems: 'flex-start', justifyContent: 'space-between', width: '100%' }}>
          {([
            { key: 'Agility', label: 'AGIL', color: 'var(--color-stat-agility)' },
            { key: 'Might', label: 'MGHT', color: 'var(--color-stat-might)' },
            { key: 'Intellect', label: 'INTL', color: 'var(--color-stat-tech)' }, // INTL is now third and purple
            { key: 'Tech', label: 'TECH', color: 'var(--color-stat-intellect)' }, // TECH is now fourth and blue
          ] as const).map(({ key, label, color }) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, width: statBoxWidth, minWidth: 0 }}>
              <div style={{
                background: '#111',
                color: 'var(--color-text)',
                border: `2px solid ${color}`,
                borderRadius: 0,
                width: '100%',
                height: statBoxHeight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                fontWeight: 700,
                marginBottom: 0,
                boxSizing: 'border-box',
              }}>{statTotals[key] > 0 ? `+${statTotals[key]}` : statTotals[key] < 0 ? `${statTotals[key]}` : '+0'}</div>
              <div
                style={{
                  marginTop: 0,
                  fontSize: 15,
                  fontWeight: 500,
                  background: '#111',
                  color: 'var(--color-text)',
                  border: `2px solid ${color}`,
                  borderTop: 'none',
                  borderRadius: 0,
                  width: '100%',
                  textAlign: 'center',
                  padding: '4px 0 2px 0',
                  boxSizing: 'border-box',
                  position: 'relative',
                  top: -2,
                  cursor: 'pointer',
                }}
                onMouseEnter={() => setStatTooltip(key)}
                onMouseLeave={() => setStatTooltip(null)}
              >{label}
                {statTooltip === key && (
                  <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: '100%',
                    transform: 'translateX(-50%)',
                    background: 'var(--color-tooltip-bg)',
                    color: 'var(--color-tooltip-text)',
                    padding: '10px 14px',
                    borderRadius: 4,
                    fontSize: 15,
                    marginTop: 8,
                    whiteSpace: 'pre-line',
                    zIndex: 10,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                    maxWidth: 260,
                    textAlign: 'left',
                  }}>{statTooltipTexts[key]}</div>
                )}
              </div>
            </div>
          ))}
        </div>
        {/* Hardpoint drop zones grid */}
        {props.hardpointItems && props.hardpointItems.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(4, props.hardpointItems.length)}, ${hardpointBoxSize}px)`,
              gap: boxGap,
              justifyContent: 'center',
              width: mainContentWidth,
              marginTop: boxGap,
            }}
          >
            {props.hardpointItems.map((item, idx) =>
              props.renderHardpointSlot(
                item,
                props.handleDrop,
                props.handleDragStart,
                idx,
                props.onHardpointClick,
                { width: hardpointBoxSize, height: hardpointBoxSize }
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Livery; 