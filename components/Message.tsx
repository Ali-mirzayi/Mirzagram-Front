import React from 'react';
import { ActivityIndicator, Image, ImageProps, Pressable, StyleSheet, Text, TouchableHighlight, View, TouchableOpacity } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { formatBytes, formatMillisecondsToTime, useThrottle } from "../utils/utils";
import * as FileSystem from 'expo-file-system';
import { Actions, ActionsProps, Bubble, BubbleProps, Composer, IMessage, InputToolbar, InputToolbarProps, Message, MessageImage, MessageProps, Send, SendProps, Time, TimeProps } from "react-native-gifted-chat";
import { ResizeMode, Video, Audio } from "expo-av";
import { darkTheme } from "../utils/theme";
import { availableStatus, currentTask, formatType, IMessagePro, RecordingEnum, replyMessage, transferredProgress, uploadMessageType } from "../utils/types";
import Ionicons from '@expo/vector-icons/Ionicons';
import Entypo from '@expo/vector-icons/Entypo';
import Feather from '@expo/vector-icons/Feather';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { fileDirectory } from "../utils/directories";
import Lightbox from 'react-native-lightbox-v2';
import { startActivityAsync } from 'expo-intent-launcher';
import { save } from "./SendMedia";
import MovingText from "./MovingText";
import { audioListType } from "../hooks/useAudioList";
import { getAudioMetadata } from "@missingcore/audio-metadata";
import Animated from 'react-native-reanimated';
import { GestureDetector, PanGesture, Swipeable } from 'react-native-gesture-handler';
import { sendFileProps, sendImageProps, sendVideoProps } from '../hooks/useSendMedia';

const wantedTags = ['artist', 'name', 'artwork'] as const;

type RenderChatFooterProps = {
	translateY: any,
	recording: RecordingEnum,
	setRecording: React.Dispatch<React.SetStateAction<RecordingEnum>>,
	colors: typeof darkTheme.colors,
	//@ts-ignore
	pan: PanGesture,
	animatedStyles: any,
	SendImage: ({ uri, mimeType, size }: sendImageProps) => Promise<void>,
	SendVideo: ({ uri, mimeType, size }: sendVideoProps) => Promise<void>,
	SendFile: ({ uri, name, mimeType, size }: sendFileProps) => Promise<void>,
	setUploadMessage: (e: uploadMessageType) => void,
	closeActions: () => void
}

export function RenderChatFooter({ translateY, recording, setRecording, colors, SendImage, SendVideo, pan, animatedStyles, SendFile, setUploadMessage, closeActions }: RenderChatFooterProps) {
	const handleCamera = async () => {
		closeActions();
		await ImagePicker.requestCameraPermissionsAsync();
		let result = await ImagePicker.launchCameraAsync({
			base64: true,
			mediaTypes: ImagePicker.MediaTypeOptions.All,
			allowsEditing: true,
			quality: 1,
			preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current
		});
		if (!result.canceled) {
			const { formattedbytes, format } = formatBytes({ bytes: result.assets[0].fileSize ?? 0 });
			if (result.assets[0].type === "image") {
				setUploadMessage([{ uri: result.assets[0].uri, mimeType: result.assets[0].mimeType, size: `${formattedbytes} ${format}`, name: result.assets[0].fileName, type: formatType.Image }]);
			} else if (result.assets[0].type === "video") {
				setUploadMessage([{ uri: result.assets[0].uri, mimeType: result.assets[0].mimeType, size: `${formattedbytes} ${format}`, name: result.assets[0].fileName, type: formatType.Video }]);
			};
		};
	};

	const handlePickImage = async () => {
		closeActions();
		let result = await ImagePicker.launchImageLibraryAsync({
			base64: true,
			mediaTypes: ImagePicker.MediaTypeOptions.All,
			allowsEditing: true,
			quality: 1,
			videoQuality: 1,
		});
		if (!result.canceled) {
			const { formattedbytes, format } = formatBytes({ bytes: result.assets[0].fileSize ?? 0 });
			if (result.assets[0].type === "image") {
				setUploadMessage([{ uri: result.assets[0].uri, mimeType: result.assets[0].mimeType, size: `${formattedbytes} ${format}`, name: result.assets[0].fileName, type: formatType.Image }]);
			} else if (result.assets[0].type === "video") {
				setUploadMessage([{ uri: result.assets[0].uri, mimeType: result.assets[0].mimeType, size: `${formattedbytes} ${format}`, name: result.assets[0].fileName, type: formatType.Video }]);
			};
		}
	};

	const handlePickFile = async () => {
		try {
			closeActions();
			const result = await DocumentPicker.getDocumentAsync({
				type: "*/*",
				multiple: true,
			});
			if (!result.canceled) {
				const uploadMessage = result.assets.map(e => {
					const { formattedbytes, format } = formatBytes({ bytes: e.size ?? 0 });
					return {
						uri: e.uri,
						mimeType: e.mimeType,
						size: `${formattedbytes} ${format}`,
						name: e.name,
						type: formatType.File
					}
				});
				setUploadMessage(uploadMessage);
			};
		} catch (error) {
			console.log(error);
		}
	};

	return (
		<Animated.View style={{ transform: [{ translateY }] }}>
			<View style={[styles.footerChatOpen, { backgroundColor: colors.card }]}>
				<TouchableHighlight onPress={handleCamera} underlayColor={colors.undetlay} style={[styles.iconContainer, { backgroundColor: colors.container }]}>
					<Ionicons name='camera' size={30} color={colors.primary} />
				</TouchableHighlight>
				<TouchableHighlight onPress={handlePickImage} underlayColor={colors.undetlay} style={[styles.iconContainer, { backgroundColor: colors.container }]}>
					<Entypo name='images' size={30} color={colors.primary} />
				</TouchableHighlight>
				<TouchableHighlight onPress={handlePickFile} underlayColor={colors.undetlay} style={[styles.iconContainer, { backgroundColor: colors.container }]}>
					<Feather name='file' size={30} color={colors.primary} />
				</TouchableHighlight>
				<View style={[styles.iconContainer, { position: 'relative' }]}>
					<GestureDetector gesture={pan}>
						<Animated.View style={[styles.iconContainer, { position: 'absolute', left: 0, backgroundColor: colors.container }, animatedStyles]}>
							<Feather name='mic' size={30} color={colors.primary} />
						</Animated.View>
					</GestureDetector>
				</View>
				{
					recording === RecordingEnum.start ? (
						<TouchableHighlight onPress={() => setRecording(() => (RecordingEnum.cancel))} style={[styles.trashIconContainer, { backgroundColor: colors.red, opacity: 0.85 }]}>
							<Feather name='trash' size={30} color={colors.container} />
						</TouchableHighlight>
					) : null
				}
			</View>
		</Animated.View>
	)
}

