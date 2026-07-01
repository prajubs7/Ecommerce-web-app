import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import authReducer from './authSlice';
import cartReducer from './cartSlice';
import uiReducer from './uiSlice';

// Manual localStorage adapter — avoids redux-persist/lib/storage import
// resolution issues with Vite's ESM/CJS interop.
const storage = {
  getItem(key: string): Promise<string | null> {
    return Promise.resolve(window.localStorage.getItem(key));
  },
  setItem(key: string, value: string): Promise<void> {
    window.localStorage.setItem(key, value);
    return Promise.resolve();
  },
  removeItem(key: string): Promise<void> {
    window.localStorage.removeItem(key);
    return Promise.resolve();
  },
};

// Only persist the cart — auth session is re-derived from Supabase on load,
// and UI state (filters, drawers) should reset on refresh.
const cartPersistConfig = {
  key: 'cart',
  storage,
};

const rootReducer = combineReducers({
  auth: authReducer,
  cart: persistReducer(cartPersistConfig, cartReducer),
  ui: uiReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;