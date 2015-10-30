var dijkstrajs = require('dijkstrajs');
var eventEmitter = require('./modules/eventEmitter.js');
var utilities = require('./modules/utilities.js');
var assembler = require('./modules/assembler.js');
var coordinatesUtilities = require('./modules/coordinatesUtilities.js');
var renderer2D = require('./modules/renderer2D.js');
var renderer3D = require('./modules/renderer3D.js');

data.obstaclesClasses = ['room', 'internal_wall', 'external_wall'];
data.interactiveClasses = ['server', 'surveillanceCamera', 'hotspot', 'antenna', 'fireExtinguisher', 'badgeReader', 'light'];


data.interactiveFeatures = [];
data.obstaclesFeatures = [];
assembler.assembleStructure(data);
if (data.config.computeGraph) assembler.assembleFeatureCollection(data.input.graph);

data.actualPosition = {
    coordinates: [data.config.startPosition.coordinates[0], data.config.startPosition.coordinates[1]],
    levelId: data.config.startPosition.levelId  
};

var generator3D = {};


generator3D.cube = function(color) {
	var geometry = new THREE.BoxGeometry(0.5, 0.5, 1.8);
    var material = new THREE.MeshLambertMaterial( {color: 0x00ff00} );
    var cube = new THREE.Mesh(geometry, material);
    cube.position.z += 0.9;
    var container = new THREE.Object3D();
    container.add(cube);
    return container;   
};

eventEmitter.on('getDirections', function(directionInfo) {
    for(var id in data.index) {
        var obj = data.index[id];
        if(obj.properties.class === 'level' && obj.layer2D.directionsLayer !== undefined) {
            obj.layer2D.removeLayer(obj.layer2D.directionsLayer);
        }
    }

    var fromNodeId = directionInfo.fromNodeId;
    var toNodeId = directionInfo.toNodeId; 
    var path = dijkstrajs.find_path(data.graph, fromNodeId, toNodeId);
    // console.log(path);
    var pathsGeoJSON = {};
    
    for(id in path) {

        var node = data.index[ path[id] ];
        var level = utilities.getLevel(node);
        if(!(level in pathsGeoJSON)) {
            pathsGeoJSON[level] = {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: []
                },
                properties: {
                    class: 'path'
                }
            };
        }
        var nodeCoordinates = coordinatesUtilities.getPointAbsoluteCoords(node);
        var geographicalCoordinates = coordinatesUtilities.fromXYToLngLat(nodeCoordinates, data.config.transformationMatrix);
        pathsGeoJSON[level].geometry.coordinates.push(geographicalCoordinates);
    }
    //console.log(pathsGeoJSON);

    for(var idLevel in pathsGeoJSON) {
        var layer = L.geoJson(pathsGeoJSON[idLevel]);
        data.index[idLevel].layer2D.addLayer(layer);
        data.index[idLevel].layer2D.directionsLayer = layer;
    }
});

//Setting canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");

document.getElementById("canvasMapColor").appendChild(canvas);

for(var id in data.index) {
    var element = data.index[id];
    if(element.properties.class === 'room') {
        drawArea(ctx,coordinatesUtilities.absoluteCoords(element), element.color);
    }
}

function drawArea(ctx, coordinates, color) {
    ctx.beginPath();
    console.log(coordinates);
    for(var i in coordinates[0]) {
        var c = coordinates[0][i];
        if(i === 0) {
            ctx.moveTo(c[0],c[1]);
        }
        else {
            ctx.lineTo(c[0],c[1]);
        }
    }
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
}

module.exports = {
    renderer2D: renderer2D,
    renderer3D: renderer3D,
    eventEmitter: eventEmitter,
    coordinatesUtilities: coordinatesUtilities,
    generator3D: generator3D,
    utilities: utilities
};