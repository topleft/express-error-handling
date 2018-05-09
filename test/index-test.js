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
    done();
  });

  xit('responds with the error object in the body', (done) => {

    chai.request(app).get('/error')
    .then((res) => {
      res.status.should.equal(500);
      res.body.error.error.should.have.property('stack');
      done();
    })
    .catch(done);
  });


  xit('logs the error to the console', (done) => {

    const consoleSpy = sinon.spy(console, 'log');

    chai.request(app).get('/error')
    .then((res) => {
      res.status.should.equal(500);
      consoleSpy.calledOnce.should.be.true;
      done();
    })
    .catch(done);
  });

  xit('responds with a 500', (done) => {

    chai.request(app).get('/error/return')
    .then((res) => {
      res.status.should.equal(500);
      done();
    })
    .catch(done);
  });

  xit('responds with a 500', (done) => {

    chai.request(app).get('/error/throw')
    .then((res) => {
      res.status.should.equal(500);
      done();
    })
    .catch(done);
  });

  xit('rejected Promise returns with a 503', (done) => {
    chai.request(app).get('/error/promise')
    .then((res) => {
      res.status.should.equal(503);
      res.body.error.message.should.equal('Promise Failed')
      done();
    })
    .catch(done);
  });

  xit('rejected Nested Promise returns with a 503', (done) => {
    chai.request(app).get('/error/consumed-promise')
    .then((res) => {
      res.status.should.equal(503);
      res.body.error.message.should.equal('Promise Failed')
      done();
    })
    .catch(done);
  });

  xit('handles expected validation error', (done) => {
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

})
