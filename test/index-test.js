const chai = require('chai');
const http = require('chai-http');
const should = chai.should();
const sinon = require('sinon');
chai.use(require('chai-as-promised'));
chai.use(http);

const app = require('../app.js');


describe('error tests', () => {

  let sandbox;

  beforeEach((done) => {
    sandbox = sinon.createSandbox();
    done();
  });

  afterEach((done) => {
    sandbox.restore()
    app.set('env', 'test')
    done();
  });

  it('responds with the error as empty object in the body', (done) => {

    chai.request(app).get('/error')
    .then((res) => {
      res.status.should.equal(500);
      Object.keys(res.body.error.error).length.should.equal(0);
      done();
    })
    .catch(done);
  });


  it('logs the error to the console (when NODE_ENV !== test)', (done) => {
    app.set('env', 'not_test');
    const consoleSpy = sinon.spy(console, 'log');

    chai.request(app).get('/error')
    .then((res) => {
      res.status.should.equal(500);
      consoleSpy.calledOnce.should.be.true;
      done();
    })
    .catch(done);
  });

  it('responds with 200, because returning does not stop route execution', (done) => {

    chai.request(app).get('/error/return')
    .then((res) => {
      res.status.should.equal(200);
      done();
    })
    .catch(done);
  });

  it('responds with 500 because throwing error invokes middleware error handler', (done) => {

    chai.request(app).get('/error/throw')
    .then((res) => {
      res.status.should.equal(500);
      done();
    })
    .catch(done);
  });

  it('rejected Promise returns with a 503', (done) => {
    chai.request(app).get('/error/promise')
    .then((res) => {
      res.status.should.equal(503);
      res.body.error.message.should.equal('Promise Failed')
      done();
    })
    .catch(done);
  });

  it('RETURNED error in nested rejected promise responds with a 200', (done) => {
    chai.request(app).get('/error/nested-promise/return')
    .then((res) => {
      res.status.should.equal(200);
      done();
    })
    .catch(done);
  });

  it('THROWN error in nested rejected promise responds with a 503', (done) => {
    chai.request(app).get('/error/nested-promise/throw')
    .then((res) => {
      res.status.should.equal(503);
      res.body.error.message.should.equal('Promise Failed')
      done();
    })
    .catch(done);
  });

  it('handles expected error', (done) => {
    chai.request(app).get('/error/expected')
    .then((res) => {
      res.status.should.equal(400);
      res.body.error.message.should.equal('expected error');
      done();
    })
    .catch(done);
  });

  it('handles middleware error', (done) => {
    chai.request(app).get('/error/middleware')
    .then((res) => {
      res.status.should.equal(401);
      res.body.error.message.should.equal('error in middleware');
      done();
    })
    .catch(done);
  });

  it('responds with 503 thrown from an async await function', (done) => {
    chai.request(app).get('/error/async-await')
    .then((res) => {
      res.status.should.equal(503);
      res.body.error.message.should.equal('async await error');
      done();
    })
    .catch(done);
  });

  it('responds with 503 thrown from cb function', (done) => {
    chai.request(app).get('/error/callback')
    .then((res) => {
      res.status.should.equal(503);
      res.body.error.message.should.equal('callback error');
      done();
    })
    .catch(done);
  });

})
