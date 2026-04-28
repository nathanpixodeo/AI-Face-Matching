import { Workspace } from '../../models/workspace.model';
import { NotFoundError } from '../../lib/errors';
import { CreateWorkspaceInput, UpdateWorkspaceInput, ListWorkspacesQuery } from './workspace.schema';

export async function createWorkspace(teamId: string, input: CreateWorkspaceInput) {
  const workspace = await Workspace.create({
    teamId,
    name: input.name,
    notes: input.notes,
  });

  return {
    id: workspace._id.toString(),
    name: workspace.name,
    notes: workspace.notes,
    status: workspace.status,
    createdAt: workspace.createdAt,
  };
}

export async function listWorkspaces(teamId: string, query: ListWorkspacesQuery) {
  const filter: Record<string, unknown> = { teamId };
  if (query.status !== undefined) filter.status = query.status;

  const skip = (query.page - 1) * query.limit;
  const [workspaces, total] = await Promise.all([
    Workspace.find(filter).sort({ name: 1 }).skip(skip).limit(query.limit),
    Workspace.countDocuments(filter),
  ]);

  return {
    items: workspaces.map((w) => ({
      id: w._id.toString(),
      name: w.name,
      notes: w.notes,
      status: w.status,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
    })),
    total,
    page: query.page,
    totalPages: Math.ceil(total / query.limit),
  };
}

export async function getWorkspace(teamId: string, workspaceId: string) {
  const workspace = await Workspace.findOne({ _id: workspaceId, teamId });
  if (!workspace) throw new NotFoundError('Workspace', workspaceId);

  return {
    id: workspace._id.toString(),
    name: workspace.name,
    notes: workspace.notes,
    status: workspace.status,
    createdAt: workspace.createdAt,
    updatedAt: workspace.updatedAt,
  };
}

export async function updateWorkspace(
  teamId: string,
  workspaceId: string,
  input: UpdateWorkspaceInput,
) {
  const workspace = await Workspace.findOneAndUpdate(
    { _id: workspaceId, teamId },
    { $set: input },
    { new: true },
  );
  if (!workspace) throw new NotFoundError('Workspace', workspaceId);

  return {
    id: workspace._id.toString(),
    name: workspace.name,
    notes: workspace.notes,
    status: workspace.status,
  };
}

export async function deleteWorkspace(teamId: string, workspaceId: string) {
  const workspace = await Workspace.findOneAndDelete({ _id: workspaceId, teamId });
  if (!workspace) throw new NotFoundError('Workspace', workspaceId);
}
