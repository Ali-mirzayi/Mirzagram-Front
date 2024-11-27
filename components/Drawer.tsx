import { Drawer } from 'react-native-drawer-layout';
import React, { useState, useRef, useCallback, useEffect } from "react";
import { View, Text, Animated, StyleSheet, Easing, Pressable, TouchableHighlight, ScrollView, Dimensions } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Checkbox from 'expo-checkbox';
import Link from "../utils/Link";
import { storage } from "../mmkv";
import LottieView from 'lottie-react-native';
import useTheme from "../utils/theme";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { DrawerCoreType } from "../utils/types";
import { useBeCheck, useUser } from '../socketContext';
import switchTheme from 'react-native-theme-switch-animation';
import sleep from '../utils/wait';
import { useTranslate } from '../language/useTranslate';
import { startActivityAsync } from 'expo-intent-launcher';

export default function DrawerCore({ children, open, setOpen, darkMode, setDarkMode }: DrawerCoreType) {
    const user = useUser(state => state.user);
    const beCheck = useBeCheck(state => state.beCheck);
    const { colors } = useTheme();
    const toggleRef = useRef(new Animated.Value(darkMode === true ? 0.5 : 0)).current;
    const AnimatedLottieView = Animated.createAnimatedComponent(LottieView);
    const [isChecked, setChecked] = useState<boolean>(false);
    const navigation = useNavigation();
    const hasMounted = useRef(false);
    const { i18n, setLocale, locale } = useTranslate();
    const screenDimensions = Dimensions.get('window');

    const DrawerComponent = () => {
        async function onPressHandler() {
            setDarkMode(e => !e);
            await sleep(1000);
            storage.set("darkMode", !darkMode);
            switchTheme({
                switchThemeFunction: () => { },
                animationConfig: {
                    type: !darkMode ? 'circular' : 'inverted-circular',
                    duration: 800,
                    startingPoint: {
                        cxRatio: 0.58,
                        cyRatio: 0.06
                    },
                    captureType: "layer"
                },
            })
        };

        function onValueChange() {
            setChecked(e => !e)
            storage.set("clearAll", !isChecked);
        };

        const openApp = async () => {
            try {
                await startActivityAsync('android.intent.action.VIEW', {
                    data: 'myket://details?id=com.services.mirzagram',
                    flags: 1,
                });
            } catch (error) {
                console.log(error)
            }
        };

        return (
            <ScrollView style={{ flex: 1, backgroundColor: colors.red }}>
                <View style={{ flex: 1, height: screenDimensions.height, backgroundColor: colors.background }}>
                    <Text style={[styles.user, { color: colors.mirza,fontSize:27, fontFamily: "Vazirmatn-Bold" }]}>{user?.name}</Text>
                    <Pressable onPress={onPressHandler} style={{ zIndex: 9999, margin: 10 }} >
                        <AnimatedLottieView
                            progress={toggleRef}
                            source={require('../assets/toggle2.json')}
                            style={styles.darkMode}
                        />
                    </Pressable>
                    <View style={styles.navigation}>
                        <Link url={'https://www.linkedin.com/in/alimirzaeizade/'}>
                            <View style={styles.indIcon}>
                                <Ionicons name="logo-linkedin" size={36} color="#317daf" />
                                <Text style={{ color: colors.text, fontSize: 18, fontFamily: "Vazirmatn-SemiBold" }}>Linkedin</Text>
                            </View>
                        </Link>
                        <Link url={"https://github.com/Ali-mirzayi"}>
                            <View style={styles.indIcon}>
                                <Ionicons name="logo-github" size={38} color="black" />
                                <Text style={{ color: colors.text, fontSize: 18, fontFamily: "Vazirmatn-SemiBold" }}>GitHub</Text>
                            </View>
                        </Link>
                        <Link url={"https://alimirzaei.vercel.app"}>
                            <View style={styles.indIcon}>
                                <MaterialCommunityIcons name="web" size={40} color="black" />
                                <Text style={{ color: colors.text, fontSize: 18, fontFamily: "Vazirmatn-SemiBold" }}>Web Site</Text>
                            </View>
                        </Link>
                    </View>
                    <TouchableHighlight style={[styles.ButtonContainer, { width: locale === 'fa' ? '60%' : '70%' }]} onPress={() => setLocale(e => e === 'en' ? 'fa' : 'en')}>
                        <Text style={[styles.Button, { fontSize: 17, fontFamily: "Vazirmatn-SemiBold" }]}>{i18n.t("switchLang")}</Text>
                    </TouchableHighlight>
                    <TouchableHighlight onPress={openApp} style={[styles.ButtonContainer, { width: locale === 'fa' ? '60%' : '70%' }]}>
                        <Text style={[styles.Button, { fontSize: 17, fontFamily: "Vazirmatn-SemiBold" }]}>{i18n.t("OpenMyket")}</Text>
                    </TouchableHighlight>
                    <TouchableHighlight underlayColor={colors.undetlay} onPress={onValueChange} style={{ backgroundColor: isChecked ? '#3e6b64' : 'transparent', marginTop: 30,paddingVertical:10 }}>
                        <View style={{ alignItems: 'center', flexDirection: locale === 'en' ? 'row' : 'row-reverse', marginHorizontal: 'auto', gap: 5 }}>
                            <Text style={{ color: isChecked ? '#fff' : colors.text, fontFamily: "Vazirmatn-SemiBold" }}>{i18n.t("RemoveData")}</Text>
                            <Checkbox
                                value={isChecked}
                                color={isChecked ? '#4630EB' : undefined}
                                onValueChange={onValueChange}
                                style={styles.removeCheck}
                            />
                        </View>
                    </TouchableHighlight>
                </View>
            </ScrollView>
        )
    };

    useEffect(() => {
        if (hasMounted.current) {
            storage.set("darkMode", !darkMode);
            Animated.timing(toggleRef, {
                toValue: darkMode ? 0.4 : 0,
                duration: 750,
                easing: Easing.linear,
                useNativeDriver: true,
            }).start();
        } else {
            hasMounted.current = true;
        };
    }, [darkMode]);

    useFocusEffect(
        useCallback(() => {
            const unsubscribe = navigation.addListener('focus', () => {
                setChecked(beCheck);
                storage.set("clearAll", beCheck);
            })
            return unsubscribe;
        }, [])
    );

    return (
        <Drawer
            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            renderDrawerContent={DrawerComponent}
        >
            {children}
        </Drawer>
    );
};

const styles = StyleSheet.create({
    chatheading: {
        fontSize: 22,
    },
    user: {
        position: "absolute",
        left: 16,
        top: 27
    },
    darkMode: {
        width: 85,
        height: 85,
        marginLeft: "auto",
    },
    navigation: {
        marginTop: "auto",
        marginBottom: "auto",
        marginRight: 'auto'
    },
    indIcon: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 20,
        marginVertical: 10,
        gap: 30
    },
    removeContainer: {
        marginTop: "auto",
        marginBottom: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    removeCheck: {
        marginHorizontal: 10,
        width: 25,
        height: 25,
    },
    ButtonContainer: {
        marginTop: 20,
        backgroundColor: "#2DA5E0",
        borderRadius: 6,
        overflow: "hidden",
        width: "75%",
        marginHorizontal: 'auto',
        paddingTop: 3
    },
    Button: {
        color: "white",
        paddingHorizontal: 20,
        paddingTop: 7,
        paddingBottom: 9,
        backgroundColor: 'transparent',
        textAlign: "center"
    }
});