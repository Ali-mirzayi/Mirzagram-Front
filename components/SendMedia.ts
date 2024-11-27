import { RecordingEnum } from "../utils/types";
import { Audio } from "expo-av";
import * as MediaLibrary from 'expo-media-library';
import Toast from "react-native-toast-message";
import * as FileSystem from 'expo-file-system';

let recordingObg: Audio.Recording | undefined = undefined;

type startRecordingProps = {
    setRecording: React.Dispatch<React.SetStateAction<RecordingEnum>>,
    handleAudioPermissions: () => Promise<boolean>,
    permissionResponse: Audio.PermissionResponse | null,
    recording: RecordingEnum
};

export async function startRecording({ setRecording, handleAudioPermissions, permissionResponse }: startRecordingProps) {
    try {
        setRecording(RecordingEnum.start);
        if (permissionResponse?.status !== 'granted') {
            await handleAudioPermissions();
            return;
        };
        recordingObg = new Audio.Recording();
        await recordingObg.prepareToRecordAsync(
            Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        await recordingObg.startAsync();
    } catch (err) {
        recordingObg = undefined;
        setRecording(RecordingEnum.cancel);
    }
};

type stopRecordingProps = {
    setRecording: React.Dispatch<React.SetStateAction<RecordingEnum>>
    SendAudio: ({ uri, duration }: {
        uri: any;
        duration: number;
    }) => Promise<void>
};

export async function stopRecording({ setRecording, SendAudio }: stopRecordingProps) {
    setRecording(RecordingEnum.stop);
    await recordingObg?.stopAndUnloadAsync();
    const duration = recordingObg?._finalDurationMillis ? recordingObg?._finalDurationMillis / 1000 : 0;
    const uri = recordingObg?.getURI();
    SendAudio({ uri, duration });
    recordingObg = undefined;
};

type cancelRecordingProps = {
    setRecording: React.Dispatch<React.SetStateAction<RecordingEnum>>,
};

export async function cancelRecording({ setRecording }: cancelRecordingProps) {
    setRecording(RecordingEnum.stop);
    await recordingObg?.stopAndUnloadAsync();
    recordingObg = undefined;
};

export const save = async ({ uri, mimeType, fileName }: { uri: string | undefined, mimeType?: string, fileName?: string }) => {
    if (!uri) return;
    if (mimeType && fileName) {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
            try {
                await FileSystem.StorageAccessFramework.createFileAsync(permissions.directoryUri, fileName,mimeType)
                    .then(async (newUri) => {
                        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
                        await FileSystem.writeAsStringAsync(newUri, base64, { encoding: FileSystem.EncodingType.Base64 });
                    }).then(() => {
                        Toast.show({
                            type: 'success',
                            text1: 'file saved.',
                            autoHide: true,
                            visibilityTime: 2500
                        });
                    })
                    .catch(() => {
                        Toast.show({
                            type: 'error',
                            text1: 'Error cant save.',
                            text2: 'Unable to write',
                            autoHide: false
                        });
                    });
            } catch (error) {
                Toast.show({
                    type: 'error',
                    text1: 'error cant save.',
                    autoHide: false,
                });
            }
        } else {
            Toast.show({
                type: 'error',
                text1: 'error cant save.',
                text2: `Need Storage permission status`,
                autoHide: false,
            });
        }
    } else {
        const { status } = await MediaLibrary.getPermissionsAsync();
        if (status === 'granted') {
            try {
                await MediaLibrary.saveToLibraryAsync(uri).then(() => {
                    Toast.show({
                        type: 'success',
                        text1: 'file saved.',
                        autoHide: true,
                        visibilityTime: 2500
                    });
                }).catch(e => console.log(e))
            } catch (error) {
                Toast.show({
                    type: 'error',
                    text1: 'Error cant save.',
                    text2: 'unable to save',
                    autoHide: false
                });
            }
        } else {
            await MediaLibrary.requestPermissionsAsync();
            Toast.show({
                type: 'error',
                text1: 'error cant save.',
                text2: `Need Storage permission status ${status}`,
                autoHide: false,
            });
        }
    }
}