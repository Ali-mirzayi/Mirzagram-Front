import { View, Text, StyleSheet, TouchableHighlight, FlatList, Pressable, TextInput, Image } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { useCurrentContact, useLastTrack, usePlayer } from '../socketContext';
import Slider from '@react-native-community/slider';
import { formatMillisecondsToTime } from '../utils/utils';
import { audioListType, useAudioList } from '../hooks/useAudioList';
import Ionicons from "@expo/vector-icons/Ionicons";
import useTheme from '../utils/theme';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { storage } from '../mmkv';
import { repeatModeEnum } from '../utils/types';
import useAudioPlayer from '../hooks/useAudioPlayer';
import { BlurView } from 'expo-blur';
import TrackPlayer, { useProgress } from 'react-native-track-player';

const ModalMusic = () => {
  const player = usePlayer(state => state.player);
  const setPlayer = usePlayer(state => state.setPlayer);
  const { lastTrack, setLastTrack } = useLastTrack();
  const isPlaying = player?.playing;
  const { colors } = useTheme();
  const contact = useCurrentContact(state => state.contact);
  const navigation = useNavigation();
  const [openSearch, setOpenSearch] = useState(false);
  const [search, setSearch] = useState<audioListType[]>();
  const [repeatMode, setRepeatMode] = useState<repeatModeEnum | undefined>(storage.getNumber('repeatMode'));
  const searchInput = useRef<TextInput>(null);
  const [showArtwork, setShowArtwork] = useState(false);
  const { position, duration } = useProgress();

  const AudioList = useAudioList();
  const filteredAudioList = AudioList.filter(audio => (audio.audioName !== "voice" && audio.audioName !== "unknown"));

  const { startPlaying, startPlayingByItem, stopPlaying, playForward } = useAudioPlayer();

  const time = lastTrack?.duration ? formatMillisecondsToTime(lastTrack?.duration) : 'unknown';

  const currentPositionTime = position ? `${formatMillisecondsToTime(position)}` : player?.lastPosition ? `${formatMillisecondsToTime(player?.lastPosition)}` : '00:00';


  const handleSearch = (e: string) => {
    const res = filteredAudioList.filter(track => track.audioName.toLowerCase().includes(e.toLowerCase()));
    if (e === "" || e === undefined || res.length === 0) { setSearch(undefined) }
    setSearch(res);
    searchInput.current?.blur();
  };

  const renderTrackItem = ({ item }: { item: audioListType }) => {
    const isTrackPlaying = (item?.id === player?.id) ? player.playing : false;

    return (
      <TouchableHighlight underlayColor={colors.undetlay} onPress={isTrackPlaying ? () => stopPlaying({ isForStart: false, isEnded: false }) : () => startPlayingByItem({ item })} style={{ marginBottom: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={[styles.iconContainer, { backgroundColor: "#415266", width: 43, height: 43, paddingLeft: isTrackPlaying ? 0 : 2 }]}>
            <Ionicons name={isTrackPlaying ? "pause" : "play"} size={31} color={"#F1F6F9"} />
          </View>
          <View>
            <Text style={{ color: colors.text, fontFamily: "Vazirmatn-SemiBold" }}>{item.audioName}</Text>
            <Text style={{ color: colors.lightText, fontSize: 12, fontFamily: "Vazirmatn-SemiBold" }}>{item.artist}</Text>
          </View>
        </View>
      </TouchableHighlight>
    )
  };

  //@ts-ignore
  const sliderValue = (position && lastTrack?.duration) ? position / lastTrack?.duration : player?.lastPosition / lastTrack?.duration;

  const onSlidingComplete = async (value: number) => {
    const pos = value * duration;
    setPlayer((e) => {
      return { ...e, lastPosition: pos };
    });
    await TrackPlayer.seekTo(pos);
  };

  const handleBack = () => {
    if (openSearch) {
      setOpenSearch(false);
      setSearch(undefined);
    } else {
      navigation.goBack();
    }
  };

  const getRepeatMode = (mode?: repeatModeEnum) => {
    switch (mode) {
      case repeatModeEnum.disabledRepeat:
        return <MaterialCommunityIcons name="repeat-off" size={26} color={colors.text} />;
      case repeatModeEnum.repeatTrack:
        return <MaterialCommunityIcons name="repeat-once" size={26} color={colors.text} />;
      case repeatModeEnum.repeatList:
        return <MaterialCommunityIcons name="shuffle-disabled" size={30} color={colors.text} />;
      case repeatModeEnum.suffleList:
        return <Ionicons name="shuffle" size={27} color={colors.text} />;
      default:
        return <MaterialCommunityIcons name="repeat-once" size={26} color={colors.text} />;
    }
  };

  const handlePressRepeatMode = () => {
    setRepeatMode(e => {
      if (e !== undefined && e !== repeatModeEnum.suffleList) {
        storage.set('repeatMode', e + 1);
        return e + 1
      } else {
        storage.set('repeatMode', 0);
        return 0
      }
    })
  };

  const Artwork = () => {
    return (
      <Pressable onPress={() => setShowArtwork(false)} style={[styles.containerArtwork, StyleSheet.absoluteFill]}>
        <BlurView intensity={15} tint='dark' experimentalBlurMethod={'dimezisBlurView'} style={[styles.containerArtwork, StyleSheet.absoluteFill]}>
          <Image source={{ uri: lastTrack.artwork }} width={290} height={290} />
        </BlurView>
      </Pressable>
    )
  };

  useEffect(() => {
    if (!player?.playing) return;
    setLastTrack((e) => {
      //@ts-ignore
      return { ...e, name: player?.name, id: player?.id, duration: player?.duration, artist: player.artist, artwork: player.artwork };
    });
  }, [player?.uuid]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {showArtwork && lastTrack.artwork ? <Artwork /> : false}
      <View style={{ flexDirection: 'row', backgroundColor: colors.undetlay, height: 50, alignItems: 'center', justifyContent: "flex-start", paddingHorizontal: 20 }}>
        <Ionicons onPress={handleBack} name="arrow-back-outline" size={29} color={colors.text} />
        <TextInput placeholder='Search' ref={searchInput} cursorColor={colors.lightText} onChangeText={handleSearch} placeholderTextColor={colors.lightText} style={{ width: "87%", marginLeft: 12, fontSize: 20, color: colors.text, display: openSearch ? 'flex' : 'none', fontFamily: "Vazirmatn-SemiBold" }} />
        {!openSearch &&
          <>
            <Text style={{ color: colors.text, fontSize: 23, marginLeft: 12,fontFamily: "Vazirmatn-Black" }}>{contact?.name}</Text>
            <Ionicons onPress={() => {
              setOpenSearch(true);
              searchInput.current?.focus();
            }} name="search" size={30} style={{ marginLeft: "auto" }} color={colors.text} />
          </>
        }
      </View>
      <View style={{ marginTop: 'auto', paddingTop: 234 }}>
        {search ?
          <FlatList
            data={search}
            renderItem={({ item }) => renderTrackItem({ item })}
            //@ts-ignore
            keyExtractor={search => search.id}
          />
          : <FlatList
            data={filteredAudioList}
            renderItem={({ item }) => renderTrackItem({ item })}
            //@ts-ignore
            keyExtractor={item => item.id}
          />
        }
      </View>
      <View style={[styles.controllerContainer, { backgroundColor: colors.undetlay }]}>
        <View style={styles.infoController}>
          <View style={{ marginRight: 'auto' }}>
            <Text style={{ color: colors.text,fontFamily: "Vazirmatn-SemiBold" }}>{lastTrack?.name}</Text>
            <Text style={{ color: colors.lightText, fontSize: 12,fontFamily: "Vazirmatn-SemiBold" }}>{lastTrack?.artist}</Text>
          </View>
          <View style={{ width: 55, height: 55, marginLeft: 'auto', borderRadius: 9, overflow: 'hidden' }}>
            {lastTrack.artwork ? <Pressable onPress={() => setShowArtwork(true)}>
              <Image source={{ uri: lastTrack.artwork }} width={55} height={55} />
            </Pressable>
              : <View style={{ backgroundColor: 'black' }} />}
          </View>
        </View>
        <View>
          <View>
            <Slider
              style={{ height: 40 }}
              minimumValue={0}
              maximumValue={1}
              minimumTrackTintColor="#FFFFFF"
              maximumTrackTintColor="#000000"
              value={sliderValue}
              onSlidingComplete={onSlidingComplete}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginHorizontal: 15 }}>
              <Text style={{ color: colors.text,fontFamily: "Vazirmatn-SemiBold" }}>{currentPositionTime}</Text>
              <Text style={{ color: colors.text,fontFamily: "Vazirmatn-SemiBold" }}>{time}</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 5, alignItems: 'center', position: 'relative' }}>
            <Pressable onPress={handlePressRepeatMode} style={{ width: 50 }}>
              {getRepeatMode(repeatMode)}
            </Pressable>
            <Pressable onPress={() => playForward({ indexJump: -1 })} style={[styles.iconContainer, { backgroundColor: '' }]}>
              <Ionicons name={"play-skip-back"} size={26} color={colors.text} />
            </Pressable>
            <Pressable onPress={isPlaying ? () => stopPlaying({ isForStart: false, isEnded: false }) : startPlaying} style={[styles.iconContainer, { backgroundColor: '', width: 50, height: 50 }]}>
              <Ionicons name={isPlaying ? "pause" : "play"} size={32} color={colors.text} />
            </Pressable>
            <Pressable onPress={() => playForward({ indexJump: 1 })} style={[styles.iconContainer, { backgroundColor: '' }]}>
              <Ionicons name={"play-skip-forward"} size={26} color={colors.text} />
            </Pressable>
            <View style={{ width: 50 }} />
          </View>
        </View>
      </View>
    </View>
  )
}

export default ModalMusic;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative'
  },
  containerArtwork: {
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controllerContainer: {
    padding: 10,
    borderTopStartRadius: 12,
    borderTopEndRadius: 12,
    overflow: 'hidden'
  },
  infoController: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginHorizontal: 15
  },
  iconContainer: {
    width: 40,
    backgroundColor: '#000',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
    marginHorizontal: 10
  },
});