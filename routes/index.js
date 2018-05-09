const express = require('express');
const router = express.Router();
const helpers = require('../helpers');

router.get('/error', function(req, res, next) {
  const name = req.body.profile.name;
  res.status(200).json({ title: 'FrontEnd Guild' });
});

router.get('/error/return', function(req, res, next) {
  helpers.throwError();
  res.status(200).json({ title: 'FrontEnd Guild' });
});

router.get('/error/throw', function(req, res, next) {
  helpers.throwError();
  res.status(200).json({ title: 'FrontEnd Guild' });
});

router.get('/error/promise', function(req, res, next) {
  helpers.promiseReject()
    .then(() => {
      res.status(200).json({ title: 'FrontEnd Guild' });
    })
    .catch(next);
});

router.get('/error/consumed-promise', function(req, res, next) {
  helpers.promiseConsumer(helpers.promiseReject)
    .then(() => {
      res.status(200).json({ title: 'FrontEnd Guild' });
    })
    .catch(next);
  });

router.get('/error/expected', function(req, res, next) {
  try {
    helpers.expectedError()
  } catch (e) {
    return next(e);
  }
  res.status(200).json({ title: 'FrontEnd Guild' });
});

router.get('/error/middleware', helpers.middlewareFn, function(req, res, next) {
  res.status(200).json({ title: 'FrontEnd Guild' });
});

module.exports = router;
