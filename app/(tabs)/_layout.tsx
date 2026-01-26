import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs } from 'expo-router';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';
import { Platform } from 'react-native';
import { colors } from '@/constants/colors';

export default function TabLayout() {
  if (Platform.OS === 'android') {
    return (
      <Tabs
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.blueEnergy,
          tabBarInactiveTintColor: '#999',
          tabBarStyle: { backgroundColor: '#0F0F0F', borderTopColor: '#1A1A1A' },
          tabBarIcon: ({ color, size }) => {
            const iconName =
              route.name === 'index'
                ? 'home-variant'
                : route.name === 'exercises'
                  ? 'brain'
                  : route.name === 'trends'
                    ? 'chart-bar'
                    : 'cog';
            return <MaterialCommunityIcons name={iconName} size={size ?? 22} color={color} />;
          },
        })}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="exercises" options={{ title: 'Exercises' }} />
        <Tabs.Screen name="trends" options={{ title: 'Trends' }} />
        <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      </Tabs>
    );
  }

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon
          sf={{ default: 'house', selected: 'house.fill' }}
          androidSrc={<VectorIcon family={MaterialCommunityIcons} name="home-variant" />}
        />
        <Label hidden>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="exercises">
        <Icon
          sf={{ default: 'brain.head.profile', selected: 'brain.head.profile' }}
          androidSrc={<VectorIcon family={MaterialCommunityIcons} name="brain" />}
        />
        <Label hidden>Exercises</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="trends">
        <Icon
          sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }}
          androidSrc={<VectorIcon family={MaterialCommunityIcons} name="chart-bar" />}
        />
        <Label hidden>Trends</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <Icon
          sf={{ default: 'gearshape', selected: 'gearshape.fill' }}
          androidSrc={<VectorIcon family={MaterialCommunityIcons} name="cog" />}
        />
        <Label hidden>Settings</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
