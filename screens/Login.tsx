import { useState } from "react";
import { Text, SafeAreaView, View, TextInput, Alert, StyleSheet, TouchableHighlight } from "react-native";
import { LoginNavigationProps } from "../utils/types";
import { generateID } from "../utils/utils";
import { StackScreenProps } from "@react-navigation/stack";
import baseURL, { axiosInstance } from "../utils/baseURL";
import { useSocket, useUser } from "../socketContext";
import { storage } from "../mmkv";
import LottieView from 'lottie-react-native';
import useTheme from "../utils/theme";
import { usePushNotifications } from "../utils/usePushNotifications";
import { useTranslate } from "../language/useTranslate";

const Login = ({ route, navigation }: StackScreenProps<LoginNavigationProps, 'Login'>) => {
	const { beCheck } = route?.params || {};
	const [username, setUsername] = useState("");
	const { colors } = useTheme();
	const setUser = useUser(state => state.setUser);
	const _id = generateID();
	const { expoPushToken } = usePushNotifications();
	const socket = useSocket(state => state.socket);
	const { i18n, locale } = useTranslate();

	const storeUsername = async () => {
		// try {
		// 	const response = await fetch(`${baseURL()}/checkUserToAdd`, {
		// 		method: 'POST',
		// 		headers: {
		// 			Accept: 'application/json',
		// 			'Content-Type': 'application/json',
		// 		},
		// 		body: JSON.stringify({ _id: _id, name: username, avatar: '', token: expoPushToken })
		// 	});
		// 	const json = await response.json();
		// 	if (json?.isOK === true) {
		// 		storage.set('user', JSON.stringify({ name: username, _id, avatar: '', token: expoPushToken }));
		// 		setUser({ _id: _id, name: username, avatar: '', token: expoPushToken });
		// 		socket?.emit('setSocketId', _id, navigation.navigate('Chat', { beCheck }));
		// 	} else {
		// 		Alert.alert("Error! invalid username");
		// 	}
		// } catch (e) {
		// 	Alert.alert("Error! While saving username");
		// }
		try {  
			const response = await axiosInstance.post('/checkUserToAdd', {  
				_id: _id,  
				name: username,  
				avatar: '',  
				token: expoPushToken,  
			});  
		
			if (response.data?.isOK === true) {  
				storage.set('user', JSON.stringify({ name: username, _id, avatar: '', token: expoPushToken }));  
				setUser({ _id: _id, name: username, avatar: '', token: expoPushToken });  
				socket?.emit('setSocketId', _id, navigation.navigate('Chat', { beCheck }));  
			} else {  
				Alert.alert("Error! Invalid username");  
			}  
		} catch (e) {  
			Alert.alert("Error! While saving username");  
		}  
	};

	const handleSignIn = () => {
		if (username.trim()) {
			storeUsername();
		} else {
			Alert.alert("Username is required.");
		}
	};

	return (
		<SafeAreaView style={[styles.loginscreen, { backgroundColor: colors.background, }]}>
			<LottieView autoPlay source={require('../assets/chat.json')} style={styles.ImageContainer} />
			<Text style={[styles.Mirza, { color: colors.loginMirza, fontSize: 28, fontFamily: "Vazirmatn-Bold" }]}>{i18n.t("SignIn")}</Text>
			<Text style={[styles.MirzaDesc, { color: colors.text, fontSize: 18, fontFamily: "Vazirmatn-Regular" }]}>{i18n.t("EnterUsername")}</Text>
			<View style={styles.logininputContainer}>
				<TextInput
					placeholderTextColor={colors.lightText}
					autoCorrect={false}
					placeholder={i18n.t("Username")}
					style={[styles.logininput, { color: colors.text, borderColor: colors.boarder, fontFamily: "Vazirmatn-Medium", textAlign: locale === 'en' ? 'left' : 'right' }]}
					value={username}
					onChangeText={setUsername} />
			</View>
			<TouchableHighlight style={styles.ButtonContainer} onPress={handleSignIn} underlayColor={"#c8cce0"}>
				<Text testID="LoginScreen" style={[styles.Button,{marginTop: locale === 'en' ? 2 : -3}]}>{i18n.t("LetChat")}</Text>
			</TouchableHighlight>
		</SafeAreaView>
	);
};

export default Login;

const styles = StyleSheet.create({
	loginscreen: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: 12,
		width: "100%",
	},
	Container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#EEF1FF"
	},
	ImageContainer: {
		width: 250,
		height: 250,
	},
	Mirza: {
		marginTop: 20,
	},
	MirzaDesc: {
		textAlign: "center",
		fontSize: 15,
		marginBottom: 20,
	},
	logininputContainer: {
		width: "100%",
		alignItems: "center",
		justifyContent: "center",
	},
	logininput: {
		borderWidth: 2,
		width: "80%",
		paddingVertical: 7,
		paddingHorizontal: 12,
		fontSize: 21,
		borderRadius: 4,
	},
	ButtonContainer: {
		marginTop: 20,
		backgroundColor: "#2DA5E0",
		borderRadius: 6,
		overflow: "hidden",
		width: "80%",
		paddingVertical:7
	},
	Button: {
		color: "white",
		textAlign: "center",
		paddingHorizontal: 20,
		backgroundColor: 'transparent',
		fontSize: 23,
		fontFamily: "Vazirmatn-SemiBold"
	}
});