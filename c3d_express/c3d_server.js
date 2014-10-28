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
    C3D.index = {};
    console.log('C3D initialization complete.');
}

function absoluteCoords(obj) {
	
	function translationMatrix(x,y) {
		return [
			[ x, 0 ],
			[ 0, y ]
		]
	}
	
	function rotationMatrix(grades) {
		var radiants = grades * Math.PI/180;
		return [
			[Math.cos(radiants), -Math.sin(radiants)],
			[Math.sin(radiants), Math.cos(radiants)]
		]
	}
	
	function matrixProduct(a,b) {
		return [
			[ a[0][0]*b[0][0]+a[0][1]*b[1][0], a[0][0]*b[0][1]+a[0][1]*b[1][1] ],
			[ a[1][0]*b[0][0]+a[1][1]*b[1][0], a[1][0]*b[0][1]+a[1][1]*b[1][1] ]
		]
	}
	
	function applyTransformation(v,m) {
		return [
			[ v[0]*m[0][0]+v[1]*m[0][1], v[0]*m[1][0]+v[1]*m[1][1] ]
		]
	}
	
	function objMatrix(object) {
		var tX = object.properties.tVector[0];
		var tY = object.properties.tVector[1];
		var rZ = object.properties.rVector[2];
		
		var transMat = translationMatrix(tX, tY);
		var rotMat = rotationMatrix(rZ);
		return matrixProduct(transMat, rotMat);
	}
	
	var ancestor = C3D.index[obj.properties.parent];
	var matrix = objMatrix(obj);
	
	while(ancestor.properties.class !== 'building') {
		matrix = matrixProduct(matrix, objMatrix(ancestor));
		ancestor = C3D.index[ancestor.properties.parent];
	}
	
	switch (obj.geometry.type) {
        case "Point":
            return applyTransformation(obj.geometry.coordinates, matrix);
            break;
        case "LineString": 
        	oldCoords = obj.geometry.coordinates;
        	for (var i = 0; i < oldCoords.length; i++)
        	{
        		var newCouple = applyTransformation(oldCoords[i], matrix);
	        	newCoords.push(newCouple);
        	}
            return newCoords;
            break;
        case "Polygon":
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

module.exports = C3D;