import { AppBar, Toolbar, Typography, Button, Badge, IconButton } from '@mui/material';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setCartDrawerOpen } from '../store/uiSlice';
import { signOut } from '../api/auth';

export default function Navbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { userId, profile } = useAppSelector((state) => state.auth);
  const cartCount = useAppSelector((state) => state.cart.items.reduce((n, i) => n + i.quantity, 0));

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <AppBar position="sticky" color="default" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
      <Toolbar sx={{ gap: 2 }}>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{ textDecoration: 'none', color: 'primary.main', fontWeight: 700, flexGrow: 1 }}
        >
          Marketplace
        </Typography>

        {profile?.role === 'vendor' && (
          <Button component={RouterLink} to="/vendor">Vendor dashboard</Button>
        )}
        {profile?.role === 'admin' && (
          <Button component={RouterLink} to="/admin">Admin</Button>
        )}
        {userId && (
          <Button component={RouterLink} to="/orders">Orders</Button>
        )}

        <IconButton onClick={() => dispatch(setCartDrawerOpen(true))}>
          <Badge badgeContent={cartCount} color="secondary">
            <ShoppingCartOutlinedIcon />
          </Badge>
        </IconButton>

        {userId ? (
          <Button onClick={handleSignOut}>Log out</Button>
        ) : (
          <>
            <Button component={RouterLink} to="/login">Log in</Button>
            <Button component={RouterLink} to="/signup" variant="contained">Sign up</Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
