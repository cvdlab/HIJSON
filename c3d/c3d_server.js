var parser = require('./modules/parser.js');
var graph = require('./modules/graphUtilities.js');
var assembler = require('./modules/assembler.js');

var inputPaths = {
	config: __dirname + '/../json_input/config.json',
	architecture: __dirname + '/../json_input/architecture_demo.json',
	furniture: __dirname + '/../json_input/furnitures_demo.json'
};

console.log('Starting initialization...');

/* Parsing function in parse.js module */
console.log('Parsing data...')
var data = parser.parse(inputPaths);
console.log('Parsing completed.');

/* Assembling structure */
console.log('Assembling structure...')
assembler.assembleStructure(data);
console.log('Assembling completed.');

/* Creating graph */
console.log('Creating graph...');
graph.createGraph(data);
console.log('Creation of graph completed.');

/* Creating geoJSON files */
console.log('Creating geoJSON file...');
assembler.generateGeoJSON(data);
console.log('Creation of geoJSON file completed.');

console.log('Generating xGeoJSON graph...')
assembler.packageGraph(data);
console.log('Creation of xGeoJSON graph completed.');

data.index = {};
data.tree = {};

console.log('Initialization completed.');

module.exports = data;