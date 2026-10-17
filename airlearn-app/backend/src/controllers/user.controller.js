const fs = require('fs');
const os = require('os');
const path = require('path');
const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const userRepository = require('../db/user.repository');
const paymentRepository = require('../db/payment.repository');
const supabase = require('../db/supabase');
const logger = require('../services/logger');

const LEARNING_PDF_PATH = path.resolve(
  process.env.LEARNING_PDF_PATH ||
    path.join(os.homedir(), 'Downloads', 'RD chinese workbook.pdf')
);

async function createAccount(req, res) {
  const { name, email, occupation } = req.body;
  if (!name || !email || !occupation) {
    return res.status(400).json({ message: 'name, email and occupation are required' });
  }
  try {
    const user = await userRepository.updateUser(req.userId, { name, email, occupation });
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user });
  } catch (error) {
    logger.error('user_account_update_failed', {
      module: 'user',
      stage: 'create_account',
      requestId: req.requestId,
      statusCode: 503,
      error,
    });
    return res.status(503).json({ message: 'Could not save your account to the database.' });
  }
}

async function updateProfile(req, res) {
  const { name, email, occupation } = req.body;
  const fields = {};
  if (name !== undefined) fields.name = name;
  if (email !== undefined) fields.email = email;
  if (occupation !== undefined) fields.occupation = occupation;
  try {
    const user = await userRepository.updateUser(req.userId, fields);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user });
  } catch (error) {
    logger.error('user_profile_update_failed', {
      module: 'user',
      stage: 'update_profile',
      requestId: req.requestId,
      statusCode: 503,
      error,
    });
    return res.status(503).json({ message: 'Could not save your account to the database.' });
  }
}

async function setLanguage(req, res) {
  const { language } = req.body;
  if (!['tamil', 'english'].includes(language)) {
    return res.status(400).json({ message: "language must be 'tamil' or 'english'" });
  }
  try {
    const user = await userRepository.updateUser(req.userId, { language });
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user });
  } catch (error) {
    logger.error('user_language_update_failed', {
      module: 'user',
      stage: 'set_language',
      requestId: req.requestId,
      statusCode: 503,
      error,
    });
    return res.status(503).json({ message: 'Could not save your account to the database.' });
  }
}

async function getMe(req, res) {
  try {
    const user = await userRepository.getUserById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user });
  } catch (error) {
    logger.error('user_profile_load_failed', {
      module: 'user',
      stage: 'get_profile',
      requestId: req.requestId,
      statusCode: 503,
      error,
    });
    return res.status(503).json({ message: 'Could not load your account from the database.' });
  }
}

async function claimStrokePreview(req, res) {
  try {
    const result = await userRepository.claimStrokePreview(req.userId);
    return res.json(result);
  } catch (error) {
    logger.error('user_stroke_preview_claim_failed', {
      module: 'user',
      stage: 'claim_stroke_preview',
      requestId: req.requestId,
      statusCode: 503,
      error,
    });
    return res.status(503).json({ message: 'Could not verify stroke practice access.' });
  }
}

