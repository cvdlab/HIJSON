var poly2tri = require('poly2tri');
var mU = require('./matrixUtilities.js');
var cU = require('./coordinatesUtilities.js');

var createSubGraph = function(data, id) {
	var object = data.index[id];
	console.log(object.id);
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
        var localMatrix = mU.objMatrix(graphNode);
		var globalMatrix = mU.getCMT(data.index[graphNode.properties.parent]);
		graphNode.CMT = mU.matrixProduct(globalMatrix, localMatrix);

		object.children.push(graphNode);
		graphNode.parent = object;
		object.graph.push(graphNode);
		data.index[graphNode.id] = graphNode;
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
						var localMatrix = mU.objMatrix(graphNode);
						var globalMatrix = mU.getCMT(data.index[graphNode.properties.parent]);
						graphNode.CMT = mU.matrixProduct(globalMatrix, localMatrix);
						
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

	if(object.type === 'furnitures') {
		var node;
		if(object.geometry.type === 'Point') {
			node = createNode([0, 0, 0], object.id, 'subNode');

		}
		if(object.geometry.type === 'Polygon') {
			node = createNode(object.properties.nodeTVector, object.id, 'subNode');
		}
		var localMatrix = mU.objMatrix(node);
		var globalMatrix = mU.getCMT(data.index[node.properties.parent]);
		var nodeCMT = mU.matrixProduct(globalMatrix, localMatrix);
		node.CMT = nodeCMT;
		
		node.parent = C3D.index[node.properties.parent];
		object.children.push(node);
		object.graph.push(node);
		C3D.index[node.id] = node;
	}
};

var getTriangles = function(object) {
	if (object.geometry.type === 'Polygon') {
		var coords = object.geometry.coordinates;
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
	    
	    for (k in object.children) {
		    var child = object.children[k];
		    if (child.geometry.type === 'Polygon') {
			    var perimeter = child.geometry.coordinates[0];
			    var tVector = child.properties.tVector;
		        var hole = [];
		        for (j in perimeter) { //scorro le singole coordinate dei vari perimetri
					hole.push(new poly2tri.Point(perimeter[j][0] + tVector[0], perimeter[j][1] + tVector[1]));
		        }
		        swctx.addHole(hole);
		    }
	    }
		
		swctx.triangulate();
		var triangles = swctx.getTriangles();
	
		return triangles;
	} else {
		console.log('error, you can triangulate only polygons');
	}
};


var getNearestNode = function(sourceNode, graphRoom) {
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


var createNode = function(tVector, objectId, triangleId) {
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


var getNode = function(tVect, mainBucket) {
	for(idNode in mainBucket) {
		var bucketNode = mainBucket[idNode];
		if(tVect[0] === bucketNode.properties.tVector[0] && tVect[1] === bucketNode.properties.tVector[1]) {
			return bucketNode;			
		}
	}
	console.log('Error');
};

var distanceBetweenTwoNodes = function(node_0, node_1) {
	return distanceBetweenTwoPoints(cU.getPointAbsoluteCoords(node_0), cU.getPointAbsoluteCoords(node_1));
};

var distanceBetweenTwoPoints = function(point_0, point_1) {
	return Math.sqrt( 
		Math.pow( (point_1[0] - point_0[0]), 2) 
		+ 
		Math.pow( (point_1[1] - point_0[1]), 2)
	);	
};


var nodeInBucket = function(tVect, bucket) {
	var bool = false;
	
	for(node in bucket.main) {
		var graphNode = bucket.main[node];
		if(tVect[0] === graphNode.properties.tVector[0] && tVect[1] === graphNode.properties.tVector[1] ) {
			bool = true;
		}
	}
	return bool;
};

var getMidPoint = function(point1, point2) {
	return [((point1.x + point2.x)/2), ((point1.y + point2.y)/2)]
};
var assembleGraph = function(data) {
	var map = {};
	for(id in data.index) {
		for(idNode in data.index[id].graph) {
			map[data.index[id].graph[idNode].id] = data.index[id].graph[idNode].properties.adj;
		}
	}
	data.graph = map;
};

module.exports = {
	createGraph: function createGraph(data) {
		//Creazione sottografi
		for(id in data.index) {
			if(data.index[id].properties.class === 'door' || data.index[id].properties.class === 'room' || data.index[id].type === 'furnitures') {
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
				var nearestNode = getNearestNode(furnitureNode, getRoom(furniture).graph);
				furnitureNode.properties.adj[nearestNode.node.id] = nearestNode.distance;
				nearestNode.node.properties.adj[furnitureNode.id] = nearestNode.distance;
			}
		}	
		assembleGraph(data);
	}

}