var fs = require('fs');
require('numeric');
var poly2tri = require('poly2tri');

var C3D = {
    input: {
	    config: 'json_input/config.json',
	    architecture: 'json_input/architecture_demo.json',
	    furnitures: 'json_input/furnitures_demo.json'
    }
}

/*
    Funzione che genera albero ed indice a partire dai file json
 */ 

C3D.createSoJSON = function() {
    var data = JSON.parse(fs.readFileSync('json_input/raw_sogei.json', 'utf8'));
    
    var result = {
    	id: 'architectures',
    	type: 'FeatureCollection',
    	features: [] 
    };
    for(var i in data)
    {
	    var level = {
	    	type: 'Feature',
	    	id: data[i].id,
	    	geometry: {
	    		type: 'Polygon',
	    		coordinates: [
	    			[ [0, 0], [20,0], [20,10], [0,10], [0,0] ]
	    		]
	    	},
	    	properties: {
	    		class: 'level',
	    		parent: 'building',
	    		rVector: data[i].rVector,
	    		tVector: data[i].tVector
	    	}
	    }

	    result.features.push(level);
	    
	    for(var j in data[i].children) {
		    var feature = {
		    	type: 'Feature',
		    	id: data[i].id +'.' + j,
		    	geometry: {
		    		type: 'Polygon',
		    		coordinates: data[i].children[j].coordinates
		    	},
		    	properties: {
		    		class: 'room',
		    		parent: data[i].id,
		    		rVector: data[i].children[j].rVector,
		    		tVector: data[i].children[j].tVector
		    	}
		    };

		   	result.features.push(feature);
	    
	    }
	}
	fs.writeFileSync('json_input/architecture_sogei.json', JSON.stringify(result));
}

C3D.parseJSON = function() {
	
	C3D.tree = {
        id: 'building',
        properties: {
	        class: 'building'
        },
        children: []
    };
    
    C3D.index = {};
    
    C3D.index['building'] = C3D.tree;
	
	console.log('Starting C3D initialization...');
    for (input_name in C3D.input)
    {
	    var data = JSON.parse(fs.readFileSync(C3D.input[input_name], 'utf8'));
	    process.stdout.write('Parsing: '+input_name+'... ');
	    if (input_name === 'config')
	    {
		    C3D.config = data;
		    console.log('Configuration loaded.');
		    C3D.transformationMatrix = computeMatrix(C3D.config.landmarks);
		    C3D.inverseTransformationMatrix = numeric.inv(C3D.transformationMatrix);
		    console.log('Matrix: ' + C3D.transformationMatrix);
		   	console.log('Inverse matrix: ' + C3D.inverseTransformationMatrix);
	    }
	    else
	    {
		    if (data.type == "FeatureCollection") 
			{
            	console.log('FeatureCollection detected for '+input_name+'.');
				for(var i = 0; i < data.features.length; i++)
				{
	                var feature = data.features[i];
	                var obj = {};
	                obj.id = feature.id;
	                obj.type = input_name;
	                obj.parent = C3D.index[feature.properties.parent];
	                C3D.index[feature.properties.parent].children.push(obj);
	                obj.children = [];
	                obj.geometry = feature.geometry;
	                obj.properties = feature.properties;
	                C3D.index[feature.id] = obj;
            	}
        	} 
			else 
			{   
            	console.log('ERROR: No FeatureCollection detected for '+input_name+'.');
        	}
        }
    }
    
    process.stdout.write('Generating geoJson layers... ');
    C3D.generateGeoJSON();
    console.log('Done.');
    C3D.createGraph();
    for(id in C3D.index) {
    	C3D.index[id].parent = {};
    }

    C3D.index = {};
    
    console.log('C3D initialization complete.');
}

