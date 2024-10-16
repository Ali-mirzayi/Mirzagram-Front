import { TouchableHighlight, StyleSheet, TextInput } from 'react-native'
import { useEffect, useRef, useState } from 'react'
import { Ionicons } from "@expo/vector-icons";
import Animated, { useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import OutsidePressHandler from 'react-native-outside-press';
import { User } from '../utils/types';
import { useSocket, useUser } from '../socketContext';
import useDebounce from '../hooks/useDebounce';
import { useTranslate } from '../language/useTranslate';
import { useIsFocused } from '@react-navigation/native';

type props = {
    setUsers: React.Dispatch<React.SetStateAction<[] | User[]>>,
    setScreen: React.Dispatch<React.SetStateAction<"users" | "rooms">>
};

export default function SearchBar({ setUsers, setScreen }: props) {
    const user = useUser(state => state.user);
    const [search, setSearch] = useState<string | undefined>();
    const width = useSharedValue(50);
    const inputRef = useRef<TextInput>(null);
    const socket = useSocket(state => state.socket);
    const debouncedInputValue = useDebounce(search?.toLocaleLowerCase(), 500);
    const { i18n } = useTranslate();
    const isFocused = useIsFocused();

    const handlePressIn = () => {
        width.value = withTiming(175, { duration: 500 });
        inputRef.current?.focus();
    };

    const handlePressOut = () => {
        width.value = withDelay(500, withTiming(50, { duration: 500 }));
        inputRef.current?.blur();
    };

    const handleSearch = (e: string) => {
        setSearch(e);
        if (!e) {
            setUsers([]);
            setScreen("rooms");
        } else {
            setScreen("users");
        }
    }

    useEffect(() => {
        if (!debouncedInputValue) return;
        socket?.emit("findUser", { search: debouncedInputValue, user: user });
        socket?.on("findUser", (roomChats: any) => setUsers(roomChats));
    }, [debouncedInputValue]);

    useEffect(() => {
        if (!isFocused) {
            setSearch(undefined);
            setUsers([]);
            setScreen("rooms");
        }
        // if (isFocused) {
        //     // if (!user) return;
        //     // socket?.emit("setSocketIdAndjoin", user?._id);
        // } else {
        //     setSearch(undefined);
        //     setUsers([]);
        //     setScreen("rooms");
        // }
    }, [isFocused]);

    return (
        <OutsidePressHandler onOutsidePress={handlePressOut} style={styles.container}>
            <Animated.View style={[styles.inner, { width }]}>
                <TextInput ref={inputRef} placeholder={i18n.t("SearchUser")} value={search} onChangeText={handleSearch} style={styles.Input} />
                <TouchableHighlight style={styles.icon} onPress={handlePressIn} underlayColor={"#c8cce0"}>
                    <Ionicons name='search' size={25} color='#3F72AF' />
                </TouchableHighlight>
            </Animated.View>
        </OutsidePressHandler>
    )
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    inner: {
        position: 'relative',
        backgroundColor: "#DBE2EF",
        borderRadius: 10,
        flexDirection: "row",
        alignItems: 'center',
        justifyContent: "flex-end",
        zIndex: 1000,
        overflow: "hidden",
        height: 40,
        width: 50,
    },
    icon: {
        position: "absolute",
        right: 0,
        padding: 12,
        zIndex: 100
    },
    Input: {
        position: "absolute",
        fontSize: 16,
        height: 35,
        width: "70%",
        right: 50,
        paddingLeft: 8,
        textAlign: 'left',
        fontFamily: "Vazirmatn-SemiBold"
    }
})