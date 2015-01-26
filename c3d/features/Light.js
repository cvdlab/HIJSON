var Feature = require('./Feature.js');

Feature.inherits(Light, Feature);

function Light(feature) {
	Feature.call(this, feature);
}

Light.prototype.get3DModel = function() {
	var light = new THREE.Object3D();
	var height = 0.05;
	var width = 0.6;
	var externalPlaneGeometry = new THREE.PlaneGeometry(width,width);
	var externalPlaneMaterial = new THREE.MeshLambertMaterial({
	                                                            color:0xE7E6DD,
	                                                            side: THREE.DoubleSide
	                                                        });

	var plane3D = new THREE.Mesh(externalPlaneGeometry, externalPlaneMaterial);
	plane3D.position.z += height;
	light.add(plane3D);
	var groupNeon = new THREE.Object3D();
	var neonMaterial = new THREE.MeshLambertMaterial( {color: 0xffffff} );
	var neonGeometry = new THREE.CylinderGeometry( 0.015, 0.015, 0.58, 32 );
	var translations = [(-0.075*3), (-0.075), (0.075), (0.075*3)];
	for(i in translations)
	{
	    var neon = new THREE.Mesh( neonGeometry, neonMaterial );
	    neon.position.x += translations[i];
	    groupNeon.add(neon);
	}
	light.add(groupNeon);

	var model = packageModel(light);

	return model;
}

module.exports = Light;