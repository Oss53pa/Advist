import { Stack } from 'expo-router';
import { colors } from '@/theme';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="profile"
        options={{ title: 'Informations personnelles' }}
      />
      <Stack.Screen
        name="security"
        options={{ title: 'Securite' }}
      />
      <Stack.Screen
        name="signatures"
        options={{ title: 'Mes signatures' }}
      />
      <Stack.Screen
        name="notifications"
        options={{ title: 'Notifications' }}
      />
      <Stack.Screen
        name="language"
        options={{ title: 'Langue' }}
      />
      <Stack.Screen
        name="appearance"
        options={{ title: 'Apparence' }}
      />
    </Stack>
  );
}
