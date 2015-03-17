// (1) dependencies
var poly2tri = require('poly2tri');
var ClipperLib = require('js-clipper');

var matrixUtilities = require('./matrixUtilities.js');
var coordinatesUtilities = require('./coordinatesUtilities.js');
var utilities = require('./utilities.js');
var featureFactory = require('./featureFactory.js');


// (2) private things

function computeWalkableArea(object) {
	var cpr = new ClipperLib.Clipper();
	var coords = object.geometry.coordinates;
	var perimeter = coords[0];
	
	var subj_paths = [fromJsonToClipper(perimeter)];
	var clip_paths = [];

	for (var i = 1; i < coords.length; i++) {
	    var internal_hole = coords[i];
	 	clip_paths.push(fromJsonToClipper(internal_hole));
    }
	
	for (k in object.children) {
		var child = object.children[k];
		if (child.geometry.type === 'Polygon') {
			clip_paths.push(fromJsonToClipper(child.getLocalCoordinates()));
		}
	}
	// console.log(subj_paths);
	//console.log(clip_paths);
	cpr.AddPaths(subj_paths, ClipperLib.PolyType.ptSubject, true);  // true means closed path
	cpr.AddPaths(clip_paths, ClipperLib.PolyType.ptClip, true);

	var walkableArea = new ClipperLib.Paths();
	var succeeded = cpr.Execute(ClipperLib.ClipType.ctDifference, walkableArea, 
		ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
	walkableArea = walkableArea.map(fromClipperToJson);
	return walkableArea;
}

function getTriangles(object) {
	if (object.geometry.type === 'Polygon') {
		var coords = computeWalkableArea(object);
		var perimeter = coords[0];
		var contour = [];
	
		for(j in perimeter) {
			contour.push(new poly2tri.Point(perimeter[j][0], perimeter[j][1]));
		}

		var swctx = new poly2tri.SweepContext(contour);
		
	    for (var i = 1; i < coords.length; i++) { //scorro eventuali holes
		    var perimeter = coords[i];
	        var hole = [];
	        for (j in perimeter) { //scorro le singole coordinate dei vari perimetri
				hole.push(new poly2tri.Point(perimeter[j][0], perimeter[j][1]));
	        }
	        swctx.addHole(hole);
	    }
	    
	    swctx.triangulate();
		var triangles = swctx.getTriangles();
	
		return triangles;
	} 
	else {
		console.log('error, you can triangulate only polygons');
	}
}

function getNearestNode(sourceNode, graphRoom) {
	var distanceNodes = [];
	var i = 0;
	for(idNode in graphRoom) {
		var nodeRoom = graphRoom[idNode];
		distanceNodes[i] = {
			node: nodeRoom,
			distance: distanceBetweenTwoNodes(sourceNode, nodeRoom)
		}
		i++;
	}
	var nearestNode = {
		node: distanceNodes[0].node,
		distance: distanceNodes[0].distance
	}

	for(var j=0; j<distanceNodes.length; j++) {
		if(distanceNodes[j].distance<nearestNode.distance) {
			nearestNode.distance = distanceNodes[j].distance;
			nearestNode.node = distanceNodes[j].node;
		}
	}
	return nearestNode;
};


function createNode(tVector, objectId, triangleId) {
	var graphNode = {
		type: 'graph',
		id: 'c_' + triangleId + '_' + objectId,
		geometry: {
			type: 'Point',
			coordinates: [0, 0]
		},
		properties: {
			class: 'graphNode',
			tVector: [0, 0, 0],
			rVector: [0, 0, 0],
			parent: objectId,
			adj: {}
		},
		children: []
	}
	graphNode.properties.tVector = tVector;
	return graphNode;
};


function getNode(tVect, mainBucket) {
	for(idNode in mainBucket) {
		var bucketNode = mainBucket[idNode];
		if(tVect[0] === bucketNode.properties.tVector[0] && tVect[1] === bucketNode.properties.tVector[1]) {
			return bucketNode;			
		}
	}
	console.log('Error');
};

function distanceBetweenTwoNodes(node_0, node_1) {
	return distanceBetweenTwoPoints(coordinatesUtilities.getPointAbsoluteCoords(node_0), coordinatesUtilities.getPointAbsoluteCoords(node_1));
};

function distanceBetweenTwoPoints(point_0, point_1) {
	return Math.sqrt( 
		Math.pow( (point_1[0] - point_0[0]), 2) 
		+ 
		Math.pow( (point_1[1] - point_0[1]), 2)
	);	
};


function nodeInBucket(tVect, bucket) {
	var bool = false;
	
	for(node in bucket.main) {
		var graphNode = bucket.main[node];
		if(tVect[0] === graphNode.properties.tVector[0] && tVect[1] === graphNode.properties.tVector[1] ) {
			bool = true;
		}
	}
	return bool;
};

function getMidPoint(point1, point2) {
	return [((point1.x + point2.x)/2), ((point1.y + point2.y)/2)]
};

function createSubGraph(data, id) {
	var object = data.index[id];
	if(object.properties.class === 'door') {
		var graphNode = {
			type: 'graph',
			id: 'n_' + object.id,
			geometry: {
				type: 'Point',
				coordinates: [0, 0]
			},
			properties: {
				class: 'graphNode',
				tVector: [(object.geometry.coordinates[1][0]/2), 0, 0],
				rVector: [0, 0, 0],
				parent: object.id,
				adj: {}
			},
			children: []
		}
        var localMatrix = matrixUtilities.objMatrix(graphNode);
		var globalMatrix = matrixUtilities.getCMT(data.index[graphNode.properties.parent]);
		graphNode.CMT = matrixUtilities.matrixProduct(globalMatrix, localMatrix);

		object.children.push(graphNode);
		graphNode.parent = object;
		object.graph.push(graphNode);
		data.index[graphNode.id] = graphNode;
	}

	if(object.type === 'furnitures') {
		var node = object.getGraphNode(object);
		var localMatrix = matrixUtilities.objMatrix(node);
		var globalMatrix = matrixUtilities.getCMT(data.index[node.properties.parent]);
		var nodeCMT = matrixUtilities.matrixProduct(globalMatrix, localMatrix);
		node.CMT = nodeCMT;
		
		node.parent = data.index[node.properties.parent];
		object.children.push(node);
		object.graph.push(node);
		data.index[node.id] = node;
	}
	if(object.properties.class === 'room') {
		var triangles = getTriangles(object);
		var i = 0;
		var bucket = {
			main: [],
			buckets: []
		};
		
		for(tri in triangles) {
			var idTriangle = object.id + '_' + tri; 
			bucket.buckets[idTriangle] = {};
			var triangle = triangles[tri];

			bucket.buckets[idTriangle].mid = [];
			for(edge in triangle.constrained_edge) {
				var constrainedEdge = triangle.constrained_edge[edge];
				if(!constrainedEdge) {
					var tVect = [];
					switch(edge) {
						case '0': 
							var midPoint = getMidPoint(triangle.points_[1], triangle.points_[2]);
							break;
						case '1': 
							var midPoint = getMidPoint(triangle.points_[0], triangle.points_[2]);
							break;
						case '2': 
							var midPoint = getMidPoint(triangle.points_[0], triangle.points_[1]);
							break;
					}
					tVect = [midPoint[0], midPoint[1], 0];
					
					if(!(nodeInBucket(tVect,bucket))) {				
						var graphNode = {
							type: 'graph',
							id: 'n_'+ i + '_' + object.id,
							geometry: {
								type: 'Point',
								coordinates: [0, 0]
							},
							properties: {
								class: 'graphNode',
								tVector: tVect,
								rVector: [0, 0, 0],
								parent: object.id,
								adj: {}
							},
							children: []
						}
						var localMatrix = matrixUtilities.objMatrix(graphNode);
						var globalMatrix = matrixUtilities.getCMT(data.index[graphNode.properties.parent]);
						graphNode.CMT = matrixUtilities.matrixProduct(globalMatrix, localMatrix);
						
						bucket.buckets[idTriangle].mid.push(graphNode);
						bucket.main.push(graphNode);
						i++;
					}
					else
					{
						bucket.buckets[idTriangle].mid.push(getNode(tVect,bucket.main));
					}

				}
			}
		}
		//Collegamento tra punti medi 
		for(id in bucket.buckets) {
			var smallBucket = bucket.buckets[id];
			if(smallBucket.mid.length >= 2){
				var nodesToConnect = smallBucket.mid;
				for(key in nodesToConnect) {
					var selectedNode = nodesToConnect[key];
					for (otherKey in nodesToConnect) {
						if (otherKey !== key) {
							var otherNode = nodesToConnect[otherKey];
							var distance = distanceBetweenTwoNodes(selectedNode, otherNode);
							selectedNode.properties.adj[otherNode.id] = distance;
						}
					}
				}
			}
		}


		//Aggiunta dei nodi all'oggetto (sottografo)
		for(node in bucket.main) {
			var graphNode = bucket.main[node];

			graphNode.parent = data.index[graphNode.properties.parent];
			object.children.push(graphNode);
			object.graph.push(graphNode);
			data.index[graphNode.id] = graphNode;
		}
	}
}

function assembleGraph(data) {
	var map = {};
	for(id in data.index) {
		for(idNode in data.index[id].graph) {
			map[data.index[id].graph[idNode].id] = data.index[id].graph[idNode].properties.adj;
		}
	}
	data.graph = map;
}

function fromJsonToClipper(coordList) {
	var clipperCoords = [];
	
	for (pointKey in coordList) {
		var newPoint = {
			X: coordList[pointKey][0],
			Y: coordList[pointKey][1]
		}
		clipperCoords.push(newPoint);
	}
	
	return clipperCoords;
}

function fromClipperToJson(coordList) {
	var jsonCoords = [];
	
	for (pointKey in coordList) {
		var newPoint = [
			coordList[pointKey].X,
			coordList[pointKey].Y
		]

		jsonCoords.push(newPoint);
	}
	
	return jsonCoords;
}

// (3) public/exported things
var self = module.exports = {
	createGraph:  function(data) {
		//Creazione sottografi
		for(id in data.index) {
			var obj = data.index[id];
			var feature = featureFactory.generateFeature(obj);
			if(feature.in_graph) {
				createSubGraph(data, id);
			}
		}
		//Collegamenti porte-stanze

		for(id in data.index) {
			if(data.index[id].properties.class === 'door') {

				var door = data.index[id];
				var doorNode = door.graph[0];
				if(door.properties.connections === undefined) {
					var connections = data.index[door.properties.parent].properties.connections;

				}
				else {
					var connections = door.properties.connections;
				}

				for (key in connections) {
					var idRoom = connections[key];
					var nearestNode = getNearestNode(doorNode, data.index[idRoom].graph);
					var roomNode = nearestNode.node;
					var distance = nearestNode.distance;
					
					doorNode.properties.adj[roomNode.id] = distance;
					roomNode.properties.adj[doorNode.id] = distance;
				}
			}
		}

		//Collegamenti furnitures-stanze
		for(id in data.index) {
			if(data.index[id].type === 'furnitures') {
				var furniture = data.index[id];
				var furnitureNode = furniture.graph[0];
				var nearestNode = getNearestNode(furnitureNode, utilities.getRoom(furniture).graph);
				furnitureNode.properties.adj[nearestNode.node.id] = nearestNode.distance;
				nearestNode.node.properties.adj[furnitureNode.id] = nearestNode.distance;
			}
		}	
		assembleGraph(data);
	}
} //close module.exports
