import { useCallback } from "react";
import { Alert, Pressable, Linking } from "react-native";

type OpenURLButtonProps = {
    url: string;
    children: any;
};

const Link = ({ url, children }: OpenURLButtonProps) => {
    const handlePress = useCallback(async () => {
        const supported = await Linking.canOpenURL('https://google.com');
        if (supported) {
            await Linking.openURL(url);
        } else {
            Alert.alert(`Don't know how to open this URL: ${url}`);
        }
    }, [url]);

    return (<Pressable onPress={handlePress}>
        {children}
    </Pressable>
    );
};

export default Link;
