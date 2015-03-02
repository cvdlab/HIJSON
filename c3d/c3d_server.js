var parser = require('./modules/parser.js');
var graph = require('./modules/graphUtilities.js');
var assembler = require('./modules/assembler.js');
var colors = require('colors/safe');

var inputPaths = {
	config: __dirname + '/../json_input/config.json',
	architecture: __dirname + '/../json_input/architecture_demo.json',
	furniture: __dirname + '/../json_input/furnitures_demo.json'
};

console.log('--- Starting initialization... ---');

/* Parsing function in parse.js module */
process.stdout.write('Parsing data: ')
var data = parser.parse(inputPaths);
console.log(colors.green('Done')+'.');

/* Assembling structure */
process.stdout.write('Assembling structure... ');
assembler.assembleStructure(data);
console.log(colors.green('Done')+'.');

/* Creating graph */
process.stdout.write('Creating graph... ');
//2graph.createGraph(data);
console.log(colors.green('Done')+'.');

/* Creating geoJSON files */
process.stdout.write('Creating geoJSON file... ');
assembler.generateGeoJSON(data);
console.log(colors.green('Done')+'.');

process.stdout.write('Generating xGeoJSON graph... ');
assembler.packageGraph(data);
console.log(colors.green('Done')+'.');

data.index = {};
data.tree = {};

console.log('--- Initialization completed. ---');

module.exports = data;