import type { StoreDataset } from './types'

export const STORES: {
  id: StoreDataset
  name: string
  inventoryTable: 'iphone_inventory' | 'shoe_inventory'
  nameColumn: 'model' | 'style'
}[] = [
  {
    id: 'iphone_shop',
    name: 'iPhone Shop',
    inventoryTable: 'iphone_inventory',
    nameColumn: 'model',
  },
  {
    id: 'shoe_store',
    name: 'Shoe Store',
    inventoryTable: 'shoe_inventory',
    nameColumn: 'style',
  },
]

export function getStoreMeta(id: StoreDataset) {
  return STORES.find((s) => s.id === id)!
}
