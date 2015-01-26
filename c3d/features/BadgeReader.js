var Feature = require('./Feature.js');

Feature.inherits(BadgeReader, Feature);

function BadgeReader(feature) {
	Feature.call(this, feature);
}

BadgeReader.prototype.style = 	{
									prefix: "fa",
									icon: "ticket"
								};

BadgeReader.prototype.get3DModel = function() {
    var geometry = new THREE.BoxGeometry( 0.2, 0.3, 0.25 );
    var material = new THREE.MeshLambertMaterial( {color: 0x38a9dc} );
    var badgeReader = new THREE.Mesh( geometry, material );
    
    var model = Feature.packageModel(badgeReader);

    return model;
}

module.exports = BadgeReader;