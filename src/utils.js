const lineByLine = require('n-readlines');


function readFile(file, lineHandler = () => {}, skipFisrt = false, extraParams = [] ) {
    const liner = new lineByLine(file, {readChunk: 1000});
    let line;
    let lineNumber = 0;
    
    const result = []
    while (line = liner.next()) {
        if(skipFisrt && lineNumber === 0) {
            lineNumber++;
            continue;
        }
        const lineStr = line.toString('ascii');
        // console.log('Line ' + lineNumber + ': ' + lineStr);
        const res = lineHandler(lineStr, ...extraParams);
        if(res) {
            result.push(res);
        }        
        lineNumber++;
    }
    console.log("RESULTS", result.length);
    return result;
}

module.exports = {
    readFile,
}