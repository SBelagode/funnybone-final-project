import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createCaptionGenerationTask } from '../src/utils/caption-generation-task.ts'
import { runCaptionJob } from '../src/utils/caption-job-client.ts'

const imageId = randomUUID()
const caption = (id = randomUUID()) => ({ id, image_id: imageId })

test('background work keeps polling and notifies only after captions load', async () => {
  const notices = []
  const activity = []
  const task = createCaptionGenerationTask(
    notice => notices.push(notice), running => activity.push(running),
  )
  assert.deepEqual(activity, [], 'foreground work does not show the background indicator')
  const jobId = randomUUID()
  const captionId = randomUUID()
  let submissions = 0
  let polls = 0
  const captions = await runCaptionJob(imageId, {
    ...task,
    apiUrl: 'https://example.test',
    getAuth: async () => ({ userId: randomUUID(), accessToken: 'test-token' }),
    fetchImpl: async (_url, init) => {
      if (init.method === 'POST') {
        submissions++
        return Response.json({ jobId }, { status: 202 })
      }
      const completed = polls++ > 0
      return Response.json({ jobId, status: completed ? 'completed' : 'running',
        captionIds: completed ? [captionId] : [],
        progress: { total: 1, completed: completed ? 1 : 0, failed: 0,
          completedSteps: completed ? 1 : 0, totalSteps: 1 } })
    },
    wait: async () => {
      task.continueInBackground()
      assert.equal(task.signal.aborted, false)
    },
    loadCaptions: async ids => {
      assert.equal(notices.length, 0, 'a terminal status is not yet a loaded result')
      assert.deepEqual(activity, [true], 'keep the indicator visible until captions load')
      return ids.map(caption)
    },
  })
  task.complete(captions)
  assert.equal(submissions, 1)
  assert.equal(polls, 2)
  assert.equal(notices.length, 1)
  assert.equal(notices[0].jobId, jobId)
  assert.notEqual(notices[0].jobId, task.id, 'links use the saved job ID, not the browser task ID')
  assert.deepEqual(notices[0].captionIds, [captionId])
  assert.equal(notices[0].imageId, imageId)
  assert.equal(notices[0].failed, false)
  assert.deepEqual(activity, [true, false])
  task.complete(captions)
  task.continueInBackground()
  assert.equal(notices.length, 1, 'late callbacks must not duplicate a notification')
  assert.deepEqual(activity, [true, false], 'late callbacks must not restart the indicator')
})

test('completion while staying on the caption page does not add a background notification', () => {
  const notices = []
  const task = createCaptionGenerationTask(notice => notices.push(notice))
  task.complete([caption()])
  assert.deepEqual(notices, [])
})

test('continuing during the final loading delay still reports the completed result once', () => {
  const notices = []
  const activity = []
  const task = createCaptionGenerationTask(
    notice => notices.push(notice), running => activity.push(running),
  )
  task.complete([caption()])
  task.continueInBackground()
  task.continueInBackground()
  assert.equal(notices.length, 1)
  assert.deepEqual(activity, [], 'already loaded captions must not flash a progress indicator')
})

test('partial completion reports available captions without claiming all flavors succeeded', () => {
  const notices = []
  const task = createCaptionGenerationTask(notice => notices.push(notice))
  task.continueInBackground()
  task.onProgress({ status: 'partially_completed', captionIds: [] })
  const partialCaption = caption()
  task.complete([partialCaption])
  assert.equal(notices.length, 1)
  assert.match(notices[0].title, /some flavors could not finish/)
  assert.deepEqual(notices[0].captionIds, [partialCaption.id])
  assert.equal(notices[0].failed, false)
})

test('a notification includes the full job even if the page mixes in popular captions', () => {
  const notices = []
  const task = createCaptionGenerationTask(notice => notices.push(notice))
  const newCaptionIds = Array.from({ length: 12 }, () => randomUUID())
  const jobId = randomUUID()
  task.continueInBackground()
  task.onProgress({ jobId, status: 'completed', captionIds: newCaptionIds })
  task.complete([caption(), caption(newCaptionIds[0])])
  assert.deepEqual(notices[0].captionIds, newCaptionIds)
  assert.equal(notices[0].imageId, imageId)
  assert.equal(notices[0].jobId, jobId)
})

test('upload or generation errors in the background report failure, never success', () => {
  const notices = []
  const activity = []
  const task = createCaptionGenerationTask(
    notice => notices.push(notice), running => activity.push(running),
  )
  task.continueInBackground()
  task.fail(new Error('Image upload failed. Please try again.'))
  task.complete([caption()])
  assert.equal(notices.length, 1)
  assert.equal(notices[0].failed, true)
  assert.equal(notices[0].captionIds, undefined)
  assert.equal(notices[0].imageId, undefined)
  assert.match(notices[0].description, /Image upload failed/)
  assert.deepEqual(activity, [true, false], 'errors must clear the progress indicator')
})

test('canceled tasks cannot publish late results or errors after provider cleanup', () => {
  const notices = []
  const activity = []
  const task = createCaptionGenerationTask(
    notice => notices.push(notice), running => activity.push(running),
  )
  task.continueInBackground()
  task.cancel()
  task.complete([caption()])
  task.fail(new Error('late failure'))
  task.cancel()
  task.continueInBackground()
  assert.equal(task.signal.aborted, true)
  assert.deepEqual(notices, [])
  assert.deepEqual(activity, [true, false], 'cleanup clears background activity exactly once')
})

test('multiple background generations publish independent notifications', () => {
  const notices = []
  let backgroundCount = 0
  const onBackgroundChange = running => { backgroundCount += running ? 1 : -1 }
  const first = createCaptionGenerationTask(notice => notices.push(notice), onBackgroundChange)
  const second = createCaptionGenerationTask(notice => notices.push(notice), onBackgroundChange)
  first.continueInBackground()
  first.continueInBackground()
  second.continueInBackground()
  assert.equal(backgroundCount, 2, 'each detached task contributes once to the indicator')
  const firstCaption = caption()
  first.complete([firstCaption])
  assert.equal(backgroundCount, 1, 'keep the indicator while another image is processing')
  const secondCaption = caption()
  second.complete([secondCaption])
  assert.equal(backgroundCount, 0)
  assert.equal(notices.length, 2)
  assert.notEqual(notices[0].id, notices[1].id)
  assert.deepEqual(notices.map(notice => notice.captionIds),
    [[firstCaption.id], [secondCaption.id]])
})
