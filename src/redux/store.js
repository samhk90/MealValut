import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // Defaults to localStorage for web
import authReducer from './features/authSlice';
import settingsReducer from './features/settingSlice';
import menuReducer from './features/menuSlice';
import tableReducer from './features/tableSlice';
import orderReducer from './features/orderSlice';
import storeReducer from './features/storeSlice';
import {
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';

// Update persist configuration to include 'store' in whitelist
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'store'], // Add 'store' to persist store data
};

// Combine reducers
const rootReducer = combineReducers({
  auth: authReducer,
  settings: settingsReducer,
  menu: menuReducer,
  table: tableReducer,
  orders: orderReducer, // Changed from 'order' to 'orders' to match slice name
  store: storeReducer,
});

// Wrap root reducer with persistReducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store with middleware to ignore non-serializable warnings
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

// Create persistor
export const persistor = persistStore(store);
