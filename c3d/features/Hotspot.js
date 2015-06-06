var Feature = require('./Feature.js');

Feature.inherits(Hotspot, Feature);

function Hotspot(feature) {
	Feature.call(this, feature);	
}

Hotspot.prototype.style = {
								prefix: "fa",
								icon: "wifi",
								zIndex: 3
							};

Hotspot.prototype.in_graph = true;
Hotspot.prototype.in_2D_map = true;

Hotspot.prototype.get3DModel = function() {
	var hotspot = new THREE.Object3D();

	var material = new THREE.MeshLambertMaterial( {color: 0x38a9dc} );
	var bodyGeometry = new THREE.BoxGeometry( 0.1, 0.02, 0.1);
	var body = new THREE.Mesh( bodyGeometry, material );
	body.name = "body_" + this.id;

	var antennaGeometry = new THREE.CylinderGeometry( 0.001, 0.005, 0.1 , 32);
	var antennaDx= new THREE.Mesh(antennaGeometry, material);
	antennaDx.name = "antennaDx_" + this.id;
	var antennaSx= new THREE.Mesh(antennaGeometry, material);
	antennaSx.name = "antennaSx_" + this.id;

	antennaDx.rotation.x = Math.PI/2;
	antennaSx.rotation.x = Math.PI/2;
	antennaSx.position.x += 0.08/2;
	antennaDx.position.x -= 0.08/2;

	antennaSx.position.z += 0.05;
	antennaDx.position.z += 0.05;

	hotspot.add(body);
	hotspot.add(antennaDx);
	hotspot.add(antennaSx);

	hotspot.receiveShadow = true;
	hotspot.castShadow = true;
	hotspot.name = this.id;
	hotspot.feature = this;
	var model = Feature.packageModel(hotspot);


	return model;
};

module.exports = Hotspot;