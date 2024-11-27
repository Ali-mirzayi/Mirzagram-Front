import TrackPlayer, { Capability, Event, RepeatMode } from 'react-native-track-player';
import { setupPlayer } from 'react-native-track-player/lib/src/trackPlayer';

export const PlaybackService = async function () {
    try {
        TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
        TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
        // TrackPlayer.addEventListener(Event.RemoteSkip, () => TrackPlayer.skip());
        TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
        TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());
        TrackPlayer.addEventListener(Event.RemoteSeek, (event) => {
            console.log('Event.RemoteSeek', event);
            TrackPlayer.seekTo(event.position);
          });
        TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop());
    }catch(err){
        console.log(err,'error registering TrackPlayer')
    }
};

export const SetupService = async () => {
    await setupPlayer({
      autoHandleInterruptions: true,
    });
    await TrackPlayer.updateOptions({
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
      ],
      progressUpdateEventInterval: 2,
    });
    // await TrackPlayer.setRepeatMode(RepeatMode.Off);
  };