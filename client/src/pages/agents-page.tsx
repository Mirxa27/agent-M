import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Route, Switch } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import AgentList from "@/components/agents/agent-list";
import AgentCreator from "@/components/agents/agent-creator";
import TaskExecutor from "@/components/agents/task-executor";

export default function AgentsPage() {
  const [match, params] = useRoute("/agents/:id/tasks/:taskId");
  const [matchAgent, agentParams] = useRoute("/agents/:id");
  const [matchCreate] = useRoute("/agents/create");
  
  return (
    <div className="container mx-auto py-6">
      <Switch>
        <Route path="/agents/create">
          <AgentCreator />
        </Route>
        <Route path="/agents/:id/tasks/:taskId">
          {(params) => (
            <TaskExecutor 
              agentId={parseInt(params.id)} 
              taskId={parseInt(params.taskId)} 
            />
          )}
        </Route>
        <Route path="/agents/:id">
          {(params) => (
            <TaskExecutor 
              agentId={parseInt(params.id)} 
            />
          )}
        </Route>
        <Route path="/agents">
          <AgentList />
        </Route>
      </Switch>
    </div>
  );
}