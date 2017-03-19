const flave = require('../index.js');
const fs = require('fs');

transpile('../samples/test.flave', '../samples/test.js');
transpile('../samples/sample.flave', '../samples/sample.js');
flave.transpile('class sample{view main{<h2>Test</h2>}}', {
    newlines: false
})

function transpile(src, dest) {
    fs.readFile(src, function(error, data) {
        if (!error)
            fs.writeFile(dest, flave.transpile(data.toString(), {
                newlines: true
            }))
    })
}
