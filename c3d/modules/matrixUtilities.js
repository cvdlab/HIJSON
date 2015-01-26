// (1) dependencies
var numeric = require('numeric');

// (2) private things

// (3) public/exported things
var self = module.exports = {

	translationMatrix: function(x, y) {
		return [
			[ 1, 0, x ],
			[ 0, 1, y ],
			[ 0, 0, 1 ]
		]
	},
	
	rotationMatrix: function(grades) {
		var radiants = grades * Math.PI/180;
		return [
			[Math.cos(radiants), -Math.sin(radiants), 0],
			[Math.sin(radiants), Math.cos(radiants), 0],
			[0, 0, 1]
		]
	},
	
	matrixProduct: function(a,b) {
		return numeric.dot(a,b);
	},
	
	getCMT: function(obj) {
		if (obj.CMT !== undefined) {
			return obj.CMT;
		} else {
			return [
				[1,0,0],
				[0,1,0],
				[0,0,1]			
			];
		}
	},
	
	applyTransformation: function(v, m) {
		return [ v[0]*m[0][0] + v[1]*m[0][1] + m[0][2], v[0]*m[1][0] + v[1]*m[1][1] + m[1][2] ];
	},

	objMatrix: function(object) {
		var tX = object.properties.tVector[0];
		var tY = object.properties.tVector[1];
		var rZ = object.properties.rVector[2];
		
		var transMat = self.translationMatrix(tX, tY);
		var rotMat = self.rotationMatrix(rZ);
		return self.matrixProduct(transMat, rotMat);
	}
}