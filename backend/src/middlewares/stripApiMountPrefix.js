const MOUNT_PREFIX = '/api/backend';

function stripApiMountPrefix(req, _res, next) {
  const url = req.url ?? '';

  if (url === MOUNT_PREFIX || url.startsWith(`${MOUNT_PREFIX}/`)) {
    req.url = url.slice(MOUNT_PREFIX.length) || '/';
  }

  next();
}

export { stripApiMountPrefix, MOUNT_PREFIX };
