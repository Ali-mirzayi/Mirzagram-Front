import { useNetInfo } from '@react-native-community/netinfo';
import React, { useEffect } from 'react';
import Toast from 'react-native-toast-message';
import baseURL, { axiosInstance } from '../utils/baseURL';
import io from 'socket.io-client';
import { useSocket } from '../socketContext';
import axios from "axios";


export default function useCheckConnection(setError: React.Dispatch<React.SetStateAction<boolean>>) {  
    const netInfo = useNetInfo({ reachabilityUrl: baseURL() });  
    const setSocket = useSocket(state => state.setSocket);  

    useEffect(() => {  
        const newSocket = io(baseURL(), {  
            auth: { token: process.env.EXPO_PUBLIC_SOCKET_PASS }  
        });  
        setSocket(newSocket);  

        const showErrorToast = (text1:string, text2:string) => {  
            Toast.show({  
                type: 'error',  
                text1,  
                text2,  
                autoHide: false,  
            });  
            setError(true);  
        };  

        const checkConnection = async () => {  
            if (!newSocket.connected) newSocket.connect();
            
            if (netInfo.isConnected===false) { 
                console.log('this show first render');
                showErrorToast('You are offline', '');  
                return;  
            };  

            try {  
                const response = await axiosInstance.get('/');
                if (response.status === 200) {  
                    setError(false);  
                    Toast.hide();  
                } else {
                    showErrorToast('Connection error', 'Server can\'t be reached');  
                }  
            } catch (error) {  
                console.error(error);  
                if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {  
                    showErrorToast('Request timed out', 'The request took too long to complete');  
                } else {  
                    showErrorToast('Connection error', 'An error occurred while trying to connect to the server');  
                }  
            }  
        };  

        checkConnection();  
        const intervalId = setInterval(checkConnection, 6000);  

        return () => {  
            clearInterval(intervalId);  
            newSocket.disconnect();  
        };  
    }, [netInfo.isConnected, setError, setSocket]);
};

// export default function useCheckConnection(setError: React.Dispatch<React.SetStateAction<boolean>>) {
//     const netInfo = useNetInfo({ reachabilityUrl: `${baseURL()}/api` });
//     const setSocket = useSocket(state => state.setSocket);
//     useEffect(() => {
//         const newSocket = io(process.env.EXPO_PUBLIC_BASE_URL2 ?? '', {
//             // auth: { token: 'zQS5wPm16P9n' },
//             auth: { token: process.env.EXPO_PUBLIC_SOCKET_PASS }
//         });
//         setSocket(newSocket);
//         const checkConnection = () => {
//             if (!newSocket.connected) {
//                 newSocket.connect();
//             }

//             if (netInfo.isConnected === false) {
//                 const showToast = () => {
//                     Toast.show({
//                         type: 'error',
//                         text1: 'You are offline',
//                         autoHide: false,
//                     });
//                     setError(true);
//                 };
//                 showToast();
//             } else {
//                 // Check server connection  
//                 const headers = new Headers();
//                 headers.append('Content-Type', 'application/json');

//                 const timeout = new Promise((_, reject) => {
//                     setTimeout(reject, 5000, 'Request timed out');
//                 });

//                 const request = fetch(baseURL(), {
//                     method: 'GET',
//                     headers: headers,
//                 });

//                 Promise.race([timeout, request])
//                     .then((res: any) => {
//                         if (res.status === 200) {
//                             setError(false);
//                             Toast.hide();
//                         } else {
//                             Toast.show({
//                                 type: 'error',
//                                 text1: 'Connection error',
//                                 text2: 'Server can\'t be reached',
//                                 autoHide: false,
//                             });
//                             setError(true);
//                         }
//                     })
//                     .catch((e) => {
//                         console.error(e);
//                         Toast.show({
//                             type: 'error',
//                             text1: 'Connection error',
//                             text2: 'An error occurred while trying to connect to the server',
//                             autoHide: false,
//                         });
//                         setError(true);
//                     });
//             }
//         };

//         checkConnection();

//         const intervalId = setInterval(checkConnection, 6000);

//         return () => {
//             clearInterval(intervalId);
//             newSocket.disconnect();
//         };
//     }, [netInfo.isConnected, setError]);
// }