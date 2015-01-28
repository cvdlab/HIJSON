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
	    if(obj.properties.class !== 'building' && obj.properties.class !== 'level') {
	        while(ancestor.properties.class !== 'room') {
	            ancestor = ancestor.parent;
	        }
	    }
	    return ancestor;
	},
	
	getCentroid: function(object3D) {
    	var boundingBox = new THREE.BoundingBoxHelper(object3D,0xff0000 );
    	boundingBox.update();
    	var center = new THREE.Vector3( (boundingBox.box.min.x + boundingBox.box.max.x)/2, (boundingBox.box.min.y + boundingBox.box.max.y)/2, (boundingBox.box.min.z + boundingBox.box.max.z)/2 );
    	return center;
	},

	show3DObject: function(obj3D, booleanValue) {
		obj3D.traverse(function(object) { 
        	object.visible = booleanValue;
    	});
	},

	setOpacity: function(obj3D, opacity) {
		console.log(obj3D);
		obj3D.traverse(function(object) {
			if(object.material !== undefined) {
				object.visible = true;
				object.material.transparent = true;
				object.material.opacity = opacity;
			}
		});
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

	trasparenceModel: function(data, idObject) {
		self.setOpacity(data.index["building"].obj3D, 0.1);
	}
}