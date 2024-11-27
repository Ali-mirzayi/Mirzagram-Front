import * as FileSystem from 'expo-file-system';

export const downloadsDir = FileSystem.documentDirectory + 'downloads/';
// export const filesDir = FileSystem.documentDirectory + 'images/';
// export const imgDir = FileSystem.documentDirectory + 'images/';
export const fileDirectory = FileSystem.documentDirectory + 'download/';


export const ensureDirExists = async () => {
    try {
        const fileInfo = await FileSystem.getInfoAsync(fileDirectory);
        if (!fileInfo.exists) {
            await FileSystem.makeDirectoryAsync(fileDirectory, { intermediates: true });
            console.log('Directory created:', fileDirectory);
        }
    } catch (error) {
        console.error('Error checking directory:', error);
        return;
    }
    const dirInfo = await FileSystem.getInfoAsync(downloadsDir);
    if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(downloadsDir, { intermediates: true });
    }
};

// export const ensureDirExists = async(props:string) => {
//     const dirInfo = await FileSystem.getInfoAsync(props);
//     if (!dirInfo.exists){
//         await FileSystem.makeDirectoryAsync(props,{intermediates: true});
//     }
// };

// export const fileName = async() => {
//     await ensureDirExists();
//     const filename = downloadsDir + new Date().getTime() + ".jpeg";
// };