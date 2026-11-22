import { useEffect, useRef, useState } from 'react'
import { Alert, Box, Button, CircularProgress, Stack, TextField, Typography } from '@mui/material'
import MyLocationOutlinedIcon from '@mui/icons-material/MyLocationOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const INDIA_CENTER = [78.9629, 20.5937]

function parseAddress(result) {
  const address = result.address || {}
  const house = address.house_number || ''
  const road = address.road || address.pedestrian || address.residential || address.footway || ''
  const city = address.city || address.town || address.village || address.municipality || address.county || ''

  return {
    line1: [house, road].filter(Boolean).join(' ') || result.name || result.display_name?.split(',')[0] || '',
    line2: [address.suburb, address.neighbourhood, address.quarter].filter(Boolean).join(', '),
    city,
    state: address.state || '',
    pincode: address.postcode || '',
    country: address.country || 'India',
  }
}

export default function OpenFreeMapAddressPicker({ onAddressSelected }) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const searchTimerRef = useRef(null)
  const onAddressSelectedRef = useRef(onAddressSelected)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [locating, setLocating] = useState(false)
  const [searching, setSearching] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    onAddressSelectedRef.current = onAddressSelected
  }, [onAddressSelected])

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return undefined

    const rasterFallbackStyle = {
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors',
          maxzoom: 19,
        },
      },
      layers: [{ id: 'osm-raster', type: 'raster', source: 'osm' }],
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: rasterFallbackStyle,
      center: INDIA_CENTER,
      zoom: 4,
      attributionControl: true,
      renderWorldCopies: true,
    })

    const resizeTimer = window.setTimeout(() => map.resize(), 350)

    map.on('load', () => {
      map.resize()
      window.requestAnimationFrame(() => map.resize())
    })

    markerRef.current = new maplibregl.Marker({ color: '#204631' })
      .setLngLat(INDIA_CENTER)
      .addTo(map)
      .setLngLat(INDIA_CENTER)

    markerRef.current.setLngLat([0, 0])
    markerRef.current.getElement().style.display = 'none'

    map.on('click', async (event) => {
      await reverseGeocode(event.lngLat.lng, event.lngLat.lat)
    })

    mapRef.current = map

    return () => {
      window.clearTimeout(resizeTimer)
      map.remove()
      mapRef.current = null
    }
  }, [])

  async function reverseGeocode(lng, lat) {
    setLocating(true)
    setErrorMessage('')

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=en&countrycodes=in`,
        { headers: { Accept: 'application/json' } },
      )
      if (!response.ok) throw new Error('Reverse geocoding failed')
      const result = await response.json()
      if (!result?.display_name) throw new Error('No address found')

      markerRef.current?.setLngLat([lng, lat])
      if (markerRef.current) markerRef.current.getElement().style.display = 'block'
      onAddressSelectedRef.current(parseAddress(result))
    } catch (error) {
      setErrorMessage('Could not find an address at this map location. Search or enter the address manually.')
    } finally {
      setLocating(false)
    }
  }

  async function searchAddresses(searchText) {
    const search = searchText.trim()
    if (search.length < 3) {
      setResults([])
      return
    }

    setSearching(true)
    setErrorMessage('')

    try {
      const params = new URLSearchParams({
        format: 'jsonv2',
        q: search,
        addressdetails: '1',
        limit: '6',
        countrycodes: 'in',
        'accept-language': 'en',
      })
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) throw new Error('Address search failed')
      setResults(await response.json())
    } catch (error) {
      setResults([])
      setErrorMessage('Address search is unavailable. You can enter the address manually.')
    } finally {
      setSearching(false)
    }
  }

  function handleSearchChange(event) {
    const value = event.target.value
    setQuery(value)
    clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => searchAddresses(value), 450)
  }

  function selectResult(result) {
    const lng = Number(result.lon)
    const lat = Number(result.lat)
    setQuery(result.display_name)
    setResults([])
    onAddressSelectedRef.current(parseAddress(result))

    if (mapRef.current) {
      mapRef.current.flyTo({ center: [lng, lat], zoom: 16, duration: 900 })
      markerRef.current?.setLngLat([lng, lat])
      if (markerRef.current) markerRef.current.getElement().style.display = 'block'
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setErrorMessage('Location access is not available in this browser.')
      return
    }

    setLocating(true)
    setErrorMessage('')
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          await reverseGeocode(coords.longitude, coords.latitude)
          mapRef.current?.flyTo({ center: [coords.longitude, coords.latitude], zoom: 16, duration: 900 })
        } finally {
          setLocating(false)
        }
      },
      (error) => {
        setLocating(false)
        setErrorMessage(
          error.code === error.PERMISSION_DENIED
            ? 'Allow location access in your browser to use your current location.'
            : 'Could not get your current location. Search or enter the address manually.',
        )
      },
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 12_000 },
    )
  }

  return (
    <Stack spacing={1.25} sx={{ gridColumn: '1 / -1', minWidth: 0 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="subtitle2" fontWeight={700}>Find your delivery address</Typography>
          <Typography variant="caption" color="text.secondary">
            Search OpenStreetMap or click anywhere on the map to fill the address fields.
          </Typography>
        </Box>
        <Button
          size="small"
          startIcon={locating ? <CircularProgress size={16} /> : <MyLocationOutlinedIcon />}
          onClick={useCurrentLocation}
          disabled={locating}
          sx={{ flexShrink: 0 }}
        >
          Use current location
        </Button>
      </Stack>

      <Box sx={{ position: 'relative', zIndex: 2 }}>
        <TextField
          fullWidth
          size="small"
          label="Search address"
          value={query}
          onChange={handleSearchChange}
          placeholder="Search address, apartment or landmark"
          InputProps={{ endAdornment: searching ? <CircularProgress size={18} /> : <SearchOutlinedIcon color="action" /> }}
        />
        {results.length > 0 && (
          <Box sx={{ position: 'absolute', left: 0, right: 0, top: '100%', zIndex: 20, mt: 0.5, maxHeight: 280, overflowY: 'auto', bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2, boxShadow: '0 12px 32px rgba(32,70,49,.16)' }}>
            {results.map((result) => (
              <Button
                key={result.place_id}
                onClick={() => selectResult(result)}
                sx={{ width: '100%', justifyContent: 'flex-start', px: 1.5, py: 1, borderRadius: 0, color: 'text.primary', textAlign: 'left', textTransform: 'none' }}
              >
                <Typography variant="body2">{result.display_name}</Typography>
              </Button>
            ))}
          </Box>
        )}
      </Box>

      <Box
        ref={mapContainerRef}
        sx={{ height: { xs: 280, sm: 340 }, width: '100%', borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider', bgcolor: 'primary.light', '& .maplibregl-ctrl-bottom-left': { mb: 0.5 }, '& .maplibregl-ctrl-top-right': { mt: 0.5, mr: 0.5 } }}
        aria-label="OpenStreetMap address map"
      />

      {errorMessage && <Alert severity="warning">{errorMessage}</Alert>}
    </Stack>
  )
}
