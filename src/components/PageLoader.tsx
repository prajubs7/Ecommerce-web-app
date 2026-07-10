import { Box, CircularProgress, Typography, Skeleton, Grid } from '@mui/material';


// Generic full-page loader
export function PageLoader() {
  return (
    <Box
      sx={{
        display:'flex',
        flexDirection:'column',
        alignItems:'center',
        justifyContent:'center',
        minHeight:'60vh',
        gap:2,
      }}
    >
      <CircularProgress size={36} thickness={4} />
      <Typography variant="body2" color="text.secondary">
        Loading...
      </Typography>
    </Box>
  );
}

// Product grid skeleton — matches ProductListPage layout
export function ProductGridSkeleton() {
  return (
    <Box sx={{ mt: 4, px: 2 }}>
      {/* Filter bar skeleton */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Skeleton variant="rounded" width={260} height={56} />
        <Skeleton variant="rounded" width={180} height={56} />
        <Skeleton variant="rounded" width={180} height={56} />
      </Box>

      {/* Product grid skeleton */}
      <Grid container spacing={3}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
            <Box>
              <Skeleton variant="rounded" height={200} sx={{ mb: 1 }} />
              <Skeleton variant="text"    width="60%"  height={20}  />
              <Skeleton variant="text"    width="40%"  height={28}  />
              <Skeleton variant="rounded" height={36}  sx={{ mt: 1 }} />
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

// Dashboard skeleton — matches vendor/admin dashboard layout
export function DashboardSkeleton() {
  return (
    <Box sx={{ mt: 4, px: 3 }}>
      <Skeleton variant="text"    width={240}  height={48} sx={{ mb: 3 }} />
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" width={120} height={40} />
        ))}
      </Box>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} variant="rounded" height={52} sx={{ mb: 1 }} />
      ))}
    </Box>
  );
}

// Auth page skeleton
export function AuthSkeleton() {
  return (
    <Box
      sx={{
        maxWidth: 400,
        mx:       'auto',
        mt:       10,
        px:       2,
      }}
    >
      <Skeleton variant="text"    width="60%"  height={48} sx={{ mb: 3 }} />
      <Skeleton variant="rounded" height={56}  sx={{ mb: 2 }} />
      <Skeleton variant="rounded" height={56}  sx={{ mb: 2 }} />
      <Skeleton variant="rounded" height={48}  sx={{ mt: 1 }} />
    </Box>
  );
}