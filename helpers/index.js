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

  promiseConsumer: (promiseFunc) => {
    return promiseFunc()
    .then((result) => result)
      .catch((err) => {
        return err;
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
  }

}


async function asyncAwaitHelper(data) {
  const y = data.name.last; // uncaught error
  throw new Error('async await error');
};

const nodeCbFn = (cb) => {
  const err = new Error('callback error');
  const result = null;
  cb(err, result);
}

const middlewareFn = (req, res, next) => {
  const error = new Error('error in middleware');
  error.status = 401;
  next(error);
}
