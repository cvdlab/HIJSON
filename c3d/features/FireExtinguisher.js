var Feature = require('./Feature.js');

Feature.inherits(FireExtinguisher, Feature);

function FireExtinguisher(feature) {
	Feature.call(this, feature);
}

FireExtinguisher.prototype.style = {
									    prefix: "fa",
									    icon: "fire-extinguisher",
									    markerColor: "red",
									    zIndex: 3
									};

FireExtinguisher.prototype.in_graph = true;
FireExtinguisher.prototype.in_2D_map = true;

FireExtinguisher.prototype.get3DModel = function() {
	var fireExtinguisher = new THREE.Object3D();

	var material = new THREE.MeshLambertMaterial( {color: 0xff0000} );
	var bodyGeometry = new THREE.CylinderGeometry( 0.1, 0.1, 0.6, 32 );
	var body = new THREE.Mesh( bodyGeometry, material );
	body.name = "body_" + this.id;
	body.rotation.x = Math.PI/2;

	fireExtinguisher.add(body);

	var geometrySphereUp = new THREE.SphereGeometry( 0.1, 32, 32 );
	var sphereUp = new THREE.Mesh( geometrySphereUp, material );
	sphereUp.name = "sphereUp_" + this.id;
	sphereUp.position.z += 0.3;

	fireExtinguisher.add(sphereUp);

	var headGeometry = new THREE.BoxGeometry(0.02, 0.02, 0.2);
	var materialHead = new THREE.MeshLambertMaterial( {color: 0x000000} );
	var head = new THREE.Mesh( headGeometry, materialHead );
	head.name = "head_" + this.id;
	head.position.z += 0.4;

	fireExtinguisher.add(head);

	var materialCylinder = new THREE.MeshLambertMaterial( {color: 0x000000} );
	var cylinderGeometry = new THREE.CylinderGeometry( 0.015, 0.08, 0.25, 32 );
	var cylinder = new THREE.Mesh(cylinderGeometry, materialCylinder);
	cylinder.name = "cylinder_" + this.id;
	cylinder.position.z += 0.5;
	cylinder.rotation.z = Math.PI/2;
	cylinder.position.x += 0.1;

	fireExtinguisher.add(cylinder);
	fireExtinguisher.name = this.id;
	fireExtinguisher.feature = this;
	var model = Feature.packageModel(fireExtinguisher);    
	return model;
};

FireExtinguisher.prototype.getInfo = function () {
    var feature = this;
    var featureInfoComponent = React.createClass({displayName: "featureInfoComponent",
        render: function() {
            var root = Feature.prototype.getCreateElement.call(feature);
            var child = React.createElement("dl", {className: "dl-horizontal"}, 
                        	React.createElement("dt", null, "Last Check:"), 
                        	React.createElement("dd", null, '01/01/1970')
                        );
            var result = React.createElement("div", null, root, child);
            
            return result;
    	}
    });

    return featureInfoComponent;
};

module.exports = FireExtinguisher;