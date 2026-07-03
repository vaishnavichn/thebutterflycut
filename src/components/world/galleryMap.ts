export interface RoomZone {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: number;
}

export interface Wall {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NpcSpawn {
  id: string; // curator, cleaner, nanny, security
  name: string;
  x: number;
  y: number;
  color: string;
}

export const ROOM_ZONES: RoomZone[] = [
  {
    id: 'Vault',
    name: 'Private Vault',
    x: 30,
    y: 30,
    width: 210,
    height: 150,
    color: 0x6b4545
  },
  {
    id: 'Storage_Room',
    name: 'Storage Room',
    x: 270,
    y: 30,
    width: 260,
    height: 150,
    color: 0x5a5a5a
  },
  {
    id: 'Security_Booth',
    name: 'Security Booth',
    x: 560,
    y: 30,
    width: 210,
    height: 150,
    color: 0x4a5a5a
  },
  {
    id: 'West_Wing',
    name: 'West Wing',
    x: 30,
    y: 180,
    width: 210,
    height: 140,
    color: 0x5a4a62
  },
  {
    id: 'Main_Hall',
    name: 'Main Hall',
    x: 270,
    y: 180,
    width: 260,
    height: 280,
    color: 0x4a4a4a
  },
  {
    id: 'East_Wing',
    name: 'East Wing',
    x: 560,
    y: 180,
    width: 210,
    height: 280,
    color: 0x4a5a4a
  },
  {
    id: 'Front_Desk',
    name: 'Front Desk',
    x: 30,
    y: 320,
    width: 210,
    height: 140,
    color: 0x5a5a42
  },
  {
    id: 'Curators_Office',
    name: "Curator's Office",
    x: 30,
    y: 460,
    width: 240,
    height: 150,
    color: 0x5a4a62
  },
  {
    id: 'Break_Room',
    name: 'Break Room',
    x: 530,
    y: 460,
    width: 240,
    height: 150,
    color: 0x4a5262
  }
];

// List of physical solid wall rectangles.
// These block movement, styled as amber/charcoal borders.
// Gaps are explicitly left open for door access between rooms!
export const WALLS: Wall[] = [
  // Outer Borders
  { x: 400, y: 15, width: 780, height: 10 },    // Top edge
  { x: 400, y: 615, width: 780, height: 10 },   // Bottom edge
  { x: 15, y: 315, width: 10, height: 610 },    // Left edge
  { x: 785, y: 315, width: 10, height: 610 },    // Right edge

  // Vertical Separator: Left column (Vault / West Wing / Front Desk / Curator's Office)
  // Separator at X: 240
  { x: 240, y: 70, width: 10, height: 100 },     // Vault vs Storage (has door at Y: 120-180)
  { x: 240, y: 240, width: 10, height: 120 },    // West Wing vs Main Hall (door at Y: 180-240)
  { x: 240, y: 390, width: 10, height: 140 },    // Front Desk vs Main Hall (door at Y: 320-390)
  // Let's add walls between left-column rooms horizontally (Y: 180, Y: 320, Y: 460)
  { x: 120, y: 180, width: 180, height: 10 },    // Vault / West Wing divider (door at X: 210-240)
  { x: 120, y: 320, width: 180, height: 10 },    // West Wing / Front Desk divider (door at X: 30-70)
  { x: 135, y: 460, width: 210, height: 10 },    // Front Desk / Curator's Office divider (door at X: 240)

  // Vertical Separator: Right column (Security Booth / East Wing / Break Room)
  // Separator at X: 560
  { x: 560, y: 70, width: 10, height: 100 },     // Security Booth vs Storage (door at Y: 120-180)
  { x: 560, y: 240, width: 10, height: 120 },    // East Wing vs Main Hall (door at Y: 180-240)
  { x: 560, y: 390, width: 10, height: 140 },    // East Wing vs Main Hall (door at Y: 320-390)
  // Walls between right-column rooms horizontally (Y: 180, Y: 460)
  { x: 670, y: 180, width: 180, height: 10 },    // Security Booth / East Wing divider (door at X: 560-600)
  { x: 655, y: 460, width: 210, height: 10 },    // East Wing / Break Room divider (door at X: 560)

  // Horizontal Separator: Storage Room / Main Hall divider at Y: 180
  { x: 390, y: 180, width: 240, height: 10 },    // Storage / Main Hall divider (door at X: 270-320)
  // Bottom wall of Main Hall separator at Y: 460
  { x: 390, y: 460, width: 240, height: 10 }     // Main Hall bottom divider (door at X: 270-320)
];

export const NPC_SPAWNS: NpcSpawn[] = [
  { id: 'curator', name: 'Eleanor Voss', x: 120, y: 530, color: '#a855f7' },
  { id: 'cleaner', name: 'Rosa Delgado', x: 660, y: 300, color: '#3b82f6' },
  { id: 'nanny', name: 'Priya Kapoor', x: 400, y: 320, color: '#ec4899' },
  { id: 'security', name: 'Marcus Reyes', x: 660, y: 100, color: '#ef4444' }
];

export const CLUE_OBJECTS = [
  { id: 'vault_scanner_log', roomId: 'Vault', x: 70, y: 70, title: 'Vault Scanner Log' },
  { id: 'storage_crate', roomId: 'Storage_Room', x: 340, y: 100, title: 'Storage Crate' },
  { id: 'storage_footprint', roomId: 'Storage_Room', x: 430, y: 80, title: 'Storage Footprint' },
  { id: 'security_maintenance_note', roomId: 'Security_Booth', x: 710, y: 70, title: 'Security Maintenance Note' },
  { id: 'signout_sheet', roomId: 'Front_Desk', x: 140, y: 390, title: 'Signout Sheet' },
  { id: 'cleaning_schedule', roomId: 'East_Wing', x: 630, y: 220, title: 'Cleaning Schedule' },
  { id: 'sensor_panel', roomId: 'West_Wing', x: 60, y: 250, title: 'Sensor Panel' },
  { id: 'draft_letter', roomId: 'Curators_Office', x: 190, y: 530, title: 'Draft Letter' },
  { id: 'nanny_phone_log', roomId: 'Main_Hall', x: 320, y: 280, title: 'Nanny Phone Log' }
];
