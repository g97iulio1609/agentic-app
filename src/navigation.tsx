/**
 * Navigation configuration – React Navigation stack.
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from './screens/HomeScreen';
import { SessionDetailScreen } from './screens/SessionDetailScreen';
import { AddServerScreen } from './screens/AddServerScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { ACPServerConfiguration } from './acp/models/types';
import { Colors } from './utils/theme';

export type RootStackParamList = {
  Home: undefined;
  Session: undefined;
  AddServer: { editingServer?: ACPServerConfiguration } | undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.primary,
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={({ navigation }) => ({
            title: 'Agmente',
            headerRight: () => (
              <TouchableOpacity
                onPress={() => navigation.navigate('Settings')}
                style={styles.headerButton}
              >
                <Text style={styles.headerButtonText}>⚙️</Text>
              </TouchableOpacity>
            ),
          })}
        />
        <Stack.Screen
          name="Session"
          component={SessionDetailScreen}
          options={{
            title: 'Chat',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="AddServer"
          component={AddServerScreen}
          options={{
            title: 'Add Server',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: 'Settings',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    padding: 4,
  },
  headerButtonText: {
    fontSize: 20,
  },
});