export function renderBubble(props: Readonly<BubbleProps<IMessage>>, { colors }: { colors: typeof darkTheme.colors }) {
	return (
		<Bubble
			{...props}
			containerStyle={{
				right: {
					borderBottomRightRadius: 0,
				},
				left: {
					borderBottomLeftRadius: 0,
				}
			}}
			containerToPreviousStyle={{
				right: {
					borderBottomRightRadius: 0,
				},
				left: {
					borderBottomLeftRadius: 0,
				}
			}}
			wrapperStyle={{
				right: {
					borderTopRightRadius: 15,
					borderTopLeftRadius: 15,
					marginVertical: 2
				},
				left: {
					backgroundColor: colors.text === "#F1F6F9" ? "#a826ff" : "#fff",
					borderTopRightRadius: 15,
					borderTopLeftRadius: 15,
					marginVertical: 1,
				}
			}}
			containerToNextStyle={{
				right: {
					borderBottomRightRadius: 15,
					borderBottomLeftRadius: 15,
					borderTopRightRadius: 15,
					borderTopLeftRadius: 15,
				},
				left: {
					borderBottomRightRadius: 15,
					borderBottomLeftRadius: 15,
					borderTopRightRadius: 15,
					borderTopLeftRadius: 15,
				},
			}}
			textStyle={{
				right: {
					color: '#fff',
				}, left: {
					color: colors.text === "#F1F6F9" ? '#fff' : '#000',
				}
			}}
			usernameStyle={{
				color: colors.text === "#F1F6F9" ? '#fff' : '#000',
			}}
			tickStyle={{
				color: '#fff',
			}}
		/>
	);
};

export function renderTime(props: TimeProps<IMessage>, { colors }: { colors: typeof darkTheme.colors }) {
	return (
		<Time
			{...props}
			timeTextStyle={{
				left: {
					color: colors.text,
				},
				right: {
					color: '#fff',
				},
			}}
		/>)
};

type renderMessageImageProps = {
	ReSendImage: ({ errorId }: { errorId?: string | number }) => Promise<void>,
	setMessages: (callback: (prev: IMessagePro[] | []) => (IMessagePro[] | [])) => void,
	colors: typeof darkTheme.colors, progress: transferredProgress,
	setProgressThrottled: (callback: (prev: transferredProgress) => transferredProgress) => void,
	setProgress: (callback: (prev: transferredProgress) => transferredProgress) => void,
	setCancellationId: (callback: (prev: string | number | undefined) => string | number | undefined) => void,
	setTasks: (callback: (prev: currentTask) => currentTask) => void
};
type renderMessageVideoProps = {
	ReSendVideo: ({ errorId }: { errorId?: string | number }) => Promise<void>,
	setMessages: (callback: (prev: IMessagePro[] | []) => (IMessagePro[] | [])) => void,
	colors: typeof darkTheme.colors,
	videoRef: React.MutableRefObject<Video>,
	progress: transferredProgress,
	setProgressThrottled: (callback: (prev: transferredProgress) => transferredProgress) => void,
	setProgress: (callback: (prev: transferredProgress) => transferredProgress) => void,
	setCancellationId: (callback: (prev: string | number | undefined) => string | number | undefined) => void,
	setTasks: (callback: (prev: currentTask) => currentTask) => void
};
type renderMessageFileProps = {
	ReSendFile: ({ errorId }: { errorId?: string | number }) => Promise<void>,
	setMessages: (callback: (prev: IMessagePro[] | []) => (IMessagePro[] | [])) => void,
	colors: typeof darkTheme.colors,
	progress: transferredProgress,
	setProgressThrottled: (callback: (prev: transferredProgress) => transferredProgress) => void,
	setProgress: (callback: (prev: transferredProgress) => transferredProgress) => void,
	setCancellationId: (callback: (prev: string | number | undefined) => string | number | undefined) => void,
	setTasks: (callback: (prev: currentTask) => currentTask) => void,
	setScrollMessage: React.Dispatch<any>,
};
type renderMessageAudioProps = {
	setMessages: (callback: (prev: IMessagePro[] | []) => (IMessagePro[] | [])) => void,
	colors: typeof darkTheme.colors,
	startPlayingByItem: ({ item, isMessage }: { item: audioListType, isMessage?: boolean }) => Promise<void>,
	stopPlaying: ({ isForStart, isEnded }: { isForStart: boolean, isEnded: boolean }) => Promise<void>,
	ReSendMusic: ({ errorId }: { errorId?: string | number }) => Promise<void>,
	ReSendAudio: ({ errorId }: { errorId?: string | number }) => Promise<void>,
	progress: transferredProgress,
	setProgressThrottled: (callback: (prev: transferredProgress) => transferredProgress) => void,
	setProgress: (callback: (prev: transferredProgress) => transferredProgress) => void,
	setCancellationId: (callback: (prev: string | number | undefined) => string | number | undefined) => void,
	setTasks: (callback: (prev: currentTask) => currentTask) => void
};
type renderMessageTextProps = {
	updateSwipeableRef: (ref: any) => void,
	setReplyMessage: React.Dispatch<React.SetStateAction<replyMessage>>
};

