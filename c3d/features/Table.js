var Feature = require('./Feature.js');

Feature.inherits(Table, Feature);

function Table(feature) {
	Feature.call(this, feature);
}

Table.prototype.style =	{
							weight: 0,
						    fillColor: "#9b8c75",
						    fillOpacity: 1,
						    zIndex: 3
						};

Table.prototype.in_graph = true;
Table.prototype.in_2D_map = true;

Table.prototype.get3DModel = function() {
	var table = new THREE.Object3D();
	
	var tableX = this.geometry.coordinates[0][1][0];
	var tableY = this.geometry.coordinates[0][2][1];
	var tableZ = this.properties.height;

	var geometry = new THREE.CylinderGeometry( 0.03, 0.03, tableZ, 32 );
	var material = new THREE.MeshLambertMaterial( {color: 0xd9d7d7} );

	var p1 = new THREE.Mesh( geometry, material );
	p1.name = "p1_" + this.id;
	p1.rotation.x += Math.PI/2;
	p1.position.z += tableZ/2;
	p1.position.x += 0.05;
	p1.position.y += 0.05;

	var p2 = new THREE.Mesh( geometry, material );
	p2.name = "p2_" + this.id;
	p2.rotation.x += Math.PI/2;
	p2.position.z += tableZ/2;
	p2.position.x += tableX - 0.05;
	p2.position.y += 0.05;

	var p3 = new THREE.Mesh( geometry, material );
	p3.name = "p3_" + this.id;
	p3.rotation.x += Math.PI/2;
	p3.position.z += tableZ/2;
	p3.position.x += tableX - 0.05;
	p3.position.y += tableY - 0.05;

	var p4 = new THREE.Mesh( geometry, material );
	p4.name = "p4_" + this.id;
	p4.rotation.x += Math.PI/2;
	p4.position.z += tableZ/2;
	p4.position.x += 0.05;
	p4.position.y += tableY - 0.05;

	geometry = new THREE.BoxGeometry( tableX, tableY, 0.04 );
	material = new THREE.MeshLambertMaterial( {color: 0x9b8c75} );
	var plane = new THREE.Mesh( geometry, material );
	plane.name = "plane_" + this.id;
	plane.position.x += tableX/2;
	plane.position.y += tableY/2;
	plane.position.z += tableZ;

	table.add(p1);
	table.add(p2);
	table.add(p3);
	table.add(p4);
	table.add(plane);

	table.feature = this;
	table.name = this.id;
	var model = Feature.packageModel(table);

	return model;
};

module.exports = Table;