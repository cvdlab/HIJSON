var Feature = require('./Feature.js');
var React = require('react');
Feature.inherits(Server, Feature);

function Server(feature) {
	Feature.call(this, feature);
}

Server.prototype.style = {
							weight: 0,
						    fillColor: "#f49530",
						    fillOpacity: 1,
						    zIndex: 2
						};

Server.prototype.in_graph = true;
Server.prototype.in_2D_map = true;

Server.prototype.get3DModel = function() {
	var shape = Feature.generatePolygonShape(this.geometry);
	var geometry = shape.extrude({
                curveSegments: 1,
                steps: 1,
                amount: this.properties.height,
                bevelEnabled: false
            });

	var material = new THREE.MeshLambertMaterial( {color: 0xf49530} );
	var wireMaterial = new THREE.MeshLambertMaterial( {color: 0x000000, wireframe: true, wireframeLinewidth: 2} );

	var server = new THREE.Mesh(geometry, material);
	server.receiveShadow = true;
	server.castShadow = true;
	server.feature = this;
	server.name = this.id;
	var model = Feature.packageModel(server);

	return model;
};

module.exports = Server;