async function deleteAccount(req, res) {
  let user;
  try {
    user = await userRepository.archiveAndDeleteUser(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
  } catch (error) {
    logger.error('user_account_deletion_failed', {
      module: 'user',
      stage: 'delete_account',
      requestId: req.requestId,
      statusCode: 503,
      error,
    });
    return res.status(503).json({ message: 'Could not delete your account from the database.' });
  }
  return res.json({ success: true });
}

async function downloadLearningPdf(req, res) {
  let purchasedBatches;
  try {
    purchasedBatches = await paymentRepository.getUserEntitlements(req.userId);
  } catch (error) {
    logger.error('learning_pdf_access_check_failed', {
      module: 'user',
      stage: 'download_learning_pdf_access_check',
      requestId: req.requestId,
      statusCode: 503,
      error,
    });
    return res.status(503).json({ message: 'Could not verify access to the learning PDF.' });
  }
  if (!Object.keys(purchasedBatches).length) {
    return res.status(403).json({ message: 'An active batch purchase is required to download the learning PDF.' });
  }

  const storageObjectUrl = process.env.SUPABASE_STORAGE_OBJECT_URL;
  const storageBucket = process.env.SUPABASE_STORAGE_BUCKET;
  const storageObjectPath = process.env.SUPABASE_STORAGE_OBJECT_PATH;

  if (storageObjectUrl || storageBucket || storageObjectPath) {
    const supabaseUrl = process.env.SUPABASE_STORAGE_URL || process.env.SUPABASE_URL;
    const isPublicBucket = process.env.SUPABASE_STORAGE_PUBLIC === 'true';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (
      !storageObjectUrl &&
      (!storageBucket || !storageObjectPath || !supabaseUrl || (!isPublicBucket && !serviceRoleKey))
    ) {
      return res.status(503).json({ message: 'The learning PDF storage is not configured.' });
    }

    let objectUrl;
    if (storageObjectUrl) {
      objectUrl = new URL(storageObjectUrl);
    } else {
      const accessType = isPublicBucket ? 'public' : 'authenticated';
      const encodedObjectPath = storageObjectPath.split('/').map(encodeURIComponent).join('/');
      objectUrl = new URL(
        `/storage/v1/object/${accessType}/${encodeURIComponent(storageBucket)}/${encodedObjectPath}`,
        supabaseUrl
      );
    }
    const headers = storageObjectUrl || isPublicBucket
      ? {}
      : { apikey: serviceRoleKey, authorization: `Bearer ${serviceRoleKey}` };

    try {
      const storageResponse = await fetch(objectUrl, { headers });
      if (!storageResponse.ok) {
        logger.error('learning_pdf_storage_request_failed', {
          module: 'user',
          stage: 'download_learning_pdf',
          requestId: req.requestId,
          statusCode: storageResponse.status === 404 ? 404 : 502,
          providerStatus: storageResponse.status,
        });
        const status = storageResponse.status === 404 ? 404 : 502;
        return res.status(status).json({
          message: status === 404 ? 'The learning PDF is not available.' : 'Could not download the learning PDF.',
        });
      }

      if (!storageResponse.body) {
        throw new Error('The learning PDF response did not include a readable body.');
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="RD chinese workbook.pdf"');
      const contentLength = storageResponse.headers?.get('content-length');
      if (contentLength && /^\d+$/.test(contentLength)) {
        res.setHeader('Content-Length', contentLength);
      }
      res.status(200);
      await pipeline(Readable.fromWeb(storageResponse.body), res);
      return;
    } catch (error) {
      logger.error('learning_pdf_storage_request_failed', {
        module: 'user',
        stage: 'download_learning_pdf',
        requestId: req.requestId,
        statusCode: 502,
        error,
      });
      if (res.headersSent || res.destroyed) {
        res.destroy(error);
        return;
      }
      return res.status(502).json({ message: 'Could not download the learning PDF.' });
    }
  }

  if (!fs.existsSync(LEARNING_PDF_PATH)) {
    logger.info('learning_pdf_file_not_found', {
      module: 'user',
      stage: 'download_learning_pdf',
      requestId: req.requestId,
      statusCode: 404,
    });
    return res.status(404).json({ message: 'The learning PDF is not available.' });
  }

  res.download(LEARNING_PDF_PATH, 'RD chinese workbook.pdf', (error) => {
    if (error && !res.headersSent) {
      logger.error('learning_pdf_file_download_failed', {
        module: 'user',
        stage: 'download_learning_pdf',
        requestId: req.requestId,
        statusCode: 500,
        error,
      });
      res.status(500).json({ message: 'Could not download the learning PDF.' });
    }
  });
}

async function getFoundationWelcomeVideo(req, res) {
  try {
    const { data, error } = await supabase.getClient()
      .storage
      .from('Rajdharma_app_pdf')
      .createSignedUrl('Videos/Welcome.mp4', 60 * 60);
    if (error) throw error;
    if (!data?.signedUrl) throw new Error('Supabase did not return a signed video URL.');
    return res.json({ videoUrl: data.signedUrl });
  } catch (error) {
    logger.error('foundation_welcome_video_url_failed', {
      module: 'user',
      stage: 'foundation_welcome_video_url',
      requestId: req.requestId,
      statusCode: 502,
      error,
    });
    return res.status(502).json({ message: 'Could not load the Foundation Batch video.' });
  }
}

module.exports = {
  createAccount,
  updateProfile,
  setLanguage,
  getMe,
  claimStrokePreview,
  deleteAccount,
  downloadLearningPdf,
  getFoundationWelcomeVideo,
};
