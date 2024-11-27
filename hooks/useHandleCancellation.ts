import { useEffect } from 'react'
import { useCurrentTask, useSetCancellationId } from '../socketContext';

export const useHandleCancellation = () => {
    const { tasks, setTasks } = useCurrentTask();
    const { cancellationId, setCancellationId } = useSetCancellationId();
    useEffect(() => {
        const cancelUpload = async () => {
            if (cancellationId) {
                setCancellationId(() => undefined);
                const cancellationTask = tasks.find(task => task.id === cancellationId)?.task;
                await cancellationTask?.cancelAsync();
                setTasks(state => state.filter(task => task.id !== cancellationId));
            };
        };
        cancelUpload();
    }, [cancellationId]);
};