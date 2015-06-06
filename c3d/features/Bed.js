var Feature = require('./Feature.js');

Feature.inherits(Bed, Feature);

function Bed(feature) {
	Feature.call(this, feature);
}

Bed.prototype.style = 	{
									prefix: "fa",
									icon: "minus",
                                    zIndex: 3
								};

Bed.prototype.in_graph = true;
Bed.prototype.in_2D_map = true;
Bed.prototype.get3DModel = function() {
    var geometry = new THREE.BoxGeometry( 2, 1, 0.6 );
    var material = new THREE.MeshLambertMaterial( {color: 0xff0000} );
    var bed = new THREE.Mesh( geometry, material );
    
    bed.feature = this;
    bed.name = this.id;
    var model = Feature.packageModel(bed);

    return model;
};

module.exports = Bed;