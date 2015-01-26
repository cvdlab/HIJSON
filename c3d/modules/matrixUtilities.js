// initialize library object (namespace)
var matrixUtilities = {};

// import any dependencies (in browser must be included before this)
var numeric = numeric || require('numeric');

(function(){
	
	// properties of library
	
	var translationMatrix = function(x, y) {
		return [
			[ 1, 0, x ],
			[ 0, 1, y ],
			[ 0, 0, 1 ]
		]
	};
	
	var rotationMatrix = function(grades) {
		var radiants = grades * Math.PI/180;
		return [
			[Math.cos(radiants), -Math.sin(radiants), 0],
			[Math.sin(radiants), Math.cos(radiants), 0],
			[0, 0, 1]
		]
	};
	
	var matrixProduct = function(a,b) {
			return numeric.dot(a,b);
	};
	
	var getCMT = function(obj) {
		if (obj.CMT !== undefined) {
			return obj.CMT;
		} else {
			return [
				[1,0,0],
				[0,1,0],
				[0,0,1]			
			];
		}
	};
	
	var applyTransformation = function(v, m) {
		return [ v[0]*m[0][0] + v[1]*m[0][1] + m[0][2], v[0]*m[1][0] + v[1]*m[1][1] + m[1][2] ];
	};

	var objMatrix = function(object) {
		var tX = object.properties.tVector[0];
		var tY = object.properties.tVector[1];
		var rZ = object.properties.rVector[2];
		
		var transMat = translationMatrix(tX, tY);
		var rotMat = rotationMatrix(rZ);
		return matrixProduct(transMat, rotMat);
	};
	
	// end of library properties
	
	// exported things
	matrixUtilities.getCMT = getCMT;
	matrixUtilities.translationMatrix = translationMatrix;
	matrixUtilities.rotationMatrix = rotationMatrix;
	matrixUtilities.matrixProduct = matrixProduct;
	matrixUtilities.applyTransformation = applyTransformation;
	matrixUtilities.objMatrix = objMatrix;
	// end of exported things
	
	// export the namespace object
	if (typeof module !== 'undefined' && module.exports) {
	  module.exports = matrixUtilities;
	}	
})();