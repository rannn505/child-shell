'use strict';
const chai = require('chai');
const path = require('path');
const os   = require('os');
const chaiAsPromised = require("chai-as-promised");

// chai config
const expect = chai.expect;
chai.use(chaiAsPromised);

// test files
const shell = require('../dist/index');


describe('Shell', () => {
  let ps;
  // console.log(__dirname);

  it('Shell constructor', () => {
    ps = new shell({
      executionPolicy: 'Unrestricted',
      inputEncoding: 'utf8',
      outputEncoding: 'utf8',
      debugMsg: false,
      noProfile: true
    });
    expect(ps instanceof shell).to.be.true;
    expect(ps).to.include.keys('history', 'streams');
  });

  it('addCommand resolve array', function() {
    this.timeout(0);
    return Promise.all([
      expect(ps.addCommand('Write-Host test -nonewline')).to.eventually.be.an('array'),
      expect(ps.invoke()).to.eventually.equal('test')
    ]);
  });
  it('addCommand param syntax - {name: "", value: ""}', function() {
    this.timeout(0);
    return Promise.all([
      expect(ps.addCommand('Write-Host', [
        {name: 'object', value: 'test'},
        {name: 'foregroundcolor', value: 'red'},
        {name: 'nonewline', value: null}
      ])).to.eventually.have.deep.property('[0]', 'Write-Host -object test -foregroundcolor red -nonewline'),
      expect(ps.invoke()).to.eventually.equal('test')
    ]);
  });
  it('addCommand param syntax - {name: value}', () => {
    return Promise.all([
      expect(ps.addCommand('Write-Host', [
        {object: 'test'},
        {foregroundcolor: 'red'},
        {nonewline: null}
      ])).to.eventually.have.deep.property('[0]', 'Write-Host -object test -foregroundcolor red -nonewline'),
      expect(ps.invoke()).to.eventually.equal('test')
    ]);
  });
  it('addCommand param syntax - @param + switch', () => {
    return Promise.all([
      expect(ps.addCommand('Write-Host @object @foregroundcolor', [
        {object: 'test'},
        {foregroundcolor: 'red'},
        'nonewline'
      ])).to.eventually.have.deep.property('[0]', 'Write-Host -object test -foregroundcolor red -nonewline'),
      expect(ps.invoke()).to.eventually.equal('test')
    ]);
  });
  it('addCommand errors', () => {
    return Promise.all([
      expect(ps.addCommand('')).be.rejectedWith(`Command is missing`),
      expect(ps.addCommand('echo test', {test: 'test'})).be.rejectedWith(`Params must be an array`),
      expect(ps.addCommand('echo test', [false, new Date()])).be.rejectedWith(`All Params need to be objects or strings`),
    ]);
  });

  it('cast data types', () => {
    ps.addCommand(`& "${path.resolve(__dirname, 'scripts', 'script-dataTypes.ps1')}"`, [
      {string: 'abc'},
      {char: 'a'},
      {byte: '0x26'},
      {int: 1},
      {long: 10000000000},
      {bool: '$True'},
      {decimal: '1d'},
      // single
      {double: 1.1},
      {DateTime: new Date().toLocaleString()},
      {xml: '<a></a>'},
      {array: [1,2]},
      // {hashtable: [{A:1},{B:2}]},
      'switch'
    ]);
    return expect(ps.invoke().then(output => {
      return JSON.parse(output).every(e => e.test)
    })).to.eventually.be.true;
  });
  it('invoke failed', () => {
    ps.addCommand('throw "error"');
    return expect(ps.invoke()).to.eventually.be.rejected;
  });

  it('listen to output event', function(done) {
    this.timeout(0);
    ps.on('output', data => {
      expect(data).to.equal('test');
      ps.removeAllListeners();
      done();
    });
    ps.addCommand('Write-Host test -nonewline')
      .then(() => {
        return ps.invoke();
      });
  });
  it('listen to err event', function(done) {
    this.timeout(0);
    ps.on('err', data => {
      ps.removeAllListeners();
      done();
    });
    ps.addCommand('throw "error"')
      .then(() => {
        return ps.invoke();
      });
  });

  it('dispose Shell', function(done) {
    this.timeout(0);
    ps.on('end', data => {
      ps.removeAllListeners();
      expect(data).to.equal(0);
      done();
    });
    ps.dispose()
  });
});
