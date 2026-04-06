import React, { createContext, useContext, useState, ReactNode } from 'react';

type ThemeContextType = {
  dark: boolean;
  toggle: () => void;
  colors: {
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
    inputBg: string;
    statCardBg: string;
  };
};

const light = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: '#111827',
  textSecondary: '#64748B',
  border: '#F1F5F9',
  primary: '#1E63D3',
  inputBg: '#FFFFFF',
  statCardBg: '#FFFFFF',
};

const darkTheme = {
  background: '#0F172A',
  card: '#1E293B',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  border: '#334155',
  primary: '#3B82F6',
  inputBg: '#1E293B',
  statCardBg: '#1E293B',
};

const ThemeContext = createContext<ThemeContextType>({
  dark: false,
  toggle: () => {},
  colors: light,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);
  const toggle = () => setDark(prev => !prev);
  const colors = dark ? darkTheme : light;

  return (
    <ThemeContext.Provider value={{ dark, toggle, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
