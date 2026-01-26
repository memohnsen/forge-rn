import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
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
