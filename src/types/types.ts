export type Part = 'Frame' | 'Chassis' | 'Systems' | 'Module';
export type WeightClass = 'Light' | 'Medium' | 'Heavy' | 'Super Heavy';
export type RoleClass = 'Striker' | 'Artillery' | 'Utility';
export type HardpointSize = 'normal' | 'large';

// For Frame, Chassis, Systems: all fields apply. For Module: only id, name, description, icon, part are required.
export interface Item {
  id: string;
  // For Frame, Chassis, Systems
  manufacturer?: string;
  model?: string;
  // For all items
  name: string; // For Frame, Chassis, Systems: name = manufacturer + ' ' + model
  description: string;
  icon: string;
  part: Part;
  // Only for Frame, Chassis, Systems
  weightClass?: WeightClass;
  agility?: number;
  might?: number;
  tech?: number;
  intellect?: number;
  roleClass?: RoleClass;
  hardpoints?: number;
  // For Frame only
  hardpointSizes?: HardpointSize[];
  engine?: number;
  armour?: number;
  motors?: number;
  computer?: number;
  // Only for Module
  roleTags?: RoleClass[];
  // For Module only
  size?: HardpointSize;
}

export type SlotType = 'inventory' | 'primary part' | 'hardpoint';

export interface DragSource {
  type: SlotType;
  index: number;
} 