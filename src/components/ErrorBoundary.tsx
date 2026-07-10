import { Component, type ReactNode } from 'react';
import { Box, Typography, Button }   from '@mui/material';

interface Props   { children: ReactNode }
interface State   { hasError: boolean; error?: Error }

/**
 * ErrorBoundary
 *
 * Catches errors from lazy-loaded chunks.
 * Common scenario: user has the app open, you deploy new code,
 * old chunk URLs no longer exist → chunk load fails → white screen.
 * This catches it and shows a helpful message + reload button.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('Lazy chunk load failed:', error);
  }

  render() {
    if (this.state.hasError) {
      const isChunkError = this.state.error?.message?.includes('Failed to fetch dynamically imported module');

      return (
        <Box
          sx={{
            display:'flex',
            flexDirection:'column',
            alignItems:'center',
            justifyContent:'center',
            minHeight:'60vh',
            textAlign:'center',
            gap: 2,
            p: 4,
          }}
        >
          <Typography variant="h5" fontWeight={700}>
            {isChunkError ? 'App updated — please refresh' : 'Something went wrong'}
          </Typography>
          <Typography color="text.secondary" maxWidth={400}>
            {isChunkError
              ? 'A new version of the app is available. Refresh to get the latest version.'
              : 'An unexpected error occurred. Try refreshing the page.'}
          </Typography>
          <Button
            variant="contained"
            onClick={() => window.location.reload()}
          >
            Refresh page
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}