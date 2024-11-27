import Aes from 'react-native-aes-crypto';

export const generateID = () => Math.random().toString(36).substring(2, 10);

export const time = (date: string | undefined) => {
    if (date === undefined) return;
    const ms = new Date(date);
    const hour =
        ms.getHours() < 10
            ? `0${ms.getHours()}`
            : `${ms.getHours()}`;

    const mins =
        ms.getMinutes() < 10
            ? `0${ms.getMinutes()}`
            : `${ms.getMinutes()}`;
    return `${hour}:${mins}`
};

export const formatMillisecondsToTime = (durationSecond: number | undefined) => {
    if (durationSecond === undefined) return;

    const totalSeconds = Math.floor(durationSecond);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    const formattedSeconds = seconds < 10 ? '0' + seconds : seconds;

    return `${formattedMinutes}:${formattedSeconds}`;
}

export const isMusicFile = (filename: string | undefined) => {
    if (filename === undefined) return;
    const musicExtensions = ['.mp3', '.wav', '.aac', '.flac', '.ogg', '.m4a'];
    const lowerCaseFilename = filename.toLowerCase();
    return musicExtensions.some(extension => lowerCaseFilename.endsWith(extension));
};

export function formatBytes({ bytes, format }: { bytes: number, format?: 'MB' | 'KB' }) {

    const megabytes = bytes / (1024 * 1024);
    const kilobytes = bytes / 1024;

    if (format) {
        if (format === 'MB') {
            return { formattedbytes: megabytes.toFixed(1) };
        };
        if (format === 'KB') {
            return { formattedbytes: kilobytes.toFixed(1) };
        };
    }

    if (megabytes >= 1) {
        return {
            formattedbytes: megabytes.toFixed(1),
            format: 'MB'
        };
    } else {
        return {
            formattedbytes: kilobytes.toFixed(1),
            format: 'KB'
        };
    }
};

export const generateKey = (password: string, salt: string, cost: number, length: number): Promise<string> => Aes.pbkdf2(password, salt, cost, length, 'sha256')

export const encryptData = (text:string, key:string) => {
    return Aes.randomKey(16).then(iv => {
        return Aes.encrypt(text, key, iv, 'aes-256-cbc').then(cipher => ({
            cipher,
            iv,
        }))
    })
}

export const decryptData = (encryptedData: { cipher: string, iv: string }, key: any) => Aes.decrypt(encryptedData.cipher, key, encryptedData.iv, 'aes-256-cbc');


export const useThrottle = (fn:any, delay:number) => {
	let timeout:any;
	return (...args:any[]) => {
		if (!timeout) {
			fn(...args);
			timeout = setTimeout(() => {
				timeout = null;
			}, delay);
		}
	};
};

