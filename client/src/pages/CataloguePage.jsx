import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Button, FormControl, InputLabel, MenuItem, Pagination, Select, Stack, TextField, Typography } from '@mui/material'
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined'
import { useCategories, useProducts } from '../hooks/useProducts'
import ProductGrid from '../components/product/ProductGrid'
import { PRODUCT_CATEGORY_OPTIONS } from '../utils/constants'

export default function CataloguePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const categoriesQuery = useCategories()
  const categories = categoriesQuery.data?.categories?.length
    ? categoriesQuery.data.categories
    : PRODUCT_CATEGORY_OPTIONS
  const params = useMemo(() => ({
    page: Number(searchParams.get('page')) || 1,
    limit: 20,
    ...(searchParams.get('q') && { search: searchParams.get('q') }),
    ...(searchParams.get('category') && { category: searchParams.get('category') }),
    ...(searchParams.get('deals') === 'true' && { deals: true }),
    sort: searchParams.get('sort') || (searchParams.get('deals') === 'true' ? '-discountPercent' : '-createdAt'),
  }), [searchParams])
  const query = useProducts(params)
  const pagination = query.data?.pagination

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setSearchParams(next)
  }

  function submitSearch(event) {
    event.preventDefault()
    updateParam('q', search.trim())
  }

  return (
    <Box className="container-app py-8 sm:py-10">
      <Box sx={{ mb: 3.5 }}>
        <Typography variant="overline" color="primary.main" fontWeight={700}>The collection</Typography>
        <Typography component="h1" variant="h4" fontWeight={800}>Shop all products</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>{pagination ? `${pagination.total} products selected for you` : 'Find something you will love.'}</Typography>
      </Box>
      <Stack
        component="form"
        onSubmit={submitSearch}
        direction={{ xs: 'column', lg: 'row' }}
        spacing={1.5}
        sx={{ mb: 3, p: 2, border: 1, borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}
      >
        <TextField value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products or brands..." aria-label="Search products" size="small" fullWidth />
        <Button type="submit" variant="contained" sx={{ flexShrink: 0 }}>Search</Button>
        <FormControl size="small" sx={{ minWidth: { lg: 190 } }}>
          <InputLabel id="catalog-category-label"><TuneOutlinedIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />Category</InputLabel>
          <Select labelId="catalog-category-label" label="Category" value={searchParams.get('category') || ''} onChange={(event) => updateParam('category', event.target.value)}>
            <MenuItem value="">All categories</MenuItem>
            {categories.map((category) => <MenuItem key={category.slug} value={category.slug}>{category.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: { lg: 190 } }}>
          <InputLabel id="catalog-sort-label">Sort by</InputLabel>
          <Select labelId="catalog-sort-label" label="Sort by" value={searchParams.get('sort') || '-createdAt'} onChange={(event) => updateParam('sort', event.target.value)}>
            <MenuItem value="-createdAt">Newest</MenuItem>
            <MenuItem value="price">Price: low to high</MenuItem>
            <MenuItem value="-price">Price: high to low</MenuItem>
            <MenuItem value="-rating">Top rated</MenuItem>
            <MenuItem value="-discountPercent">Best deals</MenuItem>
          </Select>
        </FormControl>
      </Stack>
      <ProductGrid products={query.data?.products || []} loading={query.isLoading} error={query.isError} onRetry={query.refetch} />
      {pagination?.pages > 1 && (
        <Stack sx={{ alignItems: 'center', mt: 4 }}>
          <Pagination
            color="primary"
            page={pagination.page}
            count={pagination.pages}
            onChange={(_, page) => updateParam('page', String(page))}
          />
        </Stack>
      )}
    </Box>
  )
}
