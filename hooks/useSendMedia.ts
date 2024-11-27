import { ensureDirExists, fileDirectory } from "../utils/directories";
import { getAudioMetadata } from '@missingcore/audio-metadata';
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { encryptData, formatBytes, generateID, isMusicFile } from "../utils/utils";
import { availableStatus, IMessagePro } from "../utils/types";
import baseURL from "../utils/baseURL";
import { GiftedChat } from "react-native-gifted-chat";
import { useCurrentTask, useMessage, useSocket, useTransferredProgress, useUser } from "../socketContext";
import sleep from "../utils/wait";

const wantedTags = ['artist', 'name', 'artwork'] as const;
export type sendImageProps = {
    uri?: string | null,
    mimeType?: string,
    size: string,
    text?: string
};

export type sendVideoProps = {
    uri?: string | null,
    mimeType?: string,
    size: string,
    text?: string
};

export type sendFileProps = {
    uri?: string | null,
    mimeType?: string,
    name?: string,
    size: string,
    text?: string
};

export type sendAudioProps = {
    uri?: string | null,
    duration?: number,
};

type useSendMediaProp = {
    roomId:string,
    isIntractDB:boolean,
    generatedKey:any
};

export default function useSendMedia({ roomId, isIntractDB, generatedKey}: useSendMediaProp) {
    const id = generateID();
    const socket = useSocket(state => state.socket);
    const user: any = useUser(state => state.user);
    const { messages, setMessages } = useMessage();
    const { setProgressThrottled, setProgress } = useTransferredProgress();
    const setTasks = useCurrentTask(state => state.setTasks);

    const SendImage = async ({ uri, mimeType, size, text }: sendImageProps) => {
        if (!uri) return;
        setMessages((prevMessages: IMessagePro[]) => GiftedChat.append(prevMessages, [{ _id: id, text: text??"", createdAt: new Date(), user, image: uri, mimeType, size, availableStatus: availableStatus.uploading }]));
        try {
            const uploadTask = FileSystem.createUploadTask(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file', parameters: { "id": id } }, ({ totalBytesSent, totalBytesExpectedToSend }) => {
                setProgressThrottled(e => {
                    const existingItem = e.find(item => item.id === id);
                    const { format }: any = formatBytes({ bytes: totalBytesExpectedToSend });
                    if (existingItem) {
                        return e.map(obj => {
                            if (obj.id === id) {
                                return {
                                    ...obj,
                                    transferred: formatBytes({ bytes: totalBytesSent, format }).formattedbytes
                                };
                            } else {
                                return obj;
                            }
                        });
                    } else {
                        return [...e, { id, size }];
                    }
                });
            });
            setTasks(state => [...state, { task: uploadTask, id }]);
            const response = await uploadTask.uploadAsync();
            if(text){
                const enc = await encryptData(text, generatedKey);
                text = JSON.stringify(enc)
            };
            if (response?.body === "ok") {
                socket?.emit('sendImage', { _id: id, text: text ?? "", createdAt: new Date(), user, roomId, isIntractDB }, setMessages(e => e.map(message => {
                    if (message._id === id) {
                        return { ...message, availableStatus: availableStatus.available }
                    } else {
                        return message;
                    }
                })));
            } else {
                setMessages(e => e.map(message => {
                    if (message._id === id) {
                        return { ...message, availableStatus: availableStatus.cancel }
                    } else {
                        return message;
                    }
                }));
                console.log('Error uploading image: response not ok', response?.body);
            };
        } catch (error) {
            setMessages(e => e.map(message => {
                if (message._id === id) {
                    return { ...message, availableStatus: availableStatus.error }
                } else {
                    return message;
                }
            }));
            console.error('Error occurred during upload:', error);
        }
        setProgress(e => e.filter(r => r.id !== id));
    };

    const SendVideo = async ({ uri, mimeType, size, text }: sendVideoProps) => {
        if (!uri) return;
        setMessages((prevMessages: IMessagePro[]) => GiftedChat.append(prevMessages, [{ _id: id, text: text??"", size, createdAt: new Date(), user, video: uri, mimeType, availableStatus: availableStatus.uploading }]));
        try {
            const uploadTask = FileSystem.createUploadTask(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file', parameters: { "id": id } }, ({ totalBytesSent, totalBytesExpectedToSend }: any) => {
                setProgressThrottled(e => {
                    const existingItem = e.find(item => item.id === id);
                    const { format }: any = formatBytes({ bytes: totalBytesExpectedToSend });
                    if (existingItem) {
                        return e.map(obj => {
                            if (obj.id === id) {
                                return {
                                    ...obj,
                                    transferred: formatBytes({ bytes: totalBytesSent, format }).formattedbytes
                                };
                            } else {
                                return obj;
                            }
                        });
                    } else {
                        return [...e, { id, size }];
                    }
                });
            });
            setTasks(state => [...state, { task: uploadTask, id }]);
            const response = await uploadTask.uploadAsync();
            if(text){
                const enc = await encryptData(text, generatedKey);
                text = JSON.stringify(enc)
            }
            if (response?.body === "ok") {
                socket?.emit('sendVideo', { _id: id, text: text ?? "", createdAt: new Date(), user, roomId, isIntractDB }, setMessages(e => e.map(message => {
                    if (message._id === id) {
                        return { ...message, availableStatus: availableStatus.available }
                    } else {
                        return message
                    }
                })));
            } else {
                setMessages(e => e.map(message => {
                    if (message._id === id) {
                        return { ...message, availableStatus: availableStatus.cancel }
                    } else {
                        return message;
                    }
                }));
                console.log('Error uploading Video: response not ok', response?.body);
            }
        } catch (error) {
            setMessages(e => e.map(message => {
                if (message._id === id) {
                    return { ...message, availableStatus: availableStatus.error }
                } else {
                    return message;
                }
            }));
            console.error('Error occurred during upload:', error);
        };
        setProgress(e => e.filter(r => r.id !== id));
    };

    const SendFile = async ({ uri, name, mimeType, size, text }: sendFileProps) => {
        if (!uri) return;
        const isMusic = isMusicFile(name);

        if (isMusic) {
            const data = await getAudioMetadata(uri, wantedTags).catch(e => console.log(e));
            let artwork = data?.metadata.artwork?.replace(/^data:image\/[^;]+;base64,/, '');
            if (artwork) {
                await ensureDirExists();
                await FileSystem.writeAsStringAsync(fileDirectory + `${name}-artwork.jpeg`, artwork, { encoding: "base64" }).then(() => {
                    artwork = fileDirectory + `${name}-artwork.jpeg`
                }).catch((e) => {
                    console.log(e, 'cant write artwork')
                })
            }
            const { sound, status } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false });
            // @ts-ignore
            setMessages((prevMessages: IMessagePro[]) => GiftedChat.append(prevMessages, [{ _id: id, text: text??"", createdAt: new Date(), user, audio: uri, fileName: name, size, duration: status?.durationMillis / 1000, playing: false, availableStatus: availableStatus.uploading, artwork: artwork?.startsWith('file') ? artwork : undefined, musicArtist: data?.metadata.artist ?? '', musicName: data?.metadata.name ?? name }]));
            await sound.unloadAsync();
            try {
                const uploadTask = FileSystem.createUploadTask(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file', parameters: { "id": id } }, ({ totalBytesSent, totalBytesExpectedToSend }) => {
                    setProgressThrottled(e => {
                        const existingItem = e.find(item => item.id === id);
                        const { format }: any = formatBytes({ bytes: totalBytesExpectedToSend });
                        if (existingItem) {
                            return e.map(obj => {
                                if (obj.id === id) {
                                    return {
                                        ...obj,
                                        transferred: formatBytes({ bytes: totalBytesSent, format }).formattedbytes
                                    };
                                } else {
                                    return obj;
                                }
                            });
                        } else {
                            return [...e, { id, size }];
                        }
                    });
                });
                setTasks(state => [...state, { task: uploadTask, id }]);
                const response = await uploadTask.uploadAsync();
                if(text){
                    const enc = await encryptData(text, generatedKey);
                    text = JSON.stringify(enc)
                }
                if (response?.body === "ok") {
                    // @ts-ignore
                    socket?.emit('sendAudio', { _id: id, text: text ?? "", createdAt: new Date(), user, roomId, fileName: name, duration: status?.durationMillis / 1000, isIntractDB }, setMessages(e => e.map(message => {
                        if (message._id === id) {
                            return { ...message, availableStatus: availableStatus.available }
                        } else {
                            return message
                        }
                    })));
                } else {
                    setMessages(e => e.map(message => {
                        if (message._id === id) {
                            return { ...message, availableStatus: availableStatus.cancel }
                        } else {
                            return message;
                        }
                    }));
                    console.log('error uploading music');
                };
            } catch (error) {
                setMessages(e => e.map(message => {
                    if (message._id === id) {
                        return { ...message, availableStatus: availableStatus.error }
                    } else {
                        return message;
                    }
                }));
                console.error('Error occurred during upload:', error);
            };
            setProgress(e => e.filter(r => r.id !== id));
        } else {
            setMessages((prevMessages: IMessagePro[]) => GiftedChat.append(prevMessages, [{ _id: id, text: text??"", createdAt: new Date(), user, size, file: uri, fileName: name, mimeType, availableStatus: availableStatus.uploading }]));
            try {
                const uploadTask = FileSystem.createUploadTask(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file', parameters: { "id": id } }, ({ totalBytesSent, totalBytesExpectedToSend }) => {
                    setProgressThrottled(e => {
                        const existingItem = e.find(item => item.id === id);
                        const { format }: any = formatBytes({ bytes: totalBytesExpectedToSend });
                        if (existingItem) {
                            return e.map(obj => {
                                if (obj.id === id) {
                                    return {
                                        ...obj,
                                        transferred: formatBytes({ bytes: totalBytesSent, format }).formattedbytes
                                    };
                                } else {
                                    return obj;
                                }
                            });
                        } else {
                            return [...e, { id: id, size }];
                        }
                    });
                });
                setTasks(state => [...state, { task: uploadTask, id }]);
                const response = await uploadTask.uploadAsync();
                if(text){
                    const enc = await encryptData(text, generatedKey);
                    text = JSON.stringify(enc)
                }
                if (response?.body === "ok") {
                    socket?.emit('sendFile', { _id: id, text: text ?? "", createdAt: new Date(), user, roomId, fileName: name, isIntractDB }, setMessages(e => e.map(message => {
                        if (message._id === id) {
                            return { ...message, availableStatus: availableStatus.available }
                        } else {
                            return message
                        }
                    })));
                } else {
                    setMessages(e => e.map(message => {
                        if (message._id === id) {
                            return { ...message, availableStatus: availableStatus.cancel }
                        } else {
                            return message;
                        }
                    }));
                    console.log('error uploading file');
                };
            } catch (error) {
                setMessages(e => e.map(message => {
                    if (message._id === id) {
                        return { ...message, availableStatus: availableStatus.error }
                    } else {
                        return message;
                    }
                }));
                console.error('Error occurred during upload:', error);
            };
            setProgress(e => e.filter(r => r.id !== id));
            await sleep(700);
        }
    };

    const SendAudio = async ({ uri, duration }: sendAudioProps) => {
        if (!uri) return;
        const info = await FileSystem.getInfoAsync(uri);
        // @ts-ignore
        const { formattedbytes, format } = formatBytes({bytes:info.size});
        const size = `${formattedbytes} ${format}`

        setMessages((prevMessages: IMessagePro[]) => GiftedChat.append(prevMessages, [{ _id: id, text: "", createdAt: new Date(), user, audio: uri, fileName: "voice", size, duration, playing: false, availableStatus: availableStatus.uploading }]));
        try {
            const uploadTask = FileSystem.createUploadTask(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file', parameters: { "id": id } }, ({ totalBytesSent, totalBytesExpectedToSend }) => {
                setProgressThrottled(e => {
                    const existingItem = e.find(item => item.id === id);
                    const { format }: any = formatBytes({ bytes: totalBytesExpectedToSend });
                    if (existingItem) {
                        return e.map(obj => {
                            if (obj.id === id) {
                                return {
                                    ...obj,
                                    transferred: formatBytes({ bytes: totalBytesSent, format }).formattedbytes
                                };
                            } else {
                                return obj;
                            }
                        });
                    } else {
                        return [...e, { id, size }];
                    }
                });
            });
            setTasks(state => [...state, { task: uploadTask, id }]);
            const response = await uploadTask.uploadAsync();
            if (response?.body === "ok") {
                socket?.emit('sendAudio', { _id: id, text: "", createdAt: new Date(), user, roomId, fileName: "voice", duration, isIntractDB }, setMessages(e => e.map(message => {
                    if (message._id === id) {
                        return { ...message, availableStatus: availableStatus.available }
                    } else {
                        return message
                    }
                })));
            } else {
                setMessages(e => e.map(message => {
                    if (message._id === id) {
                        return { ...message, availableStatus: availableStatus.cancel }
                    } else {
                        return message;
                    }
                }));
                console.log('error uploading audio');
            };
        } catch (error) {
            setMessages(e => e.map(message => {
                if (message._id === id) {
                    return { ...message, availableStatus: availableStatus.error }
                } else {
                    return message;
                }
            }));
            console.error('Error occurred during upload:', error);
        }
        setProgress(e => e.filter(r => r.id !== id));
    };

    const ReSendImage = async ({ errorId }: { errorId?: string | number }) => {
        if (!errorId) return;
        try {
            setMessages(e => e.map(message => {
                if (message._id === errorId) {
                    return { ...message, availableStatus: availableStatus.uploading }
                } else {
                    return message;
                }
            }));
            let oldMessage = messages.find(e => e._id === errorId);
            let uri = oldMessage?.image;
            if (!uri) return;
            const uploadTask = FileSystem.createUploadTask(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file', mimeType: oldMessage?.mimeType, parameters: { "id": String(errorId) } }, ({ totalBytesSent, totalBytesExpectedToSend }) => {
                setProgressThrottled(e => {
                    const existingItem = e.find(item => item.id === errorId);
                    const { format }: any = formatBytes({ bytes: totalBytesExpectedToSend });
                    if (existingItem) {
                        return e.map(obj => {
                            if (obj.id === errorId) {
                                return {
                                    ...obj,
                                    transferred: formatBytes({ bytes: totalBytesSent, format }).formattedbytes
                                };
                            } else {
                                return obj;
                            }
                        });
                    } else {
                        return [...e, { id: errorId, size: oldMessage?.size }];
                    }
                });
            });
            setTasks(state => [...state, { task: uploadTask, id: errorId }]);
            const response = await uploadTask.uploadAsync();
            if(oldMessage?.text){
                const enc = await encryptData(oldMessage?.text, generatedKey);
                oldMessage.text = JSON.stringify(enc)
            }
            if (response?.body === "ok") {
                socket?.emit('sendImage', { _id: errorId, text: oldMessage?.text??"", createdAt: oldMessage?.createdAt, user: oldMessage?.user, roomId, mimeType: oldMessage?.mimeType, size:oldMessage?.size, isIntractDB }, setMessages(e => e.map(message => {
                    if (message._id === errorId) {
                        return { ...message, availableStatus: availableStatus.available }
                    } else {
                        return message
                    }
                })));
            } else {
                setMessages(e => e.map(message => {
                    if (message._id === errorId) {
                        return { ...message, availableStatus: availableStatus.cancel }
                    } else {
                        return message;
                    }
                }));
                console.log('error uploading file');
            };
        } catch (error) {
            setMessages(e => e.map(message => {
                if (message._id === errorId) {
                    return { ...message, availableStatus: availableStatus.error }
                } else {
                    return message;
                }
            }));
            console.error('Error occurred during upload:', error);
        };
        setProgress(e => e.filter(r => r.id !== errorId));
        return;
    };

    const ReSendVideo = async ({ errorId }: { errorId?: string | number }) => {
        if (!errorId) return;
        try {
            setMessages(e => e.map(message => {
                if (message._id === errorId) {
                    return { ...message, availableStatus: availableStatus.uploading }
                } else {
                    return message;
                }
            }));
            let oldMessage = messages.find(e => e._id === errorId);
            let uri = oldMessage?.video;
            if (!uri) return;
            const uploadTask = FileSystem.createUploadTask(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file', mimeType: oldMessage?.mimeType, parameters: { "id": String(errorId) } }, ({ totalBytesSent, totalBytesExpectedToSend }: any) => {
                setProgressThrottled(e => {
                    const existingItem = e.find(item => item.id === errorId);
                    const { format }: any = formatBytes({ bytes: totalBytesExpectedToSend });
                    if (existingItem) {
                        return e.map(obj => {
                            if (obj.id === errorId) {
                                return {
                                    ...obj,
                                    transferred: formatBytes({ bytes: totalBytesSent, format }).formattedbytes
                                };
                            } else {
                                return obj;
                            }
                        });
                    } else {
                        return [...e, { id: errorId, size: oldMessage?.size }];
                    }
                });
            });
            setTasks(state => [...state, { task: uploadTask, id: errorId }]);
            const response = await uploadTask.uploadAsync();
            if(oldMessage?.text){
                const enc = await encryptData(oldMessage?.text, generatedKey);
                oldMessage.text = JSON.stringify(enc)
            }
            if (response?.body === "ok") {
                socket?.emit('sendVideo', { _id: errorId, text: oldMessage?.text??"", createdAt: oldMessage?.createdAt, user: oldMessage?.user, roomId, mimeType: oldMessage?.mimeType, isIntractDB }, setMessages(e => e.map(message => {
                    if (message._id === errorId) {
                        return { ...message, availableStatus: availableStatus.available }
                    } else {
                        return message
                    }
                })));
            } else {
                setMessages(e => e.map(message => {
                    if (message._id === errorId) {
                        return { ...message, availableStatus: availableStatus.cancel }
                    } else {
                        return message;
                    }
                }));
                console.log('error uploading video');
            };
        } catch (error) {
            setMessages(e => e.map(message => {
                if (message._id === errorId) {
                    return { ...message, availableStatus: availableStatus.error }
                } else {
                    return message;
                }
            }));
            console.error('Error occurred during upload:', error);
        };
        setProgress(e => e.filter(r => r.id !== errorId));
        return;
    };

    const ReSendMusic = async ({ errorId }: { errorId?: string | number }) => {
        if (!errorId) return;
        try {
            setMessages(e => e.map(message => {
                if (message._id === errorId) {
                    return { ...message, availableStatus: availableStatus.uploading }
                } else {
                    return message;
                }
            }));
            let oldMessage = messages.find(e => e._id === errorId);
            let uri = oldMessage?.audio;
            if (!uri) return;
            const uploadTask = FileSystem.createUploadTask(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file', parameters: { "id": String(errorId) } }, ({ totalBytesSent, totalBytesExpectedToSend }) => {
                setProgressThrottled(e => {
                    const existingItem = e.find(item => item.id === errorId);
                    const {  format }: any = formatBytes({ bytes: totalBytesExpectedToSend });
                    if (existingItem) {
                        return e.map(obj => {
                            if (obj.id === errorId) {
                                return {
                                    ...obj,
                                    transferred: formatBytes({ bytes: totalBytesSent, format }).formattedbytes
                                };
                            } else {
                                return obj;
                            }
                        });
                    } else {
                        return [...e, { id: errorId, size: oldMessage?.size }];
                    }
                });
            });
            setTasks(state => [...state, { task: uploadTask, id: errorId }]);
            const response = await uploadTask.uploadAsync();
            if(oldMessage?.text){
                const enc = await encryptData(oldMessage?.text, generatedKey);
                oldMessage.text = JSON.stringify(enc)
            }
            if (response?.body === "ok") {
                console.log({ _id: errorId, text: oldMessage?.text??"", createdAt: oldMessage?.createdAt, user: oldMessage?.user, roomId, fileName: oldMessage?.fileName, duration: oldMessage?.duration, isIntractDB })
                // socket?.emit('sendAudio', { _id: id, text: text ?? "", createdAt: new Date(), user, roomId, fileName: name, duration: status?.durationMillis / 1000, isIntractDB }, setMessages(e => e.map(message => {
                socket?.emit('sendAudio', { _id: errorId, text: oldMessage?.text??"", createdAt: oldMessage?.createdAt, user: oldMessage?.user, roomId, fileName: oldMessage?.fileName, duration: oldMessage?.duration, isIntractDB }, setMessages(e => e.map(message => {
                    if (message._id === errorId) {
                        return { ...message, availableStatus: availableStatus.available }
                    } else {
                        return message
                    }
                })));
            } else {
                setMessages(e => e.map(message => {
                    if (message._id === errorId) {
                        return { ...message, availableStatus: availableStatus.cancel }
                    } else {
                        return message;
                    }
                }));
                console.log('error uploading music');
            };
        } catch (error) {
            setMessages(e => e.map(message => {
                if (message._id === errorId) {
                    return { ...message, availableStatus: availableStatus.error }
                } else {
                    return message;
                }
            }));
            console.error('Error occurred during upload:', error);
        };
        setProgress(e => e.filter(r => r.id !== errorId));
        return;
    };

    const ReSendFile = async ({ errorId }: { errorId?: string | number }) => {
        if (!errorId) return;
        try {
            setMessages(e => e.map(message => {
                if (message._id === errorId) {
                    return { ...message, availableStatus: availableStatus.uploading }
                } else {
                    return message;
                }
            }));
            let oldMessage = messages.find(e => e._id === errorId);
            const uri = oldMessage?.file;
            if (!uri) return;
            const uploadTask = FileSystem.createUploadTask(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file', mimeType: oldMessage.mimeType, parameters: { "id": String(errorId) } }, ({ totalBytesSent, totalBytesExpectedToSend }) => {
                setProgressThrottled(e => {
                    const existingItem = e.find(item => item.id === errorId);
                    const { format }: any = formatBytes({ bytes: totalBytesExpectedToSend });
                    if (existingItem) {
                        return e.map(obj => {
                            if (obj.id === errorId) {
                                return {
                                    ...obj,
                                    transferred: formatBytes({ bytes: totalBytesSent, format }).formattedbytes
                                };
                            } else {
                                return obj;
                            }
                        });
                    } else {
                        return [...e, { id: errorId, size: oldMessage?.size }];
                    }
                });
            });
            setTasks(state => [...state, { task: uploadTask, id: errorId }]);
            const response = await uploadTask.uploadAsync();
            if(oldMessage?.text){
                const enc = await encryptData(oldMessage?.text, generatedKey);
                oldMessage.text = JSON.stringify(enc)
            }
            if (response?.body === "ok") {
                socket?.emit('sendFile', { _id: errorId, text: oldMessage?.text??"", createdAt: oldMessage?.createdAt, user: oldMessage?.user, roomId, fileName: oldMessage?.fileName, mimeType: oldMessage?.mimeType, isIntractDB }, setMessages(e => e.map(message => {
                    if (message._id === errorId) {
                        return { ...message, availableStatus: availableStatus.available }
                    } else {
                        return message
                    }
                })));
            } else {
                setMessages(e => e.map(message => {
                    if (message._id === errorId) {
                        return { ...message, availableStatus: availableStatus.cancel }
                    } else {
                        return message;
                    }
                }));
                console.log('error uploading file');
            };
        } catch (error) {
            setMessages(e => e.map(message => {
                if (message._id === errorId) {
                    return { ...message, availableStatus: availableStatus.error }
                } else {
                    return message;
                }
            }));
            console.error('Error occurred during upload:', error);
        };
        setProgress(e => e.filter(r => r.id !== errorId));
        return;
    };

    const ReSendAudio = async ({ errorId }: { errorId?: string | number }) => {
        if (!errorId) return;
        try {
            setMessages(e => e.map(message => {
                if (message._id === errorId) {
                    return { ...message, availableStatus: availableStatus.uploading }
                } else {
                    return message;
                }
            }));
            let oldMessage = messages.find(e => e._id === errorId);
            const uri = oldMessage?.audio;
            if (!uri) return;
            const uploadTask = FileSystem.createUploadTask(`${baseURL()}/upload`, uri, { uploadType: FileSystem.FileSystemUploadType.MULTIPART, httpMethod: 'POST', fieldName: 'file', mimeType: oldMessage.mimeType, parameters: { "id": String(errorId) } }, ({ totalBytesSent, totalBytesExpectedToSend }) => {
                setProgressThrottled(e => {
                    const existingItem = e.find(item => item.id === errorId);
                    const { format }: any = formatBytes({ bytes: totalBytesExpectedToSend });
                    if (existingItem) {
                        return e.map(obj => {
                            if (obj.id === errorId) {
                                return {
                                    ...obj,
                                    transferred: formatBytes({ bytes: totalBytesSent, format }).formattedbytes
                                };
                            } else {
                                return obj;
                            }
                        });
                    } else {
                        return [...e, { id: errorId, size: oldMessage?.size }];
                    }
                });
            });
            setTasks(state => [...state, { task: uploadTask, id: errorId }]);
            const response = await uploadTask.uploadAsync();
            if(oldMessage?.text){
                const enc = await encryptData(oldMessage?.text, generatedKey);
                oldMessage.text = JSON.stringify(enc)
            }
            if (response?.body === "ok") {
                socket?.emit('sendAudio', { _id: errorId, text: oldMessage?.text??"", createdAt: oldMessage?.createdAt, roomId, user: oldMessage?.user, fileName: "voice", duration: oldMessage?.duration, isIntractDB }, setMessages(e => e.map(message => {
                    if (message._id === errorId) {
                        return { ...message, availableStatus: availableStatus.available }
                    } else {
                        return message
                    }
                })));
            } else {
                setMessages(e => e.map(message => {
                    if (message._id === errorId) {
                        return { ...message, availableStatus: availableStatus.cancel }
                    } else {
                        return message;
                    }
                }));
                console.log('error uploading file');
            };
        } catch (error) {
            setMessages(e => e.map(message => {
                if (message._id === errorId) {
                    return { ...message, availableStatus: availableStatus.error }
                } else {
                    return message;
                }
            }));
            console.error('Error occurred during upload:', error);
        };
        setProgress(e => e.filter(r => r.id !== errorId));
        return;
    };

    return { SendImage, SendVideo, SendFile, SendAudio, ReSendImage, ReSendVideo, ReSendMusic, ReSendFile, ReSendAudio };
}