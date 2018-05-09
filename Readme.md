### Node/Express Error Handling

1. What is the best way to bubble errors up to the client?
1. What role does `next()` play in the handling off errors?
1. Should I always rely on middleware to bubble up my errors or should I explicitly res.send errors?
1. How can I be sure that errors will log properly by creating a useful stack trace, while not exposing anything to the client?


#### The out of the box express error handler is no good.
  - stripping the response of the error based on env is bogus
    - errors in recent versions of Node do not have enumerable properties, so when converted to json, they are empty objects
  - the `res.locals` as far as I can tell are meant for using with templates, Node/Express backends are typically going to be json apis
  - it relies on the user to log errors, and if the error is uncaught, there is no visibility


#### Handle all errors that will be reported to the client in the middleware

#### Checkout the example tests

### Conclusions
  - run time errors don't log themselves
  - handle all errors that will be reported to the client in the middleware
  - if you have access to the routes `next` function, call `next(error)`
  - otherwise - `throw` the error
  - return next in routes, otherwise the rest of the route logic will execute