export const renderMessageFile = (props: MessageProps<IMessagePro>, { setMessages, colors, ReSendFile, progress, setProgressThrottled, setProgress, setCancellationId, setTasks, setScrollMessage }: renderMessageFileProps) => {
	if (props.currentMessage?.file) {
		const Message = props.currentMessage;
		//@ts-ignore
		const color = props.position === 'right' ? '#fff' : colors.text === "#F1F6F9" ? '#fff' : '#000';
		const colorLight = props.position === 'right' ? '#ede' : colors.text === "#F1F6F9" ? '#ede' : '#333';
		const messageStatus = Message.availableStatus;
		const selectedProgress = progress.find(e => e.id === Message._id);
		const replyMessage = Message?.reply;

		let result;

		switch (true) {
			case !!replyMessage?.text:
				result = { type: 'text', value: replyMessage.text };
				break;
			case !!replyMessage?.musicName:
				result = { type: 'text', value: "Music" };
				break;
			case !!replyMessage?.image:
				result = { type: 'image', value: replyMessage.image, text: "Image" };
				break;
			case !!replyMessage?.preView:
				result = { type: 'image', value: replyMessage.preView, text: "Image" };
				break;
			case !!replyMessage?.thumbnail:
				result = { type: 'image', value: replyMessage.thumbnail, text: "Video" };
				break;
			case !!replyMessage?.video:
				result = { type: 'text', value: "Video" };
				break;
			case !!replyMessage?.mimeType:
				result = { type: 'text', value: replyMessage.mimeType };
				break;
			default:
				result = { type: 'text', value: 'Some Reply' };
				break;
		};

		const callback = ({ totalBytesWritten, totalBytesExpectedToWrite }: { totalBytesWritten: number, totalBytesExpectedToWrite: number }) => {
			setProgressThrottled(e => {
				const existingItem = e.find(item => item.id === Message._id);
				const { format }: any = formatBytes({ bytes: totalBytesExpectedToWrite });
				if (existingItem) {
					return e.map(obj => {
						if (obj.id === Message._id) {
							return {
								...obj,
								transferred: formatBytes({ bytes: totalBytesWritten, format }).formattedbytes
							};
						} else {
							return obj;
						}
					});
				} else {
					return [...e, { id: Message._id, size: Message.size }];
				}
			});
		};

		async function handleDownload() {
			if (Message?.file?.startsWith('file') || !Message.fileName) return;
			setMessages(e => e.map(message => {
				if (message._id === Message._id) {
					return { ...message, availableStatus: availableStatus.downloading }
				} else {
					return message
				}
			}));
			//@ts-ignore
			const downloadResumable = FileSystem.createDownloadResumable(Message?.file, fileDirectory + Message.fileName,
				{},
				callback
			);
			setTasks(state => [...state, { task: downloadResumable, id: Message._id }]);
			await downloadResumable.downloadAsync().then(result => {
				if (result) {
					setMessages(e => e.map(message => {
						if (message._id === Message._id) {
							return { ...message, file: result?.uri, availableStatus: availableStatus.available, mimeType: result?.headers["Content-Type"] }
						} else {
							return message
						}
					}));
				} else {
					setMessages(e => e.map(message => {
						if (message._id === Message._id) {
							return { ...message, availableStatus: availableStatus.cancel }
						} else {
							return message
						}
					}));
				}
			}).catch(() => {
				setMessages(e => e.map(message => {
					if (message._id === Message._id) {
						return { ...message, availableStatus: availableStatus.error }
					} else {
						return message
					}
				}));
			});
			setProgress((e: any) => e.filter((r: any) => r.id !== Message._id));
		};

		const openFile = async () => {
			if (!Message?.file?.startsWith('file')) return;
			const contentURL = await FileSystem.getContentUriAsync(Message.file);
			try {
				await startActivityAsync('android.intent.action.VIEW', {
					data: contentURL,
					flags: 1,
					type: Message.mimeType
				});
			} catch (error) {
				console.log(error)
			}
		};

		const handleCancel = () => {
			setCancellationId((state) => {
				if (state === undefined) {
					return Message._id
				}
			});
			setMessages(e => e.map(message => {
				if (message._id === Message._id) {
					return { ...message, availableStatus: availableStatus.cancel }
				} else {
					return message
				}
			}));
		};

		let finalMode = undefined;

		const TransferMode = (<TouchableOpacity onPress={useThrottle(handleCancel, 2000)} style={[styles.iconContainer, { backgroundColor: colors.undetlay }]}>
			<ActivityIndicator style={[styles.iconContainer, { backgroundColor: colors.undetlay }]} size="large" color="#fff" />
		</TouchableOpacity>);

		const AvailableMode = (<TouchableHighlight onPress={openFile} style={[styles.iconContainer, { backgroundColor: colors.undetlay }]}>
			<Feather name="file" size={28} color="#fff" />
		</TouchableHighlight>);

		const DownloadMode = (<TouchableHighlight onPress={useThrottle(handleDownload, 2000)} style={[styles.iconContainer, { backgroundColor: colors.undetlay, marginBottom: 8 }]}>
			<MaterialCommunityIcons name="download" size={34} color="#fff" />
		</TouchableHighlight>);

		const ErrorMode = (<TouchableOpacity onPress={() => { props.user.name === Message.user.name ? ReSendFile({ errorId: Message?._id }) : handleDownload() }} style={[styles.iconContainer, { backgroundColor: colors.red }]}>
			<FontAwesome6 name="exclamation" size={40} color="#fff" />
		</TouchableOpacity>);

		const UploadMode = (<TouchableHighlight onPress={() => ReSendFile({ errorId: Message?._id })} style={[styles.iconContainer, { backgroundColor: colors.undetlay }]}>
			<MaterialCommunityIcons name="upload" size={34} color="#fff" />
		</TouchableHighlight>);

		switch (messageStatus) {
			case availableStatus.available:
				finalMode = AvailableMode;
				break;
			case availableStatus.download:
				finalMode = DownloadMode;
				break;
			case availableStatus.downloading:
				finalMode = TransferMode;
				break;
			case availableStatus.uploading:
				finalMode = TransferMode;
				break;
			case availableStatus.error:
				finalMode = ErrorMode;
				break;
			case availableStatus.cancel:
				finalMode = props.user._id === Message.user._id ? UploadMode : DownloadMode;
				break;
			default:
				finalMode = AvailableMode;
				break;
		};

		const size = selectedProgress?.transferred ? (selectedProgress.transferred + ' / ' + selectedProgress.size) : Message.size ?? '';

		return (
			<View style={{ paddingTop: 2 }}>
				{replyMessage?._id === Message?._id ? <View style={{ alignItems: "center", paddingHorizontal: 8, paddingVertical: 6, gap: 6 }}>
					<View style={{ flexDirection: 'row', width: "100%", backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 10, overflow: "hidden" }}>
						<View style={{ width: 3, backgroundColor: colors.text }} />
						<View style={{ flexDirection: "row", marginLeft: 5 }}>
							{result.type === "image" && result.value && <View style={{ flexDirection: 'row', alignItems: "center", gap: 7 }}>
								<Image style={{ width: 35, height: 35, marginVertical: 7, borderRadius: 5 }} source={{ uri: result.value }} />
							</View>
							}
							<View style={{ paddingLeft: 6, paddingRight: 10 }}>
								{replyMessage.name && <Text style={{ color: colors.text, fontSize: 17, marginBottom: -7, fontFamily: "Vazirmatn-SemiBold" }}>{replyMessage.name}</Text>}
								{result.type === "text" && <Text numberOfLines={1} style={{ color: colorLight, fontSize: 17, fontFamily: "Vazirmatn-Regular" }}>{result?.value}</Text>}
								{result.text && <Text style={{ color: colors.text, fontSize: 15, fontFamily: "Vazirmatn-Regular" }}>{result?.text}</Text>}
							</View>
						</View>
					</View>
				</View> : null}
				<View style={[{ zIndex: 10, position: 'relative', width: 200, height: 60, flexDirection: 'row', alignItems: 'center', paddingTop: 10 }]}>
					<View style={{ marginHorizontal: 10 }}>
						{finalMode}
					</View>
					<View style={{ marginLeft: 0, marginRight: 'auto', width: 130, overflow: 'hidden' }}>
						<Text numberOfLines={2} style={[{ color: color, fontSize: 14 }]}>{Message?.fileName ? Message?.fileName : 'Voice'}</Text>
						<Text style={{ color: color, fontFamily: "Vazirmatn-SemiBold" }}>{size}</Text>
					</View>
				</View>
				{messageStatus === availableStatus.available ? <Pressable style={{ marginLeft: "auto", paddingRight: 10, paddingBottom: 5 }} onPress={() => save({ uri: Message ? Message?.file : undefined, mimeType: Message?.mimeType, fileName: Message?.fileName })}>
					<Text style={{ color: color, fontSize: 16, fontFamily: "Vazirmatn-SemiBold" }}>Save</Text>
				</Pressable> : null}
			</View>
		)
	};

	if (props.currentMessage?.reply?._id && !props.currentMessage?.file) {
		const color = props.position === 'right' ? '#fff' : colors.text === "#F1F6F9" ? '#fff' : '#000';
		const colorLight = props.position === 'right' ? '#ede' : colors.text === "#F1F6F9" ? '#ede' : '#333';
		const replyColor = props.position === 'right' ? 'rgba(255,255,255,0.2)' : colors.text === "#F1F6F9" ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';
		const replyMessage = props.currentMessage?.reply;
		let result;

		switch (true) {
			case !!replyMessage?.text:
				result = { type: 'text', value: replyMessage.text };
				break;
			case !!replyMessage?.musicName:
				result = { type: 'text', value: "Music" };
				break;
			case !!replyMessage?.image:
				result = { type: 'image', value: replyMessage.image, text: "Image" };
				break;
			case !!replyMessage?.preView:
				result = { type: 'image', value: replyMessage.preView, text: "Image" };
				break;
			case !!replyMessage?.thumbnail:
				result = { type: 'image', value: replyMessage.thumbnail, text: "Video" };
				break;
			case !!replyMessage?.video:
				result = { type: 'text', value: "Video" };
				break;
			case !!replyMessage?.mimeType:
				result = { type: 'text', value: replyMessage.mimeType };
				break;
			default:
				result = { type: 'text', value: 'Some Reply' };
				break;
		};

		return (
			<View style={{ alignItems: "center", paddingHorizontal: 8, paddingVertical: 6, gap: 6 }}>
				<TouchableOpacity onPress={() => setScrollMessage(replyMessage._id)} style={{ flexDirection: 'row', width: "100%", backgroundColor: replyColor, borderRadius: 10, overflow: "hidden" }}>
					<View style={{ width: 3, backgroundColor: color }} />
					<View style={{ flexDirection: "row", marginLeft: 5 }}>
						{result.type === "image" && result.value && <View style={{ flexDirection: 'row', alignItems: "center", gap: 7 }}>
							<Image style={{ width: 35, height: 35, marginVertical: 7, borderRadius: 5 }} source={{ uri: result.value }} />
						</View>
						}
						<View style={{ paddingLeft: 6, paddingRight: 10 }}>
							{props.currentMessage?.reply?.name && <Text style={{ color: color, fontSize: 17, marginBottom: -7, fontFamily: "Vazirmatn-SemiBold" }}>{props.currentMessage?.reply?.name}</Text>}
							{result.type === "text" && <Text numberOfLines={1} style={{ color: colorLight, fontSize: 17, fontFamily: "Vazirmatn-Regular" }}>{result?.value}</Text>}
							{result.text && <Text style={{ color, fontSize: 15, fontFamily: "Vazirmatn-Regular" }}>{result?.text}</Text>}
						</View>
					</View>
				</TouchableOpacity>
			</View>
		)
	}
};

