const fs = require('fs');
const _chunk = require('lodash.chunk');
const { readFile } = require('./src/utils');
const { createTable, query } = require('./src/db');




const FILENAME_POS = 2;

const SPEC_NAME_POS = 0;
const SPEC_WIDTH_POS = 1;
const SPEC_DATATYPE_POS = 2;

const VALID_DATA_LENGTH = 3;


function specLineHandler(lineIn) {
    let line = lineIn.trim();
    line = line.replace(/\"\"/g, "'");
    const values =  line.match(/(("[^"]*")|[^,]+)|(?=,(,|$))/g);
    return {
        name: values[SPEC_NAME_POS],
        datatype: values[SPEC_DATATYPE_POS],
        width: values[SPEC_WIDTH_POS],
    }
}

async function dataLineHandler(line, tablename, fields = []) {
    let parts = line.trim().split(" ").filter(Boolean);
    if(parts.length > VALID_DATA_LENGTH) {
        const last2 = parts.slice(-2);
        parts = [parts.slice(0, parts.length -2).join(" "), ...last2];
    } else if( parts.length < VALID_DATA_LENGTH) {
        console.warn("[WARN 1] bad line! skipped", {line});
        return {fail: true, line};
    }
    if(parts[0] === '""') {
        console.warn("[WARN 2] bad line! skipped", {line});
        return {fail: true, line};
    }
    return parts;
    // const queryStr = `INSERT INTO ${tablename} ( ${fields.join(", ")} ) VALUES (?, ?, ?)`;
    // try {
    //     const resp = query(queryStr, parts);
    //     return resp;
    // } catch (e) {
    //     console.error("ERROR", es)
    // }
    
}



(async () => {
    const filename = process.argv[FILENAME_POS];
    console.log('the file name is ', filename)
    const timeLabel = filename + "_" + new Date().getTime();
    console.time(timeLabel);
    const specificationFields = await readFile(`./specs/${filename}.csv`, specLineHandler, true);
    await createTable(filename, specificationFields);


    const filesInDir = fs.readdirSync(`./data`);    

    // FIXME: regex
    const REGEXP = new RegExp(`^${filename}_\d{4}\-\d{2}\-\d{2}\.txt$`)
    const dataFiles = filesInDir.filter(file => {
        const pass =  REGEXP.test(file);
        console.log({file, pass})
        return true;// FIXME: regex
    })    
    console.log({dataFiles})
    const fields = specificationFields.map(f => f.name);
    const data = dataFiles.flatMap((df) => {
        console.log("PROCCESS ", df)
        return readFile(`./data/${df}`, dataLineHandler, false, [filename, fields]);
    })
    const dataResp = await Promise.all(data);
    console.log({dataResp})
    const dataProcessed = dataResp.filter(d => !d.fail);
    const chunkSize = 1000;

    const chunks = _chunk(dataProcessed, chunkSize);
    let params = [];
    const queryStr = `INSERT INTO ${filename} ( ${fields.join(", ")} ) VALUES ? `;
    const responses = [];
    for(let i = 0; i < chunks.length; i++) {
        params.push(chunks[i]);
        responses.push(query(queryStr, params));
        params = [];
    }
    await Promise.allSettled(responses);


    console.log("DONE!");
    console.log(`Processed ${dataProcessed.length} rows...`);
    const fails = dataResp.filter(d => d.fail === true);
    console.log(`Fails ${fails.length} rows...`);
    console.table(fails);
    console.timeEnd(timeLabel)
    process.exit(0)

})();



