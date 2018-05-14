### Node/Express Error Handling

Proper error handling in web applications is essential to security, maintenance, user experience, developer experience, and even performance. In other words, error handling touches every part of your application. I am going to examine a very basic view of error handling in a Node/Express JSON API.

First I will examine the out of the box error handler that ships with Express Generator. The Express way to handle errors is through something called middleware. This article in the Express docs, [Using Middleware](https://expressjs.com/en/guide/using-middleware.html).

### Questions

1. What is the best way to bubble errors up to the client?
1. What role does `next()` play in the handling of errors?
1. Should I always rely on middleware to bubble up my errors or should I explicitly `res.send` errors?
1. How can I be sure that errors will log properly by creating a useful stack trace, while not exposing anything to the client?

# Giving Errors a Place to Go

Stock Express Middleware Error Handler

```js
// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
```

This middleware function assumes that a template engine will be used, which makes sense as Jade ships with the express generator. But I would like to create a JSON API, so this function needs updating to work for my purposes.

```js
// error handler
app.use(function(err, req, res, next) {

// unless we are running test, console.log the error
if (app.get('env') !== 'test') console.log(err);

  // make the status code available to the client
  res.status(err.status || 500);

  // send the error message and name to the client as JSON
  res.json({
    error: {
      message: err.message,
      name: err.name
    }
  });

});
```

I have commented the above code to explain its purpose, but there are some ideas that I would like to highlight.

**Why am I logging the error to the console?**

Runtime errors do not expose themselves. Unless we log this error, the only evidence of it will be the information we sent in the response. By logging the error we can look at our server's output, and assess what went wrong, whether it was something benign like a bad request (eg - malformed JSON) or something severe like an uncaught exception (eg - developer mistake).

**Why am I sending just the error message and name back to the client?**

These two pieces of information, along with the HTTP status code, create a meaningful response for the consumer of this API, wether that is my own frontend or another developer's program. What I do not want to send back is the stacktrace. This would leak out private, potentially sensitive, information about my application to the public, possibly exposing vulnerabilities.

> IMPORTANT: Do not send the error stacktrace to the consumer of the application. You log them on your server console, send them toe a log file, save them in a data base, but do not send then to the client.

**The Error Class is Not Enumerable**

```js
const e = new Error('a');

console.log(e.propertyIsEnumerable('name'));
console.log(e.propertyIsEnumerable('message'));
console.log(e.propertyIsEnumerable('fileName'));
console.log(e.propertyIsEnumerable('lineNumber'));
console.log(e.propertyIsEnumerable('columnNumber'));

for (let prop in e) {
    console.log(`${prop}: ${e[prop]}`);
}

...

> false
> false
> false
> false
> false
> undefined
```

Consider the code above. What I am displaying here is that properties of Errors must be accessed directly. This is important because it can be very confusing when trying to handle errors.

Let's say we I would like to, in development only, send the error to the client to speed up my debugging process. I might write something like this:

```js
// error handler
app.use(function(err, req, res, next) {

// unless we are running test, console.log the error
if (app.get('env') !== 'test') console.log(err);

  // make the status code available to the client
  res.status(err.status || 500);

  // if development send the whole error
  const error = app.get('env') === 'development' ?
    err
    :
    {message: err.message, name: err.name}

  // send the error message and name to the client as JSON
  res.json({ error });

});
```

The resulting response?

```js
console.log(res.body.data.error);
> {}
```

This is not because the error is actually an empty object, but because the `Error` class in javascript is not [enumerable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties), therefore the keys and values do not get translated into JSON. When translating the response data into JSON, Express is actually turning it first into a string and then into byte data to be be sent via HTTP. What makes it a json response is the Content header which is set to `application/json`. Examine the following code:

```js
const x = {
  foo: 'bar'
};

const xAsString = JSON.stringify(x);

console.log(xAsString);

> '{"foo":"bar"}'

const error = new Error('Error Message');

const errorAsString = JSON.stringify(error);

console.log(errorAsString);

> {}
```

This demonstrates that when an Error is stringified, it loses its keys and values. In conclusion, Error properties are not enumerable and therefore must be accessed directly.

### Rules for Bubbling Errors Up to the Response

1. Always use the Error Instance or an object that inherits from Error when creating new errors.
1. All errors reported to consumer of the API should always be handled through the error handler middleware.
1. When the Express router method `next` is available, the error should be passed to that method.
1. If `next` is not in the scope, simply `throw` the error.
1. If all functions either `throw` or call `next(error)` when a caught error is encountered, it will always pass through the middleware.
1. Unhandled errors will be automatically sent through the error handling middleware by Express.


#### Checkout the example tests

### conclusions
  - run time errors don't log themselves
  - handle all errors that will be reported to the client in the middleware
  - if you have access to the route's `next` function, call `next(error)`
  - otherwise, `throw` the error
  - return next in routes, otherwise the rest of the route logic will execute


