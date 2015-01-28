var Feature = require('./Feature.js');

Feature.inherits(Table, Feature);

function Table(feature) {
	Feature.call(this, feature);
}

Table.prototype.style =	{
							prefix: "fa",
							icon: "square-o"
    					};

Table.prototype.get3DModel = function() {
	var table = new THREE.Object3D();

	var geometry = new THREE.CylinderGeometry( 0.03, 0.03, 0.8, 32 );
	var material = new THREE.MeshLambertMaterial( {color: 0xd9d7d7} );

	var p1 = new THREE.Mesh( geometry, material );
	p1.name = "p1_" + this.id;
	p1.rotation.x += Math.PI/2;
	p1.position.z += 0.8/2;

	var p2 = new THREE.Mesh( geometry, material );
	p2.name = "p2_" + this.id;
	p2.rotation.x += Math.PI/2;
	p2.position.z += 0.8/2;
	p2.position.y += 1;

	var p3 = new THREE.Mesh( geometry, material );
	p3.name = "p3_" + this.id;
	p3.rotation.x += Math.PI/2;
	p3.position.z += 0.8/2;
	p3.position.x += 2;

	var p4 = new THREE.Mesh( geometry, material );
	p4.name = "p4_" + this.id;
	p4.rotation.x += Math.PI/2;
	p4.position.z += 0.8/2;
	p4.position.y += 1;
	p4.position.x += 2;


	var geometry = new THREE.BoxGeometry( 2.1, 1.1, 0.04 );
	var material = new THREE.MeshLambertMaterial( {color: 0x9b8c75} );
	var plane = new THREE.Mesh( geometry, material );
	plane.name = "plane_" + this.id;
	plane.position.x -= 0.05 - 2.1/2;
	plane.position.y -= 0.05 - 1.1/2;
	plane.position.z += 0.8;

	table.add(p1);
	table.add(p2);
	table.add(p3);
	table.add(p4);
	table.add(plane);

	table.feature = this;
	table.name = this.id;
	var model = Feature.packageModel(table);

	return model;
}

module.exports = Table;