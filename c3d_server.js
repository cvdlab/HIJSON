var parser = require('./public/libs/parser.js');
var graph = require('./public/libs/graphUtilities.js');
var assembler = require('./public/libs/assembler.js');

var inputPaths = {
	config: 'json_input/config.json',
	architecture: 'json_input/architecture_demo.json',
	furniture: 'json_input/furnitures_demo.json'
};

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
console.log('Creation of geoJSON file completed.');

data.index = {};
data.tree = {};


/* Creating geoJSON files */
module.exports = data;