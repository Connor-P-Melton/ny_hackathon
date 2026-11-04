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

function mapRow(row: InventoryRow, nameColumn: 'model' | 'style'): StoreProduct {
  return {
    id: row.id,
    sku: row.sku,
    name: (nameColumn === 'model' ? row.model : row.style) ?? '',
    units_in_stock: row.units_in_stock,
    list_price: Number(row.list_price),
    image_url: row.image_url,
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
        (data as InventoryRow[]).map((row) => mapRow(row, meta.nameColumn)),
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
