var furnitureGen = {}

var simpleFurnitures = {}

/* set floor height */
var levelHeight = 5;

/* convert Floor level to actual height */
function zLevel(level) {
    return level*levelHeight;
}


function simpleFurnitureAdd(furnitures, feature) {
	var simpleFurniturePosition = new THREE.Vector3(
                        feature.geometry.coordinates[0], 
                        feature.geometry.coordinates[1], 
                        zLevel(feature.properties.level)
                        ); 
	
	var simpleFurniture = simpleFurnitures[feature.properties.geomType]();
	
	simpleFurniture.position = simpleFurniturePosition;

	furnitures.add(simpleFurniture);
}

/* Oggetti complessi */
furnitureGen['server'] = function parseServer(furnitures, feature) {
    // probabilmente l'utilizzo di una shape risulta l'opzione migliore, specialmente per la creazione degli holes (vedi docs geoJson)
    
    var serverPosition = new THREE.Vector3(
                        feature.geometry.coordinates[0], 
                        feature.geometry.coordinates[1], 
                        zLevel(feature.properties.level)
                        );
    
    //var server = new THREE.Mesh( new THREE.CircleGeometry( 0.25, 20 ), new THREE.MeshBasicMaterial( {color: 0x0000ff, side: THREE.DoubleSide}));
    var geometry = new THREE.BoxGeometry(3, 1, 2.5 );
	var material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
	var server = new THREE.Mesh( geometry, material );
    
    server.position = serverPosition;   
        
    furnitures.add(server);
};


/* Oggetti semplici */
simpleFurnitures['surveillanceCamera'] = function surveillanceCamera() {
	return new THREE.Mesh( new THREE.CircleGeometry( 0.25, 20 ), new THREE.MeshBasicMaterial( {color: 0xff0000, side: THREE.DoubleSide} ));
};

simpleFurnitures['hotspot'] = function hotspot() {
	return new THREE.Mesh( new THREE.CircleGeometry( 0.25, 20 ), new THREE.MeshBasicMaterial( {color: 0x00ff00, side: THREE.DoubleSide} ));
};