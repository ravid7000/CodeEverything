import { useEffect, useMemo } from "react";
import { useSubscription } from "./createState";
import {
  workflowState,
  currentWorkflowState,
  createTaskDialogState,
  TaskType,
  storageInstance,
  WorkflowType,
  taskCounterState,
} from "./board";

export const useBoard = () => {
  const workflows = useSubscription(workflowState);

  // actions
  const removeTaskFromWorkflow = (workflowId: string, taskId: string) => {
    workflowState.set(
      workflows.map((workflow) => {
        if (
          workflow.id === workflowId &&
          workflow.tasks.some((task) => task.id === taskId)
        ) {
          return {
            ...workflow,
            tasks: workflow.tasks.filter((task) => task.id !== taskId),
          };
        }
        return workflow;
      })
    );
  };

  const addTaskToWorkflow = (task: TaskType) => {
    const workflows = workflowState.get();
    workflowState.set(
      workflows.map((workflow) => {
        if (workflow.id === task.workflowId) {
          return {
            ...workflow,
            tasks: [...workflow.tasks, task],
          };
        }
        return workflow;
      })
    );
  };

  const moveTaskToOtherWorkflow = (
    prevWorkflowId: string,
    workflowId: string,
    taskId: string
  ) => {
    let task: TaskType | null = null;

    // get the task from previously stored workflow
    workflows.forEach((workflow) => {
      if (workflow.id === prevWorkflowId) {
        task = workflow.tasks.find((tsk) => tsk.id === taskId) || null;
      }
    });

    if (task !== null && (task as TaskType).workflowId !== workflowId) {
      // remove the task from previouly stored workflow
      removeTaskFromWorkflow(prevWorkflowId, taskId);
      // add the task in new workflow
      addTaskToWorkflow({ ...(task as TaskType), workflowId });
    }
  };

  return {
    states: {
      workflows,
    },
    actions: {
      removeTaskFromWorkflow,
      moveTaskToOtherWorkflow,
    },
  };
};

export const useTotalTasks = () => {
  const workflows = useSubscription(workflowState);
  const taskCounter = useSubscription(taskCounterState);

  const totalTasks = useMemo(() => {
    return workflows
      .map((workflow) => workflow.tasks.length)
      .reduce((prev, curr) => {
        return prev + curr;
      }, 0);
  }, [workflows]);

  const updateTaskCounter = () => {
    const nextCounter = Math.max(totalTasks + 1, taskCounter + 1);
    taskCounterState.set(nextCounter);
    return `KB-${nextCounter}`;
  };

  useEffect(() => {
    const state = storageInstance.get<WorkflowType[]>("__workflows__");
    const taskCounterSt = storageInstance.get<number>(
      "__workflows_tasks_counter__"
    );
    if (state) {
      workflowState.set(state);
    }
    if (taskCounterSt) {
      taskCounterState.set(taskCounterSt);
    }
  }, []);

  return { totalTasks, taskCounter, updateTaskCounter };
};

export const useCreateTask = () => {
  const currentWorkflow = useSubscription(currentWorkflowState);

  const createTask = (task: TaskType) => {
    const workflows = workflowState.get();
    workflowState.set(
      workflows.map((workflow) => {
        if (workflow.id === task.workflowId) {
          return {
            ...workflow,
            tasks: [...workflow.tasks, task],
          };
        }
        return workflow;
      })
    );
  };

  const updateWorkflowId = (workflowId: string) => {
    currentWorkflowState.set(workflowId);
  };

  return {
    states: {
      currentWorkflow,
    },
    actions: {
      createTask,
      updateWorkflowId,
    },
  };
};

export const useCreateTaskDialog = () => {
  const dialogState = useSubscription(createTaskDialogState);

  const onClose = () => {
    createTaskDialogState.set(false);
    currentWorkflowState.set(null);
  };

  const onOpen = (workflowId?: string) => {
    if (workflowId) {
      currentWorkflowState.set(workflowId);
    }
    createTaskDialogState.set(true);
  };

  return {
    open: dialogState,
    onClose,
    onOpen,
  };
};
