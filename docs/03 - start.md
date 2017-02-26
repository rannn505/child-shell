## Quick start
```javascript
const shell = require('node-powershell');
let ps = new shell({
  executionPolicy: 'Bypass',
  noProfile: true
});

ps.addCommand('echo "node-powershell rocks"')
ps.invoke()
  .then(output=> {
    console.log(output);
    ps.dispose();
  })
  .catch(err=> {
    console.log(err);
    ps.dispose();
  });
```