export const RenderMessageImage = (props: any, { setMessages, colors, ReSendImage, progress, setProgressThrottled, setProgress, setCancellationId, setTasks }: renderMessageImageProps) => {
	const Message: IMessagePro = props.currentMessage;

	const messageStatus = Message.availableStatus;
	const color = props.position === 'right' ? '#fff' : colors.text === "#F1F6F9" ? '#fff' : '#000';
	const selectedProgress = progress.find(e => e.id === Message._id);

	const callback = ({ totalBytesWritten, totalBytesExpectedToWrite }: { totalBytesWritten: number, totalBytesExpectedToWrite: number }) => {
		setProgressThrottled(e => {
			const existingItem = e.find(item => item.id === Message._id);
			const { format }: any = formatBytes({ bytes: totalBytesExpectedToWrite });
			if (existingItem) {
				return e.map(obj => {
					if (obj.id === Message._id) {
						return {
							...obj,
							transferred: formatBytes({ bytes: totalBytesWritten, format }).formattedbytes
						};
					} else {
						return obj;
					}
				});
			} else {
				return [...e, { id: Message._id, size: Message.size }];
			}
		});
	};

	async function handleDownload() {
		if (Message?.image?.startsWith('file') || !Message.fileName || !Message.image) return;
		setMessages(e => e.map(message => {
			if (message._id === Message._id) {
				return { ...message, availableStatus: availableStatus.downloading }
			} else {
				return message
			}
		}));
		const downloadResumable = FileSystem.createDownloadResumable(Message.image, fileDirectory + Message.fileName,
			{},
			callback
		);
		setTasks(state => [...state, { task: downloadResumable, id: Message._id }]);
		await downloadResumable.downloadAsync().then(result => {
			if (result) {
				setMessages(e => e.map(message => {
					if (message._id === Message._id) {
						return { ...message, image: result?.uri, availableStatus: availableStatus.available, mimeType: result?.headers["Content-Type"] }
					} else {
						return message
					}
				}));
			} else {
				setMessages(e => e.map(message => {
					if (message._id === Message._id) {
						return { ...message, availableStatus: availableStatus.cancel }
					} else {
						return message
					}
				}));
			}
		}).catch(() => {
			setMessages(e => e.map(message => {
				if (message._id === Message._id) {
					return { ...message, availableStatus: availableStatus.error }
				} else {
					return message
				}
			}));
		});
		setProgress((e: any) => e.filter((r: any) => r.id !== Message._id));
	};

	const handleCancel = () => {
		setCancellationId((state) => {
			if (state === undefined) {
				return Message._id
			}
		});
		setMessages(e => e.map(message => {
			if (message._id === Message._id) {
				return { ...message, availableStatus: availableStatus.cancel }
			} else {
				return message
			}
		}));
	};

	let finalMode = undefined;

	const TransferMode = (<TouchableHighlight onPress={useThrottle(handleCancel, 2000)} style={[styles.iconContainer, styles.downloadImg, { backgroundColor: colors.undetlay }]}>
		<ActivityIndicator style={[styles.iconContainer, { backgroundColor: colors.undetlay }]} size="large" color="#fff" />
	</TouchableHighlight>
	);

	const DownloadMode = (<TouchableOpacity onPress={useThrottle(handleDownload, 2000)} style={[styles.iconContainer, styles.downloadImg, { backgroundColor: colors.undetlay }]}>
		<MaterialCommunityIcons name="download" size={34} color="#fff" />
	</TouchableOpacity>);

	const ErrorMode = (<TouchableOpacity onPress={() => { props.user.name === Message.user.name ? ReSendImage({ errorId: Message?._id }) : handleDownload() }} style={[styles.iconContainer, styles.downloadImg, { backgroundColor: colors.red }]}>
		<FontAwesome6 name="exclamation" size={40} color="#fff" />
	</TouchableOpacity>);

	const UploadMode = (<TouchableHighlight onPress={() => ReSendImage({ errorId: Message?._id })} style={[styles.iconContainer, styles.downloadImg, { backgroundColor: colors.undetlay }]}>
		<MaterialCommunityIcons name="upload" size={34} color="#fff" />
	</TouchableHighlight>);

	switch (messageStatus) {
		case availableStatus.download:
			finalMode = DownloadMode;
			break;
		case availableStatus.downloading:
			finalMode = TransferMode;
			break;
		case availableStatus.uploading:
			finalMode = TransferMode;
			break;
		case availableStatus.error:
			finalMode = ErrorMode;
			break;
		case availableStatus.cancel:
			finalMode = props.user._id === Message.user._id ? UploadMode : DownloadMode;
			break;
		default:
			break;
	};

	const size = selectedProgress?.transferred ? (selectedProgress.transferred + ' / ' + selectedProgress.size) : Message.size ?? undefined;

	return (
		<View style={[props.containerStyle, { zIndex: 10, position: 'relative' }]}>
			<Lightbox
				activeProps={{
					style: styles.imageActive,
				}}
				onOpen={handleDownload}
			>
				<Image
					style={[styles.image, props.imageStyle]}
					blurRadius={Message?.image?.startsWith('file') ? 0 : 8}
					source={{ uri: Message?.image?.startsWith('file') ? Message?.image : Message?.preView }}
				/>
			</Lightbox>
			{finalMode}
			{size ?
				<View style={{ backgroundColor: 'rgba(52, 52, 52, 0.5)', position: "absolute", top: 7, left: 7, paddingVertical: 4, paddingHorizontal: 7, borderRadius: 7 }}>
					<Text style={{ color: '#fff', fontSize: 13, fontFamily: "Vazirmatn-SemiBold" }}>{size}</Text>
				</View>
				: null}
			{messageStatus === availableStatus.available ? <Pressable style={{ marginRight: 4, padding: 5 }} onPress={() => save({ uri: Message ? Message?.image : undefined })}>
				<Text style={{ color: color, fontSize: 16, fontFamily: "Vazirmatn-SemiBold" }}>Save</Text>
			</Pressable> : null}
		</View>
	)
};

