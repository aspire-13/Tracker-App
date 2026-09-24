import type { ReactNode } from 'react';
import { AppStoreProvider, useStore } from './state/AppStore';
import { type Route, useRoute } from './router';
import { useTheme } from './theme';
import { Layout } from './components/Layout';
import { TodayScreen } from './screens/TodayScreen';
import { HabitsScreen } from './screens/HabitsScreen';
import { HabitFormScreen } from './screens/HabitFormScreen';
import { HabitDetailScreen } from './screens/HabitDetailScreen';
import { StatsScreen } from './screens/StatsScreen';
import { SettingsScreen } from './screens/SettingsScreen';

function renderScreen(route: Route): ReactNode {
  switch (route.name) {
    case 'today':
      return <TodayScreen />;
    case 'habits':
      return <HabitsScreen />;
    case 'habitNew':
      return <HabitFormScreen key="new" />;
    case 'habitEdit':
      return <HabitFormScreen key={route.id} id={route.id} />;
    case 'habitDetail':
      return <HabitDetailScreen key={route.id} id={route.id} />;
    case 'stats':
      return <StatsScreen />;
    case 'settings':
      return <SettingsScreen />;
  }
}

function Screens() {
  const route = useRoute();
  const { data } = useStore();
  useTheme(data.settings.theme);
  return <Layout route={route}>{renderScreen(route)}</Layout>;
}

export default function App() {
  return (
    <AppStoreProvider>
      <Screens />
    </AppStoreProvider>
  );
}
