const chai = require('chai');
const path = require('path');
const chaiAsPromised = require("chai-as-promised");

// chai config
const expect = chai.expect;
chai.use(chaiAsPromised);

// test files
const shell = require(path.join(__dirname, '..', 'dist', 'index'));


describe('Shell', () => {
  let ps;
  before(() => {
    ps = new shell({
      executionPolicy: 'Bypass',
      debugMsg: true,
      noProfile: true
    });
  });

  it('addCommand promise', () => {
    expect(ps.addCommand('echo test')).to.eventually.be.an('array');
  });

  after(() => {
    ps.dispose();
  });
});
