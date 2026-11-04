export type StoreDataset = 'iphone_shop' | 'shoe_store'

export type StoreProduct = {
  id: string
  sku: string
  name: string
  units_in_stock: number
  list_price: number
  image_url: string | null
  display_order: number
}

export type GameSession = {
  id: string
  room_code: string
  status: 'waiting' | 'active' | 'completed'
  health_score: number
  player_name: string | null
  dataset: StoreDataset | null
  started_at: string | null
  ends_at: string | null
  defender_won: boolean | null
  created_at: string
}
