import { View, Text, StyleSheet, TouchableOpacity, TouchableHighlight } from 'react-native';
import React, { useEffect } from 'react';
import { useIsOpen, useLastTrack, usePlayer, useRemotePlayBack } from '../socketContext';
import useTheme from '../utils/theme';
import Ionicons from "@expo/vector-icons/Ionicons";
import { formatMillisecondsToTime } from '../utils/utils';
import { useNavigation } from '@react-navigation/native';
import { storage } from '../mmkv';
import { remotePlayBackEnum, repeatModeEnum } from '../utils/types';
import MovingText from './MovingText';
import useAudioPlayer from '../hooks/useAudioPlayer';
import TrackPlayer, { State, usePlaybackState, useProgress } from 'react-native-track-player';

const FloatingMusicPlayer = () => {
    const { colors } = useTheme();
    const { player, setPlayer } = usePlayer();
    const { navigate } = useNavigation();
    const { lastTrack, setLastTrack } = useLastTrack();
    const setOpen = useIsOpen(state => state.setOpen);
    const { startPlaying, startPlyingList, stopPlaying, shufflePlayList, playForward } = useAudioPlayer();
    const { position } = useProgress();
    const remotePlayBack = useRemotePlayBack(state => state.remotePlayBack);

    const { state } = usePlaybackState();

    const handleClose = async () => {
        await stopPlaying({ isEnded: true, isForStart: false });
        setOpen(false);
    };

    useEffect(() => {
        if (!player?.playing) return;
        setOpen(true);
        setLastTrack((e) => {
            //@ts-ignore
            return { ...e, name: player?.name, id: player?.id, duration: player?.duration, artist: player.artist, artwork: player.artwork };
        });
    }, [player?.uuid]);

    useEffect(() => {
        (async () => {
            if (state !== State.Ended) return;
            switch (storage.getNumber('repeatMode')) {
                case repeatModeEnum.disabledRepeat:
                    stopPlaying({ isEnded: true, isForStart: false });
                    break;
                case repeatModeEnum.repeatTrack:
                    await TrackPlayer.seekTo(0);
                    break;
                case repeatModeEnum.repeatList:
                    startPlyingList({ indexJump: 1 });
                    break;
                case repeatModeEnum.suffleList:
                    shufflePlayList();
                    break;
                default:
                    stopPlaying({ isEnded: true, isForStart: false });
                    break;
            }
        }
        )()
    }, [state]);

    useEffect(() => {
        if (remotePlayBack === undefined) return;
        (async () => {
            switch (remotePlayBack.state) {
                case remotePlayBackEnum.play:
                    startPlaying();
                    break;
                case remotePlayBackEnum.pause:
                    stopPlaying({ isEnded: false, isForStart: false });
                    break;
                case remotePlayBackEnum.next:
                    playForward({ indexJump: 1 });
                    break;
                case remotePlayBackEnum.previous:
                    playForward({ indexJump: -1 });
                    break;
                case remotePlayBackEnum.seekto:
                    if(remotePlayBack.position===undefined) break;
                    setPlayer((e) => {
                        return { ...e, lastPosition: remotePlayBack.position };
                    });
                    await TrackPlayer.seekTo(remotePlayBack.position);
                    break;
                default:
                    stopPlaying({ isEnded: false, isForStart: false });
                    break;
            }
        })();
    }, [remotePlayBack]);

    const currentPositionTime = position ? formatMillisecondsToTime(position) : '00:00';

    return (
        //@ts-ignore
        <TouchableOpacity onPress={() => navigate('ModalMusic')} style={[styles.container, { backgroundColor: colors.card, borderColor: colors.primary }]}>
            <View style={styles.innerContainer}>
                <TouchableHighlight onPress={player?.playing ? () => stopPlaying({ isEnded: false, isForStart: false }) : startPlaying} style={[styles.iconContainer, { backgroundColor: colors.undetlay }]}>
                    <Ionicons name={player?.playing ? "pause" : "play"} size={20} color="#fff" style={{ marginLeft: player?.playing ? 0 : 2 }} />
                </TouchableHighlight>
                <View style={styles.containerMovingText}>
                    <MovingText animationThreshold={35} style={{ color: colors.text, size: 10, paddingLeft: 0, marginRight: 0, paddingRight: 0 }} disable={!player?.playing && Number(lastTrack?.name?.length) >= 50}>{lastTrack.name ?? ""}</MovingText>
                </View>
                <View style={styles.close}>
                    <Text style={{ color: colors.text, fontFamily: "Vazirmatn-SemiBold" }}>{currentPositionTime}</Text>
                    <Ionicons onPress={handleClose} name='close-circle' size={28} color={colors.red} />
                </View>
            </View>
        </TouchableOpacity>
    );
}

export default FloatingMusicPlayer;

const styles = StyleSheet.create({
    container: {
        height: 40,
        borderRadius: 4,
    },
    innerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: '100%',
        width: 'auto',
        justifyContent: 'flex-start',
    },
    iconContainer: {
        width: 30,
        backgroundColor: '#000',
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 50,
        marginHorizontal: 10
    },
    containerMovingText: {
        overflow: 'hidden',
        flex: 1,
        paddingHorizontal: 5
    },
    close: {
        marginHorizontal: 7,
        width: 70,
        flexDirection: 'row',
        alignItems: 'center',
        height: 30,
        gap: 10,
    }
});