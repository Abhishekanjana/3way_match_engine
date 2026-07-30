const ApiError = require('../utils/ApiError');

function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const message = error.details.map((d) => d.message).join('; ');
      return next(new ApiError(400, 'VALIDATION_ERROR', message));
    }

    req[source] = value;
    return next();
  };
}

module.exports = validate;
