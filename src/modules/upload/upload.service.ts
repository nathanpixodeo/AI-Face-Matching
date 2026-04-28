import { MultipartFile } from '@fastify/multipart';
import { UploadBatch } from '../../models/upload-batch.model';
import { Image } from '../../models/image.model';
import { Face } from '../../models/face.model';
import { Identity } from '../../models/identity.model';
import { NotFoundError, ForbiddenError } from '../../lib/errors';
import { checkPlanLimit, incrementUsage } from '../team/plan-limit';
import { validateImageFile, saveFile, deleteFile } from '../../lib/file-storage';
import { addFaceDetectJob } from '../../jobs/queue';
import { ListBatchesQuery, ReviewMappingInput } from './upload.schema';

export async function uploadImages(
  teamId: string,
  userId: string,
  files: AsyncIterableIterator<MultipartFile>,
) {
  const savedFiles: Array<{
    filePath: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
  }> = [];

  for await (const file of files) {
    validateImageFile(file.filename, file.mimetype);

    const buffer = await file.toBuffer();
    await checkPlanLimit(teamId, 'maxImages');

    const { filePath } = await saveFile(teamId, buffer, file.filename);
    savedFiles.push({
      filePath,
      originalName: file.filename,
      mimeType: file.mimetype,
      sizeBytes: buffer.length,
    });
  }

  if (savedFiles.length === 0) {
    throw new ForbiddenError('No valid image files uploaded');
  }

  const batch = await UploadBatch.create({
    teamId,
    uploadedBy: userId,
    totalImages: savedFiles.length,
    status: 'uploading',
  });

  const imageDocs = savedFiles.map((f) => ({
    teamId,
    uploadBatchId: batch._id,
    filePath: f.filePath,
    originalName: f.originalName,
    mimeType: f.mimeType,
    sizeBytes: f.sizeBytes,
    uploadedBy: userId,
    status: 'pending' as const,
  }));

  await Image.insertMany(imageDocs);
  await incrementUsage(teamId, 'maxImages', savedFiles.length);

  const jobId = await addFaceDetectJob(batch._id.toString(), teamId);

  return {
    batchId: batch._id.toString(),
    totalImages: savedFiles.length,
    jobId,
    status: 'uploading',
  };
}

export async function listBatches(teamId: string, query: ListBatchesQuery) {
  const filter: Record<string, unknown> = { teamId };
  if (query.status) filter.status = query.status;

  const skip = (query.page - 1) * query.limit;
  const [batches, total] = await Promise.all([
    UploadBatch.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
    UploadBatch.countDocuments(filter),
  ]);

  return {
    items: batches.map((b) => ({
      id: b._id.toString(),
      totalImages: b.totalImages,
      processedImages: b.processedImages,
      totalFacesDetected: b.totalFacesDetected,
      autoMapped: b.autoMapped,
      unmatched: b.unmatched,
      status: b.status,
      createdAt: b.createdAt,
      completedAt: b.completedAt,
    })),
    total,
    page: query.page,
    totalPages: Math.ceil(total / query.limit),
  };
}

export async function getBatch(teamId: string, batchId: string) {
  const batch = await UploadBatch.findOne({ _id: batchId, teamId });
  if (!batch) throw new NotFoundError('UploadBatch', batchId);

  const images = await Image.find({ uploadBatchId: batchId })
    .select('-__v')
    .sort({ createdAt: 1 });

  return {
    id: batch._id.toString(),
    totalImages: batch.totalImages,
    processedImages: batch.processedImages,
    totalFacesDetected: batch.totalFacesDetected,
    autoMapped: batch.autoMapped,
    unmatched: batch.unmatched,
    status: batch.status,
    createdAt: batch.createdAt,
    completedAt: batch.completedAt,
    images: images.map((img) => ({
      id: img._id.toString(),
      filePath: img.filePath,
      originalName: img.originalName,
      facesDetected: img.facesDetected,
      status: img.status,
    })),
  };
}