export function renderMessageVideo(props: any, { setMessages, videoRef, colors, ReSendVideo, progress, setProgress, setProgressThrottled, setCancellationId, setTasks }: renderMessageVideoProps) {
	const Message = props.currentMessage;
	if (!Message?.video) return;

	const messageStatus = Message.availableStatus;
	const selectedProgress = progress.find(e => e.id === Message._id);

	const duration = Message.duration;
	const color = props.position === 'right' ? '#fff' : colors.text === "#F1F6F9" ? '#fff' : '#000';

	const callback = ({ totalBytesWritten, totalBytesExpectedToWrite }: { totalBytesWritten: number, totalBytesExpectedToWrite: number }) => {
		setProgressThrottled(e => {
			const existingItem = e.find(item => item.id === Message._id);
			const { format }: any = formatBytes({ bytes: totalBytesExpectedToWrite });
			if (existingItem) {
				return e.map(obj => {
					if (obj.id === Message._id) {
						return {
							...obj,
							transferred: formatBytes({ bytes: totalBytesWritten, format }).formattedbytes
						};
					} else {
						return obj;
					}
				});
			} else {
				return [...e, { id: Message._id, size: Message.size }];
			}
		});
	};

	async function handleDownload() {
		if (Message?.video?.startsWith('file') || !Message.fileName) return;
		setMessages(e => e.map(message => {
			if (message._id === Message._id) {
				return { ...message, availableStatus: availableStatus.downloading }
			} else {
				return message
			}
		}));
		const downloadResumable = FileSystem.createDownloadResumable(Message?.video, fileDirectory + Message.fileName,
			{},
			callback
		);
		setTasks(state => [...state, { task: downloadResumable, id: Message._id }]);
		await downloadResumable.downloadAsync().then((result) => {
			if (result) {
				setMessages(e => e.map(message => {
					if (message._id === Message._id) {
						return { ...message, video: result?.uri, availableStatus: availableStatus.available, mimeType: result?.headers["Content-Type"] }
					} else {
						return message
					}
				}));
			} else {
				setMessages(e => e.map(message => {
					if (message._id === Message._id) {
						return { ...message, availableStatus: availableStatus.cancel }
					} else {
						return message
					}
				}));
			}
		}).catch(() => {
			setMessages(e => e.map(message => {
				if (message._id === Message._id) {
					return { ...message, availableStatus: availableStatus.error }
				} else {
					return message
				}
			}));
		});
		setProgress((e: any) => e.filter((r: any) => r.id !== Message._id));
	};

	const handleCancel = async () => {
		setCancellationId((state) => {
			if (state === undefined) {
				return Message._id
			}
		});
		setMessages(e => e.map(message => {
			if (message._id === Message._id) {
				return { ...message, availableStatus: availableStatus.cancel }
			} else {
				return message
			}
		}));
	};

	const onPlayVideo = () => {
		videoRef.current.presentFullscreenPlayer();
		videoRef.current.playAsync();
	};

	let finalMode = undefined;

	const TransferMode = (
		<TouchableHighlight onPress={useThrottle(handleCancel, 2000)} style={[styles.iconContainer, styles.download, { backgroundColor: colors.undetlay }]}>
			<ActivityIndicator style={[styles.iconContainer, { backgroundColor: colors.undetlay }]} size="large" color="#fff" />
		</TouchableHighlight>
	);

	const DownloadMode = (<TouchableHighlight onPress={useThrottle(handleDownload, 2000)} style={[styles.iconContainer, styles.download, { backgroundColor: colors.undetlay }]}>
		<MaterialCommunityIcons name="download" size={34} color="#fff" />
	</TouchableHighlight>);

	const AvailableMode = (<TouchableHighlight onPress={onPlayVideo} style={[styles.iconContainer, styles.download, { backgroundColor: colors.undetlay }]}>
		<Ionicons name={"play"} size={30} color="#fff" />
	</TouchableHighlight>);

	const ErrorMode = (<TouchableOpacity onPress={() => { props.user.name === Message.user.name ? ReSendVideo({ errorId: Message?._id }) : handleDownload() }} style={[styles.iconContainer, styles.download, { backgroundColor: colors.red }]}>
		<FontAwesome6 name="exclamation" size={40} color="#fff" />
	</TouchableOpacity>);

	const UploadMode = (<TouchableHighlight onPress={() => ReSendVideo({ errorId: Message._id })} style={[styles.iconContainer, styles.download, { backgroundColor: colors.undetlay }]}>
		<MaterialCommunityIcons name="upload" size={34} color="#fff" />
	</TouchableHighlight>);

	switch (messageStatus) {
		case availableStatus.available:
			finalMode = AvailableMode;
			break;
		case availableStatus.download:
			finalMode = DownloadMode;
			break;
		case availableStatus.downloading:
			finalMode = TransferMode;
			break;
		case availableStatus.uploading:
			finalMode = TransferMode;
			break;
		case availableStatus.error:
			finalMode = ErrorMode;
			break;
		case availableStatus.cancel:
			finalMode = props.user._id === Message.user._id ? UploadMode : DownloadMode;
			break;
		default:
			finalMode = AvailableMode;
			break;
	};

	const CustomPosterComponent = ({ source, style }: { source: ImageProps["source"], style: ImageProps["style"] }) => {
		return (
			<TouchableHighlight style={[{ zIndex: 10, position: 'relative' }, style]} onPress={handleDownload}>
				<View style={[{ zIndex: 10, position: 'relative' }, style]}>
					<Image
						source={source}
						style={[{ zIndex: 10 }, style]}
						blurRadius={8}
						resizeMode={ResizeMode.COVER}
					/>
					{
						messageStatus === availableStatus.downloading ? TransferMode : messageStatus === availableStatus.download && DownloadMode
					}
				</View>
			</TouchableHighlight>
		);
	};

	const setDuration = (e: any) => {
		const newDuration = e?.durationMillis / 1000;
		if (!duration) {
			setMessages(m => m.map(e => {
				if (e._id === Message._id) {
					return { ...e, duration: newDuration }
				} else {
					return e
				}
			}))
		};
	};

	const size = selectedProgress?.transferred ? (selectedProgress.transferred + ' / ' + selectedProgress.size) : Message.size ?? undefined;

	return (
		<>
			<Pressable style={{ zIndex: 5 }} onPress={onPlayVideo}>
				<Video
					// @ts-ignore
					source={{ uri: Message?.video?.startsWith('file') ? Message?.video : undefined }}
					resizeMode={ResizeMode.COVER}
					useNativeControls={false}
					ref={videoRef}
					shouldPlay={false}
					onPlaybackStatusUpdate={setDuration}
					progressUpdateIntervalMillis={100000}
					style={{
						width: 195,
						height: 130,
						borderRadius: 13,
						margin: 3,
						zIndex: -10
					}}
					videoStyle={{
						zIndex: -10,
						backgroundColor: '#000'
					}}
					posterSource={{ uri: Message?.thumbnail ? Message?.thumbnail : undefined }}
					usePoster={Message?.video?.startsWith('file') ? false : true}
					PosterComponent={Message?.video?.startsWith('file') ? undefined : CustomPosterComponent}
				/>
				{
					finalMode
				}
				<View style={{ backgroundColor: 'rgba(52, 52, 52, 0.5)', position: "absolute", top: 7, left: 7, paddingVertical: 3, paddingHorizontal: 5, borderRadius: 7 }}>
					<Text style={{ color: '#fff', fontSize: 13, fontFamily: "Vazirmatn-SemiBold" }}>{formatMillisecondsToTime(duration) ?? "Video"}</Text>
					{size ? <Text style={{ color: '#fff', fontSize: 13, fontFamily: "Vazirmatn-SemiBold" }}>{size}</Text> : null}
				</View>
			</Pressable>
			{messageStatus === availableStatus.available ? <Pressable style={{ marginRight: 4, padding: 5 }} onPress={() => save({ uri: Message ? Message?.video : undefined })}>
				<Text style={{ color: color, fontSize: 16, fontFamily: "Vazirmatn-SemiBold" }}>Save</Text>
			</Pressable> : null}
		</>
	)
};

