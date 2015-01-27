var parser = require('./modules/parser.js');
var graph = require('./modules/graphUtilities.js');
var assembler = require('./modules/assembler.js');

var inputPaths = {
	config: __dirname + '/../json_input/config.json',
	architecture: __dirname + '/../json_input/architecture_demo.json',
	furniture: __dirname + '/../json_input/furnitures_demo.json'
};

console.log('--- Starting initialization... ---');

/* Parsing function in parse.js module */
console.log('Parsing data...')
var data = parser.parse(inputPaths);
console.log('Parsing completed.');

/* Assembling structure */
process.stdout.write('Assembling structure... ');
assembler.assembleStructure(data);
console.log('Done.');

/* Creating graph */
process.stdout.write('Creating graph... ');
graph.createGraph(data);
console.log('Done.');

/* Creating geoJSON files */
process.stdout.write('Creating geoJSON file... ');
assembler.generateGeoJSON(data);
console.log('Done.');

process.stdout.write('Generating xGeoJSON graph... ');
assembler.packageGraph(data);
console.log('Done.');

data.index = {};
data.tree = {};

console.log('--- Initialization completed. ---');

module.exports = data;