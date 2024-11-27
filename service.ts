import TrackPlayer from 'react-native-track-player';
import { Event } from 'react-native-track-player';
import { remotePlayBackEnum } from './utils/types';

export const PlaybackService = async function ({ setRemotePlayBack }: { setRemotePlayBack: (e: { state: remotePlayBackEnum; position?: number | undefined; } | undefined) => void }) {
    TrackPlayer.addEventListener(Event.RemotePlay, () => setRemotePlayBack({state:remotePlayBackEnum.play}));
    TrackPlayer.addEventListener(Event.RemotePause, () => setRemotePlayBack({state:remotePlayBackEnum.pause}));
    TrackPlayer.addEventListener(Event.RemoteNext, () => setRemotePlayBack({state:remotePlayBackEnum.next}));
    TrackPlayer.addEventListener(Event.RemotePrevious, () => setRemotePlayBack({state:remotePlayBackEnum.previous}));
    TrackPlayer.addEventListener(Event.RemoteSeek, (event) => setRemotePlayBack({state:remotePlayBackEnum.seekto,position:event.position}));
};
