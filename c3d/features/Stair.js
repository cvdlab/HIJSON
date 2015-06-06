var Feature = require('./Feature.js');

Feature.inherits(Stair, Feature);

function Stair(feature) {
	Feature.call(this, feature);
}

Stair.prototype.style =	{
                            weight: 0,
                            fillColor: "#ff0000",
                            fillOpacity: 1,
                            zIndex: 1
						};

Stair.prototype.in_graph = false;
Stair.prototype.in_2D_map = true;

Stair.prototype.get3DModel = function() {
    var material = new THREE.MeshLambertMaterial( {color: 0xb8b8b8} );
    var stair = new THREE.Object3D();
    var dim = this.properties.stepDimension;
    for(var i=0; i< this.properties.nSteps; i++) {
        var stepGeometry = new THREE.BoxGeometry(dim[1],dim[0], dim[2]);
        var step = new THREE.Mesh(stepGeometry, material);
        step.position.z = i*dim[2];
        step.position.x = i*dim[1];
        stair.add(step);
    }
    stair.position.z += dim[2]/2;
    stair.position.y += dim[0]/2;
    return stair;
};

module.exports = Stair;