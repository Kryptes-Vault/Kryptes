import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FileText, Key, CreditCard, QrCode, Settings } from 'lucide-react-native';

// Screens
import VaultScreen from '../screens/VaultScreen';
import PasswordsScreen from '../screens/PasswordsScreen';
import CardsScreen from '../screens/CardsScreen';
import ScanScreen from '../screens/ScanScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

/**
 * Custom Icon Wrapper to match the "Premium" design in the reference image.
 * When active, it shows a rounded orange background.
 */
const TabIcon = ({ icon: Icon, color, focused }: { icon: any, color: string, focused: boolean }) => (
  <View style={[
    styles.iconContainer,
    focused && styles.activeIconContainer
  ]}>
    <Icon size={24} color={focused ? '#fff' : color} />
  </View>
);

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarShowLabel: false, // NO NAMES, ONLY SYMBOLS
        tabBarActiveTintColor: '#FF3B13',
        tabBarInactiveTintColor: '#A0A0A0',
        tabBarStyle: styles.tabBar,
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
      }}
    >
      <Tab.Screen 
        name="Vault" 
        component={VaultScreen} 
        options={{
          tabBarIcon: (props) => <TabIcon icon={FileText} {...props} />,
          headerTitle: 'DOCUMENTS',
        }}
      />
      <Tab.Screen 
        name="Passwords" 
        component={PasswordsScreen} 
        options={{
          tabBarIcon: (props) => <TabIcon icon={Key} {...props} />,
          headerTitle: 'PASSWORDS',
        }}
      />
      <Tab.Screen 
        name="Cards" 
        component={CardsScreen} 
        options={{
          tabBarIcon: (props) => <TabIcon icon={CreditCard} {...props} />,
          headerTitle: 'PAYMENTS',
        }}
      />
      <Tab.Screen 
        name="Scan" 
        component={ScanScreen} 
        options={{
          tabBarIcon: (props) => <TabIcon icon={QrCode} {...props} />,
          headerTitle: 'SCANNER',
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{
          tabBarIcon: (props) => <TabIcon icon={Settings} {...props} />,
          headerTitle: 'SETTINGS',
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: '#EBEBEB',
    height: 80,
    paddingBottom: 25,
    paddingTop: 10,
    elevation: 0,
    shadowOpacity: 0,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconContainer: {
    backgroundColor: '#FF3B13', // Matches the orange button in the image
    shadowColor: '#FF3B13',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    backgroundColor: '#fff',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 2.5,
  },
});
