import { Socket } from 'socket.io-client';
import { currentPosition, currentTask, IMessagePro, LastMessageType, lastTrack, locales, player, playerStatus, remotePlayBackEnum, Room, transferredProgress, uploadMessageType, User, videoDuration } from './utils/types';
import { create } from 'zustand';
import { useThrottle } from './utils/utils';

const initialCurrentPosition: currentPosition = {
	position: undefined,
	id: undefined
};

const initialLastTrack: lastTrack = {
	duration: undefined,
	id: undefined,
	name: undefined,
	uri: undefined
};

interface useMessage {
	messages: IMessagePro[] | [],
	setMessages: (callback: (prev: IMessagePro[] | []) => (IMessagePro[] | [])) => void
}
interface useSocket {
	socket: Socket | null
	setSocket: (e: Socket) => void
}
interface useDarkMode {
	darkMode: boolean
	setDarkMode: (e: boolean) => void
}
interface useUser {
	user: User | undefined
	setUser: (e: User) => void
}
interface useCurrentContact {
	contact: User | undefined
	setContact: (e: User) => void
}
interface useForceRerender {
	forceRerender: boolean
	setForceRerender: () => void
}
interface useSetLastMessage {
	lastMessage: LastMessageType[] | []
	setLastMessage: (callback: (prev: LastMessageType[] | []) => (LastMessageType[] | [])) => void
}
interface usePlayer {
	player: player
	setPlayer: (callback: (prev: player) => (player)) => void
}

interface useLastTrack {
	lastTrack: lastTrack
	setLastTrack: (callback: (prev: lastTrack) => (lastTrack)) => void
}

interface useBeCheck {
	beCheck: boolean
	setBeCheck: (e: boolean) => void
}

interface useIsOpen {
	open: boolean
	setOpen: (e: boolean) => void
}

interface useSetLocale {
	locale: locales
	setLocale: (callback: (prev: locales) => locales) => void;
}

interface useRemotePlayBack {
	remotePlayBack: { state: remotePlayBackEnum, position?: number } | undefined
	setRemotePlayBack: (e: { state: remotePlayBackEnum, position?: number } | undefined) => void
}

interface useTransferredProgress {
	progress: transferredProgress;
	setProgressThrottled: (callback: (prev: transferredProgress) => transferredProgress) => void;
	setProgress: (callback: (prev: transferredProgress) => transferredProgress) => void;
};

interface useSetCancellationId {
	cancellationId?: string | number
	setCancellationId: (callback: (prev: string | number | undefined) => string | number | undefined) => void;
};

interface useCurrentTask {
	tasks: currentTask
	setTasks: (callback: (prev: currentTask) => currentTask) => void;
};

interface useUploadMessage {
	uploadMessage: uploadMessageType | undefined
	setUploadMessage: (e: uploadMessageType | undefined) => void
};

export const useMessage = create<useMessage>()((set) => ({
	messages: [],
	setMessages: (callback) => set((state) => ({ messages: callback(state.messages) }))
}));

export const useSocket = create<useSocket>()((set) => ({
	socket: null,
	setSocket: (e) => set({ socket: e })
}));

export const useDarkMode = create<useDarkMode>()((set) => ({
	darkMode: true,
	setDarkMode: (e) => set({ darkMode: !e })
}));

export const useUser = create<useUser>()((set) => ({
	user: undefined,
	setUser: (e) => set({ user: e })
}));

export const useCurrentContact = create<useCurrentContact>()((set) => ({
	contact: undefined,
	setContact: (e) => set({ contact: e })
}));

export const useForceRerender = create<useForceRerender>()((set) => ({
	forceRerender: false,
	setForceRerender: () => set((state) => ({ forceRerender: !state.forceRerender }))
}));

export const useSetLastMessage = create<useSetLastMessage>()((set) => ({
	lastMessage: [],
	setLastMessage: (callback) => set((state) => ({ lastMessage: callback(state.lastMessage) })),
}));

export const usePlayer = create<usePlayer>()((set) => ({
	player: undefined,
	setPlayer: (callback) => set((state) => ({ player: callback(state.player) })),
}));

export const useBeCheck = create<useBeCheck>()((set) => ({
	beCheck: false,
	setBeCheck: (e) => set({ beCheck: e })
}));

export const useLastTrack = create<useLastTrack>()((set) => ({
	lastTrack: initialLastTrack,
	setLastTrack: (callback) => set((state) => ({ lastTrack: callback(state.lastTrack) })),
}));

//for open or close FloatingMusicPlayer  useIsOpen
export const useIsOpen = create<useIsOpen>()((set) => ({
	open: false,
	setOpen: (e) => set({ open: e })
}));

export const useSetLocale = create<useSetLocale>()((set) => ({
	locale: 'fa',
	setLocale: (callback) => set((state) => ({ locale: callback(state.locale) })),
}));

export const useRemotePlayBack = create<useRemotePlayBack>()((set) => ({
	remotePlayBack: undefined,
	setRemotePlayBack: (e) => set({ remotePlayBack: e })
}));

export const useTransferredProgress = create<useTransferredProgress>()((set) => ({
	progress: [],
	setProgressThrottled: useThrottle((callback: any) => set((state) => ({
		progress: callback(state.progress),
	})), 700),
	setProgress: (callback) => set((state) => ({ progress: callback(state.progress) })),
}));

export const useSetCancellationId = create<useSetCancellationId>()((set) => ({
	cancellationId: undefined,
	setCancellationId: (callback) => set((state) => ({ cancellationId: callback(state.cancellationId) })),
}));

export const useCurrentTask = create<useCurrentTask>()((set) => ({
	tasks: [],
	setTasks: (callback) => set((state) => ({ tasks: callback(state.tasks) })),
}));

export const useUploadMessage = create<useUploadMessage>()((set) => ({
	uploadMessage: undefined,
	setUploadMessage: (e) => set({ uploadMessage: e })
}));