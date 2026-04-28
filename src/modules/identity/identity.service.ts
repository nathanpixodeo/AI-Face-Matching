import { Identity } from '../../models/identity.model';
import { Face } from '../../models/face.model';
import { NotFoundError } from '../../lib/errors';
import { checkPlanLimit, incrementUsage, decrementUsage } from '../team/plan-limit';
import { CreateIdentityInput, UpdateIdentityInput, ListIdentitiesQuery } from './identity.schema';

export async function createIdentity(teamId: string, input: CreateIdentityInput) {
  await checkPlanLimit(teamId, 'maxIdentities');

  const identity = await Identity.create({
    teamId,
    name: input.name,
    description: input.description,
  });

  await incrementUsage(teamId, 'maxIdentities');

  return {
    id: identity._id.toString(),
    name: identity.name,
    description: identity.description,
    facesCount: identity.facesCount,
    createdAt: identity.createdAt,
  };
}

export async function listIdentities(teamId: string, query: ListIdentitiesQuery) {
  const filter: Record<string, unknown> = { teamId };
  if (query.search) {
    filter.name = { $regex: query.search, $options: 'i' };
  }

  const skip = (query.page - 1) * query.limit;
  const [identities, total] = await Promise.all([
    Identity.find(filter).sort({ name: 1 }).skip(skip).limit(query.limit),
    Identity.countDocuments(filter),
  ]);

  return {
    items: identities.map((i) => ({
      id: i._id.toString(),
      name: i.name,
      description: i.description,
      avatarFaceId: i.avatarFaceId?.toString() ?? null,
      facesCount: i.facesCount,
      createdAt: i.createdAt,
    })),
    total,
    page: query.page,
    totalPages: Math.ceil(total / query.limit),
  };
}

export async function getIdentity(teamId: string, identityId: string) {
  const identity = await Identity.findOne({ _id: identityId, teamId });
  if (!identity) throw new NotFoundError('Identity', identityId);

  return {
    id: identity._id.toString(),
    name: identity.name,
    description: identity.description,
    avatarFaceId: identity.avatarFaceId?.toString() ?? null,
    facesCount: identity.facesCount,
    createdAt: identity.createdAt,
    updatedAt: identity.updatedAt,
  };
}

export async function updateIdentity(
  teamId: string,
  identityId: string,
  input: UpdateIdentityInput,
) {
  const identity = await Identity.findOneAndUpdate(
    { _id: identityId, teamId },
    { $set: input },
    { new: true },
  );
  if (!identity) throw new NotFoundError('Identity', identityId);

  return {
    id: identity._id.toString(),
    name: identity.name,
    description: identity.description,
    facesCount: identity.facesCount,
  };
}

export async function deleteIdentity(teamId: string, identityId: string) {
  const identity = await Identity.findOneAndDelete({ _id: identityId, teamId });
  if (!identity) throw new NotFoundError('Identity', identityId);

  await Face.updateMany(
    { teamId, identityId },
    { $set: { identityId: null, mappingStatus: 'unmatched', mappingConfidence: 0 } },
  );

  await decrementUsage(teamId, 'maxIdentities');
}

export async function getIdentityFaces(teamId: string, identityId: string) {
  const identity = await Identity.findOne({ _id: identityId, teamId });
  if (!identity) throw new NotFoundError('Identity', identityId);

  const faces = await Face.find({ teamId, identityId })
    .select('-embedding')
    .populate('imageId', 'filePath originalName')
    .sort({ createdAt: -1 });

  return faces.map((f) => ({
    id: f._id.toString(),
    imageId: f.imageId.toString(),
    image: f.imageId,
    bbox: f.bbox,
    gender: f.gender,
    age: f.age,
    qualityScore: f.qualityScore,
    mappingStatus: f.mappingStatus,
    mappingConfidence: f.mappingConfidence,
    createdAt: f.createdAt,
  }));
}
