import { AlertTriangle, Package } from 'lucide-react'
import type { StoreProduct } from '../lib/types'

type Props = {
  product: StoreProduct
  tested: boolean
}

export function ProductCard({ product, tested }: Props) {
  const missingName = !product.name.trim()
  const badStock = product.units_in_stock < 0
  const zeroStock = product.units_in_stock === 0
  const badPrice = product.list_price < 0 || product.list_price > 5000
  const corrupted = tested && (missingName || badStock || zeroStock || badPrice)

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-2xl border bg-slate-900/60 transition duration-500 ${
        corrupted ? 'border-rose-500/50 shadow-lg shadow-rose-500/10' : 'border-slate-800'
      }`}
    >
      <div className="relative aspect-square bg-slate-950">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name || 'Product'}
            className={`size-full object-cover transition ${corrupted ? 'opacity-70 grayscale-[30%]' : ''}`}
          />
        ) : (
          <div className="flex size-full items-center justify-center text-slate-600">
            <Package className="size-12" />
          </div>
        )}
        {corrupted && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-rose-600/90 px-2 py-0.5 text-xs font-medium text-white">
            <AlertTriangle className="size-3" /> affected
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">{product.sku}</p>
        <h3
          className={`text-lg font-semibold leading-snug ${
            missingName ? 'italic text-rose-300' : 'text-slate-100'
          }`}
        >
          {missingName ? '— name missing —' : product.name}
        </h3>
        <p
          className={`text-xl font-medium tabular-nums ${
            badPrice ? 'text-rose-400 line-through decoration-2' : 'text-emerald-300'
          }`}
        >
          {badPrice ? `$${product.list_price.toLocaleString()} (invalid)` : `$${product.list_price.toFixed(2)}`}
        </p>
        <p className="mt-auto text-sm text-slate-400">
          Stock:{' '}
          <span
            className={
              badStock
                ? 'font-semibold text-rose-400'
                : zeroStock
                  ? 'text-amber-400'
                  : 'text-slate-200'
            }
          >
            {badStock ? `${product.units_in_stock} oversold` : product.units_in_stock}
          </span>
        </p>
      </div>
    </article>
  )
}
