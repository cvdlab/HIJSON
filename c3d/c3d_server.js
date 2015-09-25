var parser = require('./modules/parser.js');
var graph = require('./modules/graphUtilities.js');
var assembler = require('./modules/assembler.js');
var colors = require('colors/safe');

var inputPaths = {
	config: __dirname + '/../json_input/parser/config.json',
	architecture: __dirname + '/../json_input/parser/architecture.json',
	furniture: __dirname + '/../json_input/parser/furnitures.json'
};

console.log('--- Starting initialization... ---');

/* Parsing function in parse.js module */
process.stdout.write('Parsing data: ');
var data = parser.parse(inputPaths);
console.log(colors.green('Done')+'.');

/* Assembling structure */
process.stdout.write('Assembling structure... ');
assembler.assembleStructure(data);
console.log(colors.green('Done')+'.');

/* Creating graph */
if (data.config.computeGraph) {
	process.stdout.write('Creating graph... ');
	graph.createGraph(data);
	console.log(colors.green('Done')+'.');
}

/* Creating geoJSON files */
process.stdout.write('Creating geoJSON file... ');
assembler.generateGeoJSON(data);
console.log(colors.green('Done')+'.');

if (data.config.computeGraph) {
	process.stdout.write('Generating HIJSON graph... ');
	assembler.packageGraph(data);
	console.log(colors.green('Done')+'.');
}

data.proxies = {};
for(var obj in data.index) {
	var object = data.index[obj];
	if(object.getProxy !== undefined) {
		data.proxies[object.id] = object.getProxy(object.id);
	}
}

data.index = {};
data.tree = {};

console.log('--- Initialization completed. ---');

module.exports = data;