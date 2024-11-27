import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CountNewMessageType, User } from "../utils/types";
import { time } from "../utils/utils";
import { IMessage } from "react-native-gifted-chat";
import useTheme from "../utils/theme";

type props = {
	messages: IMessage | any,
	contact: User,
	handleNavigation: () => void,
	countNewMessage: CountNewMessageType | undefined,
	lastMessage: string | undefined
}

const ChatComponent = ({ messages, contact, handleNavigation, countNewMessage, lastMessage }: props) => {
	const { colors } = useTheme();
	return (
		<TouchableOpacity style={[styles.cchat, { backgroundColor: colors.card, borderColor: colors.mirza, borderWidth: (countNewMessage?.count === 0 || countNewMessage?.count === undefined) ? 0 : 3 }]} onPress={handleNavigation}>
			<Ionicons
				name='person-circle-outline'
				size={45}
				color={colors.text}
				style={styles.cavatar}
			/>
			<View style={styles.crightContainer}>
				<View>
					<Text style={[styles.cusername, { color: colors.text, fontFamily: "Vazirmatn-SemiBold" }]}>{contact.name}</Text>
					<Text style={[styles.cmessage, { color: colors.text, textAlign: 'left', fontFamily: "Vazirmatn-SemiBold" }]}>
						{lastMessage ? lastMessage : messages?.text ? messages.text : "Tap to start chatting"}
					</Text>
				</View>
				<View>
					<Text style={[styles.ctime, { color: colors.text, fontFamily: "Vazirmatn-SemiBold" }]}>
						{messages?.createdAt ? time(`${messages.createdAt}`) : "now"}
					</Text>
					<View style={[styles.newMessage, { display: (countNewMessage?.count === 0 || countNewMessage?.count === undefined) ? "none" : "flex", backgroundColor: colors.primary }]}>
						<Text style={[styles.cmessage, { color: colors.newMessage, opacity: 1, fontFamily: "Vazirmatn-Black" }]}>
							{countNewMessage?.count}
						</Text>
					</View>
				</View>
			</View>
		</TouchableOpacity>
	);
};

export default ChatComponent;

const styles = StyleSheet.create({
	cchat: {
		width: "100%",
		flexDirection: "row",
		alignItems: "center",
		borderRadius: 5,
		paddingHorizontal: 15,
		height: 80,
		marginBottom: 10,
	}, cavatar: {
		marginRight: 15,
	}, cusername: {
		fontSize: 18,
		marginBottom: 5,
	}, cmessage: {
		fontSize: 14,
		opacity: 0.7,
	},
	crightContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		flex: 1,
	},
	ctime: {
		opacity: 0.5,
	},
	newMessage: {
		width: 23,
		height: 23,
		borderRadius: 50,
		margin: 5,
		alignItems: "center",
		justifyContent: "center",
		paddingRight: 0.5
	}
});