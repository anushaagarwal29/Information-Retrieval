import { useState } from "react";

export function useTimedFunction(callback: () => any) {
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  const timedFunction = async () => {
    const startTime = performance.now();
    await callback();
    const endTime = performance.now();
    const elapsedTime = endTime - startTime;
    setExecutionTime(elapsedTime);
  };

  const resetExecutionTime = () => {
    setExecutionTime(null);
  }

  return { executionTime, timedFunction, resetExecutionTime };
}