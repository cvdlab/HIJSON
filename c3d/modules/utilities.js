var self = module.exports = {
	
	getLevel: function(obj) {
		var ancestor = obj;
		while (ancestor.properties.class !== 'level') {
			ancestor = ancestor.parent;
		}

		if (ancestor.properties.class === 'building') {
			return undefined;
		} else {
			return ancestor.id;
		}
	},

	getRoom: function(obj) {
	    var ancestor = obj;
	    var objClass = obj.properties.class;
	    if(objClass !== 'building' && objClass !== 'level') {
	        while(ancestor.properties.class !== 'room') {
	            ancestor = ancestor.parent;
	        }
	    }
	    return ancestor;
	},
	
	getCentroid: function(object3D) {
    	var boundingBox = new THREE.BoundingBoxHelper(object3D,0xff0000 );
    	boundingBox.update();
    	var center = new THREE.Vector3( 
    					(boundingBox.box.min.x + boundingBox.box.max.x)/2,
    					(boundingBox.box.min.y + boundingBox.box.max.y)/2, 
    					(boundingBox.box.min.z + boundingBox.box.max.z)/2
    				);
    	return center;
	},
	
	getActualLevelId: function() {
		var id;
		for(idLayer in data.map2D._layers){
			layer = data.map2D._layers[idLayer];
			if(layer.feature !== undefined && layer.feature.properties.class === 'level') {
				id = layer.feature.id; 
			}
		}   
		return id;
	},
	
	isPackage: function(obj3D) {
		var pack = false;
		if ( obj3D.package === true ) {
			pack = true;
		}
		return pack;
	},

	setVisibility: function(obj3D, booleanValue) {
		obj3D.traverse(function(object) { 
        	if(!self.isPackage(object)) {	// act only if not package
	        	object.visible = booleanValue;
	        	if (object.material !== undefined) {
		        	object.material.transparent = false;
		        	object.material.opacity = 1;
	        	}
        	}
    	});
	},

	setOpacity: function(obj3D, opacity) {
		obj3D.traverse(function(object) {
        	if(!self.isPackage(object)) {	// act only if not package
	        	object.visible = true;
	        	if (object.material !== undefined) {
		        	object.material.transparent = true;
		        	object.material.opacity = opacity;
	        	}
        	}
    	});
	},

	highlightFeature: function(idObject) {
		// hide all
		self.setVisibility(data.index['building'].obj3D, false);
		// get level id and show the level in transparency
		var idLevel = self.getLevel( data.index[idObject] );
		self.setOpacity(data.index[idLevel].obj3D, 0.2);
		// highlight feature
		self.setVisibility(data.index[idObject].obj3D, true);
	}

}