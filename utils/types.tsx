import { IMessage } from "react-native-gifted-chat";
import * as Notifications from "expo-notifications";
import * as FileSystem from 'expo-file-system';

export enum availableStatus {
    "available" = 0,
    "downloading" = 1,
    "download" = 2,
    "uploading" = 3,
    "error" = 4,
    "cancel" = 5,
};

export type LoginNavigationProps = {
    LoginPrev: undefined;
    Login: { beCheck: boolean };
    Chat: { beCheck: boolean };
};

export type ChatNavigationProps = {
    Chat: { beCheck: boolean };
    Messaging: { contact: User | undefined, roomId: string };
};

export type RootStackParamList = {
    LoginNavigation?: undefined;
    Chat: { beCheck: boolean };
    Messaging: { contact: User | undefined, roomId: string };
    ModalMusic: undefined;
};

export type IMessagePro = IMessage & {
    fileName?: string,
    file?: string,
    mimeType?: string,
    preView?: string,
    thumbnail?: string,
    duration?: number,
    playing?: boolean,
    availableStatus?: availableStatus,
    musicName?: string,
    artwork?: string,
    musicArtist?: string,
    size?: string,
    reply?: replyMessage
}

export type User = {
    _id: string;
    name: string;
    avatar: string;
    token?: string;
};

export type Room = {
    id: string,
    users: [user: User, contact: User],
    messages: IMessagePro[]
}

export type DrawerCoreType = {
    darkMode: boolean,
    setDarkMode: React.Dispatch<React.SetStateAction<boolean>>,
    children: React.ReactNode,
    open: boolean,
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export type CountNewMessageType = {
    count: number;
    id: string;
}

export type LastMessageType = {
    message: string;
    roomId: string;
}

export type player = {
    name?: string,
    uri?: string,
    playing?: boolean,
    id?: string | number,
    duration?: number,
    lastPosition?: number,
    uuid?: string | number,
    artist?: string,
    artwork?: string
} | undefined;

export type currentPosition = {
    position?: number,
    id?: number | string
};

export type lastTrack = {
    duration?: number,
    name?: string,
    id?: number | string,
    uri?: string,
    artist?: string,
    artwork?: string,
};

export enum RecordingEnum {
    "start" = 0,
    "stop" = 1,
    "cancel" = 2,
    "undefind" = 3
};

export enum repeatModeEnum {
    disabledRepeat = 0,
    repeatTrack = 1,
    repeatList = 2,
    suffleList = 3,
};

export type playerStatus = { isPlaying: boolean, id?: string | number }

export type videoDuration = { duration?: number, id?: string | number }

export type locales = 'en' | 'fa'

export enum remotePlayBackEnum {
    "play" = 0,
    "pause" = 1,
    "next" = 2,
    "previous" = 3,
    "seekto" = 4,
}

export type transferredProgress = { id?: string | number, transferred?: string, size?: string }[] | [];

export type currentTask = { task: FileSystem.DownloadResumable | FileSystem.UploadTask, id: string | number }[] | [];

export type replyMessage = { _id: string | number, name?: string, text?: string, image?: string, fileName?: string, musicName?: string, thumbnail?: string, preView?: string, video?: string, mimeType?: string } | undefined;

export type uploadMessageType = { name?: string | null, uri: string, mimeType?: string, size: string, type: formatType }[];

export enum formatType {
    'Image' = 0,
    'Video' = 1,
    'File' = 2
};