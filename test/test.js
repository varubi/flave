const flave = require('../dist/index.js'),
    assert = require('assert'),
    fs = require('fs'),
    config_unformatted = {
        quote: '\'',
        stripcomments: true,
        output: '$O',
        trim: true,
        newlines: true,
        format: false,
        export: false,
    },
    config_formatted = {
        quote: '\'',
        stripcomments: true,
        output: '$O',
        trim: true,
        newlines: true,
        format: true,
        export: false,
    }
var flaves = decode('./test/samples/basic-tests.flave');
var formatted = decode('./test/samples/basic-tests-formatted.js');
var unformatted = decode('./test/samples/basic-tests-unformatted.js');
for (var section in flaves) {
    describe(section, () => {
        for (var test in flaves[section]) {
            var string_flave = (flaves[section][test]);
            var string_formatted = (formatted[section][test]);
            var string_unformatted = (unformatted[section][test]);
            describe(test, () => {
                it('Formatted ', () => { assert.equal(flave.Transpile(string_flave, config_formatted).trim(), string_formatted) });
                it('Unformatted ', () => { assert.equal(flave.Transpile(string_flave, config_unformatted).trim(), string_unformatted) });
            });
        }
    });
}

function decode(path) {
    var obj = {};
    var file = fs.readFileSync(path, 'utf8');
    var sections = file.split('/*####');
    for (var i = 0; i < sections.length; i++) {
        if (sections[i]) {
            var subsections = sections[i].split('####*/');
            var subobj = {};
            var tests = subsections[1].split('/*##')
            for (var ii = 0; ii < tests.length; ii++) {
                if (tests[ii].trim()) {
                    var testsparameters = tests[ii].split('##*/')
                    subobj[testsparameters[0].trim()] = testsparameters[1].trim().replace(/[\r\n]+/, '\n');
                }
            }
            obj[subsections[0].trim()] = subobj;
        }
    }
    return obj;
}