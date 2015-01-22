var parser = require('./public/libs/parser.js');
var graph = require('./public/libs/graphUtilities.js');

var inputFiles = {
	configPath: 'json_input/config.json',
	architecturePath: 'json_input/architecture_demo.json',
	furniturePath: 'json_input/furnitures_demo.json'
};

/* Parsing function in parse.js module */
console.log('Parsing data...')
var data = parser.parse(inputFiles);
console.log('Parsing completed.');

/* Creating graph */
console.log('Creating graph...');
graph.createGraph(data);
console.log('Creation of graph completed.');

/* Creating geoJSON files */
console.log('Creating geoJSON file...');
parser.generateGeoJSON(data);
console.log('Creation of geoJSON file completed.');


/* Creating geoJSON files */
console.log('Cleaning index for JSON stringify...');
cleanIndex();
console.log('Cleaning completed.');

function cleanIndex() {
    // clean for JSON stringify
    for(id in data.index) {
    	data.index[id].parent = {};
    }
    data.index = {};
}

module.exports = data;