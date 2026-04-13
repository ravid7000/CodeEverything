import React from "react";

// components
import { Board } from "../../components/Board";
import { WorkspaceCard } from "../../components/WorkspaceCard";
import { Card } from "../../components/Card";

// hooks
import { useBoard, useCreateTaskDialog } from "../../store";

export const Workspace = () => {
  const { states, actions } = useBoard();
  const { onOpen } = useCreateTaskDialog();

  const handleDragStart = (workflowId: string, evt) => {
    const taskId = evt.target.dataset.id;
    evt.dataTransfer.setData(
      "text/plain",
      JSON.stringify({
        workflowId,
        taskId,
      })
    );
  };

  const handleDragOver = (evt: React.DragEvent<HTMLDivElement>) => {
    evt.preventDefault();
    evt.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (evt: React.DragEvent<HTMLDivElement>) => {
    evt.preventDefault();

    // validate data
    try {
      const data = evt.dataTransfer.getData("text/plain");
      const workflowId = evt.currentTarget.dataset.id;
      const parsed = JSON.parse(data);
      if (workflowId && workflowId !== parsed.workflowId) {
        if (parsed.taskId && parsed.workflowId) {
          actions.moveTaskToOtherWorkflow(
            parsed.workflowId,
            workflowId,
            parsed.taskId
          );
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <Board>
      {states.workflows.map((workflow) => (
        <WorkspaceCard
          data-id={workflow.id}
          key={workflow.id}
          header={workflow.name}
          onAdd={() => onOpen(workflow.id)}
          onDragStart={(evt) => handleDragStart(workflow.id, evt)}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {workflow.tasks.map((task) => (
            <Card id={task.id} key={task.id} header={task.id}>
              {task.title}
            </Card>
          ))}
        </WorkspaceCard>
      ))}
    </Board>
  );
};