export async function getReviewData(teamId: string, batchId: string) {
  const batch = await UploadBatch.findOne({ _id: batchId, teamId });
  if (!batch) throw new NotFoundError('UploadBatch', batchId);

  const imageIds = (await Image.find({ uploadBatchId: batchId }).select('_id')).map(
    (i) => i._id,
  );

  const faces = await Face.find({ teamId, imageId: { $in: imageIds } })
    .select('-embedding')
    .populate('imageId', 'filePath originalName')
    .populate('identityId', 'name description')
    .sort({ createdAt: 1 });

  const existingIdentities = await Identity.find({ teamId })
    .select('name description facesCount')
    .sort({ name: 1 });

  return {
    batch: {
      id: batch._id.toString(),
      totalImages: batch.totalImages,
      totalFacesDetected: batch.totalFacesDetected,
      autoMapped: batch.autoMapped,
      unmatched: batch.unmatched,
      status: batch.status,
    },
    faces: faces.map((f) => ({
      faceId: f._id.toString(),
      image: f.imageId,
      bbox: f.bbox,
      gender: f.gender,
      age: f.age,
      qualityScore: f.qualityScore,
      suggestedIdentity: f.identityId
        ? { id: (f.identityId as unknown as { _id: string; name: string })._id?.toString?.() ?? f.identityId.toString(), name: (f.identityId as unknown as { name: string }).name }
        : null,
      mappingStatus: f.mappingStatus,
      mappingConfidence: f.mappingConfidence,
    })),
    existingIdentities: existingIdentities.map((i) => ({
      id: i._id.toString(),
      name: i.name,
      description: i.description,
      facesCount: i.facesCount,
    })),
  };
}

export async function submitReview(
  teamId: string,
  batchId: string,
  input: ReviewMappingInput,
) {
  const batch = await UploadBatch.findOne({ _id: batchId, teamId });
  if (!batch) throw new NotFoundError('UploadBatch', batchId);

  for (const mapping of input.mappings) {
    const face = await Face.findOne({ _id: mapping.faceId, teamId });
    if (!face) continue;

    switch (mapping.action) {
      case 'confirm': {
        await Face.findByIdAndUpdate(face._id, {
          identityId: mapping.identityId,
          mappingStatus: 'confirmed',
        });
        break;
      }
      case 'reassign': {
        if (face.identityId) {
          await Identity.findByIdAndUpdate(face.identityId, { $inc: { facesCount: -1 } });
        }
        await Face.findByIdAndUpdate(face._id, {
          identityId: mapping.identityId,
          mappingStatus: 'manual',
        });
        await Identity.findByIdAndUpdate(mapping.identityId, { $inc: { facesCount: 1 } });
        break;
      }
      case 'create': {
        await checkPlanLimit(teamId, 'maxIdentities');
        const identity = await Identity.create({
          teamId,
          name: mapping.name,
          description: mapping.description,
          facesCount: 1,
        });
        await incrementUsage(teamId, 'maxIdentities');
        await Face.findByIdAndUpdate(face._id, {
          identityId: identity._id,
          mappingStatus: 'manual',
        });
        break;
      }
      case 'skip': {
        if (face.identityId) {
          await Identity.findByIdAndUpdate(face.identityId, { $inc: { facesCount: -1 } });
        }
        await Face.findByIdAndUpdate(face._id, {
          identityId: null,
          mappingStatus: 'unmatched',
          mappingConfidence: 0,
        });
        break;
      }
    }
  }

  await UploadBatch.findByIdAndUpdate(batchId, {
    status: 'completed',
    completedAt: new Date(),
  });

  return { batchId, status: 'completed' };
}

export async function getBatchProgress(teamId: string, batchId: string) {
  const batch = await UploadBatch.findOne({ _id: batchId, teamId });
  if (!batch) throw new NotFoundError('UploadBatch', batchId);

  return {
    batchId: batch._id.toString(),
    status: batch.status,
    totalImages: batch.totalImages,
    processedImages: batch.processedImages,
    totalFacesDetected: batch.totalFacesDetected,
    autoMapped: batch.autoMapped,
    unmatched: batch.unmatched,
    progress: batch.totalImages > 0
      ? Math.round((batch.processedImages / batch.totalImages) * 100)
      : 0,
  };
}

export async function deleteImage(teamId: string, imageId: string) {
  const image = await Image.findOne({ _id: imageId, teamId });
  if (!image) throw new NotFoundError('Image', imageId);

  await Face.deleteMany({ imageId: image._id });
  await deleteFile(image.filePath);
  await Image.deleteOne({ _id: image._id });

  await UploadBatch.findByIdAndUpdate(image.uploadBatchId, {
    $inc: { totalImages: -1, totalFacesDetected: -image.facesDetected },
  });
}
