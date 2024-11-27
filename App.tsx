import { useAssets } from 'expo-asset';
import { useEffect, useState } from "react";
import { I18nManager, StatusBar } from 'react-native';
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { EventProvider } from 'react-native-outside-press';
import Toast, { ErrorToast } from 'react-native-toast-message';
import TrackPlayer, { AppKilledPlaybackBehavior, Capability } from 'react-native-track-player';
import LoadingPage from "./components/LoadingPage";
import useCheckConnection from "./hooks/useCheckConnection";
import Navigation from "./Navigation";
import { PlaybackService } from "./service";
import { useRemotePlayBack } from "./socketContext";
import * as Updates from 'expo-updates';

function App() {
  const [error, setError] = useState(false);
  const setRemotePlayBack = useRemotePlayBack(state => state.setRemotePlayBack);

  I18nManager.forceRTL(false);
  I18nManager.allowRTL(false);

  useCheckConnection(setError);

  async function onFetchUpdateAsync() {
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        Toast.show({
          type: 'info',
          text1: 'Download New Version Mirzagram ;)',
          autoHide: false
        });
        await Updates.fetchUpdateAsync();
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error fetching latest Expo update',
        autoHide: false,
      });
      console.log(`Error fetching latest Expo update: ${error}`);
    }
  };

  const setupPlayer = async () => {
    try {
      await TrackPlayer.setupPlayer();
      await TrackPlayer.updateOptions({
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
          Capability.SeekTo
        ],
        compactCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
          Capability.SeekTo
        ],
        notificationCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
          Capability.SeekTo
        ],
        android: {
          appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback
        },
      });
    } catch (error) { console.log(error); }
  };

  useEffect(() => {
    onFetchUpdateAsync();
    setupPlayer();
    TrackPlayer.registerPlaybackService(() => () => PlaybackService({ setRemotePlayBack }));
  }, []);

  const toastConfig = {
    error: (props: any) => (
      <ErrorToast
        {...props}
        text1Style={{
          fontSize: 17
        }}
        text2Style={{
          fontSize: 15
        }}
      />
    )
  };
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <EventProvider>
        <StatusBar backgroundColor={error?'red':'#000'} />
        <Navigation />
        <Toast config={toastConfig} />
      </EventProvider>
    </GestureHandlerRootView>
  );
}

function Main() {
  const [assets] = useAssets([
    require('./assets/mirza64.png'),
    require('./assets/mirza96.png'),
    require('./assets/mirza128.png'),
    require('./assets/mirza256.png')
  ]);

  if (!assets) {
    return <LoadingPage />
  }
  return <App />
}

export default Main;