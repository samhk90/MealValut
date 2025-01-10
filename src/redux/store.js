import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // Defaults to localStorage for web
import authReducer from './features/authSlice';
import settingsReducer from './features/settingSlice';
import menuReducer from './features/menuSlice';
import tableReducer from './features/tableSlice';
import orderReducer from './features/orderSlice';
import {
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';

// Define persist configuration
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'], // Specify which reducers should be persisted
};

// Combine reducers
const rootReducer = combineReducers({
  auth: authReducer,
  settings: settingsReducer,
  menu: menuReducer,
  table: tableReducer,
  order: orderReducer,
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
