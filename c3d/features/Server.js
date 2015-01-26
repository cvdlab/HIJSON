var Feature = require('./Feature.js');

Feature.inherits(Server, Feature);

function Server(feature) {
	Feature.call(this, feature);
}

Server.prototype.style = {
							"weight": 0,
						    "fillColor": "#f49530",
						    "fillOpacity": 1
						};

Server.prototype.get3DModel = function() {
	var coords = this.geometry.coordinates;
	var geometry = new THREE.BoxGeometry(coords[0][2][0], coords[0][2][1], this.properties.height);
	var material = new THREE.MeshLambertMaterial( {color: 0xf49530} );
	var wireMaterial = new THREE.MeshLambertMaterial( {color: 0x000000, wireframe: true, wireframeLinewidth: 2} );
	var server = new THREE.Mesh(geometry, material);

	server.receiveShadow = true;
	server.castShadow = true;
	var model = Feature.packageModel(server);

	return model;
}

module.exports = Server;