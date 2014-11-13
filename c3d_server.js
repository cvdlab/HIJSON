var fs = require('fs');

var C3D = {
    input: {
	    config: 'json_input/config.json',
	    architecture: 'json_input/architecture.json',
	    furnitures: 'json_input/furnitures.json'
    }
}

/*
    Funzione che genera albero ed indice a partire dai file json
 */ 

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
	                //obj.parent = C3D.index[feature.properties.parent];
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
    
    C3D.index = {};
    console.log('C3D initialization complete.');
}

C3D.generateGeoJSON = function() {

	var geoJSONmap = {};
    var includedArchitectureClasses = ['level', 'room', 'door', 'internal_wall', 'external_wall'];
    var includedFurtituresClasses = ['server', 'surveillanceCamera','fireExtinguisher','hotspot','antenna'];
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
	C3D.geoJSONmap = geoJSONmap;
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
	return [
		[ a[0][0]*b[0][0] + a[0][1]*b[1][0] + a[0][2]*b[2][0], a[0][0]*b[0][1] + a[0][1]*b[1][1] + a[0][2]*b[2][1], a[0][0]*b[0][2] + a[0][1]*b[1][2] + a[0][2]*b[2][2] ],
		[ a[1][0]*b[0][0] + a[1][1]*b[1][0] + a[1][2]*b[2][0], a[1][0]*b[0][1] + a[1][1]*b[1][1] + a[1][2]*b[2][1], a[1][0]*b[0][2] + a[1][1]*b[1][2] + a[1][2]*b[2][2] ],
		[ a[2][0]*b[0][0] + a[2][1]*b[1][0] + a[2][2]*b[2][0], a[2][0]*b[0][1] + a[2][1]*b[1][1] + a[2][2]*b[2][1], a[2][0]*b[0][2] + a[2][1]*b[1][2] + a[2][2]*b[2][2] ]
	]
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

C3D.parseJSON();

module.exports = C3D;