import React, { useState } from "react";
import {
  useCreateTask,
  useCreateTaskDialog,
  useTotalTasks,
  WORKFLOWS,
} from "./store";

// components
import { PrimaryButton, BaseButton } from "./components/Button";
import { Navbar } from "./components/Navbar";
import { Dialog } from "./components/Dialog";
import { TextInput } from "./components/TextInput";
import { SelectInput } from "./components/SelectInput";

// compound components : elements
import { Workspace } from "./elements/Workspace";

// styles
import "./index.styles.css";

export const KanbanBoard = () => {
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const { totalTasks, updateTaskCounter } = useTotalTasks();
  const { states, actions } = useCreateTask();
  const { open, onClose } = useCreateTaskDialog();

  const handleCreate = () => {
    if (states.currentWorkflow && taskTitle.trim()) {
      actions.createTask({
        id: updateTaskCounter(),
        title: taskTitle,
        description: taskDescription,
        workflowId: states.currentWorkflow,
      });
      setTaskTitle("");
      setTaskDescription("");
      onClose();
    }
  };

  return (
    <div>
      <Navbar header={`(${totalTasks})`} />
      <main>
        <Workspace />
      </main>
      <Dialog
        header="Create Task"
        footer={
          <>
            <BaseButton onClick={onClose}>Cancel</BaseButton>
            <PrimaryButton onClick={handleCreate}>Create</PrimaryButton>
          </>
        }
        open={open}
        onClose={onClose}
      >
        <TextInput
          label="Title"
          autoFocus
          required
          placeholder="Enter title for the task"
          value={taskTitle}
          onChange={(evt) => setTaskTitle(evt.target.value)}
        />
        <TextInput
          label="Description"
          placeholder="Enter description for the task"
          value={taskDescription}
          onChange={(evt) => setTaskDescription(evt.target.value)}
        />
        <SelectInput
          label="Workflow"
          options={WORKFLOWS}
          value={states.currentWorkflow || ""}
          onChange={(evt) => actions.updateWorkflowId(evt.target.value)}
        />
      </Dialog>
    </div>
  );
};
