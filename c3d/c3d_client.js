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

//var startRoomId =  data.mapColor[getAreaColor(ctx, [data.config.startPosition.coordinates[0], data.config.startPosition.coordinates[1]])];
data.actualPosition = {
    coordinates: [data.config.startPosition.coordinates[0], data.config.startPosition.coordinates[1]],
    levelId: data.config.startPosition.levelId,
    roomId: "undef"  
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

var canvas_maps = {};

function drawArea(ctx, coordinates, color) {
    ctx.beginPath();
    //console.log(coordinates);
    for(var i in coordinates[0]) {
        var c = coordinates[0][i];
        if (i === 0) { ctx.moveTo(c[0], c[1]); }
        else { ctx.lineTo(c[0], c[1]); }
    }
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
}

function getAreaColor(ctx, coords) {
    function rgbToHex(r, g, b) {
        function componentToHex(c) {
            var hex = c.toString(16);
            return hex.length == 1 ? "0" + hex : hex;
        }
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }
    var data = ctx.getImageData(coords[0], coords[1], 1, 1).data;
    return rgbToHex(data[0],data[1],data[2]);
}

for (var id_level in data.geoJSONmap) {
    canvas_maps[id_level] = document.createElement("canvas");
    var ctx = canvas_maps[id_level].getContext("2d");

    for(var id in data.index) {
        var element = data.index[id];
        if(element.properties.class === 'room' && utilities.getLevel(element) === id_level) {
            drawArea(ctx, coordinatesUtilities.absoluteCoords(element), element.properties.pixelColor);
            //console.log(element.id+': '+element.properties.pixelColor);
        }
    }
}

data.canvas_maps = canvas_maps;

//document.getElementById("canvasMapColor").appendChild(canvas_maps.level_0);


eventEmitter.on('updatePosition', function(actualPosition) {
    
    function updateObstaclesArray(actualPosition) {
        newObstaclesFeatures = [];
        var room = data.index[actualPosition.roomId];
        var level = data.index[actualPosition.levelId];
        newObstaclesFeatures.push(room.obj3D);

        for (var childKey in level.children) {
            var child = level.children[childKey];
            if ( (child.properties.class === 'internal_wall' || child.properties.class === 'external_wall') && 
                  child.properties.connections.indexOf(actualPosition.roomId) > -1 ) {
                newObstaclesFeatures.push(child.obj3D);
            }
        }
        eventEmitter.emit('updateObstacles', newObstaclesFeatures);
        data.obstaclesFeatures = newObstaclesFeatures;
        console.log(data.obstaclesFeatures);
    }

    var canvas = canvas_maps[actualPosition.levelId];
    var ctx = canvas.getContext('2d');
    var color = getAreaColor(ctx, actualPosition.coordinates);
    var actualRoomId = data.mapColor[color];

    if(data.actualPosition.roomId !== actualRoomId) {
        data.actualPosition.roomId = actualRoomId;
        console.log('nuova impostazione: '+"Actual room position: " + data.actualPosition.roomId);
        eventEmitter.emit('showFeatureInfo', data.actualPosition.roomId);
        updateObstaclesArray(data.actualPosition);
    }
});

module.exports = {
    renderer2D: renderer2D,
    renderer3D: renderer3D,
    eventEmitter: eventEmitter,
    coordinatesUtilities: coordinatesUtilities,
    generator3D: generator3D,
    utilities: utilities
};