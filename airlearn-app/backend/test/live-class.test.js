const test = require('node:test');
const { mock } = require('node:test');
const assert = require('node:assert/strict');
const paymentRepository = require('../src/db/payment.repository');
const logger = require('../src/services/logger');
const { getLiveClassMeetingLinkAt } = require('../src/controllers/user.controller');
const { isLiveClassWindowOpen } = require('../src/services/live-class-schedule');
const TEST_MEETING_URL = 'https://us06web.zoom.us/j/test-meeting?pwd=test';

function createResponse() {
  return {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test('live-class availability uses the 1st–10th and 6–8 PM IST window', () => {
  assert.equal(isLiveClassWindowOpen(new Date('2026-10-02T12:29:00.000Z')), false);
  assert.equal(isLiveClassWindowOpen(new Date('2026-10-02T12:30:00.000Z')), true);
  assert.equal(isLiveClassWindowOpen(new Date('2026-10-02T14:29:00.000Z')), true);
  assert.equal(isLiveClassWindowOpen(new Date('2026-10-02T14:30:00.000Z')), false);
  assert.equal(isLiveClassWindowOpen(new Date('2026-10-11T12:30:00.000Z')), false);
});

test('meeting link requires an active Live Class entitlement', async () => {
  mock.method(paymentRepository, 'getUserEntitlements', async () => ({
    foundation: { tier: 'videos' },
  }));
  const response = createResponse();

  try {
    await getLiveClassMeetingLinkAt(
      { userId: 'user-1' },
      response,
      new Date('2026-10-02T12:30:00.000Z')
    );
    assert.equal(response.statusCode, 403);
    assert.match(response.body.message, /Live Class package/);
  } finally {
    mock.restoreAll();
  }
});

test('meeting link is returned to a Live Class package holder during the IST window', async () => {
  mock.method(paymentRepository, 'getUserEntitlements', async () => ({
    foundation: { tier: 'videos_live' },
  }));
  const response = createResponse();
  const previousMeetingUrl = process.env.ZOOM_MEETING_URL;
  process.env.ZOOM_MEETING_URL = TEST_MEETING_URL;

  try {
    await getLiveClassMeetingLinkAt(
      { userId: 'user-1' },
      response,
      new Date('2026-10-02T12:30:00.000Z')
    );
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.meetingUrl, TEST_MEETING_URL);
  } finally {
    mock.restoreAll();
    if (previousMeetingUrl === undefined) delete process.env.ZOOM_MEETING_URL;
    else process.env.ZOOM_MEETING_URL = previousMeetingUrl;
  }
});

test('meeting link is not returned when the Zoom URL is not configured', async () => {
  mock.method(paymentRepository, 'getUserEntitlements', async () => ({
    foundation: { tier: 'videos_live' },
  }));
  mock.method(logger, 'error', () => {});
  const response = createResponse();
  const previousMeetingUrl = process.env.ZOOM_MEETING_URL;
  delete process.env.ZOOM_MEETING_URL;

  try {
    await getLiveClassMeetingLinkAt(
      { userId: 'user-1', requestId: 'request-1' },
      response,
      new Date('2026-10-02T12:30:00.000Z')
    );
    assert.equal(response.statusCode, 503);
    assert.deepEqual(response.body, { message: 'The Live Class meeting link is not configured.' });
  } finally {
    mock.restoreAll();
    if (previousMeetingUrl === undefined) delete process.env.ZOOM_MEETING_URL;
    else process.env.ZOOM_MEETING_URL = previousMeetingUrl;
  }
});

test('meeting link is not returned outside the IST window', async () => {
  mock.method(paymentRepository, 'getUserEntitlements', async () => ({
    foundation: { tier: 'videos_live' },
  }));
  const response = createResponse();

  try {
    await getLiveClassMeetingLinkAt(
      { userId: 'user-1' },
      response,
      new Date('2026-10-02T14:30:00.000Z')
    );
    assert.equal(response.statusCode, 403);
    assert.match(response.body.message, /6:00 PM to 8:00 PM IST/);
  } finally {
    mock.restoreAll();
  }
});

test('meeting-link entitlement lookup failures return an explicit service error', async () => {
  mock.method(paymentRepository, 'getUserEntitlements', async () => {
    throw new Error('database unavailable');
  });
  mock.method(logger, 'error', () => {});
  const response = createResponse();

  try {
    await getLiveClassMeetingLinkAt(
      { userId: 'user-1', requestId: 'request-1' },
      response,
      new Date('2026-10-02T12:30:00.000Z')
    );
    assert.equal(response.statusCode, 503);
    assert.deepEqual(response.body, { message: 'Could not verify Live Class access.' });
  } finally {
    mock.restoreAll();
  }
});
