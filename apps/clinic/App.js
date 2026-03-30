import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';

const App = () => {
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <WebView
          source={{ uri: 'file:///android_asset/index.html' }}
          style={{ flex: 1 }}
        />
      </SafeAreaView>
    </>
  );
};

export default App;