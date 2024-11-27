import React, { useState, useEffect, useRef, useCallback } from 'react'
import { GiftedChat, IMessage } from 'react-native-gifted-chat'
import { StackScreenProps } from "@react-navigation/stack";
import { formatType, IMessagePro, RecordingEnum, replyMessage, RootStackParamList, User } from '../utils/types';
import { useCurrentContact, useCurrentTask, useIsOpen, useMessage, useSetCancellationId, useSetLastMessage, useSocket, useTransferredProgress, useUploadMessage, useUser } from '../socketContext';
import { updateMessage, getRoom } from '../utils/DB';
import LoadingPage from '../components/LoadingPage';
import { renderActions, renderBubble, RenderChatFooter, renderCustomMessage, renderInputToolbar, renderMessageAudio, renderMessageFile, RenderMessageImage, renderMessageVideo, renderSend, renderTime } from '../components/Message';
import useTheme from '../utils/theme';
import { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { Audio } from 'expo-av';
import FloatingMusicPlayer from '../components/FloatingMusicPlayer';
import { cancelRecording, startRecording, stopRecording } from '../components/SendMedia';
import useAudioPlayer from '../hooks/useAudioPlayer';
import { Gesture, Swipeable } from 'react-native-gesture-handler';
import useSendMedia from '../hooks/useSendMedia';
import { useHandleCancellation } from '../hooks/useHandleCancellation';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { encryptData, generateKey } from '../utils/utils';
import { axiosInstance } from '../utils/baseURL';

const Messaging = ({ route }: StackScreenProps<RootStackParamList, 'Messaging'>) => {
	const { contact, roomId }: any = route.params;

	const { messages, setMessages } = useMessage();
	const [open, setOpen] = useState<boolean>(false); // renderChatFooter
	const [status, setStatus] = useState<boolean | undefined>(undefined); // connection
	const [recording, setRecording] = useState<RecordingEnum>(RecordingEnum.undefind);
	const [isInRoom, setIsInRoom] = useState<boolean>(true);
	const [isPending, setPending] = useState(true); // set for roomId and save it db
	const [replyMessage, setReplyMessage] = useState<replyMessage>(undefined);
	const swipeableRef = useRef<Swipeable | null>(null);
	const FlatListRef = useRef<FlatList<IMessagePro>>(null);
	const [scrollMessage, setScrollMessage] = useState<any>(null);
	const [isIntractDB, setIsIntractDB] = useState(true);
	const [generatedKey, setGeneratedKey] = useState<string | undefined>(undefined);

	const socket = useSocket(state => state.socket);
	const user: User | undefined = useUser(state => state.user);

	const { lastMessage, setLastMessage } = useSetLastMessage();
	const { open: isPlayerOpen } = useIsOpen();
	const setContact = useCurrentContact(state => state.setContact);
	const { startPlayingByItem, stopPlaying } = useAudioPlayer();
	const translateY = useSharedValue(1000);
	const { colors } = useTheme();
	const videoRef: any = useRef(null);
	const [permissionResponse, requestPermission] = Audio.usePermissions();
	const offset = useSharedValue<number>(0);
	const pressed = useSharedValue<boolean>(false);
	const { SendImage, SendVideo, SendFile, SendAudio, ReSendImage, ReSendVideo, ReSendMusic, ReSendAudio, ReSendFile } = useSendMedia({ roomId, isIntractDB, generatedKey });
	const { progress, setProgress, setProgressThrottled } = useTransferredProgress();
	const setCancellationId = useSetCancellationId(state => state.setCancellationId);
	const setTasks = useCurrentTask(state => state.setTasks);
	const { uploadMessage, setUploadMessage } = useUploadMessage();

	useHandleCancellation();

	const clearReply = () => setReplyMessage(undefined);
	const clearUploadMessage = () => setUploadMessage(undefined);
	const closeActions = () => setOpen(false);

	if (!user) return;

	const handleAudioPermissions = async () => {
		try {
			if (permissionResponse?.status !== 'granted') {
				console.log('Requesting permission..');
				await requestPermission();
				return true;
			} else {
				return true;
			}
		} catch (err) {
			console.log('error to request permision', err);
			return false;
		}
	};

	const pan = Gesture.Pan()
		.onBegin(() => {
			runOnJS(startRecording)({ handleAudioPermissions, setRecording, permissionResponse, recording });
			pressed.value = true;
		})
		.onChange((event) => {
			offset.value = event.translationY;
		})
		.onFinalize((event) => {
			if (event.translationY <= -50 && event.translationY >= -110) {
				runOnJS(cancelRecording)({ setRecording });
			} else {
				runOnJS(stopRecording)({ setRecording, SendAudio });
			};
			offset.value = withSpring(0);
			pressed.value = false;
		});

	const animatedStyles = useAnimatedStyle(() => ({
		transform: [
			{ translateY: offset.value },
			{ scale: withTiming(pressed.value ? 1.2 : 1) },
		],
	}));

	if (open === true) {
		translateY.value = withTiming(300, { duration: 400 });
	} else {
		translateY.value = withTiming(700, { duration: 1000 });
	};

	const handleLastMessages = ({ roomId, newMessage }: { roomId: string, newMessage: string }) => {
		setLastMessage((prevState: any) => {
			const existingItem = prevState.find((item: any) => item.roomId === roomId);
			if (existingItem) {
				return prevState.map((item: any) =>
					item.roomId === roomId ? { ...item, message: newMessage } : item
				);
			} else {
				return [...prevState, { roomId, message: newMessage }];
			}
		})
	};

	useEffect(() => {
		if (scrollMessage) {
			const index = messages.findIndex(m => m._id === scrollMessage);
			FlatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 1 });
			setScrollMessage(null);
		}
	}, [scrollMessage])

	useEffect(() => {
		if (socket) {
			socket.emit('checkStatus', { contactId: contact._id, userRoomId: roomId });
			socket.emit('isUserInRoom', { userId: user._id, contactId: contact._id, userRoomId: roomId });
			socket.on('checkStatusResponse', (res: { status: boolean, isInRoom: boolean }) => {
				setStatus(res.status);
				setIsInRoom(res.isInRoom);
			});
			socket.on('isUserInRoomResponse', (res) => {
				setIsInRoom(res)
			});
			socket.on('userConnected', (res: string[]) => {
				const isContactDisconected = res.find(e => e === contact._id);
				setStatus(!!isContactDisconected);
			});
			socket.on('userDisconnected', (res: string[]) => {
				const isContactDisconected = res.find(e => e === contact._id);
				setStatus(!!isContactDisconected);
			});
			return () => {
				socket.off('newMessage');
				socket.off('checkStatusResponse');
				socket?.emit('isUserInRoom', { userId: user._id, contactId: contact._id, userRoomId: undefined });
				socket?.off('isUserInRoomResponse');
			}
		}
	}, [socket]);

	useEffect(() => {
		if (isPending == false) {
			updateMessage({ id: roomId, users: [user, contact], messages });
		}
	}, [messages]);

	useEffect(() => {
		setPending(true);
		getRoom(roomId)
			.then((result) => {
				if (result.length > 0) {
					const roomMessage: IMessagePro[] = result.map((e: any) => JSON.parse(e.data))[0]?.messages;
					setMessages(() => roomMessage.map(e => ({ ...e, playing: false })));
					setPending(false);
				}
			}).catch(error => {
				console.log(error, 'v2');
				setPending(false)
			});
		setPending(false);
	}, [lastMessage]);

	useEffect(() => {
		setContact(contact);
		generateKey(roomId, process.env.EXPO_PUBLIC_SALT ?? '', 500, 128).then(key => {
			setGeneratedKey(key)
		});
		return () => {
			setRecording(RecordingEnum.undefind);
		}
	}, []);

	const shouldUpdateMessage = useCallback((currentProps: any, nextProps: any) => {
		if (currentProps.previousMessage !== nextProps.nextMessage) {
			return true
		}
		return false
	}, []);

	useEffect(() => {
		if (replyMessage && swipeableRef.current) {
			swipeableRef.current.close();
			swipeableRef.current = null;
		}
	}, [replyMessage]);

	const updateSwipeableRef = useCallback(
		(ref: any) => {
			if (
				ref &&
				replyMessage &&
				ref.props.children.props.currentMessage?._id === replyMessage._id
			) {
				swipeableRef.current = ref;
			}
		},
		[replyMessage]
	);

	const onSend = useCallback(async (newMessage: IMessagePro[]) => {
		if (!generatedKey) return;
		const enc = await encryptData(newMessage[0].text, generatedKey);
		if (uploadMessage) {
			clearUploadMessage();
			if (uploadMessage.length > 1) {
				for await (const asset of uploadMessage) {
					await SendFile({
						size: asset.size,
						uri: asset.uri,
						mimeType: asset.mimeType
					});
				}
				socket?.emit('sendMessage', { ...newMessage[0], text: JSON.stringify(enc), user, roomId, isIntractDB }, setMessages((prevMessages: IMessage[]) => GiftedChat.append(prevMessages, [...newMessage])));
			};
			if (uploadMessage[0].type === formatType.Image){
				await SendImage({ uri: uploadMessage[0].uri, mimeType: uploadMessage[0].mimeType, size: uploadMessage[0].size, text: newMessage[0].text});
			};
			if (uploadMessage[0].type === formatType.Video){
				await SendVideo({ uri: uploadMessage[0].uri, mimeType: uploadMessage[0].mimeType, size: uploadMessage[0].size, text: newMessage[0].text });
			};
			if (uploadMessage[0].type === formatType.File){
				//@ts-ignore
				await SendFile({ uri: uploadMessage[0].uri, mimeType: uploadMessage[0].mimeType, name: uploadMessage[0].name, size: uploadMessage[0].size, text: newMessage[0].text });
			};
			handleLastMessages({ roomId, newMessage: "New File" });
			if(contact?.token?.data){
				await axiosInstance.post('/sendPushNotifications', { name: user.name, message: "New File", token: contact?.token?.data });
			};
			return;
		};

		if (replyMessage) {
			newMessage[0].reply = replyMessage;
			socket?.emit('sendMessage', { ...newMessage[0], text: JSON.stringify(enc), user, roomId, isIntractDB }, setMessages((prevMessages: IMessage[]) => GiftedChat.append(prevMessages, [...newMessage])));
			clearReply();
		} else {
			socket?.emit('sendMessage', { ...newMessage[0], text: JSON.stringify(enc), user, roomId, isIntractDB }, setMessages((prevMessages: IMessage[]) => GiftedChat.append(prevMessages, [...newMessage])));
		};

		handleLastMessages({ roomId, newMessage: newMessage[0].text });

		console.log(contact?.token);
		if(contact?.token){
			await axiosInstance.post('/sendPushNotifications', { name: user.name, message: newMessage[0].text, token: contact?.token });
		};
	}, [replyMessage, isIntractDB, generatedKey, uploadMessage]);

	const onSendWithEmptyText = useCallback(async () => {
		if (uploadMessage) {
			clearUploadMessage();
			if (uploadMessage.length > 1) {
				for await (const asset of uploadMessage) {
					await SendFile({
						size: asset.size,
						uri: asset.uri,
						mimeType: asset.mimeType
					});
				};
			};
			if (uploadMessage[0].type === formatType.Image) {
				SendImage({ uri: uploadMessage[0].uri, mimeType: uploadMessage[0].mimeType, size: uploadMessage[0].size });
			};
			if (uploadMessage[0].type === formatType.Video) {
				await SendVideo({ uri: uploadMessage[0].uri, mimeType: uploadMessage[0].mimeType, size: uploadMessage[0].size });
			};
			if (uploadMessage[0].type === formatType.File){
				//@ts-ignore
				SendFile({ uri: uploadMessage[0].uri, name: uploadMessage[0].name, mimeType: uploadMessage[0].mimeType, size: uploadMessage[0].size });
			};
			handleLastMessages({ roomId, newMessage: "New File" });
			if(contact?.token){
				await axiosInstance.post('/sendPushNotifications', { name: user.name, message: "New File", token: contact?.token });
			};
		};
	},[uploadMessage]);

	return (
		<View style={{ flex: 1, backgroundColor: colors.background }}>
			{isPending ? <LoadingPage /> : <></>}
			<View style={{ flexDirection: 'row', padding: 15, alignItems: "center", backgroundColor: colors.undetlay }}>
				<View style={{ width: 47, height: 47, borderRadius: 25, backgroundColor: colors.border, marginRight: 10 }} />
				<View style={{ justifyContent: "space-between", flexDirection: "row", alignItems: "center", width: '80%' }}>
					<View style={{ alignItems: "flex-start", flexDirection: "column" }}>
						<Text style={{ color: colors.text, fontSize: 23, fontFamily: "Vazirmatn-Black" }}>{contact ? contact.name : ''}</Text>
						<View style={{ flexDirection: "row", alignItems: "center", gap: 5, justifyContent: "space-between" }}>
							<Text style={{ color: colors.text, fontSize: 17, paddingBottom: 2, fontFamily: "Vazirmatn-Bold" }}>{status === true ? "online" : status === false ? "offline" : "connecting..."}</Text>
							<Text style={{ color: colors.text, fontSize: 14, fontFamily: "Vazirmatn-Bold" }}>{isInRoom === false && status === true ? "but not in room" : ""}</Text>
						</View>
					</View>
					<TouchableOpacity onPress={() => setIsIntractDB(e => !e)}>
						{isIntractDB ? <FontAwesome5 name="unlock" size={27} color={colors.lightText} /> :
							<FontAwesome5 name="lock" size={27} color="green" />}
					</TouchableOpacity>
				</View>
			</View>
			{isPlayerOpen ?
				<FloatingMusicPlayer />
				: null}
			<GiftedChat
				messages={messages}
				onSend={messages => onSend(messages)}
				user={user}
				renderMessageImage={(e) => RenderMessageImage(e, { setMessages, colors, ReSendImage, progress, setProgressThrottled, setProgress, setCancellationId, setTasks })}
				renderMessageVideo={(e) => renderMessageVideo(e, { setMessages, colors, videoRef, ReSendVideo, progress, setProgressThrottled, setProgress, setCancellationId, setTasks })}
				renderMessageAudio={(e) => renderMessageAudio(e, { setMessages, colors, startPlayingByItem, stopPlaying, ReSendMusic, ReSendAudio, progress, setProgressThrottled, setProgress, setCancellationId, setTasks })}
				renderCustomView={(e: any) => renderMessageFile(e, { setMessages, colors, ReSendFile, progress, setProgressThrottled, setProgress, setCancellationId, setTasks, setScrollMessage })}
				renderMessage={(e) => renderCustomMessage(e, { updateSwipeableRef, setReplyMessage })}
				alwaysShowSend
				scrollToBottom
				inverted={true}
				renderActions={(e) => renderActions(e, { setOpen, open, colors })}
				renderBubble={(e) => renderBubble(e, { colors })}
				renderSend={(e) => renderSend(e, { colors, onSendWithEmptyText })}
				renderChatFooter={() => RenderChatFooter({ translateY, colors, recording, setRecording, pan, animatedStyles, SendImage, SendVideo, SendFile, setUploadMessage, closeActions })}
				renderInputToolbar={(e) => renderInputToolbar(e, { colors, replyMessage, clearReply, uploadMessage, clearUploadMessage })}
				renderTime={(e) => renderTime(e, { colors })}
				optionTintColor='#fff'
				shouldUpdateMessage={shouldUpdateMessage}
				messageContainerRef={FlatListRef}
			/>
		</View>
	);
};

export default Messaging;