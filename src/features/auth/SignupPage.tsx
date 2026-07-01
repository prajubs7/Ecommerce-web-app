import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Link as MuiLink,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signUp } from '../../api/auth';

const schema = z.object({
  fullName: z.string().min(2, 'Enter your name'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['customer', 'vendor']),
});
type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'customer' },
  });

  const onSubmit = async (formData: FormData) => {
    console.log("Form data",  formData);
    setServerError(null);
    try {
      await signUp(formData.email, formData.password, formData.fullName, formData.role);
      // Vendors land on a "pending approval" notice; customers go straight in.
      navigate(formData.role === 'vendor' ? '/vendor/pending' : '/');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Sign up failed');
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Typography variant="h4" gutterBottom>Create an account</Typography>
      {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <TextField
          fullWidth
          label="Full name"
          margin="normal"
          {...register('fullName')}
          error={!!errors.fullName}
          helperText={errors.fullName?.message}
        />
        <TextField
          fullWidth
          label="Email"
          margin="normal"
          {...register('email')}
          error={!!errors.email}
          helperText={errors.email?.message}
        />
        <TextField
          fullWidth
          type="password"
          label="Password"
          margin="normal"
          {...register('password')}
          error={!!errors.password}
          helperText={errors.password?.message}
        />

        <Typography variant="body2" sx={{ mt: 2, mb: 1 }} color="text.secondary">
          I want to
        </Typography>
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <ToggleButtonGroup
              fullWidth
              exclusive
              value={field.value}
              onChange={(_, val) => val && field.onChange(val)}
            >
              <ToggleButton value="customer">Shop</ToggleButton>
              <ToggleButton value="vendor">Sell products</ToggleButton>
            </ToggleButtonGroup>
          )}
        />

        <Button fullWidth type="submit" variant="contained" size="large" sx={{ mt: 3 }} disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Sign up'}
        </Button>
      </Box>
      <Typography variant="body2" sx={{ mt: 2 }}>
        Already have an account? <MuiLink href="/login">Log in</MuiLink>
      </Typography>
    </Container>
  );
}
