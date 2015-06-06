var Feature = require('./Feature.js');

Feature.inherits(Room, Feature);

function Room(feature) {
	Feature.call(this, feature);
}

Room.prototype.style = {
							weight: 0,
							fillColor: "#b8b8b8",
							fillOpacity: 1,
                            zIndex: 1
    					};

Room.prototype.in_graph = true;
Room.prototype.in_2D_map = true;

Room.prototype.get3DModel = function() {
    var material = new THREE.MeshLambertMaterial({
        color: this.style.fillColor,
        transparent: false, 
        opacity: 0.9, 
        side: THREE.DoubleSide
    });

    var model = new THREE.Mesh(Feature.generatePolygon(this.geometry), material);
    model.name = this.id;    
    model.receiveShadow = true;

    return model;	
};

module.exports = Room;