/**
 * @typedef {import('../../../typedefs').TodoDetails} TodoDetails
 * @typedef {import('../../../typedefs').FileBoundaries} FileBoundaries
 * @typedef {import('../../../typedefs').GitHubContext} GitHubContext
 * @typedef {import('../../../typedefs').DiffChunk}  DiffChunk
 * @typedef {import('../../../typedefs').DiffChange} DiffChange
 */

/**
 * Get the file boundaries of the hunk
 * @param {DiffChange} lastChange
 * @param {number} line
 * @param {number} [padding=2]
 * @returns {FileBoundaries}
 */
function getFileBoundaries(lastChange, line, padding = 2) {
  const end = Math.min(line + padding, lastChange.ln || lastChange.ln2);
  return { start: line, end };
}

/**
 * Prepares some details about the TODO
 * @param {Object} params
 * @param {GitHubContext} params.context
 * @param {DiffChunk} params.chunk
 * @param {Object} params.config
 * @param {number} params.line
 * @returns {TodoDetails}
 */
module.exports = ({ context, chunk, config, line }) => {
  const number = context.payload.pull_request ? context.payload.number : null;

  let username, sha;
  if (context.payload.head_commit) {
    // Get it from the head commit in this push
    username = context.payload.head_commit.author.username;
    sha = context.payload.head_commit.id;
  } else {
    // Get it from the head ref in this PR
    username = context.payload.pull_request.head.user.login;
    sha = context.payload.pull_request.head.sha;
  }

  const blobLines = config.blobLines || 10;
  const lastChange = chunk.changes[chunk.changes.length - 1];
  const { start, end } = getFileBoundaries(lastChange, line, blobLines);
  const range = start === end ? `L${start}` : `L${start}-L${end}`;

  return {
    username,
    sha,
    number,
    range,
  };
};
