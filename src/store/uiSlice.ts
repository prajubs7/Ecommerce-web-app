import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  cartDrawerOpen: boolean;
  productFilters: {
    categoryId: string | null;
    searchQuery: string;
    sortBy: 'newest' | 'price_asc' | 'price_desc';
  };
}

const initialState: UIState = {
  cartDrawerOpen: false,
  productFilters: {
    categoryId: null,
    searchQuery: '',
    sortBy: 'newest',
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setCartDrawerOpen(state, action: PayloadAction<boolean>) {
      state.cartDrawerOpen = action.payload;
    },
    setCategoryFilter(state, action: PayloadAction<string | null>) {
      state.productFilters.categoryId = action.payload;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.productFilters.searchQuery = action.payload;
    },
    setSortBy(state, action: PayloadAction<UIState['productFilters']['sortBy']>) {
      state.productFilters.sortBy = action.payload;
    },
  },
});

export const { setCartDrawerOpen, setCategoryFilter, setSearchQuery, setSortBy } =
  uiSlice.actions;
export default uiSlice.reducer;
