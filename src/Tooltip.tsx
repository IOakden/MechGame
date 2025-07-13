import React from 'react';
import type { Item } from './types/types';

interface TooltipProps {
  tooltip: { item: Item; x: number; y: number } | null;
}

const Tooltip: React.FC<TooltipProps> = ({ tooltip }) => {
  if (!tooltip) return null;
  // Tooltip width estimate
  const tooltipWidth = 280;
  const tooltipHeight = 200; // Estimate tooltip height
  const padding = 16;
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const screenCenterX = screenWidth / 2;
  const screenCenterY = screenHeight / 2;
  // Show tooltip on opposite side of cursor relative to screen center
  const showLeft = tooltip.x > screenCenterX;
  const showAbove = tooltip.y > screenCenterY;
  // Role class color map
  const roleColors: Record<string, string> = {
    Striker: 'var(--color-class-striker)',
    Artillery: 'var(--color-class-artillery)',
    Utility: 'var(--color-class-utility)',
  };
  return (
    <div
      style={{
        position: 'fixed',
        left: showLeft ? tooltip.x - tooltipWidth - 16 : tooltip.x + 16,
        top: showAbove ? tooltip.y - tooltipHeight - 16 : tooltip.y + 16,
        background: 'var(--color-tooltip-bg)',
        color: 'var(--color-tooltip-text)',
        padding: '10px 16px',
        borderRadius: 0,
        pointerEvents: 'none',
        zIndex: 1000,
        minWidth: 180,
        maxWidth: tooltipWidth,
        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
        fontSize: 15,
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
        {['Frame', 'Chassis', 'Systems'].includes(tooltip.item.part)
          ? `${tooltip.item.manufacturer || ''} ${tooltip.item.model || ''}`.trim()
          : tooltip.item.name}
      </div>
      <div style={{ 
        fontSize: 13, 
        opacity: 0.7, 
        marginBottom: 6,
        textTransform: 'uppercase',
        fontWeight: 600
      }}>
        {tooltip.item.part === 'Module' ? tooltip.item.size : tooltip.item.weightClass}
      </div>
      <div style={{ opacity: 0.85, marginBottom: 8 }}>{tooltip.item.description}</div>
      {/* Module role tags */}
      {tooltip.item.part === 'Module' && Array.isArray(tooltip.item.roleTags) && tooltip.item.roleTags.length > 0 && (
        <div style={{
          background: '#000',
          marginTop: 8,
          marginBottom: 8,
          padding: '8px 10px',
          borderRadius: 0,
          display: 'flex',
          flexDirection: 'row',
          gap: 8,
          justifyContent: 'center',
        }}>
          {tooltip.item.roleTags.map((role) => (
            <span
              key={role}
              style={{
                border: `2px solid ${roleColors[role]}`,
                color: roleColors[role],
                borderRadius: 999,
                padding: '2px 14px',
                fontWeight: 700,
                fontSize: 15,
                background: 'none',
                display: 'inline-block',
                lineHeight: 1.2,
              }}
            >
              {role}
            </span>
          ))}
        </div>
      )}
      {/* Attribute modifications */}
      {['agility', 'might', 'tech', 'intellect'].some(attr => tooltip.item[attr as keyof typeof tooltip.item] !== 0) && (
        <div style={{
          background: '#000',
          marginTop: 8,
          padding: '8px 10px',
          borderRadius: 0,
          display: 'flex',
          flexDirection: 'row',
          gap: 8,
          justifyContent: 'center',
        }}>
          {([
            { key: 'agility', label: 'AGIL', color: 'var(--color-stat-agility)' },
            { key: 'might', label: 'MGHT', color: 'var(--color-stat-might)' },
            { key: 'intellect', label: 'INTL', color: 'var(--color-stat-tech)' }, // INTL is now third and purple
            { key: 'tech', label: 'TECH', color: 'var(--color-stat-intellect)' }, // TECH is now fourth and blue
          ] as const).map(({ key, label, color }) => {
            const value = tooltip.item[key];
            if (!value) return null;
            return (
              <div key={key} style={{
                border: `2px solid ${color}`,
                color: color,
                background: '#111',
                minWidth: 38,
                textAlign: 'center',
                fontWeight: 700,
                fontSize: 15,
                padding: '2px 6px',
                borderRadius: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}>
                <span style={{ color: '#fff', fontSize: 13 }}>{label}</span>
                <span style={{ color }}>{value > 0 ? `+${value}` : value}</span>
              </div>
            );
          })}
        </div>
      )}
      {/* Item-specific properties (hardpoints, engine, armour, motors, computer) - skip for modules */}
      {(() => {
        const { part } = tooltip.item;
        if (part === 'Module') return null;
        let props: { key: string; label: string; color: string }[] = [];
        if (part === 'Frame') {
          props = [
            { key: 'hardpoints', label: 'HARDPOINTS', color: '#fff' },
          ];
        } else if (part === 'Chassis') {
          props = [
            { key: 'engine', label: 'ENGINE', color: '#fff' },
            { key: 'armour', label: 'ARMOUR', color: '#fff' },
          ];
        } else if (part === 'Systems') {
          props = [
            { key: 'motors', label: 'MOTORS', color: '#fff' },
            { key: 'computer', label: 'COMPUTER', color: '#fff' },
          ];
        }
        const hasAny = props.some(({ key }) => tooltip.item[key as keyof Item] !== undefined);
        if (!hasAny) return null;
        return (
          <div style={{
            background: '#000',
            marginTop: 8,
            padding: '8px 10px',
            borderRadius: 0,
            display: 'flex',
            flexDirection: 'row',
            gap: 8,
            justifyContent: 'center',
          }}>
            {props.map(({ key, label, color }) => {
              const value = tooltip.item[key as keyof Item];
              if (value === undefined) return null;
              return (
                <div key={key} style={{
                  border: `2px solid ${color}`,
                  color: color,
                  background: '#111',
                  minWidth: 38,
                  textAlign: 'center',
                  fontWeight: 700,
                  fontSize: 15,
                  padding: '2px 6px',
                  borderRadius: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}>
                  <span style={{ color: '#fff', fontSize: 13 }}>{label}</span>
                  <span style={{ color: '#fff' }}>{value}</span>
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
};

export default Tooltip; 