import { useNetInfo } from '@react-native-community/netinfo';
import React, { useEffect } from 'react';
import Toast from 'react-native-toast-message';
import baseURL from '../utils/baseURL';
import io from 'socket.io-client';
import { useSocket } from '../socketContext';

export default function useCheckConnection(setError: React.Dispatch<React.SetStateAction<boolean>>) {
    const netInfo = useNetInfo({ reachabilityUrl: `${baseURL()}/api` });
    const setSocket = useSocket(state => state.setSocket);

    useEffect(() => {
        const newSocket = io(baseURL(), {
            auth: {token: 'zQS5wPm16P9n'}
            // auth: {token: process.env.EXPO_PUBLIC_SOCKET_PASS}
        });
        setSocket(newSocket);
        const checkConnection = () => {
            if (!newSocket.connected) {
                newSocket.connect();
            }

            if (netInfo.isConnected === false) {
                const showToast = () => {
                    Toast.show({
                        type: 'error',
                        text1: 'You are offline',
                        autoHide: false,
                    });
                    setError(true);
                };
                showToast();
            } else {
                // Check server connection  
                const headers = new Headers();
                headers.append('Content-Type', 'application/json');

                const timeout = new Promise((_, reject) => {
                    setTimeout(reject, 5000, 'Request timed out');
                });

                const request = fetch(baseURL(), {
                    method: 'GET',
                    headers: headers,
                });

                Promise.race([timeout, request])
                    .then((res: any) => {
                        if (res.status === 200) {
                            setError(false);
                            Toast.hide();
                        } else {
                            Toast.show({
                                type: 'error',
                                text1: 'Connection error',
                                text2: 'Server can\'t be reached',
                                autoHide: false,
                            });
                            setError(true);
                        }
                    })
                    .catch((e) => {
                        console.error(e);
                        Toast.show({
                            type: 'error',
                            text1: 'Connection error',
                            text2: 'An error occurred while trying to connect to the server',
                            autoHide: false,
                        });
                        setError(true);
                    });
            }
        };

        checkConnection();

        const intervalId = setInterval(checkConnection, 6000);

        return () => {
            clearInterval(intervalId);
            newSocket.disconnect();
        };
    }, [netInfo.isConnected, setError]);
}