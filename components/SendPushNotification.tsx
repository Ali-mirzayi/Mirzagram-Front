import { Text, StyleSheet, TextInput, View, Button, ToastAndroid } from 'react-native'
import useTheme from '../utils/theme';
import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from 'react';
import * as Notifications from "expo-notifications";
import baseURL from '../utils/baseURL';
import { User } from '../utils/types';
import { useTranslate } from '../language/useTranslate';


export default function PushNotificationSend({ user, contactToken,roomId }: { user: User, contactToken: Notifications.ExpoPushToken,roomId: string | undefined }) {
    const { colors } = useTheme();
    const [open, setOpen] = useState(true);
    const [value, setValue] = useState<string>("");
    const { i18n } = useTranslate();


    type props = {
        user: User;
        message: string;
        token: any;
        roomId:string | undefined;
        type: "send" | "here"
    }
    
    const notificationSend: props = { user, message: value, token: contactToken?.data,roomId, type: 'send' }
    const notificationHere: props = { user, message: 'I`m in room', token: contactToken?.data,roomId, type: 'here' }

    const handlePress = async (props: props) => {
        if (!user.name || (props.type === 'send' && value === "") || !contactToken || !roomId) return;
        try {
            const response = await fetch(`${baseURL()}/sendPushNotifications`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(props)
            });
            const result = await response.json();
            if (result.status === "ok") {
                ToastAndroid.showWithGravity('Request sent successfully!', ToastAndroid.SHORT, ToastAndroid.TOP);
            } else {
                ToastAndroid.showWithGravity('Some thing went wrong!', ToastAndroid.SHORT, ToastAndroid.TOP);
            }
        } catch (err) {
            console.log('send notification error', err)
        }
    }

    if (open) {
        return (
            <View style={[styles.container, StyleSheet.absoluteFill]} >
                <View style={[styles.modal, { backgroundColor: colors.card }]}>
                    <Ionicons onPress={() => setOpen(false)} name='close-circle' size={35} color={colors.red} style={{ marginVertical: 15 }} />
                    <Text style={[styles.Available, { color: colors.text,fontFamily: "Vazirmatn-SemiBold" }]}>{i18n.t("UserAvailable")}</Text>
                    <Text style={[styles.Notification, { color: colors.text,fontFamily: "Vazirmatn-SemiBold" }]}>{i18n.t("MessageNotification")}</Text>
                    <TextInput style={[styles.Input, { color: colors.text, borderColor: colors.mirza,fontFamily: "Vazirmatn-SemiBold" }]} blurOnSubmit placeholderTextColor={colors.mirza} placeholder='Message...' onChangeText={setValue} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 20 }}>
                        <View style={{ width: '42%' }}>
                            <Button title={i18n.t("Send")} onPress={() => handlePress(notificationSend)} />
                        </View>
                        <View style={{ width: '42%' }}>
                            <Button title={i18n.t("Ihere")}  onPress={() => handlePress(notificationHere)} />
                        </View>
                    </View>
                </View>
            </View>
        )
    } else {
        return null
    }
}


const styles = StyleSheet.create({
    container: {
        zIndex: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modal: {
        paddingHorizontal: 20,
        paddingTop: 5,
        paddingBottom: 25,
        borderRadius: 10
    },
    Available: {
        fontSize: 22,
    },
    Notification: {
        fontSize: 18,
    },
    Input: {
        letterSpacing: 1.5,
        marginTop: 50,
        fontSize: 18,
        borderRadius: 4,
        width: 300,
        height: 50,
        borderWidth: 3,
        paddingVertical: 7,
        paddingHorizontal: 12,
        zIndex: 20
    },
})