/**
 * corners/registry.js — Extensible Corners System
 * Phase 7: registry of pluggable site sections ("corners").
 *
 * Each corner gets:
 *   - A door on the Arcade Hall map
 *   - A tab in the contribute form
 *   - An admin moderation tab
 *   - Storage via corner_items(corner_id, ...) in the DB
 *
 * HOW TO ADD A NEW CORNER (see README.md for full docs):
 *
 *   import { registerCorner } from '@/corners/registry.js';
 *   registerCorner({
 *     id:               'guestbook',
 *     title:            "Muski's Guestbook",
 *     icon:             '📖',
 *     unlock:           'post_unlock',   // 'always' | 'post_unlock' | 'post_boss'
 *     component:        () => import('./guestbook/index.js'),
 *     contributionForm: () => import('./guestbook/contribute.js'),
 *     schema: {
 *       type: 'object',
 *       required: ['message'],
 *       properties: { message: { type: 'string', maxLength: 300 } },
 *     },
 *     moderation: { previewFields: ['message'] },
 *   });
 */

/** @type {Map<string, object>} */
const _corners = new Map();

/**
 * Register a new corner.
 * @param {object} corner
 * @param {string}   corner.id               unique ID (matches corner_items.corner_id)
 * @param {string}   corner.title            display name
 * @param {string}   corner.icon             emoji icon
 * @param {string}   corner.unlock           'always' | 'post_unlock' | 'post_boss'
 * @param {Function} corner.component        () => import('...')
 * @param {Function} corner.contributionForm () => import('...')
 * @param {object}   corner.schema           JSON schema for payload validation
 * @param {object}   corner.moderation       { previewFields: string[] }
 */
export function registerCorner(corner) {
  if (!corner.id) throw new Error('Corner must have an id');
  if (_corners.has(corner.id)) {
    console.warn(`[corners] Overwriting existing corner: ${corner.id}`);
  }
  _corners.set(corner.id, corner);
}

/** Get all registered corners. */
export function getAllCorners() {
  return Array.from(_corners.values());
}

/** Get a corner by ID. */
export function getCorner(id) {
  return _corners.get(id) ?? null;
}
