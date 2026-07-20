import * as contentService from '../services/goldenBox/contentService.js'

function sendError(res, err, fallback = 400) {
  const statusByCode = {
    component_not_found: 404,
    cannot_edit_published_directly_use_new_version: 409,
    publish_failed_already_published_or_not_found: 409,
    no_fields_provided: 400,
  }
  res.status(statusByCode[err.code] || fallback).json({ success: false, error: err.code || 'internal_error' })
}

export async function handleListComponents(req, res) {
  try {
    const components = await contentService.listComponents({ category: req.query.category, selectableOnly: req.query.selectableOnly === 'true' })
    res.json({ success: true, components })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleGetComponent(req, res) {
  try {
    const component = await contentService.getComponent(Number(req.params.id))
    if (!component) return res.status(404).json({ success: false, error: 'component_not_found' })
    const [compatibility, quiz] = await Promise.all([
      contentService.getCompatibility(component.id),
      contentService.listQuizForComponent(component.id),
    ])
    res.json({ success: true, component, compatibility, quiz })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleListFlavorNotes(req, res) {
  try {
    const notes = await contentService.listFlavorNotes({ group: req.query.group })
    res.json({ success: true, notes })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleCreateDraft(req, res) {
  try {
    const component = await contentService.createDraftComponent(req.body, req.user.id)
    res.status(201).json({ success: true, component })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleUpdateDraft(req, res) {
  try {
    const component = await contentService.updateDraftComponent(Number(req.params.id), req.body, req.user.id)
    res.json({ success: true, component })
  } catch (err) { sendError(res, err, 500) }
}

export async function handlePublish(req, res) {
  try {
    const component = await contentService.publishComponent(Number(req.params.id), req.user.id)
    res.json({ success: true, component })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleArchive(req, res) {
  try {
    const component = await contentService.archiveComponent(Number(req.params.id), req.user.id)
    res.json({ success: true, component })
  } catch (err) { sendError(res, err, 500) }
}
