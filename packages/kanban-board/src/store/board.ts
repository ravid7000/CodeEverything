import { createState, storage } from "./createState";

export type WorkflowType = {
  id: string;
  name: string;
  tasks: TaskType[];
};

export type TaskType = {
  id: string;
  title: string;
  workflowId: string;
  description?: string;
};

export const WORKFLOWS: WorkflowType[] = [
  {
    id: "todo",
    name: "Todo",
    tasks: [],
  },
  {
    id: "in-progress",
    name: "In Progress",
    tasks: [],
  },
  {
    id: "testing",
    name: "Testing",
    tasks: [],
  },
  {
    id: "done",
    name: "Done",
    tasks: [],
  },
];

export const workflowState = createState(WORKFLOWS)();
export const taskCounterState = createState(0)();
export const createTaskDialogState = createState(false)();
export const currentWorkflowState = createState<string | null>(null)();
export const storageInstance = storage();

workflowState.subscribe((state) => {
  storageInstance.set("__workflows__", state);
});

taskCounterState.subscribe((state) => {
  storageInstance.set("__workflows_tasks_counter__", state);
});
