import {
  createIdentity,
  listIdentities,
  getIdentity,
  updateIdentity,
  deleteIdentity,
} from '../../modules/identity/identity.service';
import { Face } from '../../models/face.model';
import { Identity } from '../../models/identity.model';
import { createTestUser } from '../helpers/fixtures';
import { Types } from 'mongoose';

process.env.JWT_SECRET = 'test-secret-minimum-16-chars';
process.env.MONGO_URI = 'mongodb://localhost:27017/test';
process.env.ML_SERVICE_URL = 'http://localhost:8000';

describe('Identity service', () => {
  let teamId: string;

  beforeEach(async () => {
    const { team } = await createTestUser();
    teamId = team._id.toString();
  });

  test('createIdentity creates and increments usage', async () => {
    const result = await createIdentity(teamId, { name: 'Alice', description: 'Test person' });
    expect(result.name).toBe('Alice');
    expect(result.facesCount).toBe(0);
  });

  test('listIdentities with search', async () => {
    await createIdentity(teamId, { name: 'Alice' });
    await createIdentity(teamId, { name: 'Bob' });
    await createIdentity(teamId, { name: 'Alicia' });

    const all = await listIdentities(teamId, { page: 1, limit: 20 });
    expect(all.total).toBe(3);

    const filtered = await listIdentities(teamId, { page: 1, limit: 20, search: 'Ali' });
    expect(filtered.total).toBe(2);
  });

  test('getIdentity returns detail', async () => {
    const created = await createIdentity(teamId, { name: 'Charlie' });
    const result = await getIdentity(teamId, created.id);
    expect(result.name).toBe('Charlie');
  });

  test('getIdentity throws for wrong team', async () => {
    const created = await createIdentity(teamId, { name: 'Eve' });
    const fakeTeamId = new Types.ObjectId().toString();
    await expect(getIdentity(fakeTeamId, created.id)).rejects.toThrow('not found');
  });

  test('updateIdentity changes fields', async () => {
    const created = await createIdentity(teamId, { name: 'Old Name' });
    const updated = await updateIdentity(teamId, created.id, { name: 'New Name' });
    expect(updated.name).toBe('New Name');
  });

  test('deleteIdentity unlinks faces', async () => {
    const created = await createIdentity(teamId, { name: 'ToDelete' });

    await Face.create({
      teamId,
      imageId: new Types.ObjectId(),
      identityId: created.id,
      embedding: new Array(512).fill(0),
      bbox: { x: 0, y: 0, width: 100, height: 100 },
      modelUsed: 'adaface',
      mappingStatus: 'confirmed',
    });

    await deleteIdentity(teamId, created.id);

    const face = await Face.findOne({ teamId });
    expect(face!.identityId).toBeNull();
    expect(face!.mappingStatus).toBe('unmatched');

    const identity = await Identity.findById(created.id);
    expect(identity).toBeNull();
  });
});
