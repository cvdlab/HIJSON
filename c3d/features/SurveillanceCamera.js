var Feature = require('./Feature.js');

Feature.inherits(SurveillanceCamera, Feature);

function SurveillanceCamera(feature) {
	Feature.call(this, feature);
}

SurveillanceCamera.prototype.style = {
									    prefix: "fa",
									    icon: "video-camera"
    								};
SurveillanceCamera.prototype.get3DModel = function() {
	var material = new THREE.MeshLambertMaterial( {color: 0x38a9dc} );
	var camera = new THREE.Object3D();

	//Creazione corpo macchina
	var widthBody = 0.2;
	var depthBody = 0.1;
	var heightBody = 0.1;

	var bodyCameraGeometry = new THREE.BoxGeometry(widthBody, depthBody, heightBody);
	var bodyCamera = new THREE.Mesh( bodyCameraGeometry, material );

	//Creazione obiettivo
	var radiusTopCameraLens = 0.04;
	var radiusBottomCameraLens = 0.06;
	var heightCylinderCamenraLens =  0.08;
	var cameraLensGeometry = new THREE.CylinderGeometry(radiusTopCameraLens, radiusBottomCameraLens, heightCylinderCamenraLens, 32 );
	var cameraLens = new THREE.Mesh( cameraLensGeometry, material );
	cameraLens.rotation.z = Math.PI/2;
	cameraLens.position.x += 2*widthBody/3;

	//Creazione asse sostegno
	var radiusTopRod = 0.005;
	var radiusBottomRod = 0.005;
	var heightRod = 0.15;

	var rodGeometry = new THREE.CylinderGeometry(radiusTopRod, radiusBottomRod, heightRod, 32 );
	var rod = new THREE.Mesh( rodGeometry, material );
	rod.rotation.z = Math.PI/2;
	rod.position.x -= widthBody/2;

	camera.add(bodyCamera);
	camera.add(cameraLens);

	camera.receiveShadow = true;
	camera.castShadow = true;
	var box = new THREE.Box3();
	box.setFromObject(camera);
	camera.add(box);
	camera.rotation.y += Math.PI*1/9;
	
	camera.feature = this;
	camera.name = this.id;

	var model = Feature.packageModel(camera);
	return model;
}

module.exports = SurveillanceCamera;
