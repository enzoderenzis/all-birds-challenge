const fs = require('fs');
const { readFile } = require('./src/utils')

function pickRamdom(words = []) {
    const random = Math.floor(Math.random() * words.length);
    return words[random];
}

function generateData() {
    const amount = process.argv[2];
    const filename = `${new Date().getTime()}.txt`;
    console.log(`going to generate ${amount} lines in file ${filename}`);
    const randomWords = [];
    readFile('./random-words.txt', (line) => {
        randomWords.push(line.trim());
    });

    const fd = fs.openSync(`./data/${filename}`, 'w');

    for(let i = 0; i < Number(amount); i++) {
        let amountWords = Math.floor(Math.random() * 4);
        if(!amountWords && Math.random() < 0.7) {
            amountWords = Math.floor(Math.random() * 4);
        }
        let nameColumn = [];
        for(let j = 0; j < amountWords; j++) {
            const word = pickRamdom(randomWords);
            nameColumn.push(word);
        }
        nameColumn = nameColumn.join(' ');
        const valid = Math.random() > 0.5 ? 0 : 1;
        const count = (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 1000);
        fs.appendFileSync(`./data/${filename}`, `"${nameColumn}" ${valid} ${count}\n`)
    }

    process.exit(0)

}

generateData();