export const renderMessageAudio = (props: any, { setMessages, colors, startPlayingByItem, stopPlaying, ReSendMusic, ReSendAudio, progress, setProgressThrottled, setProgress, setCancellationId, setTasks }: renderMessageAudioProps) => {
	const Message = props.currentMessage;
	if (!Message?.audio) return;

	const isPlaying = Message.playing;
	const messageStatus = Message.availableStatus;
	const selectedProgress = progress.find(e => e.id === Message._id);
	
	const callback = ({ totalBytesWritten, totalBytesExpectedToWrite }: { totalBytesWritten: number, totalBytesExpectedToWrite: number }) => {
		setProgressThrottled(e => {
			const existingItem = e.find(item => item.id === Message._id);
			const { format }: any = formatBytes({ bytes: totalBytesExpectedToWrite });
			if (existingItem) {
				return e.map(obj => {
					if (obj.id === Message._id) {
						return {
							...obj,
							transferred: formatBytes({ bytes: totalBytesWritten, format }).formattedbytes
						};
					} else {
						return obj;
					}
				});
			} else {
				return [...e, { id: Message._id, size: Message.size }];
			}
		});
	};

	async function handleDownload() {
		if (Message?.audio?.startsWith('file') || !Message.fileName) return;
		setMessages(e => e.map(message => {
			if (message._id === Message._id) {
				return { ...message, availableStatus: availableStatus.downloading }
			} else {
				return message
			}
		}));
		try {
			const downloadResumable = FileSystem.createDownloadResumable(Message?.audio, fileDirectory + Message.fileName,
				{},
				callback
			);
			setTasks(state => [...state, { task: downloadResumable, id: Message._id }]);
			const result = await downloadResumable.downloadAsync();
			if (!result?.uri) {
				setMessages(e => e.map(message => {
					if (message._id === Message._id) {
						return { ...message, availableStatus: availableStatus.cancel }
					} else {
						return message
					}
				}));
				return;
			};
			const data = await getAudioMetadata(result.uri, wantedTags).catch(e => console.log(e));
			let artwork = data?.metadata.artwork?.replace(/^data:image\/[^;]+;base64,/, '');
			if (artwork) {
				await FileSystem.writeAsStringAsync(fileDirectory + `${Message.fileName}-artwork.jpeg`, artwork, { encoding: "base64" }).then(() => {
					artwork = fileDirectory + `${Message.fileName}-artwork.jpeg`
				}).catch((e) => {
					console.log(e, 'error write artwork')
				})
			}

			if (!Message.duration) {
				const { sound, status } = await Audio.Sound.createAsync({ uri: result.uri }, { shouldPlay: false });
				//@ts-ignore
				const duration: number = status?.durationMillis / 1000;
				setMessages((prevMessages: IMessagePro[]) => (prevMessages.map(e => {
					if (e._id === Message._id) {
						return { ...e, audio: result.uri, duration, artwork: artwork?.startsWith('file') ? artwork : undefined, musicArtist: data?.metadata.artist ?? '', musicName: data?.metadata.name ?? Message.fileName, mimeType: result?.headers["Content-Type"] };
					} else {
						return e;
					}
				})));
				await sound.unloadAsync();
			} else {
				setMessages(e => e.map(message => {
					if (message._id === Message._id) {
						return { ...message, audio: result.uri, availableStatus: availableStatus.available, artwork: artwork?.startsWith('file') ? artwork : undefined, musicArtist: data?.metadata.artist ?? '', musicName: data?.metadata.name ?? Message.fileName, mimeType: result?.headers["Content-Type"] };
					} else {
						return message;
					}
				}));
			};
			setProgress((e: any) => e.filter((r: any) => r.id !== Message._id));
		} catch (error) {
			setMessages(e => e.map(message => {
				if (message._id === Message._id) {
					return { ...message, availableStatus: availableStatus.error }
				} else {
					return message
				}
			}));
		}
	};

	const handleCancel = async () => {
		setCancellationId((state) => {
			if (state === undefined) {
				return Message._id
			}
		});
		setMessages(e => e.map(message => {
			if (message._id === Message._id) {
				return { ...message, availableStatus: availableStatus.cancel }
			} else {
				return message
			}
		}));
	};

	const handleErrorMode = () => {
		if (props.user.name === Message.user.name) {
			if (Message?.fileName === "voice") {
				ReSendAudio({ errorId: Message?._id });
			} else {
				ReSendMusic({ errorId: Message?._id });
			}
		} else {
			handleDownload();
		}
	}

	const color = props.position === 'right' ? '#fff' : colors.text === "#F1F6F9" ? '#fff' : '#000';
	const time = formatMillisecondsToTime(Message?.duration);

	let finalMode = undefined;

	const TransferMode = (
		<TouchableOpacity onPress={useThrottle(handleCancel, 2000)} style={[styles.iconContainer, { backgroundColor: colors.undetlay }]}>
			<ActivityIndicator style={[styles.iconContainer, { backgroundColor: colors.undetlay }]} size="large" color="#fff" />
		</TouchableOpacity>
	);

	const AvailableMode = (<TouchableHighlight onPress={isPlaying ? () => stopPlaying({ isForStart: false, isEnded: false }) : () => startPlayingByItem({ item: { audioName: Message.musicName ?? "", id: Message._id, uri: Message.audio ?? '', artist: Message.musicArtist, artwork: Message.artwork }, isMessage: true })} style={[styles.iconContainer, { backgroundColor: colors.undetlay }]}>
		<Ionicons name={isPlaying ? "pause" : "play"} size={30} color="#fff" style={{ marginRight: isPlaying ? 0 : -4 }} />
	</TouchableHighlight>);

	const DownloadMode = (<TouchableHighlight onPress={useThrottle(handleDownload, 2000)} style={[styles.iconContainer, { backgroundColor: colors.undetlay }]}>
		<MaterialCommunityIcons name="download" size={34} color="#fff" />
	</TouchableHighlight>);

	const ErrorMode = (<TouchableOpacity onPress={handleErrorMode} style={[styles.iconContainer, { backgroundColor: colors.red }]}>
		<FontAwesome6 name="exclamation" size={40} color="#fff" />
	</TouchableOpacity>);

	const UploadMode = (<TouchableHighlight onPress={() => { Message?.fileName === "voice" ? ReSendAudio({ errorId: Message?._id }) : ReSendMusic({ errorId: Message?._id }) }} style={[styles.iconContainer, { backgroundColor: colors.undetlay }]}>
		<MaterialCommunityIcons name="upload" size={34} color="#fff" />
	</TouchableHighlight>);

	switch (messageStatus) {
		case availableStatus.available:
			finalMode = AvailableMode;
			break;
		case availableStatus.download:
			finalMode = DownloadMode;
			break;
		case availableStatus.downloading:
			finalMode = TransferMode;
			break;
		case availableStatus.uploading:
			finalMode = TransferMode;
			break;
		case availableStatus.error:
			finalMode = ErrorMode;
			break;
		case availableStatus.cancel:
			finalMode = props.user._id === Message.user._id ? UploadMode : DownloadMode;
			break;
		default:
			finalMode = AvailableMode;
			break;
	};

	const size = selectedProgress?.transferred ? (selectedProgress.transferred + ' / ' + selectedProgress.size) : Message.size ?? '';

	return (
		<View style={{ paddingTop: 10 }}>
			<View style={[{ zIndex: 10, position: 'relative', width: 200, height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden' }]}>
				<View style={{ width: 50, height: 50, borderRadius: 50, marginHorizontal: 10, justifyContent: 'center', alignItems: 'center' }}>
					{finalMode}
				</View>
				<View style={{ marginLeft: 0, marginRight: 'auto', width: 130, overflow: 'hidden' }}>
					<MovingText disable={isPlaying ? false : true} animationThreshold={15} style={[{ color: color, size: 10 }]}>{Message?.musicName ? Message?.musicName : Message?.fileName ? Message?.fileName : 'Voice'}</MovingText>
					<Text numberOfLines={1} style={[{ color: color, fontSize: 12, fontFamily: "Vazirmatn-SemiBold" }]}>{Message?.musicArtist ? Message?.musicArtist : ''}</Text>
					{size ? <Text style={{ color: color, fontFamily: "Vazirmatn-SemiBold" }}>{size}</Text> : null}
				</View>
			</View>
			<View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-end', gap: 10, paddingRight: 10, marginBottom: 5 }}>
				<Text style={{ color, fontSize: 14, fontFamily: "Vazirmatn-SemiBold" }}>{time}</Text>
				{messageStatus === availableStatus.available ? <Pressable onPress={() => save({ uri: Message ? Message?.audio : undefined })}>
					<Text style={{ color, fontSize: 16, fontFamily: "Vazirmatn-SemiBold" }}>Save</Text>
				</Pressable> : null}
			</View>
		</View>
	)
};

// export const renderMessageText = (props: any,{colors}:{colors: typeof darkTheme.colors}) => {
// 	const Message = props.currentMessage.text;
//     // console.log(Message)
// 	return (
// 		<MessageText
// 			{...props}
// 			textStyle={{
// 				left: { color: colors.text === "#F1F6F9" ? '#fff' : '#000' },
// 				right: { color: '#fff' },
// 			}}
// 		/>
// 	)
// };

export const renderCustomMessage = (props: MessageProps<IMessagePro>, { updateSwipeableRef, setReplyMessage }: renderMessageTextProps) => {
	// @ts-ignore
	const cMessage = props.currentMessage;

	const RightAction = () => {
		return (
			<View style={{ width: 70, justifyContent: 'flex-end' }}>
				<View style={{ alignItems: 'center', justifyContent: 'center', height: 40, width: 40, marginBottom: 15, backgroundColor: "#444", borderRadius: 20, marginLeft: 5 }}>
					<FontAwesome6 name="reply" size={22} color="#fff" />
				</View>
			</View>
		);
	}

	const onSwipeOpenAction = () => {
		if (cMessage) {
			setReplyMessage({
				_id: cMessage._id,
				name: cMessage?.user.name,
				text: cMessage?.text,
				musicName: cMessage?.musicName,
				image: cMessage?.image,
				video: cMessage?.video,
				thumbnail: cMessage?.thumbnail,
				preView: cMessage?.preView,
				fileName: cMessage?.fileName,
				mimeType: cMessage?.mimeType
			});
		}
	};

	return (
		<Swipeable ref={updateSwipeableRef} friction={2} rightThreshold={30} renderRightActions={RightAction} onSwipeableOpen={onSwipeOpenAction}>
			<Message {...props} />
		</Swipeable>
	)
};

export function renderSend(props: SendProps<IMessage>, { colors, onSendWithEmptyText }: { colors: typeof darkTheme.colors, onSendWithEmptyText: () => Promise<void> }) {
	return (
		<View style={{ flexDirection: 'row', alignItems: "center" }}>
			<Send {...props}>
				{
					props.text === "" ?
						<Ionicons style={styles.sendIcon} name="send" size={27} color={colors.primary} onPress={onSendWithEmptyText} /> :
						<Ionicons style={styles.sendIcon} name="send" size={27} color={colors.primary} />
				}
			</Send>
		</View>
	)
};

export function renderActions(props: Readonly<ActionsProps>, { setOpen, open, colors }: { setOpen: React.Dispatch<React.SetStateAction<boolean>>, open: boolean, colors: typeof darkTheme.colors }) {
	return (
		<Actions
			{...props}
			icon={() => (
				<Feather name="paperclip" style={{ marginTop: 2 }} size={24} color={colors.primary} />
			)}
			onPressActionButton={() => setOpen(!open)}
		/>
	)
};

export function renderInputToolbar(props: InputToolbarProps<IMessage>, { colors, replyMessage, clearReply, uploadMessage, clearUploadMessage }: { colors: typeof darkTheme.colors, replyMessage: replyMessage, clearReply: () => void, uploadMessage: uploadMessageType | undefined, clearUploadMessage: () => void }) {

	let result;

	switch (true) {
		case !!replyMessage?.text:
			result = { type: 'text', value: replyMessage.text };
			break;
		case !!replyMessage?.musicName:
			result = { type: 'text', value: replyMessage.musicName };
			break;
		case !!replyMessage?.image:
			result = { type: 'image', value: replyMessage.image, text: replyMessage.fileName ?? replyMessage.image.substring(replyMessage.image.lastIndexOf("/") + 1) };
			break;
		case !!replyMessage?.preView:
			result = { type: 'image', value: replyMessage.preView, text: replyMessage.fileName ?? replyMessage?.image?.substring(replyMessage?.image?.lastIndexOf("/") + 1) };
			break;
		case !!replyMessage?.thumbnail:
			result = { type: 'image', value: replyMessage.thumbnail, text: replyMessage.fileName ?? replyMessage?.video?.substring(replyMessage?.video?.lastIndexOf("/") + 1) };
			break;
		case !!replyMessage?.fileName:
			result = { type: 'text', value: replyMessage.fileName };
			break;
		case !!replyMessage?.mimeType:
			result = { type: 'text', value: replyMessage.mimeType };
			break;
		default:
			result = { type: 'text', value: 'Some Reply' };
			break;
	};

	return (
		<View>
			{
				uploadMessage && <View style={{ flexDirection: 'row', alignItems: "center", justifyContent: 'space-between', paddingHorizontal: 15, backgroundColor: colors.card, borderBottomWidth: 1, borderColor: colors.lightText, borderTopRightRadius: 7, borderTopLeftRadius: 7 }}>
					{uploadMessage[0].type === formatType.Image && <View style={{ flexDirection: 'row', alignItems: "center", gap: 7 }}>
						<Image style={{ width: 35, height: 35, marginVertical: 7, borderRadius: 5 }} source={{ uri: uploadMessage[0].uri }} />
						<Text numberOfLines={1} style={{ color: colors.lightText, fontSize: 17, fontFamily: "Vazirmatn-Regular", maxWidth: '83%' }}>{uploadMessage[0].name}</Text>
					</View>}
					{
						uploadMessage[0].type === formatType.File && uploadMessage.length > 1 && <Text style={{ color: colors.lightText, fontSize: 17, fontFamily: "Vazirmatn-SemiBold" }}>upload {uploadMessage.length} items</Text>
					}
					{
						uploadMessage[0].type !== formatType.Image && uploadMessage.length === 1 && <View style={{ flexDirection: 'row', alignItems: "center",width: '90%',justifyContent:'space-between'}}>
							<Text numberOfLines={1} style={{ color: colors.lightText, fontSize: 17, fontFamily: "Vazirmatn-Regular", width: '80%' }}>{uploadMessage[0].name}</Text>
							<Text style={{ color: colors.lightText, fontSize: 17, fontFamily: "Vazirmatn-SemiBold" }}>{uploadMessage[0].size}</Text>
						</View>
					}
					<Ionicons onPress={clearUploadMessage} name='close-circle' size={27} color={colors.red} style={{ marginVertical: 10 }} />
				</View>
			}
			{replyMessage?._id && <View style={{ flexDirection: 'row', alignItems: "center", justifyContent: 'space-between', paddingHorizontal: 15, backgroundColor: colors.card, borderBottomWidth: 1, borderColor: colors.lightText, borderTopRightRadius: 7, borderTopLeftRadius: 7 }}>
				<FontAwesome6 name="reply" size={22} color={colors.primary} />
				<View style={{ flexDirection: "column", width: '75%', paddingTop: 4 }}>
					{replyMessage.name && <Text style={{ color: colors.text, fontSize: 17, marginBottom: -5, fontFamily: "Vazirmatn-SemiBold" }}>Replay to {replyMessage.name}</Text>}
					{result.type === "text" && <Text numberOfLines={1} style={{ color: colors.lightText, fontSize: 17, fontFamily: "Vazirmatn-Regular" }}>{result?.value}</Text>}
					{result.type === "image" && result.value && <View style={{ flexDirection: 'row', alignItems: "center", gap: 7 }}>
						<Image style={{ width: 35, height: 35, marginVertical: 7, borderRadius: 5 }} source={{ uri: result.value }} />
						<Text numberOfLines={1} style={{ color: colors.lightText, fontSize: 17, fontFamily: "Vazirmatn-Regular" }}>{result?.text}</Text>
					</View>}
				</View>
				<Ionicons onPress={clearReply} name='close-circle' size={27} color={colors.red} style={{ marginVertical: 10 }} />
			</View>}
			<InputToolbar
				{...props}
				containerStyle={{
					backgroundColor: colors.card,
					borderTopColor: colors.card,
				}}
				renderComposer={(props) => <Composer textInputStyle={{ color: colors.text }} {...props} />}
			/>
		</View>
	);
};


const styles = StyleSheet.create({
	sendIcon: {
		marginBottom: 6,
		marginRight: 8,
		height: "auto"
	},
	footerChatOpen: {
		shadowColor: '#1F2687',
		shadowOpacity: 0.37,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 8 },
		elevation: 8,
		borderTopLeftRadius: 10,
		borderTopRightRadius: 10,
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.18)',
		flexDirection: 'row',
		justifyContent: 'space-around',
		paddingHorizontal: 10,
		paddingTop: 15,
		backgroundColor: '#fff',
		height: 380,
		position: 'absolute',
		bottom: 0,
		right: 0,
		left: 0,
	},
	iconContainer: {
		width: 50,
		height: 50,
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 50,
	},
	trashIconContainer: {
		position: 'absolute',
		top: '-12%',
		left: '84%',
		transform: [{ translateY: -15 }],
		borderRadius: 50,
		padding: 10
	},
	image: {
		width: 150,
		height: 100,
		borderRadius: 13,
		margin: 3,
		resizeMode: 'cover',
	},
	imageActive: {
		width: '100%',
		flex: 1,
		resizeMode: 'contain',
	},
	download: {
		position: 'absolute',
		left: 75,
		top: 40,
	},
	downloadImg: {
		position: 'absolute',
		left: 52,
		top: 30,
		// zIndex: 50
	}
});
