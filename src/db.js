const mysql = require('mysql');

const pool  = mysql.createPool({
    connectionLimit: 5,
    host     : 'localhost',
    user     : 'root',
    password : 'enzo1234',
    database : 'all-birds'
});


pool.on('connection', function (connection) {
    console.log("Connected!");
    // Establecer una variable de sesión
    //connection.query('SET SESSION auto_increment_increment=1')
});

// pool.end(function (err) {
//     // todas las conexiones en el pool han terminado
//     console.log("END CONNECTION!")
// });



async function query(queryStr, params = []) {
    return new Promise( (success, fail) => {
        try {
            pool.getConnection((err, connection) => {
                if(err) {
                    console.error("[ERROR DB1] CONNECTION TO DB FAIL!", err);
                    return fail("CONNECTION TO DB FAIL!");
                }
                
                connection.query(queryStr, params, (err, rows) => {
                    if(err) {
                        console.error("QUERY ERROR", err);
                        fail("ERROR [DB2] QUERY ERROR")
                    }
                    try {
                        success(rows);
                    } finally {
                        // console.log('release connection!')
                        connection.release();
                    }
                });
            });
        } catch (e) {
            console.error("ERROR [DB3]", e)
        }
    });
}


function createTable(tablename, fields = []) {
    if(!fields.every(validateField)) {
        throw new Error("ERROR [DB4] Field structure is no valid");
    }
    let queryStr = `CREATE TABLE IF NOT EXISTS ${tablename} ( ${fields.map(mapToColumn).join(", ") } )`;
    return query(queryStr);
}

function mapToColumn(field) {
    return `${field.name} ${field.datatype} ${field.datatype !== "BOOLEAN" ? `(${field.width})` : '' }`
}

const VALID_DATA_FIELDS = ['TEXT', 'BOOLEAN', 'INTEGER'];
function validateField({ name, datatype, width }) {
    const validField = datatype && VALID_DATA_FIELDS.some((f) => f === datatype);
    const widthValid = /\d+/.test(width);
    return !!name && validField && widthValid;
}


module.exports = {
    query,
    createTable,
}