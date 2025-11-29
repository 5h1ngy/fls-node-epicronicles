import { configureStore } from '@reduxjs/toolkit';
import { gameReducer } from '@store/slice/gameSlice';

export const store = configureStore({
  reducer: {
    game: gameReducer,
  },
  devTools: import.meta.env.DEV,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