C3D.generateGeoJSON = function() {

	var geoJSONmap = {};
    var includedArchitectureClasses = ['level', 'room', 'door', 'internal_wall', 'external_wall'];
    var includedFurtituresClasses = ['server', 'surveillanceCamera','fireExtinguisher','hotspot','antenna','badgeReader'];
	var includedClasses = includedArchitectureClasses.concat(includedFurtituresClasses);
    var queue = [];
    var obj;

	var newObj = {};
	
    for(var i = 0; i < C3D.tree.children.length; i++) {
        queue.push(C3D.tree.children[i]);
    }
    
    while(queue.length > 0) {
        obj = queue.shift();
        

        if(includedClasses.indexOf(obj.properties.class) > -1)
        {
	        var localMatrix = objMatrix(obj);
			var globalMatrix = getCMT(C3D.index[obj.properties.parent]);
			C3D.index[obj.id].CMT = matrixProduct(globalMatrix, localMatrix);
			
            //console.log('(2D) Oggetto in fase di generazione: ' + obj.id);
			var level = getLevel(obj);			
			
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
				coordinates: absoluteCoords(obj)
			};
			
			newObj.properties = {
				class: obj.properties.class
			};
			
			geoJSONmap[level].features.push(newObj);
		}
		
		for(var i = 0; i < obj.children.length; i++) {
            queue.push(obj.children[i]);
        }
		
	}
	C3D.geoJSONmap = convertToDegrees(geoJSONmap);
}

function getCMT(obj) {
	if (obj.CMT !== undefined) {
		return obj.CMT;
	} else {
		return [
			[1,0,0],
			[0,1,0],
			[0,0,1]			
		];
	}
}

function translationMatrix(x,y) {
	return [
		[ 1, 0, x ],
		[ 0, 1, y ],
		[ 0, 0, 1 ]
	]
}

function rotationMatrix(grades) {
	var radiants = grades * Math.PI/180;
	return [
		[Math.cos(radiants), -Math.sin(radiants), 0],
		[Math.sin(radiants), Math.cos(radiants), 0],
		[0, 0, 1]
	]
}

function matrixProduct(a,b) {
/*
	return [
		[ a[0][0]*b[0][0] + a[0][1]*b[1][0] + a[0][2]*b[2][0], a[0][0]*b[0][1] + a[0][1]*b[1][1] + a[0][2]*b[2][1], a[0][0]*b[0][2] + a[0][1]*b[1][2] + a[0][2]*b[2][2] ],
		[ a[1][0]*b[0][0] + a[1][1]*b[1][0] + a[1][2]*b[2][0], a[1][0]*b[0][1] + a[1][1]*b[1][1] + a[1][2]*b[2][1], a[1][0]*b[0][2] + a[1][1]*b[1][2] + a[1][2]*b[2][2] ],
		[ a[2][0]*b[0][0] + a[2][1]*b[1][0] + a[2][2]*b[2][0], a[2][0]*b[0][1] + a[2][1]*b[1][1] + a[2][2]*b[2][1], a[2][0]*b[0][2] + a[2][1]*b[1][2] + a[2][2]*b[2][2] ]
	]
*/
	return numeric.dot(a,b);
}

function applyTransformation(v, m) {
	return [ v[0]*m[0][0] + v[1]*m[0][1] + m[0][2], v[0]*m[1][0] + v[1]*m[1][1] + m[1][2] ];
}

function objMatrix(object) {
	var tX = object.properties.tVector[0];
	var tY = object.properties.tVector[1];
	var rZ = object.properties.rVector[2];
	
	var transMat = translationMatrix(tX, tY);
	var rotMat = rotationMatrix(rZ);
	return matrixProduct(transMat, rotMat);
}

function getLevel(obj) {
	var ancestor = obj;
	while (ancestor.properties.class !== 'level') {
		ancestor = C3D.index[ancestor.properties.parent];
	}
	if (ancestor.properties.class === 'building') {
		return undefined;
	} else {
		return ancestor.id;
	}
}

function absoluteCoords(obj) {
	
	var matrix = getCMT(obj);
	
	switch (obj.geometry.type) {
        case "Point":
            return applyTransformation(obj.geometry.coordinates, matrix);
            break;
        case "LineString": 
        	var newCoords = [];
        	oldCoords = obj.geometry.coordinates;
        	for (var i = 0; i < oldCoords.length; i++)
        	{
        		var newCouple = applyTransformation(oldCoords[i], matrix);
	        	newCoords.push(newCouple);
        	}
            return newCoords;
            break;
        case "Polygon":
        	var newCoords = [];
        	oldCoords = obj.geometry.coordinates;
        	for (var i = 0; i < oldCoords.length; i++)
        	{
	        	var newPerimeter = [];
	        	for (var j = 0; j < oldCoords[i].length; j++)
	        	{
		        	var newCouple = applyTransformation(oldCoords[i][j], matrix);
	        		newPerimeter.push(newCouple);
	        	}
	        	newCoords.push(newPerimeter);
	        }
            return newCoords;
            break;
        default:
        	return undefined;
        	break;
    }
}

