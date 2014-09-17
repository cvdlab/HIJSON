/* set floor height */
var levelHeight = 5;

/* convert Floor level to actual height */
function zLevel(level) {
    return level*levelHeight;
}

function getMaxlevel(pathname) {
    var maxLevel = 0;
    $.getJSON(pathname, function(data) { 
        if (data.type == "FeatureCollection") {
            console.log('FeatureCollection detected');
            $.each( data.features, function( key, feature ) {
                if(feature.properties.level > maxLevel)
                    maxLevel = feature.properties.level;
            });
        } else {
            console.log('ERROR: No FeatureCollection detected');
        }

    });
}
/* main parsing function */
function parsefurnitureJSON(scene, pathname) {
    
    var mapFurniture = new THREE.Object3D();

    $.getJSON(pathname, function(data) { 
        if (data.type == "FeatureCollection") {
            console.log('FeatureCollection detected');
            
            $.each( data.features, function( key, feature ) {
                switch (feature.geometry.type) {
                    case "camera":
                        parseCamera(mapFurniture, feature.geometry.coordinates, feature.properties);
                        break;
                    case "server":
                        parseServer(mapFurniture, feature.geometry.coordinates, feature.properties);
                        break;
                    case "repeaterWifi":
                        parserRepeaterWifi(mapFurniture, feature.geometry.coordinates, feature.properties);
                        break;
                }
            });
        } else {
            console.log('ERROR: No FeatureCollection detected');
        }
    });
    
    scene.add(mapFurniture);
}

/* auxiliary parsing functions for points, lines and polygons */

function parseCamera(mapFurniture, coordinates, properties) {
    //Le coordinate (x,y) sono impostate dai parametri all'interno delle properties, 
    //mentre per quanto riguarda l'altezza si presuppone che la camera sia fissa al soffitto.
   var cameraPosition = new THREE.Vector3(
                        coordinates[0], 
                        coordinates[1], 
                        (zLevel(properties.level) + levelHeight)
                        );
    
    var camera = new THREE.Object3D();
    camera.position = cameraPosition;
    
    // aggiungo all'object3D un cerchietto per segnarlo sulla mapFurniturepa
    camera.add(new THREE.Mesh( new THREE.CircleGeometry( 0.25, 20 ), new THREE.MeshBasicMaterial( {color: 0xff0000, side: THREE.DoubleSide} ) ));
    
    mapFurniture.add(camera);
}

function parserRepeaterWifi(mapFurniture, coordinates, properties) {
    //Le coordinate (x,y) sono impostate dai parametri all'interno delle properties, 
    //mentre per quanto riguarda l'altezza si presuppone che la camera sia fissa al soffitto.
    var repeaterWifiPosition = new THREE.Vector3(
                                coordinates[0], 
                                coordinates[1], 
                                (zLevel(properties.level) + levelHeight)
                            );
    
    var repeaterWifi = new THREE.Object3D();
    repeaterWifi.position = repeaterWifiPosition;
    
    // aggiungo all'object3D un cerchietto per segnarlo sulla mapFurniturepa
    repeaterWifi.add(new THREE.Mesh( new THREE.CircleGeometry( 0.25, 20 ), new THREE.MeshBasicMaterial( {color: 0x00ff00, side: THREE.DoubleSide} ) ));
    
    mapFurniture.add(repeaterWifi);
}

function parseServer(mapFurniture, coordinates, properties) {
    // probabilmente l'utilizzo di una shape risulta l'opzione migliore, specialmente per la creazione degli holes (vedi docs geoJson)
    
    var shape = new THREE.Shape();
    
    for (var j = 0; j < coordinates[0].length; j++) //scorro le singole coordinate del perimetro esterno
    { 
        if (j == 0) { // primo punto
            shape.moveTo(coordinates[0][j][0], coordinates[0][j][1]);
        } else { // altri punti
            shape.lineTo(coordinates[0][j][0], coordinates[0][j][1]);
        }
    }
    
    for (var i = 1; i < coordinates.length; i++) { //scorro eventuali holes
        var hole = new THREE.Path();
        for (var j = 0; j < coordinates[i].length; j++) { //scorro le singole coordinate dei vari perimetri
            if (j == 0) { // primo punto
                hole.moveTo(coordinates[i][j][0], coordinates[i][j][1]);
            } else { // altri punti
                hole.lineTo(coordinates[i][j][0], coordinates[i][j][1]);
            }  
        }
        shape.holes.push(hole);
    }
    
    var server = new THREE.Mesh(shape.makeGeometry(), new THREE.MeshBasicMaterial({color: 0x0000ff, transparent: false, opacity: 0.3, side: THREE.DoubleSide}));
    
    server.position.z = zLevel(properties.level);  // imposta il piano di altezza
    mapFurniture.add(server);
}