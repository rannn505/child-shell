# Properties

### history [Array]

An array containing the command history ever added to the shell instance.

```javascript
console.log(ps.history);
```

### streams [Object]

An object containing the [sdtio (in,out,err)](https://nodejs.org/api/child_process.html#child_process_child_stderr) [[stream.Readable]](https://nodejs.org/api/stream.html#stream_class_stream_readable) of the PowerShell Instance.

```javascript
ps.streams.stdin.write();
ps.streams.stdout.on('data', data=>{});
```