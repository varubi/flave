const flave = require('../index.js');
const fs = require('fs');
const config = {
    quote: '\'',
    stripcomments: true,
    output: '$O',
    trim: true,
    newlines: true,
    export: false,
    format: false,
}
transpile('./test/samples/basic-tests.flave', './test/samples/basic-tests.js');
transpile('./sample/sample.flave', './sample/sample.js');

function transpile(src, dest) {
    fs.readFile(src, function (error, data) {
        if (!error)
            fs.writeFileSync(dest, flave.transpile(data.toString(), config))
    })
}
