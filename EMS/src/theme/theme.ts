import {
  MD3DarkTheme,
  MD3LightTheme,
  type MD3Theme,
  adaptNavigationTheme,
} from 'react-native-paper';
import {
  DarkTheme as NavDarkTheme,
  DefaultTheme as NavLightTheme,
  type Theme as NavTheme,
} from '@react-navigation/native';

export type AppTheme = {
  paper: MD3Theme;
  navigation: NavTheme;
};

const { LightTheme: NavPaperLight, DarkTheme: NavPaperDark } = adaptNavigationTheme({
  reactNavigationLight: NavLightTheme,
  reactNavigationDark: NavDarkTheme,
});

export const lightTheme: AppTheme = {
  paper: {
    ...MD3LightTheme,
    colors: {
      ...MD3LightTheme.colors,
      primary: '#2563EB',
      secondary: '#0EA5E9',
    },
  },
  navigation: {
    ...NavPaperLight,
    colors: {
      ...NavPaperLight.colors,
      primary: '#2563EB',
    },
  },
};

export const darkTheme: AppTheme = {
  paper: {
    ...MD3DarkTheme,
    colors: {
      ...MD3DarkTheme.colors,
      primary: '#60A5FA',
      secondary: '#38BDF8',
    },
  },
  navigation: {
    ...NavPaperDark,
    colors: {
      ...NavPaperDark.colors,
      primary: '#60A5FA',
    },
  },
};

