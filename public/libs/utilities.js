// initialize library object (namespace)
var utilities = {};

// import any dependencies (in browser must be included before this)
// var dependency = dependency || require('./dependency');

(function(){
	
	//library properties and functions (public an private)
	
	var getLevel = function(obj) {
		var ancestor = obj;
		while (ancestor.properties.class !== 'level') {
			ancestor = ancestor.parent;
		}

		if (ancestor.properties.class === 'building') {
			return undefined;
		} else {
			return ancestor.id;
		}
	};

	var getRoom = function(obj) {
	    var ancestor = obj;
	    if(obj.properties.class !== 'building' && obj.properties.class !== 'level') {
	        while(ancestor.properties.class !== 'room') {
	            ancestor = ancestor.parent;
	        }
	    }
	    return ancestor;
	};
	var getCentroid = function(object3D) {
    	var boundingBox = new THREE.BoundingBoxHelper(object3D,0xff0000 );
    	boundingBox.update();
    	var center = new THREE.Vector3( (boundingBox.box.min.x + boundingBox.box.max.x)/2, (boundingBox.box.min.y + boundingBox.box.max.y)/2, (boundingBox.box.min.z + boundingBox.box.max.z)/2 );
    	return center;
	};
	var show3DObject = function(obj3D, booleanValue) {
		obj3D.traverse(function(object) { 
        	object.visible = booleanValue;
    	});
	}

	// end of library properties
	
	// exported things (public)
	utilities.getLevel = getLevel;
	utilities.getRoom = getRoom;
	utilities.getCentroid = getCentroid;
	utilities.show3DObject = show3DObject;
	// end exported things
	
	// export the namespace object
	if (typeof module !== 'undefined' && module.exports) {
	  module.exports = utilities;
	}	
})();