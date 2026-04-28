import { Plan } from '../models/plan.model';

const defaultPlans = [
  {
    name: 'free',
    limits: {
      maxIdentities: 50,
      maxImages: 500,
      maxMatchesPerDay: 50,
      maxApiCallsPerDay: 100,
      maxStorageMB: 500,
      maxTeamMembers: 2,
      maxFilesPerUpload: 10,
    },
    price: 0,
    active: true,
  },
  {
    name: 'pro',
    limits: {
      maxIdentities: 5000,
      maxImages: 50000,
      maxMatchesPerDay: 5000,
      maxApiCallsPerDay: 10000,
      maxStorageMB: 10000,
      maxTeamMembers: 10,
      maxFilesPerUpload: 100,
    },
    price: 29,
    active: true,
  },
  {
    name: 'enterprise',
    limits: {
      maxIdentities: -1,
      maxImages: -1,
      maxMatchesPerDay: -1,
      maxApiCallsPerDay: -1,
      maxStorageMB: -1,
      maxTeamMembers: -1,
      maxFilesPerUpload: 1000,
    },
    price: 99,
    active: true,
  },
];

export async function seedPlans(): Promise<void> {
  for (const plan of defaultPlans) {
    await Plan.findOneAndUpdate({ name: plan.name }, plan, { upsert: true });
  }
  console.log('Plans seeded successfully');
}
