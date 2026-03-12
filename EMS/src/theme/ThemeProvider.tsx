import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme, type AppTheme } from './theme';

const KEY = 'ems.theme.v1'; // 'light' | 'dark' | 'system'

type ThemeMode = 'light' | 'dark' | 'system';

type ThemeCtx = {
  mode: ThemeMode;
  theme: AppTheme;
  setMode: (m: ThemeMode) => void;
};

const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (v === 'light' || v === 'dark' || v === 'system') setModeState(v);
    });
  }, []);

  const theme = useMemo(() => {
    const effective = mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;
    return effective === 'dark' ? darkTheme : lightTheme;
  }, [mode, system]);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(KEY, m).catch(() => {});
  };

  const value = useMemo<ThemeCtx>(() => ({ mode, theme, setMode }), [mode, theme]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppTheme() {
  const v = useContext(Ctx);
  if (!v) throw new Error('ThemeProvider missing');
  return v;
}

