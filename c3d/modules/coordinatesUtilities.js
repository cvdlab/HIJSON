// (1) dependencies
var matrixUtilities = require('./matrixUtilities.js');

var self = module.exports = {
	
	absoluteCoords: function(obj) {
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
	},
	
	getPointAbsoluteCoords: function(object) {
    	return matrixUtilities.applyTransformation([0, 0], object.CMT);
	},

	convertToDegrees: function(geoJSONmap, transformationMatrix) {
		for(level in geoJSONmap) {
			geoJSONobject = geoJSONmap[level];
			for(feature in geoJSONobject.features) {
				var object = geoJSONobject.features[feature];
				switch (object.geometry.type) {
			        case "Point":
			            object.geometry.coordinates = self.fromXYToLngLat(object.geometry.coordinates, transformationMatrix);
			            break;
			        case "LineString": 
			        	var coords = object.geometry.coordinates;
			        	for (var i = 0; i < coords.length; i++)
			        	{
				        	coords[i] = self.fromXYToLngLat(coords[i], transformationMatrix);
			        	}
			            break;
			        case "Polygon":
			        	var coords = object.geometry.coordinates;
			        	for (var i = 0; i < coords.length; i++)
			        	{
				        	for (var j = 0; j < coords[i].length; j++)
				        	{
				        		coords[i][j] = self.fromXYToLngLat(coords[i][j], transformationMatrix);
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
	},
	
	computeGeoMatrix: function(landmarks) {
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
	},
	
	// input: un oggetto posizione generale, output: un oggetto L.latLng
	fromGeneralTo2D: function(genPosition, transformationMatrix) {
	    var convertedCoordinates = self.fromXYToLngLat(genPosition.coordinates, transformationMatrix);
	    var leafletPosition = L.latLng(convertedCoordinates[1], convertedCoordinates[0]);

		return leafletPosition;
	},
	
	// inversa
	from2DToGeneral: function(leafletPosition, actualPosition, inverseTransformationMatrix) {
	    var genPosition = {
			coordinates: self.fromLngLatToXY([leafletPosition.lng, leafletPosition.lat], inverseTransformationMatrix),
			levelId: actualPosition.levelId
		}
		return genPosition;
	},
	
	// input: un oggetto posizione generale, output: un THREE.Vector3 da usare come posizione
	fromGeneralTo3D: function(genPosition) {
		var threePosition = new THREE.Vector3(genPosition.coordinates[0], genPosition.coordinates[1], 0);
		return threePosition;
	},
	
	from3DToGeneral: function(threePosition, actualPosition) {
		var genPosition = {
			coordinates: [threePosition.x, threePosition.y],
			levelId: actualPosition.levelId
		}
		return genPosition;
	},
	
	// input: un oggetto posizione generale, output: un THREE.Vector3 da usare come posizione
	fromGeneralTo3DScene: function(genPosition) {
		var threePosition = new THREE.Vector3(genPosition.coordinates[0], data.index[genPosition.levelId].properties.tVector[2], -genPosition.coordinates[1]);
		return threePosition;
	},
	
	// trasformazione inversa della precedente.
	from3DSceneToGeneral: function(threePosition, actualPosition) {
		var genPosition = {
			coordinates: [threePosition.x, -threePosition.z],
			levelId: actualPosition.levelId
		}
		return genPosition;
	},
	
	from2Dto3D: function(leafletPosition) {
		var genPosition = self.from2DToGeneral(leafletPosition);
		var threePosition = self.fromGeneralTo3D(genPosition);
		
	    return threePosition;
	},

	from3Dto2D: function(threePosition) {
		var genPosition = self.from3DToGeneral(threePosition);
		var leafletPosition = self.fromGeneralTo2D(genPosition);
		
	    return leafletPosition;
	},
	
	fromXYToLngLat: function(coordinates, transformationMatrix) {
		return matrixUtilities.applyTransformation(coordinates, transformationMatrix);
	},
	
	fromLngLatToXY: function(coordinates, inverseTransformationMatrix) {
	    return matrixUtilities.applyTransformation(coordinates, inverseTransformationMatrix);
	}

}
