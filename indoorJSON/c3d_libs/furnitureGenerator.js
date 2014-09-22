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
    if(feature.properties.dimensions === undefined) {
        var dimensions = [1,1,2];

    }
    else {
        var dimensions = feature.properties.dimensions;
    }
    
    var geometry = new THREE.BoxGeometry(dimensions[0], dimensions[1], dimensions[2]);
    var material = new THREE.MeshBasicMaterial( {color: 0x008080} );
    
    var server = new THREE.Mesh( geometry, material );
    
    server.position = serverPosition;           

    server.position.z += dimensions[2]/2;
    
    furnitures.add(server);
};


/* Oggetti semplici */
simpleFurnitures['surveillanceCamera'] = function surveillanceCamera() {
	return new THREE.Mesh( new THREE.CircleGeometry( 0.25, 20 ), new THREE.MeshBasicMaterial( {color: 0xff0000, side: THREE.DoubleSide} ));
};

simpleFurnitures['hotspot'] = function hotspot() {
    var width = 0.1;
    var depth = 0.2;
    var height = 0.3;
    var geometry = new THREE.BoxGeometry(width, depth, height);
    var material = new THREE.MeshBasicMaterial( {color: 0x0000ff});
    
    var model = new THREE.Mesh( geometry, material );
    model.position.z = model.position.z + levelHeight - height/2;
    
    var hotspot = new THREE.Object3D();
    hotspot.add(model);
    return hotspot;
};

/*
simpleFurnitures['name_furniture'] = function parseMulti**Name_furniture**(furnitures, feature) {
    $.each(feature.geometry.coordinates, function (key, furnitureCoordinates) {
        simpleFurnitureAdd(furnitures, feature);
    });
}
 */