export async function fetchProducts() {
  try {
    const res = await fetch('https://dummyjson.com/products?limit=10')
    if (!res.ok) {
      throw new Error(`Failed to fetch products: ${res.statusText}`)
    }
    return await res.json()
  } catch (e: any) {
    console.error('Error fetching dummyjson:', e.message)
    return { products: [] }
  }
}
