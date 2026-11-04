import { useCallback, useEffect, useState } from 'react'
import { getStoreMeta } from '../lib/stores'
import { supabase } from '../lib/supabase'
import type { StoreDataset, StoreProduct } from '../lib/types'

type InventoryRow = {
  id: string
  sku: string
  model?: string
  style?: string
  units_in_stock: number
  list_price: number
  image_url: string | null
  display_order: number
}

function resolveImageUrl(url: string | null, sku: string, dataset: 'iphone' | 'shoes') {
  if (url?.startsWith('/products/')) return url
  const num = parseInt(sku.split('-')[1] ?? '1', 10)
  const idx = Number.isFinite(num) ? String(num).padStart(2, '0') : '01'
  return `/products/${dataset}/${idx}.svg`
}

function mapRow(
  row: InventoryRow,
  nameColumn: 'model' | 'style',
  dataset: 'iphone' | 'shoes',
): StoreProduct {
  return {
    id: row.id,
    sku: row.sku,
    name: (nameColumn === 'model' ? row.model : row.style) ?? '',
    units_in_stock: row.units_in_stock,
    list_price: Number(row.list_price),
    image_url: resolveImageUrl(row.image_url, row.sku, dataset),
    display_order: row.display_order,
  }
}

export function useStoreProducts(dataset: StoreDataset | null) {
  const [products, setProducts] = useState<StoreProduct[]>([])
  const [loading, setLoading] = useState(true)

  const meta = dataset ? getStoreMeta(dataset) : null

  const refresh = useCallback(async () => {
    if (!meta) return
    setLoading(true)
    const { data, error } = await supabase
      .from(meta.inventoryTable)
      .select('*')
      .order('display_order', { ascending: true })

    if (!error && data) {
      setProducts(
        (data as InventoryRow[]).map((row) =>
          mapRow(
            row,
            meta.nameColumn,
            meta.inventoryTable === 'iphone_inventory' ? 'iphone' : 'shoes',
          ),
        ),
      )
    }
    setLoading(false)
  }, [meta])

  useEffect(() => {
    if (!meta) return
    void refresh()

    const channel = supabase
      .channel(`products-${meta.inventoryTable}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: meta.inventoryTable },
        () => {
          void refresh()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [meta, refresh])

  return { products, loading, refresh }
}
