// Self-contained deterministic avatar + glyph drawing for the network graph.
// No external image/API calls (offline-safe replacement for DiceBear).

export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function avatarHue(id: string): number {
  return hashStr(id) % 360;
}

export function initials(label: string): string {
  const clean = label.replace(/[^A-Za-z\s']/g, ' ').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const TYPE_COLOR: Record<string, string> = {
  Accused: '#EF4444',
  Victim: '#38BDF8',
  Witness: '#22C55E',
  Vehicle: '#F59E0B',
  Location: '#10B981',
  Account: '#3B82F6',
  Incident: '#F8FAFC',
  Evidence: '#A78BFA'
};

const isPerson = (t?: string) => t === 'Accused' || t === 'Victim' || t === 'Witness';

// Draw a person avatar: hued disc + symmetric identicon dots + initials, ringed
// in the community colour (thicker ring + crown for the kingpin/coordinator).
function drawPersonAvatar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  node: any,
  ringColor: string
) {
  const hue = avatarHue(node.id);
  ctx.save();
  // base disc
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = `hsl(${hue} 55% 32%)`;
  ctx.fill();
  // identicon dots (deterministic, symmetric)
  const h = hashStr(node.id);
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = `hsl(${hue} 70% 62% / 0.55)`;
  const cells = 3;
  const cs = (r * 2) / cells;
  for (let cx = 0; cx < 2; cx++) {
    for (let cy = 0; cy < cells; cy++) {
      if ((h >> (cx * cells + cy)) & 1) {
        const px = x - r + cx * cs;
        const pxm = x + r - (cx + 1) * cs;
        const py = y - r + cy * cs;
        ctx.fillRect(px, py, cs, cs);
        ctx.fillRect(pxm, py, cs, cs);
      }
    }
  }
  ctx.restore();
  // initials
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${r * 0.9}px Sans-Serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials(node.label), x, y + r * 0.02);
  // ring
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.lineWidth = node.isCoordinator ? r * 0.28 : r * 0.16;
  ctx.strokeStyle = ringColor;
  ctx.stroke();
  // crown for kingpin/coordinator
  if (node.isCoordinator) {
    ctx.fillStyle = '#F59E0B';
    ctx.font = `${r * 0.9}px Sans-Serif`;
    ctx.fillText('♔', x, y - r - r * 0.5); // ♔
  }
  ctx.restore();
}

// Draw a glyph badge for Vehicle / Location / Account / Evidence / Incident.
function drawGlyphBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  node: any,
  ringColor: string
) {
  const color = TYPE_COLOR[node.type] || '#94A3B8';
  ctx.save();
  // rounded-square badge
  const s = r * 1.7;
  const rad = r * 0.35;
  ctx.beginPath();
  ctx.moveTo(x - s / 2 + rad, y - s / 2);
  ctx.arcTo(x + s / 2, y - s / 2, x + s / 2, y + s / 2, rad);
  ctx.arcTo(x + s / 2, y + s / 2, x - s / 2, y + s / 2, rad);
  ctx.arcTo(x - s / 2, y + s / 2, x - s / 2, y - s / 2, rad);
  ctx.arcTo(x - s / 2, y - s / 2, x + s / 2, y - s / 2, rad);
  ctx.closePath();
  ctx.fillStyle = '#0b1220';
  ctx.fill();
  ctx.lineWidth = r * 0.2;
  ctx.strokeStyle = ringColor === '#334155' ? color : ringColor;
  ctx.stroke();

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(0.5, r * 0.14);
  const g = r * 0.55;
  if (node.type === 'Vehicle') {
    // car: body + roof + wheels
    ctx.beginPath();
    ctx.moveTo(x - g, y + g * 0.3);
    ctx.lineTo(x - g * 0.6, y - g * 0.2);
    ctx.lineTo(x + g * 0.6, y - g * 0.2);
    ctx.lineTo(x + g, y + g * 0.3);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(x - g * 0.5, y + g * 0.5, g * 0.28, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + g * 0.5, y + g * 0.5, g * 0.28, 0, Math.PI * 2); ctx.fill();
  } else if (node.type === 'Location') {
    // map pin
    ctx.beginPath();
    ctx.arc(x, y - g * 0.2, g * 0.55, Math.PI, 0);
    ctx.lineTo(x, y + g * 0.7);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y - g * 0.2, g * 0.2, 0, Math.PI * 2); ctx.fill();
  } else if (node.type === 'Account') {
    // card
    ctx.strokeRect(x - g, y - g * 0.55, g * 2, g * 1.1);
    ctx.fillRect(x - g, y - g * 0.2, g * 2, g * 0.25);
  } else if (node.type === 'Evidence' || node.type === 'Incident') {
    // concentric target
    ctx.beginPath(); ctx.arc(x, y, g * 0.7, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, g * 0.3, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.beginPath(); ctx.arc(x, y, g * 0.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

export function drawNode(
  ctx: CanvasRenderingContext2D,
  node: any,
  r: number,
  ringColor: string,
  dim: boolean
) {
  ctx.globalAlpha = dim ? 0.28 : 1;
  if (isPerson(node.type)) drawPersonAvatar(ctx, node.x, node.y, r, node, ringColor);
  else drawGlyphBadge(ctx, node.x, node.y, r, node, ringColor);
  ctx.globalAlpha = 1;
}
