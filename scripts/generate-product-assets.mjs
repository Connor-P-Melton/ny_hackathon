import fs from 'fs'
import path from 'path'

const root = path.join(import.meta.dirname, '..', 'public', 'products')
const iphoneDir = path.join(root, 'iphone')
const shoeDir = path.join(root, 'shoes')

const phoneColors = [
  '#1e293b', '#334155', '#0f766e', '#7c3aed', '#be123c',
  '#0369a1', '#b45309', '#4f46e5', '#059669', '#dc2626',
  '#0891b2', '#9333ea', '#ca8a04', '#2563eb', '#16a34a',
  '#db2777', '#0284c7', '#65a30d', '#ea580c', '#57534e',
]

const shoeColors = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e',
  '#84cc16', '#6366f1', '#0ea5e9', '#a855f7', '#10b981',
  '#fb7185', '#fcd34d', '#4ade80', '#38bdf8', '#c084fc',
]

function phoneSvg(label, color, idx) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="g${idx}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${color}"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="#0b1220"/>
  <rect x="130" y="40" width="140" height="280" rx="24" fill="url(#g${idx})" stroke="#64748b" stroke-width="3"/>
  <rect x="155" y="58" width="90" height="200" rx="8" fill="#020617" opacity="0.85"/>
  <circle cx="200" cy="280" r="10" fill="#334155"/>
  <text x="200" y="350" text-anchor="middle" fill="#e2e8f0" font-family="system-ui,sans-serif" font-size="13" font-weight="600">${label.replace(/&/g, '&amp;').slice(0, 28)}</text>
</svg>`
}

function shoeSvg(label, color, idx) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="#0b1220"/>
  <ellipse cx="200" cy="250" rx="150" ry="35" fill="#1e293b"/>
  <path d="M90 250 Q120 170 200 160 Q280 170 310 250 L290 270 Q200 290 110 270 Z" fill="${color}" stroke="#94a3b8" stroke-width="2"/>
  <path d="M110 230 Q160 200 240 210 L260 235 Q200 245 130 240 Z" fill="#ffffff" opacity="0.15"/>
  <text x="200" y="340" text-anchor="middle" fill="#e2e8f0" font-family="system-ui,sans-serif" font-size="13" font-weight="600">${label.replace(/&/g, '&amp;').slice(0, 28)}</text>
</svg>`
}

fs.mkdirSync(iphoneDir, { recursive: true })
fs.mkdirSync(shoeDir, { recursive: true })

const iphoneNames = [
  'iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16', 'iPhone 16 Plus', 'iPhone 15 Pro Max',
  'iPhone 15', 'iPhone 15 Plus', 'iPhone 14', 'iPhone 14 Plus', 'iPhone SE',
  'iPhone 13', 'iPhone 13 mini', 'iPhone 12', 'iPhone 11', 'iPhone 16 Pro Desert',
  'iPhone 16 Teal', 'iPhone 15 Pro', 'iPhone 15 Pink', 'iPhone 14 Pro Gold', 'iPhone 12 Pro Max',
]

const shoeNames = [
  'Air Runner Elite', 'Trail Max GTX', 'City Slip On', 'Sprint Pro Carbon', 'Urban Flex Knit',
  'Court Classic Low', 'Hike Ridge', 'Velocity Track', 'Cloud Step Lite', 'Peak Summit Boot',
  'Retro Jam High', 'Studio Yoga Grip', 'Marathon Elite 2', 'Street Bold Red', 'Glide Foam Racer',
  'Kids Zoom Mini', 'Work Steel Toe', 'Lounge Fleece Clog', 'Pro Basketball', 'Eco Knit Walker',
]

for (let i = 0; i < 20; i++) {
  const id = String(i + 1).padStart(2, '0')
  fs.writeFileSync(
    path.join(iphoneDir, `${id}.svg`),
    phoneSvg(iphoneNames[i], phoneColors[i], i),
  )
  fs.writeFileSync(
    path.join(shoeDir, `${id}.svg`),
    shoeSvg(shoeNames[i], shoeColors[i], i),
  )
}

console.log('Generated 40 local product SVGs in public/products/')
