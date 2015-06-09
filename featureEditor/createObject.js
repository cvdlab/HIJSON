function get3DModel() {
	var geometry = new THREE.BoxGeometry( 1, 1, 1 );
	var material = new THREE.MeshLambertMaterial( {color: 0x0000ff} );
	var object = new THREE.Mesh( geometry, material );

	return object;

	/* To set on get3DModel for the new Features
	var model = Feature.packageModel(object);
	return model;
	*/
}