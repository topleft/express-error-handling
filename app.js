const express = require('express');
const path = require('path');
const logger = require('morgan');

const index = require('./routes/index');

const app = express();

app.use(logger('dev'));

app.use('/', index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  const env = app.get('env');
  if (app.get('env') !== 'test') console.log(err);
  res.locals.error = err;
  res.status(err.status || 500);
  res.json({
    error: {
      message: err.message,
      name: err.name
    }
  });
});

module.exports = app;
