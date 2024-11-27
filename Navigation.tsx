import React from 'react';
import { NavigationContainer } from '@react-navigation/native'
import Login from "./screens/Login";
import { CardStyleInterpolators, createStackNavigator } from '@react-navigation/stack';
import Messaging from "./screens/Messaging";
import Chat from "./screens/Chat";
import LoginPrev from './screens/LoginPrev';
import { useColorScheme, Easing } from 'react-native';
import { TransitionSpec } from '@react-navigation/stack/lib/typescript/src/types';
import { useEffect, useLayoutEffect, useState } from 'react';
import { ChatNavigationProps, LoginNavigationProps, RootStackParamList, User } from './utils/types';
import { useUser } from './socketContext';
import { createTable, deleteDB } from "./utils/DB";
import LoadingPage from './components/LoadingPage';
import { storage } from './mmkv';
import baseURL, { axiosInstance } from './utils/baseURL';
import * as FileSystem from 'expo-file-system';
import { fileDirectory } from './utils/directories';
import ModalMusic from './screens/ModalMusic';
import useTheme from './utils/theme';


const config: TransitionSpec = {
    animation: 'spring',
    config: {
        stiffness: 1000,
        damping: 50,
        mass: 3,
        overshootClamping: false,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01
    }
}

const closeConfig: TransitionSpec = {
    animation: 'timing',
    config: {
        duration: 250,
        easing: Easing.linear
    }
}

export const LoginNavigation = () => {
    const Stack = createStackNavigator<LoginNavigationProps>();
    return (
        <Stack.Navigator initialRouteName='LoginPrev' screenOptions={{
            gestureEnabled: true,
            gestureDirection: "horizontal",
            transitionSpec: {
                open: config,
                close: closeConfig
            },
            cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS
        }}>
            <Stack.Group>
                <Stack.Screen
                    name='LoginPrev'
                    component={LoginPrev}
                    options={{ headerShown: false, presentation: 'modal' }}
                />
            </Stack.Group>
            <Stack.Group screenOptions={{ presentation: "modal" }}>
                <Stack.Screen
                    name='Login'
                    component={Login}
                    options={{ headerShown: false }}
                />
            </Stack.Group>
        </Stack.Navigator>
    )
}

export const ChatNavigation = ({ beCheck }: any) => {
    const Stack = createStackNavigator<ChatNavigationProps>();
    return (<>
        <Stack.Navigator initialRouteName='Chat' screenOptions={{
            gestureEnabled: true,
            gestureDirection: "horizontal",
            transitionSpec: {
                open: config,
                close: closeConfig
            },
            cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS
        }}>
            <Stack.Group>
                <Stack.Screen
                    name='Chat'
                    component={Chat}
                    initialParams={{ beCheck }}
                    options={{
                        title: "Chats",
                        headerShown: false,
                    }}
                />
            </Stack.Group>
            <Stack.Group screenOptions={{ presentation: "modal" }}>
                <Stack.Screen
                    name='Messaging'
                    component={Messaging}
                    initialParams={{ contact: undefined }}
                    options={{
                        title: "Messaging",
                        headerShown: false,
                        freezeOnBlur: false
                    }}
                />
            </Stack.Group>
        </Stack.Navigator>
    </>
    )
}

export default function Navigation() {
    const Stack = createStackNavigator<RootStackParamList>();
    const user = useUser(state => state.user);
    const setUser = useUser(state => state.setUser);
    const [loading, setLoading] = useState(true);
    const [chat, setChat] = useState<boolean>(false);
    const [beCheck, setBeCheck] = useState<boolean>(false);
    const colorScheme = useColorScheme();
    const initDarkMode = storage.getBoolean("darkMode");
    const scheme = (colorScheme === 'dark' ? true : false);
    const fin = initDarkMode !== undefined ? initDarkMode : scheme;

    useEffect(() => {
        // this function called in chat screen
        (async () => {
            try {
                setLoading(true);
                const jsonUser = storage.getString('user');
                if (jsonUser) {
                    const { name, _id, token } = JSON.parse(jsonUser);
                    if (name !== null && _id !== null) {
                        setUser({ _id: _id, name: name, avatar: '', token })
                    }
                }
            } catch (e) {
                console.log(`error cant user: ${e}`)
            }
        })();
        setLoading(false);
    }, [chat]);

    async function purge() {
        const userData = storage.getString('user');
        try {
            storage.delete('user');
            axiosInstance.post('/deleteUser', userData);  
            await deleteDB();
            await createTable();
            setBeCheck(true);
            FileSystem.deleteAsync(fileDirectory,{idempotent: true});
        } catch (err) {
            console.log(err, 'err')
        }
    };

    useLayoutEffect(() => {
        setLoading(true);
        const value = storage.getBoolean("clearAll");
        if (value == true) {
            purge();
        } else {
            createTable();
        }
        storage.set("darkMode", fin);
    }, []);

    if (loading) { return <LoadingPage /> }

    return (
        <>
            <NavigationContainer fallback={<LoadingPage />} >
                <Stack.Navigator>
                    <Stack.Group screenOptions={{
                        headerShown: false,
                        gestureEnabled: true,
                        gestureDirection: "horizontal",
                        transitionSpec: {
                            open: config,
                            close: closeConfig
                        },
                        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS
                    }}>
                        {user ?
                            null
                            :
                            <Stack.Screen
                                name='LoginNavigation'
                                component={LoginNavigation}
                                options={{ headerShown: false, presentation: 'card' }} />
                        }
                        <Stack.Screen
                            name='Chat'
                            component={Chat}
                            initialParams={{ beCheck }}
                            options={{
                                headerShown: false,
                            }}
                            listeners={{
                                focus: () => {
                                    setChat(true);
                                }
                            }}
                        />
                        <Stack.Screen
                            name='Messaging'
                            component={Messaging}
                            initialParams={{ contact: undefined }}
                            options={{
                                headerShown: false
                            }}
                        />
                    </Stack.Group>
                    <Stack.Group  screenOptions={{
                        presentation: 'modal',
                        headerShown: false,
                        gestureEnabled: true,
                        gestureDirection: "vertical",
                        cardStyleInterpolator: CardStyleInterpolators.forRevealFromBottomAndroid,
                    }}>
                        <Stack.Screen name="ModalMusic" component={ModalMusic} />
                    </Stack.Group>
                </Stack.Navigator>
            </NavigationContainer>
        </>
    )
}