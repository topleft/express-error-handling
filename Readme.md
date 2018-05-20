# Node/Express Error Handling

Proper error handling in web applications is essential to security, maintenance, user experience, and developer experience. In other words, error handling touches almost every aspect of an application. Errors are to be expected in an application, and they do not always mean that something has gone wrong. More often than not, in production, errors represent expected pathways in an application that require notification to the consumer, such as a BadRequest (400) or an Unauthorized (401)request. I am going to examine a very fundamental approach to error handling in a Node/Express JSON API that will accomplish basic yet sound functionality.

### What are errors for?

This question is a little meta, but unless I know what I am trying to accomplish, there isn't much hope for success. Errors in an application serve the following purposes:

1. Abort execution of unexpected/undesired pathways
1. Allow for graceful transitions from implementations that do not work to ones that do
1. Notify the consumer, human or computer, that the program did not work as expected and/or desired. Ideally with enough information that will allow them decide how to proceed
1. Provide information to developers about flaws/bugs in the code

### Express Specific Questions

While the objective of errors in programming will remain fairly consistent between languages and frameworks, the details of implementation will certainly not. When creating a Node/Express application recently, I had the following questions about how this a JSON API should handle errors:

1. What is the best way to bubble errors up to the client?
1. What role does `next()` play in the handling of errors?
1. Should I always rely on middleware to bubble up my errors or should I explicitly `res.send` errors?
1. How can I be sure that errors will log properly by creating a useful stack trace, while not exposing anything to the client?

I will answer these questions as well as several others that came up while researching the topic.

#### Guidelines

Considering the simple objectives layed out above and these Express specific questions, here are some basic guidelines for my application code to adhere to in order to achieve these goals:

  - Runtime errors do not log themselves, an application must explicitly log errors in order to have access to error details
  - Handle all errors that will be reported to the API consumer in the middleware
  - If you have access to the route's `next` function, call `next(error)`
  - Otherwise, `throw` the error
  - Return `next` calls in routes when handling an error, otherwise the remaining logic below the `next` call will execute

# Giving Errors a Place to Go

