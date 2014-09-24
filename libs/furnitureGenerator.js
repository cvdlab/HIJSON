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
/*
simpleFurnitures['surveillanceCamera'] = function surveillanceCamera() {
	return new THREE.Mesh( new THREE.CircleGeometry( 0.25, 20 ), new THREE.MeshBasicMaterial( {color: 0xff0000, side: THREE.DoubleSide} ));
};
*/

simpleFurnitures['surveillanceCamera'] = function surveillanceCamera() {
    var radius = 0.2;
    var widthSegments = 32;
    var heightSegments = 32;
    var phiStart = 0;
    var phiLength = -Math.PI;
    var thetaStart = 0;
    var thetaLength = Math.PI;

    var geometry = new THREE.SphereGeometry( radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength);
    var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
    
    var model = new THREE.Mesh( geometry, material );

    model.position.z = model.position.z + levelHeight - radius/2;
    
    var surveillanceCamera = new THREE.Object3D();
    surveillanceCamera.add(model);
    return surveillanceCamera;
}

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

simpleFurnitures['light'] = function light() {
    var radius = 0.05;
    var width = 0.1;
    var depth = 0.2;
    var height = 0.3;
    var length  = 2;

    var geometry = new THREE.CylinderGeometry( radius, radius, length, 32);
    var material = new THREE.MeshBasicMaterial( {color: 0xffffff} );
    var model = new THREE.Mesh( geometry, material);
    
    model.position.z = model.position.z + levelHeight - radius;

    var light = new THREE.Object3D();

    light.add(model);
    return light;
};

simpleFurnitures['antenna'] = function antenna() {
    var radius_down = 0.02;
    var radius_up = 0.01;
    var length = 0.3;
    var width = 0.1;
    var depth = 0.2;
    var height = 0.3;
    
    var geometry = new THREE.CylinderGeometry( radius_down, radius_up, length, 32);
    var material = new THREE.MeshBasicMaterial( {color: 0xff0000} );
    var model = new THREE.Mesh( geometry, material);

    model.rotation.x = Math.PI/2;
    
    model.position.z = model.position.z + levelHeight - length;

    var antenna = new THREE.Object3D();

    antenna.add(model);
    return antenna;
};
/*
simpleFurnitures['name_furniture'] = function parseMulti**Name_furniture**(furnitures, feature) {
    $.each(feature.geometry.coordinates, function (key, furnitureCoordinates) {
        simpleFurnitureAdd(furnitures, feature);
    });
}
 */