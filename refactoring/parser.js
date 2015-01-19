var fs = require('fs');
var cU = require('./coordinatesUtilities.js');
var mU = require('./matrixUtilities.js');
var utilities = require('./utilities.js');
require('numeric');

var tree = {
    id: 'building',
    properties: {
        class: 'building'
    },
    children: []
};

var index = {};
var config = {};

function parseJSON(input) {
	
	index['building'] = tree;
	
	console.log('Starting C3D initialization...');
    for (input_name in input)
    {
	    var parsedData = JSON.parse(fs.readFileSync(input[input_name], 'utf8'));
	    process.stdout.write('Parsing: ' + input_name + '... ');
	    if (input_name === 'config')
	    {
		    config = parsedData;
		    
		    console.log('Configuration loaded.');
		    
		    config.transformationMatrix = cU.computeGeoMatrix(config.landmarks);
		    config.inverseTransformationMatrix = numeric.inv(config.transformationMatrix);
		    
		    console.log('Matrix: ' + config.transformationMatrix);

		   	console.log('Inverse matrix: ' + config.inverseTransformationMatrix);
	    }
	    else
	    {
		    if (parsedData.type == "FeatureCollection") 
			{
            	console.log('FeatureCollection detected for ' + input_name + '.');
				for(var key in parsedData.features) {
	                var feature = parsedData.features[key];
	                var obj = {};
	                obj.id = feature.id;
	                obj.type = input_name;
	                obj.parent = index[feature.properties.parent];
	                
	                index[feature.properties.parent].children.push(obj);
	                obj.children = [];
	                obj.graph = [];
	                obj.geometry = feature.geometry;
	                obj.properties = feature.properties;
	                index[feature.id] = obj;

			        var localMatrix = mU.objMatrix(obj);
					var globalMatrix = mU.getCMT(index[obj.properties.parent]);
					obj.CMT = mU.matrixProduct(globalMatrix, localMatrix);
            	}
        	} 
			else {   
            	console.log('ERROR: No FeatureCollection detected for ' + input_name + '.');
        	}
        }
    }
    console.log('Parsing complete.');
}

module.exports = {
	parse: function parse(inputFiles) {
		var input = {
			config: inputFiles.configPath,
			architecture: inputFiles.architecturePath,
			furniture: inputFiles.furniturePath
		};

		parseJSON(input);

		var data = {
			config: config,
			tree: tree,
			index: index
		}		
		return data;
	},

	generateGeoJSON: function generateGeoJSON(data) {
		var geoJSONmap = {};
	    var includedArchitectureClasses = ['level', 'room', 'door', 'internal_wall', 'external_wall'];
	    var includedFurtituresClasses = ['server', 'surveillanceCamera','fireExtinguisher','hotspot','antenna','badgeReader', 'server_polygon'];
		var includedClasses = includedArchitectureClasses.concat(includedFurtituresClasses);
		
		if (data.config.showGraph) {
			includedClasses.push('graphNode');
		
		}
	    var queue = [];
	    var obj;

		var newObj = {};
		
	    for(var i = 0; i < data.tree.children.length; i++) {
	        queue.push(data.tree.children[i]);
	    }
	    
	    while(queue.length > 0) {
	        obj = queue.shift();
	        

	        if(includedClasses.indexOf(obj.properties.class) > -1)
	        {

				var level = utilities.getLevel(obj);
				
				// create the feature collection for the level if not exists	
				if(!(level in geoJSONmap)) {
					geoJSONmap[level] = {
						type: "FeatureCollection",
						features: []
					}
				}
				
				var newObj = {};
				newObj.type = "Feature";
				newObj.id = obj.id;
				newObj.geometry = {
					type: obj.geometry.type,
					coordinates: cU.absoluteCoords(obj)
				};
				newObj.properties = {
					class: obj.properties.class
				};
				geoJSONmap[level].features.push(newObj);
				
				// add representation of graph arcs
				if (data.config.showGraph && obj.properties.class === 'graphNode') {
					var k = 0;
					for (node in obj.properties.adj) {
						var adiacent = data.index[node];
						var newObj = {};
						
						newObj.type = "Feature";
						newObj.id = obj.id + "_arc_" + k;
						
						newObj.geometry = {
							type: "LineString",
							coordinates: [ 
								cU.getPointAbsoluteCoords(obj), 
								cU.getPointAbsoluteCoords(adiacent) 
							]
						};
						
						newObj.properties = {
							class: "graphArc"
						};
						
						geoJSONmap[level].features.push(newObj);
						k++;				
					}
				}
			}
			
			for(var i = 0; i < obj.children.length; i++) {
	            queue.push(obj.children[i]);
	        }
		}
		// put the map in real-world coordinates
		data.geoJSONmap = cU.convertToDegrees(geoJSONmap, data.config.transformationMatrix);
	}
}