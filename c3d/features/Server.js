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
	var model = Feature.packageModel(server);

	return model;
}

module.exports = Server;