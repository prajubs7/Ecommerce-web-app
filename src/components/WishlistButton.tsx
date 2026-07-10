import { memo, useCallback } from 'react';
import { IconButton, Tooltip, CircularProgress } from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { useIsWishlisted, useToggleWishlist } from '../hooks/useWishlist';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface WishlistButtonProps {
  productId: string;
  size?:     'small' | 'medium' | 'large';
}

const WishlistButton = memo(function WishlistButton({
  productId,
  size = 'small',
}: WishlistButtonProps) {
  const { isLoggedIn } = useAuth();
  const navigate        = useNavigate();
  const isWishlisted    = useIsWishlisted(productId);
  const toggleWishlist  = useToggleWishlist();

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Stop event from bubbling to ProductCard's onClick (navigate to detail)
      e.stopPropagation();

      // If not logged in, redirect to login
      if (!isLoggedIn) {
        navigate('/login');
        return;
      }

      // Fire the optimistic mutation
      // UI updates BEFORE this promise resolves
      toggleWishlist.mutate({
        productId,
        isCurrentlyWishlisted: isWishlisted,
      });
    },
    [isLoggedIn, navigate, toggleWishlist, productId, isWishlisted]
  );

  // Show spinner briefly during API call
  // Note: the icon already changed optimistically — spinner is subtle feedback
  if (toggleWishlist.isPending) {
    return (
      <CircularProgress
        size={size === 'small' ? 16 : 20}
        sx={{ color: 'error.main', m: 0.5 }}
      />
    );
  }

  return (
    <Tooltip title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}>
      <IconButton
        size={size}
        onClick={handleClick}
        sx={{
          color: isWishlisted ? 'error.main' : 'action.disabled',
          transition: 'color 0.15s ease, transform 0.15s ease',
          '&:hover': {
            color:     'error.main',
            transform: 'scale(1.2)',
          },
        }}
      >
        {isWishlisted
          ? <Favorite fontSize={size} />
          : <FavoriteBorder fontSize={size} />
        }
      </IconButton>
    </Tooltip>
  );
});

export default WishlistButton;