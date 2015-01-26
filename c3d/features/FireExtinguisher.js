var Feature = require('./Feature.js');

Feature.inherits(FireExtinguisher, Feature);

function FireExtinguisher(feature) {
	Feature.call(this, feature);
}

FireExtinguisher.prototype.style = {
									    prefix: "fa",
									    icon: "fire-extinguisher",
									    markerColor: "red"
									};

FireExtinguisher.prototype.get3DModel = function() {
	var fireExtinguisher = new THREE.Object3D();

	var material = new THREE.MeshLambertMaterial( {color: 0xff0000} );
	var bodyGeometry = new THREE.CylinderGeometry( 0.1, 0.1, 0.6, 32 );
	var body = new THREE.Mesh( bodyGeometry, material );
	body.rotation.x = Math.PI/2;

	fireExtinguisher.add(body);

	var geometrySphereUp = new THREE.SphereGeometry( 0.1, 32, 32 );
	var sphereUp = new THREE.Mesh( geometrySphereUp, material );
	sphereUp.position.z += 0.3;

	fireExtinguisher.add(sphereUp);

	var headGeometry = new THREE.BoxGeometry(0.02, 0.02, 0.2);
	var materialHead = new THREE.MeshLambertMaterial( {color: 0x000000} );
	var head = new THREE.Mesh( headGeometry, materialHead );
	head.position.z += 0.4;

	fireExtinguisher.add(head);

	var materialCylinder = new THREE.MeshLambertMaterial( {color: 0x000000} );
	var cylinderGeometry = new THREE.CylinderGeometry( 0.015, 0.08, 0.25, 32 );
	var cylinder = new THREE.Mesh(cylinderGeometry, materialCylinder);
	cylinder.position.z += 0.5;
	cylinder.rotation.z = Math.PI/2;
	cylinder.position.x += 0.1;

	fireExtinguisher.add(cylinder);

	var model = packageModel(fireExtinguisher);    
	return model;
}

module.exports = FireExtinguisher;