var Feature = require('./Feature.js');


function Antenna(feature) {
	Feature.call(this, feature);
}

Feature.inherits(Antenna, Feature);

Antenna.prototype.style =	{
								prefix: "fa",
								icon: "signal",
								zIndex: 3
    						};
Antenna.prototype.in_graph = true;
Antenna.prototype.in_2D_map = true;

Antenna.prototype.get3DModel = function() {
	var material = new THREE.MeshLambertMaterial( {color: 0x38a9dc} );

	var antenna = new THREE.Object3D();
	
	var geometry = new THREE.BoxGeometry( 0.3, 0.1, 0.3 );
	var base = new THREE.Mesh( geometry, material );
	base.name = "base_" + this.id;
	base.position.z += 0.3/2;

	geometry = new THREE.CylinderGeometry( 0.01, 0.01, 0.065, 32 );
	var baseCylinder = new THREE.Mesh( geometry, material );
	baseCylinder.name = "baseCylinder_" + this.id;
	baseCylinder.position.y += 0.05;
	baseCylinder.position.z += 0.3/2;

	geometry = new THREE.CylinderGeometry( 0.001, 0.01, 0.5, 32 );
	var cylinderAntenna = new THREE.Mesh( geometry, material );
	cylinderAntenna.name = "cylinderAntenna_" + this.id;
	cylinderAntenna.rotation.x = Math.PI/2;
	cylinderAntenna.position.z += 0.3/2 +  0.5/2;
	cylinderAntenna.position.y += 0.08;

	geometry = new THREE.SphereGeometry( 0.01, 32, 32 );
	var sphere = new THREE.Mesh( geometry, material );
	sphere.name = "sphere_" + this.id;
	sphere.position.z += 0.3/2;
	sphere.position.y += 0.08;
	
	antenna.add(base);
	antenna.add(baseCylinder);
	antenna.add(cylinderAntenna);
	antenna.add( sphere );
	
	antenna.name = this.id;
	antenna.feature = this;
	var model = Feature.packageModel(antenna);
	return model;
};

module.exports = Antenna;


