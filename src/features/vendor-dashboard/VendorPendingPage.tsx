import { Container, Alert, Typography } from '@mui/material';

export default function VendorPendingPage() {
  return (
    <Container sx={{ mt: 8 }}>
      <Typography variant="h4" gutterBottom>Almost there</Typography>
      <Alert severity="info">
        Your vendor application has been submitted. An admin will review it shortly —
        you'll be able to list products once it's approved.
      </Alert>
    </Container>
  );
}
