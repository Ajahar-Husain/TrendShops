import { Component } from 'react'
import { Box, Button, Paper, Typography } from '@mui/material'

export default class AppErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Unhandled application rendering error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box className="container-app" sx={{ display: 'grid', minHeight: '100vh', placeItems: 'center', py: 4 }}>
          <Paper variant="outlined" sx={{ maxWidth: 560, p: { xs: 3, sm: 5 }, textAlign: 'center', borderRadius: 4 }}>
            <Typography variant="overline" color="secondary.dark" fontWeight={800}>Something went wrong</Typography>
            <Typography component="h1" variant="h4" fontWeight={800} sx={{ mt: 1 }}>This page couldn’t load.</Typography>
            <Typography color="text.secondary" sx={{ mt: 1.5 }}>
              Try again, or return to TrendShops and choose another page.
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1.5, mt: 3 }}>
              <Button variant="contained" onClick={() => window.location.reload()}>Try again</Button>
              <Button component="a" href="/" variant="outlined">Go to home</Button>
            </Box>
          </Paper>
        </Box>
      )
    }

    return this.props.children
  }
}
