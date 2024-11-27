import { useIsOpen, useMessage, usePlayer } from '../socketContext';
import { audioListType, useAudioList } from './useAudioList';
import { Audio } from 'expo-av';
import TrackPlayer, { useProgress } from 'react-native-track-player';

function useAudioPlayer() {
    const { player, setPlayer } = usePlayer();
    const AudioList = useAudioList();
    const filteredAudioList = AudioList.filter(audio => (audio.audioName !== "voice" && audio.audioName !== "unknown"));
    const setMessages = useMessage(state => state.setMessages);
    const track = AudioList.find(audio => audio.id === player?.id);
    const setIsOpen = useIsOpen(state => state.setOpen);
    const { position } = useProgress();

    const stopPlaying = async ({ isForStart, isEnded }: { isForStart: boolean, isEnded: boolean }) => {
        const { position } = await TrackPlayer.getProgress();
        const lastPosition = isEnded ? undefined : position;
        await TrackPlayer.pause();

        setPlayer((e) => {
            return { uri: undefined, track: undefined, name: undefined, id: e?.id, uuid: undefined, duration: undefined, lastPosition, playing: isForStart ? true : false, artist: undefined, artwork: undefined };
        });

        setMessages(e =>
            e.map((item) =>
                item._id === player?.id ? { ...item, playing: false } : item
            )
        );
    };

    const startPlaying = async () => {
        if (!track?.uri) return;

        if (player?.lastPosition) {
            await TrackPlayer.seekTo(player?.lastPosition);
            await TrackPlayer.play();
        } else {
            await TrackPlayer.play();
        };

        setPlayer((e) => {
            return { ...e, uri: track?.uri, id: track?.id };
        });

        const { sound: newSound, status } = await Audio.Sound.createAsync(
            { uri: track.uri },
            { shouldPlay: false }
        );

        setPlayer((e) => {
            //@ts-ignore
            return { ...e, name: track.audioName, uuid: track.id, duration: status?.durationMillis / 1000, playing: true, artist: track.artist, artwork: track.artwork }
        });

        setMessages(e =>
            e.map((item) =>
                item._id === track.id ? { ...item, playing: true } : item
            )
        );

        await newSound.unloadAsync();
    };

    const startPlayingByItem = async ({ item, isMessage }: { item: audioListType, isMessage?: boolean }) => {
        if (!item?.uri) return;
        // this is for if startPlayingByItem called from messaging open floatingMusicPlayer
        if (isMessage) setIsOpen(true);

        await stopPlaying({ isForStart: true, isEnded: false });

        const { sound: newSound, status } = await Audio.Sound.createAsync(
            { uri: item.uri },
            { shouldPlay: false }
        );

        await TrackPlayer.setQueue([{
            url: item.uri,
            id: item.id,
            artist: item.artist,
            artwork: item.artwork,
            title: item.audioName,
            //@ts-ignore
            duration: status.durationMillis / 1000
        }]);

        if (player?.lastPosition) {
            await TrackPlayer.seekTo(player?.lastPosition);
            await TrackPlayer.play();
        } else {
            await TrackPlayer.play();
        };

        setPlayer(() => {
            //@ts-ignore
            return { name: item.audioName, uri: item.uri, uuid: item.id, duration: status?.durationMillis / 1000, id: item.id, artist: item.artist, artwork: item.artwork, playing: true }
        });

        setMessages(e =>
            e.map((m) =>
                m._id === item.id ? { ...m, playing: true } : m
            )
        );

        await newSound.unloadAsync();
    };

    const startPlyingList = async ({ indexJump }: { indexJump: number }) => {
        const currentTrackIndex = filteredAudioList.findIndex(audio => audio.id === player?.id);

        if (currentTrackIndex === -1) return;
        const forwardTrack = filteredAudioList.length === currentTrackIndex + indexJump ? filteredAudioList[0] : filteredAudioList[currentTrackIndex + indexJump];
        setPlayer((e) => {
            return { ...e, uri: forwardTrack.uri, id: forwardTrack.id };
        });

        await stopPlaying({ isEnded: false, isForStart: true });

        const { sound: newSound, status } = await Audio.Sound.createAsync(
            { uri: forwardTrack.uri },
            { isLooping: false, progressUpdateIntervalMillis: 1000, shouldPlay: false }
        );

        await TrackPlayer.setQueue([{
            url: forwardTrack.uri,
            id: forwardTrack.id,
            artist: forwardTrack.artist,
            artwork: forwardTrack.artwork,
            title: forwardTrack.audioName,
            //@ts-ignore
            duration: status.durationMillis / 1000
        }]);

        await TrackPlayer.play();

        setPlayer(() => {
            //@ts-ignore
            return { name: forwardTrack.audioName, uri: forwardTrack.uri, uuid: forwardTrack.id, duration: status?.durationMillis / 1000, id: forwardTrack.id, artist: forwardTrack.artist, artwork: forwardTrack.artwork, playing: true }
        });

        setMessages(e =>
            e.map((item) =>
                item._id === forwardTrack.id ? { ...item, playing: true } : item
            )
        );

        await newSound.unloadAsync();
    };

    const shufflePlayList = async () => {
        const currentTrackIndex = filteredAudioList.findIndex(audio => audio.id === player?.id);
        if (currentTrackIndex === -1) return;
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * filteredAudioList.length);
        } while (randomIndex === currentTrackIndex);
        const forwardTrack = filteredAudioList[randomIndex];
        setPlayer((e) => {
            return { ...e, uri: forwardTrack.uri, id: forwardTrack.id };
        });
        await stopPlaying({ isEnded: false, isForStart: true });

        const { sound: newSound, status } = await Audio.Sound.createAsync(
            { uri: forwardTrack.uri },
            { shouldPlay: false }
        );

        await TrackPlayer.setQueue([{
            url: forwardTrack.uri,
            id: forwardTrack.id,
            artist: forwardTrack.artist,
            artwork: forwardTrack.artwork,
            title: forwardTrack.audioName,
            //@ts-ignore
            duration: status.durationMillis / 1000
        }]);

        await TrackPlayer.play();

        setPlayer(() => {
            //@ts-ignore
            return { track: newSound, name: forwardTrack.audioName, uri: forwardTrack.uri, uuid: forwardTrack.id, duration: status?.durationMillis / 1000, id: forwardTrack.id, artist: forwardTrack.artist, artwork: forwardTrack.artwork, playing: true }
        });

        setMessages(e =>
            e.map((item) =>
                item._id === forwardTrack.id ? { ...item, playing: true } : item
            )
        );
        await newSound.unloadAsync();
    };

    const playForward = async ({ indexJump }: { indexJump: 1 | -1 }) => {
        const currentTrackIndex = filteredAudioList.findIndex(audio => audio.id === player?.id);
        if (currentTrackIndex === -1) return;

        if (indexJump === -1 && position >= 2) {
            TrackPlayer.seekTo(0);
            return;
        }

        const forwardTrack = filteredAudioList.length === currentTrackIndex + indexJump ? filteredAudioList[0] : filteredAudioList[currentTrackIndex + indexJump];

        await stopPlaying({ isForStart: true, isEnded: false });

        const { sound: newSound, status } = await Audio.Sound.createAsync(
            { uri: forwardTrack.uri },
            { shouldPlay: false }
        );

        await TrackPlayer.setQueue([{
            url: forwardTrack.uri,
            id: forwardTrack.id,
            artist: forwardTrack.artist,
            artwork: forwardTrack.artwork,
            title: forwardTrack.audioName,
            //@ts-ignore
            duration: status.durationMillis / 1000
        }]);

        await TrackPlayer.play();

        setPlayer(() => {
            //@ts-ignore
            return { track: newSound, name: forwardTrack.audioName, uri: forwardTrack.uri, uuid: forwardTrack.id, duration: status?.durationMillis / 1000, id: forwardTrack.id, artist: forwardTrack.artist, artwork: forwardTrack.artwork, playing: true }
        });

        setMessages(e =>
            e.map((item) =>
                item._id === forwardTrack.id ? { ...item, playing: true } : item
            )
        );
        await newSound.unloadAsync();
    };

    return { startPlaying, startPlayingByItem, startPlyingList, stopPlaying, shufflePlayList, playForward }
}

export default useAudioPlayer;