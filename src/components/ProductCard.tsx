import { AlertTriangle, Package } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { StoreProduct } from '../lib/types'

function fallbackForProduct(product: StoreProduct) {
  const dataset = product.sku.startsWith('SHO') ? 'shoes' : 'iphone'
  const num = parseInt(product.sku.split('-')[1] ?? '1', 10)
  const idx = Number.isFinite(num) ? String(num).padStart(2, '0') : '01'
  return `/products/${dataset}/${idx}.svg`
}

type Props = {
  product: StoreProduct
  tested: boolean
}

export function ProductCard({ product, tested }: Props) {
  const fallback = fallbackForProduct(product)
  const [imgSrc, setImgSrc] = useState(product.image_url ?? fallback)
  useEffect(() => {
    setImgSrc(product.image_url ?? fallback)
  }, [product.id, product.image_url, fallback])
  const missingName = !product.name.trim()
  const badStock = product.units_in_stock < 0
  const zeroStock = product.units_in_stock === 0
  const badPrice = product.list_price < 0 || product.list_price > 5000
  const corrupted =
    missingName || badStock || badPrice || (tested && zeroStock)

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-2xl border bg-slate-900/60 transition duration-500 ${
        corrupted ? 'border-rose-500/50 shadow-lg shadow-rose-500/10' : 'border-slate-800'
      }`}
    >
      <div className="relative aspect-square bg-slate-950">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={product.name || 'Product'}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={() => setImgSrc(fallbackForProduct(product))}
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
