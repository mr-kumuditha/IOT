import { update, set } from "firebase/database";
import { workerRef } from "./firebase/refs";
import type { Worker } from "../models/worker";

export const updateWorker = async (workerId: string, data: Partial<Worker>) => {
    await update(workerRef(workerId), data);
};

export const createWorker = async (workerId: string, data: Worker) => {
    await set(workerRef(workerId), data);
};
