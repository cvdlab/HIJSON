var fs = require('fs');
var inputPath = './json_input/edificio.json'

console.log('parsing Input File...')

// creo un oggetto javascript con i dati (un array)
var parsedData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

// trasformo l'array in un dizioanrio usando gli id come chiavi
var index = {};
for (key in parsedData) {
	var element = parsedData[key];
	index[element.id] = element;
}

// definizione di funzioni per identificare classi
function isLevel(element) {
	return element.id.match(/^Edificio-Piano_[0-9]$/);
}

function isPianoCompleto(element) {
	return element.id.match(/^Edificio-Piano_[0-9]-Piano(Completo|Ridotto)$/);
}

function isSector(element) {
	return element.id.match(/^Edificio-Piano_[0-9]-Piano(Completo|Ridotto)-(SpazioComune|Ascensori|Ala_nord|Ala_sud|Ala_est|Ala_ovest)$/);
}

function isRoom(element) {
	return element.properties.class === 'room';
}

// assegno le classi
for (id in index) {
	var element = index[id];
	
	if ( isLevel(element) ) {
		element.properties.class = "level";
	}
	
	if ( isPianoCompleto(element) ) {
		element.properties.class = "pianoCompleto";
	}
	
	if ( isSector(element) ) {
		element.properties.class = "sector";
	}
	
	if ( isRoom(element) ) {
		var ancestor = index[element.properties.parent];
		ancestor.properties.class = "roomBox";
	}
}

/*
la struttura gerarchica originale è del tipo

-level
-piano completo (non utile, duplicato di level)
-settore (ala)
-box contenimento stanze (non utile, non provvisto della altezza che sarebbe la unica cosa utile)
-stanze

bisogna bypassare ed eliminare le cose non utili
*/

for (id in index) {
	var element = index[id];
	// bypass
	if (element.properties.class === 'room' || element.properties.class === 'sector') {
		var ancestor = index[element.properties.parent];
		element.properties.parent = ancestor.properties.parent;
	}
}

for (id in index) {
	var element = index[id];
	// elimnazione elementi inutili
	if (element.properties.class === 'roomBox' || element.properties.class === 'pianoCompleto') {
		delete index[element.id];
	}
}


/*
TODO

lavorare sulle coordinate
*/




// creo la struttura del file di uscita
var output = {
	id: "architectures",
	type: "FeatureCollection",
	features: []
}

// inserisco gli elementi sopravvissuti nella struttura
for (id in index) {
	var element = index[id];
	console.log(element);
	output.features.push(element);
}

// scrivo il file
var outputJSON = JSON.stringify(output, null, 4);
outputPath = './json_input/architecture_sogei.json';
fs.writeFileSync(outputPath, outputJSON);

console.log('Transformation completed: '+outputPath);