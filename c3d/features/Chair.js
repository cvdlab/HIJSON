var Feature = require('./Feature.js');

Feature.inherits(Chair, Feature);

function Chair(feature) {
	Feature.call(this, feature);
}

Chair.prototype.style = {
			    			prefix: "fa",
	    					icon: "minus"
						};
						
Chair.prototype.get3DModel = function() {
	var chair = new THREE.Object3D();

	var geometry = new THREE.CylinderGeometry( 0.015, 0.015, 0.5, 32 );
	var material = new THREE.MeshLambertMaterial( {color: 0xd9d7d7} );

	var p1 = new THREE.Mesh( geometry, material );
	p1.rotation.x += Math.PI/2;
	p1.position.z += 0.5/2;

	var p2 = new THREE.Mesh( geometry, material );
	p2.rotation.x += Math.PI/2;
	p2.position.z += 0.5/2;
	p2.position.y += 0.4;

	var p3 = new THREE.Mesh( geometry, material );
	p3.rotation.x += Math.PI/2;
	p3.position.z += 0.5/2;
	p3.position.x += 0.4;

	var p4 = new THREE.Mesh( geometry, material );
	p4.rotation.x += Math.PI/2;
	p4.position.z += 0.5/2;
	p4.position.y += 0.4;
	p4.position.x += 0.4;

	var p5 = new THREE.Mesh( geometry, material );
	p5.rotation.x += Math.PI/2;
	p5.position.z += 0.5*3/2;

	var p6 = new THREE.Mesh( geometry, material );
	p6.rotation.x += Math.PI/2;
	p6.position.z += 0.5*3/2;
	p6.position.x += 0.4;

	var geometry = new THREE.BoxGeometry( 0.45, 0.45, 0.02 );
	var material = new THREE.MeshLambertMaterial( {color: 0x9b8c75} );
	var plane = new THREE.Mesh( geometry, material );
	plane.position.x += 0.4/2;
	plane.position.y += 0.4/2;
	plane.position.z += 0.5;

	var geometry = new THREE.BoxGeometry( 0.38, 0.02, 0.15);
	var back = new THREE.Mesh( geometry, material );
	back.position.x += 0.4/2;
	back.position.y += 0.001;
	back.position.z += 0.5*12/7;

	chair.add(back);
	chair.add(plane);
	chair.add(p1);
	chair.add(p2);
	chair.add(p3);
	chair.add(p4);
	chair.add(p5);
	chair.add(p6);
	var model = Feature.packageModel(chair);

	return model;
}

module.exports = Chair;