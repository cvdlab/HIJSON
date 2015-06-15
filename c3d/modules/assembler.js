// (1) dependencies
var coordinatesUtilities = require('./coordinatesUtilities.js');
var featureFactory = require('./featureFactory.js');
var numeric = require('numeric');
var matrixUtilities = require('./matrixUtilities.js');
var utilities = require('./utilities.js');
var fs = require('fs');


// (2) private things
var tree = {
    id: 'building',
    properties: {
        class: 'building'
    },
    children: []
};

var index = {
	building: tree
};


// (3) public/exported things
var self = module.exports = {
	
	assembleStructure: function(data) {
		data.config.transformationMatrix = coordinatesUtilities.computeGeoMatrix(data.config.landmarks);
		// console.log('Matrix: ' + data.config.transformationMatrix);
		data.config.inverseTransformationMatrix = numeric.inv(data.config.transformationMatrix);
		// console.log('Inverse matrix: ' + data.config.inverseTransformationMatrix);

		self.assembleFeatureCollection(data.input.architecture);
		self.assembleFeatureCollection(data.input.furniture);

		data.index = index;
		data.tree = tree;
	},
	
	assembleFeatureCollection: function(featureCollection) {
		for(var key in featureCollection.features) {
			var feature = featureCollection.features[key];
			var obj = featureFactory.generateFeature(feature);
			index[obj.id] = obj;
			obj.type = featureCollection.id;
			obj.parent = index[obj.properties.parent];
			obj.parent.children.push(obj);
			var localMatrix = matrixUtilities.objMatrix(obj);
			var globalMatrix = matrixUtilities.getCMT(index[obj.properties.parent]);
			obj.CMT = matrixUtilities.matrixProduct(globalMatrix, localMatrix);	
			obj.graph = [];
		}
	},
	
	generateGeoJSON: function(data) {
		var geoJSONmap = {};
	    var queue = [];
	    var obj;

		var newObj = {};
		
	    for(var i = 0; i < data.tree.children.length; i++) {
	        queue.push(data.tree.children[i]);
	    }
	    
	    while(queue.length > 0) {
	        obj = queue.shift();
	        var feature = featureFactory.generateFeature(obj);
	        if(feature.in_2D_map)
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
					coordinates: coordinatesUtilities.absoluteCoords(obj)
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
								coordinatesUtilities.getPointAbsoluteCoords(obj), 
								coordinatesUtilities.getPointAbsoluteCoords(adiacent) 
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
		data.geoJSONmap = coordinatesUtilities.convertToDegrees(geoJSONmap, data.config.transformationMatrix);

		// export GeoJSON files

		var output_path = './geojson_output';

		if (!fs.existsSync(output_path)) 
			fs.mkdirSync(output_path);
		else {
			var filenames = fs.readdirSync(output_path);
			for (var key in filenames) fs.unlinkSync(output_path+'/'+filenames[key]);
		}
		for (var level_id in geoJSONmap) {
			fs.writeFileSync(output_path+'/'+level_id+'.json', JSON.stringify(geoJSONmap[level_id], null, 4));
		}
	},
	
	packageGraph: function(data) {
		var graph = {
			id: 'graph',
			type: 'FeatureCollection',
			features: []
		};
		for(var id in data.index) {
			var obj = data.index[id];
			if(obj.properties.class === 'graphNode') {
				obj.parent = {};
				obj.children = [];
				graph.features.push(obj);
			}
		}
		data.input.graph = graph;
	}
	
}; //close module.exports