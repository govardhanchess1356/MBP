/**
 * corners/sticker-book/contribute.js — Sticker submission form
 * Phase 7: contributor submits a pixel sticker (emoji + message + colour).
 *           Validates against the sticker schema, calls submit_corner_item RPC.
 */
// TODO Phase 7
export function mountStickerContributeForm(_container, _rawToken) {
  throw new Error('sticker contribute form not implemented — Phase 7');
}

/**
 * JSON schema for sticker book payload (used in registerCorner + server-side check)
 * @type {object}
 */
export const STICKER_SCHEMA = {
  type: 'object',
  required: ['sticker_emoji', 'message'],
  properties: {
    sticker_emoji: { type: 'string', maxLength: 4 },
    message:       { type: 'string', maxLength: 200 },
    color:         { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
  },
  additionalProperties: false,
};
