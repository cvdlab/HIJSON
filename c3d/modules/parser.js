var fs = require('fs');
var colors = require('colors/safe');

var self = module.exports = {
	
	parse: function(inputPaths) {
	    for (input_name in inputPaths)
	    {
		    var parsedData = JSON.parse(fs.readFileSync(inputPaths[input_name], 'utf8'));
		    
		    if (input_name === 'config') {
			    var config = parsedData;
		    } else if(input_name === 'architecture') {
		    	var architecture = parsedData;
		    } else if(input_name === 'furniture') {
		    	var furniture = parsedData;
		    }
			process.stdout.write(input_name + '... ');
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
	
}