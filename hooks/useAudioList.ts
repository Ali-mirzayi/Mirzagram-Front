import { useEffect, useState } from 'react'
import { Room } from '../utils/types';
import { getAllRooms } from '../utils/DB';

export type audioListType = {
  uri: string;
  audioName: string;
  id: string | number;
  artwork?: string;
  artist?: string;
};

export const useAudioList = () => {
  const [audioList, setAudioList] = useState<audioListType[]>([]);
  useEffect(() => {
    getAllRooms().then((result: Room[] | any) => {
      if (result.length > 0) {
        const messages: audioListType[] = [];
        const rooms: Room[] = result.map((e: any) => JSON.parse(e.data));
        rooms.forEach(room => {
          room.messages.forEach(message => {
            if (message.audio) {
              messages.push({
                uri: message.audio,
                audioName: message.musicName ?? "unknown",
                id: message._id,
                artist: message.musicArtist,
                artwork: message.artwork
              });
            }
          })
        });

        setAudioList(messages);
      }
    }).catch((e) => console.log(e))
  }, []);
  return audioList;
};