function fromXYToLngLat(coordinates) {
	return applyTransformation(coordinates, C3D.transformationMatrix);
}

function convertToDegrees(geoJSONmap) {
	for(level in geoJSONmap) {
		geoJSONobject = geoJSONmap[level];
		for(feature in geoJSONobject.features) {
			var object = geoJSONobject.features[feature];
			switch (object.geometry.type) {
		        case "Point":
		            object.geometry.coordinates = fromXYToLngLat(object.geometry.coordinates);
		            break;
		        case "LineString": 
		        	var coords = object.geometry.coordinates;
		        	for (var i = 0; i < coords.length; i++)
		        	{
			        	coords[i] = fromXYToLngLat(coords[i]);
		        	}
		            break;
		        case "Polygon":
		        	var coords = object.geometry.coordinates;
		        	for (var i = 0; i < coords.length; i++)
		        	{
			        	for (var j = 0; j < coords[i].length; j++)
			        	{
			        		coords[i][j] = fromXYToLngLat(coords[i][j]);
						}
			        }
		            break;
		        default:
		        	return undefined;
		        	break;
    		}
		}
	}
	return geoJSONmap;	
}

C3D.createGraph = function () {
	var graph = {};
	for(id in C3D.index) {
		if(C3D.index[id].properties.class === 'room' || C3D.index[id].properties.class === 'door') {
			graph[id] = {
				adj: {},
				pos: []
			}
		}
	}

	for(id in graph) {
		C3D.pos = getCentroid(C3D.index[id]);
		if(C3D.index[id].properties.class === 'door') {
			for(i in C3D.index[id].parent.properties.connections) {
				graph[id].adj[C3D.index[id].parent.properties.connections[i]] = 1;
				graph[C3D.index[id].parent.properties.connections[i]].adj[id] = 1;				
			}
		}
	}
	C3D.pathGraph = graph;
}

function getCentroid(obj) {
	var centroid;
	if(obj.properties.class === 'door') {
		centroid = obj.geometry.coordinates[1];
		centroid[0] += obj.properties.tVector[0];
		centroid[1] += obj.properties.tVector[1];
		return centroid;
	}
	else 
	{
		var contour = [];
		var hole = [];

		for(j in obj.geometry.coordinates[0]) {
			contour.push(new poly2tri.Point(obj.geometry.coordinates[0][j][0],obj.geometry.coordinates[0][j][1]));
		}
		var swctx = new poly2tri.SweepContext(contour);
		if(obj.geometry.coordinates[1] !== undefined) {
		    for (var i = 1; i < coords.length; i++) {
        		for (var j = 0; j < coords[i].length; j++) {
					hole.push(new poly2tri.Point(obj.geometry.coordinates[i][j][0],obj.geometry.coordinates[i][j][1]));
        		}
    		}
    		swctx.addHole(hole);			
		}
		swctx.triangulate();
		var triangles = swctx.getTriangles();
		console.log(triangles);
		return triangles;
	}
}

function computeMatrix(landmarks) {
	var x1 = landmarks[0].local[0];
	var y1 = landmarks[0].local[1];
	var x2 = landmarks[1].local[0];
	var y2 = landmarks[1].local[1];
	var x3 = landmarks[2].local[0];
	var y3 = landmarks[2].local[1];
	var X1 = landmarks[0].lnglat[0];
	var Y1 = landmarks[0].lnglat[1];
	var X2 = landmarks[1].lnglat[0];
	var Y2 = landmarks[1].lnglat[1];
	var X3 = landmarks[2].lnglat[0];
	var Y3 = landmarks[2].lnglat[1];

	var matrixA = 
	[
		[x1,	y1,		0,		0,		1,		0],
		[0,		0,		x1,		y1,		0,		1],
		[x2, 	y2,		0,		0,		1,		0],
		[0,		0,		x2,		y2,		0,		1],
		[x3,	y3,		0,		0,		1,		0],
		[0,		0,		x3,		y3,		0,		1]
	];

	var vectorB =
	[
		X1, Y1, X2, Y2, X3, Y3
	];

	var sol = numeric.solve(matrixA, vectorB);
	var transformationMatrix =
	[
		[sol[0], sol[1], sol[4]],
		[sol[2], sol[3], sol[5]],
		[0, 0, 1]
	];

	return transformationMatrix;
}

//C3D.createSoJSON();
C3D.parseJSON();
module.exports = C3D;