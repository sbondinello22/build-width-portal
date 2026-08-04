import { useQueries, useQuery } from "@tanstack/react-query";
import { listClients } from "../api/clients";
import { listProjectsForClient } from "../api/projects";

export function useAllProjects() {
  const { data: clients } = useQuery({ queryKey: ["clients"], queryFn: listClients });

  const projectQueries = useQueries({
    queries: (clients ?? []).map((client) => ({
      queryKey: ["clients", client.id, "projects"],
      queryFn: () => listProjectsForClient(client.id),
      enabled: !!clients,
    })),
  });

  const isLoading = !clients || projectQueries.some((q) => q.isLoading);

  const projects = (clients ?? []).flatMap((client, i) =>
    (projectQueries[i]?.data ?? []).map((project) => ({ ...project, clientName: client.name }))
  );

  return { projects, isLoading };
}