The _Express_ convention of handling errors is through something called **middleware**. This article in the Express docs, [Using Middleware](https://expressjs.com/en/guide/using-middleware.html), explains the concept of middleware and how it is employed in Express applications. In short, the middleware pattern allows a programmer to intercept request at different points in the request life cycle, act on the request, and pass it along to the _next_ piece of application logic. As well, middleware can provide a catch-all that acts as a final destination for all errors, expected or not.

First I will examine the _out of the box_ middleware error handler that ships with [Express Generator](https://expressjs.com/en/starter/generator.html).

#### Stock Express Middleware Error Handler

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

This middleware function assumes that a template engine will be used, which makes sense as [Jade (Pug)](https://github.com/pugjs/pug) ships with the Express Generator. But I would like to create a JSON API, so this function needs updating to work for my purposes. I need to be able to communicate the error to the client in a secure way via a JSON response, as well as notify myself of what went happened.

```js
// error handler
app.use(function(err, req, res, next) {

  // unless we are running tests, console.log the error
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

**Order Matters**

This middleware function is placed at the bottom most position of the _app.js_ file. This ensures that any response, not explicitly sent back to the consumer, will pass through this function ensuring a response and avoiding a hanging request (never concluding).

**Why am I logging the error to the console?**

Runtime errors do not expose themselves. Unless we log this error, the only evidence of it will be the information we sent in the response. By logging the error we can look at our server's output, and assess what went wrong, whether it was something expected like a bad request (eg - malformed JSON) or something severe like an uncaught exception (eg - developer mistake).

**Why am I sending only the error's message and name back to the client?**

These two pieces of information, along with the HTTP status code, create a meaningful response for the consumer of this API, wether that is my own frontend or another developer's program. What I do not want to send back is the stacktrace. This would leak out private, potentially sensitive, information about my application to the public, possibly exposing vulnerabilities.

> IMPORTANT: Do not send the error stacktrace to the consumer of the application. Logging stack traces to the server console, writing them to a log file, saving them in a database are all fine, but they should not be exposed to the client.

**The Error Class is Not Enumerable**

In javascript, objects/classes have properties that can either be enumerable or not. This mimics a public/private pattern that is standard in other languages and can be useful in code organization. I want to be clear that non-enumerable properties are still accessible on javascript Classes, but cannot be looped over, which introduces some possibly unexpected behavior. Consider the following code:

```js
const e = new Error('a');

console.log(e.propertyIsEnumerable('name'));
console.log(e.propertyIsEnumerable('message'));
console.log(e.propertyIsEnumerable('fileName'));
console.log(e.propertyIsEnumerable('lineNumber'));
console.log(e.propertyIsEnumerable('columnNumber'));

...

> false
> false
> false
> false
> false

for (let prop in e) {
    console.log(`${prop}: ${e[prop]}`);
}

...

> undefined
```

What I am displaying in this example is that properties of Errors must be accessed directly. This is important because it can be very confusing when trying to handle errors. For example, let's say I would like to, in development only, send the error to the client to speed up my debugging process. I might write something like this:

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

The resulting response sent to the consumer?

```js
console.log(res.body.error);

> {}
```

This is not because the error is actually an empty object, but because the `Error` class in javascript is not [enumerable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties). Therefore, the keys and values do not get translated into JSON. Examine the following code:

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

This demonstrates that when an Error is _JSON.stringified_, it loses its keys and values. In conclusion, Error properties are not enumerable and therefore must be accessed directly.

### Bubbling Errors Up to the Response

- Always use the Error Instance or an object that inherits from Error when creating new errors.
- All errors reported to consumer of the API should always be handled through the error handler middleware.
- When the Express router method `next` is available, the error should be passed to that method.
- If `next` is not in the scope, simply `throw` the error.
- If all functions either `throw` or call `next(error)` when a caught error is encountered, it will always pass through the middleware.
- Unhandled errors will be automatically sent through the error handling middleware by Express.

**Why should all errors pass through the middleware before reaching the consumer?**

By centralizing all reporting logic and configuration in one place, I can be sure that no sensitive data is leaked, error data is uniformly formatted, and any logging strategies are executed consistently.

**What does `next` do?**

The Express router's `next` function pass the control flow of the request on to the _next_ middleware handler. When using Express router, the error handler middleware should always be defined as the last piece of middleware in the application ensuring that any properly handled, or unhandled error will pass through it.

**Example Tests**

I find that one of the best ways to learn is by writing tests and reading code. Most of the value of this post is in a test suite I wrote to identify error handling best practices with common Javascript function patterns. Included are several example routes, helpers and tests to demonstrate how errors should be handled in different situations in this sample Express application:

- [/routes/index.js](https://github.com/topleft/express-error-handling/blob/master/routes/index.js)
- [/helpers/index.js](https://github.com/topleft/express-error-handling/helpers/index.js)
- [/app.js](https://github.com/topleft/express-error-handling/app.js)
- [/test/index-test.js](https://github.com/topleft/express-error-handling/test/index-test.js)

To run the tests, clone the repository and execute to following commands:

```
$ npm i
$ npm run test
```

### Conclusions
  - Runtime errors do not log themselves, an application must explicitly log errors in order to have access to error details
  - Handle all errors that will be reported to the API consumer in the middleware
  - If you have access to the route's `next` function, call `next(error)`
  - Otherwise, `throw` the error
  - Return `next` calls in routes when handling an error, otherwise the remaining logic below the `next` call will execute

The Errors is a powerful tool to be utilized by developers to make programming easier, provide a better experience for the consumer and ensure that an application is protected. By following a consistent pattern, utilizing the framework's strengths and understanding some basics about the JS Error Class, error handling in Express applications can be simple and helpful.

Thanks for reading.



