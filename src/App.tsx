import { AppStoreProvider, useStore } from './state/AppStore';
import { useRoute } from './router';
import { useTheme } from './theme';
import { Layout } from './components/Layout';
import { TodayScreen } from './screens/TodayScreen';

function Screens() {
  const route = useRoute();
  const { data } = useStore();
  useTheme(data.settings.theme);

  let screen;
  switch (route.name) {
    case 'today':
      screen = <TodayScreen />;
      break;
    default:
      screen = <p className="py-12 text-center text-slate-500">Раздел в разработке</p>;
  }
  return <Layout route={route}>{screen}</Layout>;
}

export default function App() {
  return (
    <AppStoreProvider>
      <Screens />
    </AppStoreProvider>
  );
}
