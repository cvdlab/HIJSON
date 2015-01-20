// initialize library object (namespace)
var coordinatesUtilities = {};

// import any dependencies (in browser must be included before this)
var matrixUtilities = matrixUtilities || require('./matrixUtilities.js');

(function(){
	// properties of library goes here

	var fromXYToLngLat = function(coordinates, transformationMatrix) {
		return matrixUtilities.applyTransformation(coordinates, transformationMatrix);
	};
	
	var absoluteCoords = function(obj) {
		var matrix = matrixUtilities.getCMT(obj);
		switch (obj.geometry.type) {
	        case "Point":
	            return matrixUtilities.applyTransformation(obj.geometry.coordinates, matrix);
	            break;
	        case "LineString": 
	        	var newCoords = [];
	        	oldCoords = obj.geometry.coordinates;
	        	for (var i = 0; i < oldCoords.length; i++)
	        	{
	        		var newCouple = matrixUtilities.applyTransformation(oldCoords[i], matrix);
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
			        	var newCouple = matrixUtilities.applyTransformation(oldCoords[i][j], matrix);
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
	};
	
	var convertToDegrees = function(geoJSONmap, transformationMatrix) {
		for(level in geoJSONmap) {
			geoJSONobject = geoJSONmap[level];
			for(feature in geoJSONobject.features) {
				var object = geoJSONobject.features[feature];
				switch (object.geometry.type) {
			        case "Point":
			            object.geometry.coordinates = fromXYToLngLat(object.geometry.coordinates, transformationMatrix);
			            break;
			        case "LineString": 
			        	var coords = object.geometry.coordinates;
			        	for (var i = 0; i < coords.length; i++)
			        	{
				        	coords[i] = fromXYToLngLat(coords[i], transformationMatrix);
			        	}
			            break;
			        case "Polygon":
			        	var coords = object.geometry.coordinates;
			        	for (var i = 0; i < coords.length; i++)
			        	{
				        	for (var j = 0; j < coords[i].length; j++)
				        	{
				        		coords[i][j] = fromXYToLngLat(coords[i][j], transformationMatrix);
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
	};
	
	var computeGeoMatrix = function(landmarks) {
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
			[sol[0],	sol[1],		sol[4]],
			[sol[2],	sol[3],		sol[5]],
			[0,			0,			1]
		];

		return transformationMatrix;
	};
	
	var getPointAbsoluteCoords = function(object) {
    	return matrixUtilities.applyTransformation([0, 0], object.CMT);
	};
	// end of library properties
	
	// exported things
	coordinatesUtilities.absoluteCoords = absoluteCoords;
	coordinatesUtilities.convertToDegrees = convertToDegrees;
	coordinatesUtilities.computeGeoMatrix = computeGeoMatrix;
	coordinatesUtilities.getPointAbsoluteCoords = getPointAbsoluteCoords;
	// end of exported things
	
	// export the namespace object
	if (typeof module !== 'undefined' && module.exports) {
	  module.exports = coordinatesUtilities;
	}
	
})();