import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './src/screens/HomeScreen';
import ArticleDetailScreen from './src/screens/ArticleDetailScreen';
import ArchiveScreen from './src/screens/ArchiveScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#e42c29',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="ArticleDetail" 
          component={ArticleDetailScreen}
          options={{
            title: 'Article',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen 
          name="Archive" 
          component={ArchiveScreen}
          options={{
            title: 'Archive',
            headerBackTitle: 'Back',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
