var fs = require('fs');

function parseJSON(inputPaths) {
    for (input_name in inputPaths)
    {
	    var parsedData = JSON.parse(fs.readFileSync(inputPaths[input_name], 'utf8'));
	    
	    process.stdout.write('Parsing: ' + input_name + '... ');
	    
	    if (input_name === 'config') {
		    var config = parsedData;
	    } else if(input_name === 'architecture') {
	    	var architecture = parsedData;
	    } else if(input_name === 'furniture') {
	    	var furniture = parsedData;
	    }
		console.log('Done.');
    }
	var data = {
		config: config,
		input: {
			architecture: architecture,
			furniture: furniture
		}
	}
	
	return data;
}

module.exports = {
	parse: parseJSON
}