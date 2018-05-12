module.exports = {

  throwError: () => {
    throw new Error('regular function error');
  },

  returnError: () => {
    return new Error('regular function error');
  },

  promiseReject: () => {
    return new Promise((resolve, reject) => {
      const error = new Error('Promise Failed');
      error.status = 503; // database error
      reject(error);
    });
  },

  promiseConsumerReturn: (promiseFunc) => {
    return promiseFunc()
    .then((result) => result)
      .catch((err) => {
        return err;
      });
  },

  promiseConsumerThrow: (promiseFunc) => {
    return promiseFunc()
    .then((result) => result)
      .catch((err) => {
        throw err;
      });
  },

  expectedError: () => {
    const valid = false;
    if (!valid) {
      const error = new Error('expected error')
      error.status = 400;
      throw error;
    }
  },

  middlewareFn: (req, res, next) => {
    const error = new Error('error in middleware');
    error.status = 401;
    next(error);
  },

  asyncAwaitError: async (data) => {
    const error = new Error('async await error');
    error.status = 503;
    await Promise.reject(error);
    return 'result';
  },

  nodeCbError: (cb) => {
    const err = new Error('callback error');
    err.status = 503;
    const result = null;
    cb(err, result);
  }

}

