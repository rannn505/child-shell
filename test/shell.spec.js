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
  console.log(__dirname);

  before(() => {
    ps = new shell({
      executionPolicy: 'Bypass',
      debugMsg: true,
      noProfile: false
    });
  });
  after(() => {
    ps.dispose();
  });

  it('addCommand resolve array', () => {
    return Promise.all([
      expect(ps.addCommand('Write-Host test -nonewline')).to.eventually.be.an('array'),
      expect(ps.invoke()).to.eventually.equal('test')
    ]);
  });
  it('addCommand param syntax - {name: "", value: ""}', () => {
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
});
