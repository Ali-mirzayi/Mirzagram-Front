import {
  useMessage,
  useCurrentTask,
  useTransferredProgress,
} from "../socketContext";
import { availableStatus, IMessagePro } from "../utils/types";
import { formatBytes } from "../utils/utils";
import * as FileSystem from "expo-file-system";
import { fileDirectory } from "../utils/directories";

export default function useControl_io() {
  const setTasks = useCurrentTask((state) => state.setTasks);
  const setMessages = useMessage((state) => state.setMessages);
  const { setProgressThrottled, setProgress } = useTransferredProgress();

  let newSize = "0";

  const callback = ({
    totalBytesWritten,
    totalBytesExpectedToWrite,
    messageId,
  }: {
    totalBytesWritten: number;
    totalBytesExpectedToWrite: number;
    messageId: string | number;
  }) => {
    setProgressThrottled((e) => {
      const existingItem = e.find((item) => item.id === messageId);
      const { formattedbytes: totalByte, format }: any = formatBytes({
        bytes: totalBytesExpectedToWrite,
      });
      if (existingItem) {
        return e.map((obj) => {
          if (obj.id === messageId) {
            return {
              ...obj,
              transferred: formatBytes({ bytes: totalBytesWritten, format })
                .formattedbytes,
            };
          } else {
            return obj;
          }
        });
      } else {
        newSize = `${totalByte} ${format}`;
        return [...e, { id: messageId, size: newSize }];
      }
    });
  };

  async function handleDownload({ Message }: { Message: IMessagePro }) {
    if (Message?.file?.startsWith("file") || !Message.fileName) return;
    setMessages((e) =>
      e.map((message: IMessagePro) => {
        if (message._id === Message._id) {
          return { ...message, availableStatus: availableStatus.downloading };
        } else {
          return message;
        }
      })
    );
    const downloadResumable = FileSystem.createDownloadResumable(
      //@ts-ignore
      Message.file,
      fileDirectory + Message.fileName,
      {},
      (e) => callback({ ...e, messageId: Message._id })
    );
    setTasks((state) => [
      ...state,
      { task: downloadResumable, id: Message._id },
    ]);
    await downloadResumable
      .downloadAsync()
      .then((result) => {
        if (result) {
          setMessages((e) =>
            e.map((message) => {
              if (message._id === Message._id) {
                return {
                  ...message,
                  file: result?.uri,
                  size: newSize,
                  availableStatus: availableStatus.available,
                  mimeType: result?.headers["Content-Type"],
                };
              } else {
                return message;
              }
            })
          );
        } else {
          setMessages((e) =>
            e.map((message:IMessagePro) => {
              if (message._id === Message._id) {
                return {
                  ...message,
                  size: newSize,
                  availableStatus: availableStatus.cancel,
                };
              } else {
                return message;
              }
            })
          );
        }
      })
      .catch(() => {
        setMessages((e) =>
          e.map((message:IMessagePro) => {
            if (message._id === Message._id) {
              return {
                ...message,
                size: newSize,
                availableStatus: availableStatus.error,
              };
            } else {
              return message;
            }
          })
        );
      });
    setProgress((e: any) => e.filter((r: any) => r.id !== Message._id));
  }
};
