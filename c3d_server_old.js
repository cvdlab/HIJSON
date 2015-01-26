var fs = require('fs');
require('numeric');
var poly2tri = require('poly2tri');

var C3D = {
    input: {
	    config: 'json_input/config.json',
	    architecture: 'json_input/architecture_demo.json',
	    furnitures: 'json_input/furnitures_demo.json'
    },
    graph: {}
}

/*
    Funzione che genera albero ed indice a partire dai file json
 */ 

C3D.createSoJSON = function() {
    var data = JSON.parse(fs.readFileSync('json_input/raw_sogei.json', 'utf8'));
    
    var result = {
    	id: 'architectures',
    	type: 'FeatureCollection',
    	features: [] 
    };
    for(var i in data)
    {
	    var level = {
	    	type: 'Feature',
	    	id: data[i].id,
	    	geometry: {
	    		type: 'Polygon',
	    		coordinates: [
	    			[ [0, 0], [20,0], [20,10], [0,10], [0,0] ]
	    		]
	    	},
	    	properties: {
	    		class: 'level',
	    		parent: 'building',
	    		rVector: data[i].rVector,
	    		tVector: data[i].tVector
	    	}
	    }

	    result.features.push(level);
	    
	    for(var j in data[i].children) {
		    var feature = {
		    	type: 'Feature',
		    	id: data[i].id +'.' + j,
		    	geometry: {
		    		type: 'Polygon',
		    		coordinates: data[i].children[j].coordinates
		    	},
		    	properties: {
		    		class: 'room',
		    		parent: data[i].id,
		    		rVector: data[i].children[j].rVector,
		    		tVector: data[i].children[j].tVector
		    	}
		    };

		   	result.features.push(feature);
	    
	    }
	}
	fs.writeFileSync('json_input/architecture_sogei.json', JSON.stringify(result));
}

C3D.parseJSON = function() {
	
	C3D.tree = {
        id: 'building',
        properties: {
	        class: 'building'
        },
        children: []
    };
    
    C3D.index = {};
    
    C3D.index['building'] = C3D.tree;
	
	console.log('Starting C3D initialization...');
    for (input_name in C3D.input)
    {
	    var data = JSON.parse(fs.readFileSync(C3D.input[input_name], 'utf8'));
	    process.stdout.write('Parsing: '+input_name+'... ');
	    if (input_name === 'config')
	    {
		    C3D.config = data;
		    console.log('Configuration loaded.');
		    C3D.transformationMatrix = computeMatrix(C3D.config.landmarks);
		    C3D.inverseTransformationMatrix = numeric.inv(C3D.transformationMatrix);
		    console.log('Matrix: ' + C3D.transformationMatrix);
		   	console.log('Inverse matrix: ' + C3D.inverseTransformationMatrix);
	    }
	    else
	    {
		    if (data.type == "FeatureCollection") 
			{
            	console.log('FeatureCollection detected for '+input_name+'.');
				for(var i = 0; i < data.features.length; i++)
				{
	                var feature = data.features[i];
	                var obj = {};
	                obj.id = feature.id;
	                obj.type = input_name;
	                obj.parent = C3D.index[feature.properties.parent];
	                C3D.index[feature.properties.parent].children.push(obj);
	                obj.children = [];
	                obj.graph = [];
	                obj.geometry = feature.geometry;
	                obj.properties = feature.properties;
	                C3D.index[feature.id] = obj;

			        var localMatrix = objMatrix(obj);
					var globalMatrix = getCMT(C3D.index[obj.properties.parent]);
					obj.CMT = matrixProduct(globalMatrix, localMatrix);
            	}
        	} 
			else 
			{   
            	console.log('ERROR: No FeatureCollection detected for '+input_name+'.');
        	}
        }
    }
    

    process.stdout.write('Generating subgraphs... ');
    C3D.createGraph();
    console.log('Done.');
    
    process.stdout.write('Generating geoJson layers... ');
    C3D.generateGeoJSON();
    console.log('Done.');

    process.stdout.write('Generating complete graph... ');
    C3D.createMap()
    console.log('Done.');

    // clean for JSON stringify
    for(id in C3D.index) {
    	C3D.index[id].parent = {};
    }
    C3D.index = {};
    
    console.log('C3D initialization complete.');
}

C3D.generateGeoJSON = function() {

	var geoJSONmap = {};
    var includedArchitectureClasses = ['level', 'room', 'door', 'internal_wall', 'external_wall'];
    var includedFurtituresClasses = ['server', 'surveillanceCamera','fireExtinguisher','hotspot','antenna','badgeReader', 'server_polygon'];
	var includedClasses = includedArchitectureClasses.concat(includedFurtituresClasses);
	
	if (C3D.config.showGraph) {
		includedClasses.push('graphNode');
	
	}
    var queue = [];
    var obj;

	var newObj = {};
	
    for(var i = 0; i < C3D.tree.children.length; i++) {
        queue.push(C3D.tree.children[i]);
    }
    
    while(queue.length > 0) {
        obj = queue.shift();
        

        if(includedClasses.indexOf(obj.properties.class) > -1)
        {
			var level = getLevel(obj);
			
			// create the feature collection for the level if not exists	
			if(!(level in geoJSONmap)) {
				geoJSONmap[level] = {
					type: "FeatureCollection",
					features: []
				}
			}
			
			var newObj = {};
			newObj.type = "Feature";
			newObj.id = obj.id;
			newObj.geometry = {
				type: obj.geometry.type,
				coordinates: absoluteCoords(obj)
			};
			newObj.properties = {
				class: obj.properties.class
			};
			geoJSONmap[level].features.push(newObj);
			
			// add representation of graph arcs
			if (C3D.config.showGraph && obj.properties.class === 'graphNode') {
				var k = 0;
				for (node in obj.properties.adj) {
					var adiacent = C3D.index[node];
					var newObj = {};
					
					newObj.type = "Feature";
					newObj.id = obj.id + "_arc_" + k;
					
					newObj.geometry = {
						type: "LineString",
						coordinates: [ 
							getAbsoluteCoords(obj), 
							getAbsoluteCoords(adiacent) 
						]
					};
					
					newObj.properties = {
						class: "graphArc"
					};
					
					geoJSONmap[level].features.push(newObj);
					k++;				
				}
			}
		}
		
		for(var i = 0; i < obj.children.length; i++) {
            queue.push(obj.children[i]);
        }
	}
	
	// put the map in real-world coordinates
	C3D.geoJSONmap = convertToDegrees(geoJSONmap);
}

function getCMT(obj) {
	if (obj.CMT !== undefined) {
		return obj.CMT;
	} else {
		return [
			[1,0,0],
			[0,1,0],
			[0,0,1]			
		];
	}
}

function translationMatrix(x,y) {
	return [
		[ 1, 0, x ],
		[ 0, 1, y ],
		[ 0, 0, 1 ]
	]
}

function rotationMatrix(grades) {
	var radiants = grades * Math.PI/180;
	return [
		[Math.cos(radiants), -Math.sin(radiants), 0],
		[Math.sin(radiants), Math.cos(radiants), 0],
		[0, 0, 1]
	]
}

function matrixProduct(a,b) {
/*
	return [
		[ a[0][0]*b[0][0] + a[0][1]*b[1][0] + a[0][2]*b[2][0], a[0][0]*b[0][1] + a[0][1]*b[1][1] + a[0][2]*b[2][1], a[0][0]*b[0][2] + a[0][1]*b[1][2] + a[0][2]*b[2][2] ],
		[ a[1][0]*b[0][0] + a[1][1]*b[1][0] + a[1][2]*b[2][0], a[1][0]*b[0][1] + a[1][1]*b[1][1] + a[1][2]*b[2][1], a[1][0]*b[0][2] + a[1][1]*b[1][2] + a[1][2]*b[2][2] ],
		[ a[2][0]*b[0][0] + a[2][1]*b[1][0] + a[2][2]*b[2][0], a[2][0]*b[0][1] + a[2][1]*b[1][1] + a[2][2]*b[2][1], a[2][0]*b[0][2] + a[2][1]*b[1][2] + a[2][2]*b[2][2] ]
	]
*/
	return numeric.dot(a,b);
}

function applyTransformation(v, m) {
	return [ v[0]*m[0][0] + v[1]*m[0][1] + m[0][2], v[0]*m[1][0] + v[1]*m[1][1] + m[1][2] ];
}

function objMatrix(object) {
	var tX = object.properties.tVector[0];
	var tY = object.properties.tVector[1];
	var rZ = object.properties.rVector[2];
	
	var transMat = translationMatrix(tX, tY);
	var rotMat = rotationMatrix(rZ);
	return matrixProduct(transMat, rotMat);
}

function getLevel(obj) {
	var ancestor = obj;
	while (ancestor.properties.class !== 'level') {
		ancestor = C3D.index[ancestor.properties.parent];
	}
	if (ancestor.properties.class === 'building') {
		return undefined;
	} else {
		return ancestor.id;
	}
}

function absoluteCoords(obj) {
	
	var matrix = getCMT(obj);
	switch (obj.geometry.type) {
        case "Point":
            return applyTransformation(obj.geometry.coordinates, matrix);
            break;
        case "LineString": 
        	var newCoords = [];
        	oldCoords = obj.geometry.coordinates;
        	for (var i = 0; i < oldCoords.length; i++)
        	{
        		var newCouple = applyTransformation(oldCoords[i], matrix);
	        	newCoords.push(newCouple);
        	}
            return newCoords;
            break;
        case "Polygon":
        	var newCoords = [];
        	oldCoords = obj.geometry.coordinates;
        	for (var i = 0; i < oldCoords.length; i++)
        	{
	        	var newPerimeter = [];
	        	for (var j = 0; j < oldCoords[i].length; j++)
	        	{
		        	var newCouple = applyTransformation(oldCoords[i][j], matrix);
	        		newPerimeter.push(newCouple);
	        	}
	        	newCoords.push(newPerimeter);
	        }
            return newCoords;
            break;
        default:
        	return undefined;
        	break;
    }
}

function fromXYToLngLat(coordinates) {
	return applyTransformation(coordinates, C3D.transformationMatrix);
}

function convertToDegrees(geoJSONmap) {
	for(level in geoJSONmap) {
		geoJSONobject = geoJSONmap[level];
		for(feature in geoJSONobject.features) {
			var object = geoJSONobject.features[feature];
			switch (object.geometry.type) {
		        case "Point":
		            object.geometry.coordinates = fromXYToLngLat(object.geometry.coordinates);
		            break;
		        case "LineString": 
		        	var coords = object.geometry.coordinates;
		        	for (var i = 0; i < coords.length; i++)
		        	{
			        	coords[i] = fromXYToLngLat(coords[i]);
		        	}
		            break;
		        case "Polygon":
		        	var coords = object.geometry.coordinates;
		        	for (var i = 0; i < coords.length; i++)
		        	{
			        	for (var j = 0; j < coords[i].length; j++)
			        	{
			        		coords[i][j] = fromXYToLngLat(coords[i][j]);
						}
			        }
		            break;
		        default:
		        	return undefined;
		        	break;
    		}
		}
	}
	return geoJSONmap;	
}


C3D.createMap = function() {
	var map = {};
	for(id in C3D.index) {
		for(idNode in C3D.index[id].graph) {
			map[C3D.index[id].graph[idNode].id] = C3D.index[id].graph[idNode].properties.adj;
		}
	}
	C3D.graph = map;
}

C3D.createGraph = function () {
	//Creazione sottografi
	for(id in C3D.index) {
		if(C3D.index[id].properties.class === 'door' || C3D.index[id].properties.class === 'room' || C3D.index[id].type === 'furnitures') {
			createSubGraph_noCentroids(C3D.index[id]);
		}
	}

	//Collegamenti porte-stanze

	for(id in C3D.index) {
		if(C3D.index[id].properties.class === 'door') {
			var door = C3D.index[id];
			var doorNode = door.graph[0];
			if(door.properties.connections === undefined) {
				var connections = C3D.index[door.properties.parent].properties.connections;
			}
			else {
				var connections = door.properties.connections;
			}

			for (key in connections) {
				var idRoom = connections[key];
				var nearestNode = getNearestNode(doorNode, C3D.index[idRoom].graph);
				var roomNode = nearestNode.node;
				var distance = nearestNode.distance;
				
				doorNode.properties.adj[roomNode.id] = distance;
				roomNode.properties.adj[doorNode.id] = distance;
			}
		}
	}

	//Collegamenti furnitures-stanze
	for(id in C3D.index) {
		if(C3D.index[id].type === 'furnitures') {
			var furniture = C3D.index[id];
			var furnitureNode = furniture.graph[0];
			var nearestNode = getNearestNode(furnitureNode, getRoom(furniture).graph);
			furnitureNode.properties.adj[nearestNode.node.id] = nearestNode.distance;
			nearestNode.node.properties.adj[furnitureNode.id] = nearestNode.distance;
		}
	}
}

function createSubGraph(object) {
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
        var localMatrix = objMatrix(graphNode);
		var globalMatrix = getCMT(C3D.index[graphNode.properties.parent]);
		graphNode.CMT = matrixProduct(globalMatrix, localMatrix);

		object.children.push(graphNode);
		object.graph.push(graphNode);
		C3D.index[graphNode.id] = graphNode;
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
			var v0 = {
				x: triangle.points_[0].x,
				y: triangle.points_[0].y
			}

			var v1 = {
				x: triangle.points_[1].x,
				y: triangle.points_[1].y
			}

			var v2 = {
				x: triangle.points_[2].x,
				y: triangle.points_[2].y
			}

			var centroid = createNode(calcuteTriangleMidPoint(v0, v1, v2), object.id, tri)
			bucket.buckets[idTriangle].centroid = centroid;
	        
	        var localMatrix = objMatrix(centroid);
			var globalMatrix = getCMT(C3D.index[centroid.properties.parent]);
			centroid.CMT = matrixProduct(globalMatrix, localMatrix);

			bucket.main.push(bucket.buckets[idTriangle].centroid);
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
						var localMatrix = objMatrix(graphNode);
						var globalMatrix = getCMT(C3D.index[graphNode.properties.parent]);
						graphNode.CMT = matrixProduct(globalMatrix, localMatrix);
						
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

/*
		//Collegamento tra punti medi 
		for(id in bucket.buckets) {
			var smallBucket = bucket.buckets[id];
			if(smallBucket.length >= 2){
				connectNodes(smallBucket,bucket.main);
			}
		}
*/
		
		//Collegamento tra centroidi e punti medi
		for(id in bucket.buckets) {
			var smallBucket = bucket.buckets[id];
			connectCentroid(smallBucket);
		}		

		//Aggiunta dei nodi all'oggetto (sottografo)
		for(node in bucket.main) {
			var graphNode = bucket.main[node];

			graphNode.parent = C3D.index[graphNode.properties.parent];
			object.children.push(graphNode);
			object.graph.push(graphNode);
			C3D.index[graphNode.id] = graphNode;
		}
	}
}

function createSubGraph_noCentroids(object) {
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
        var localMatrix = objMatrix(graphNode);
		var globalMatrix = getCMT(C3D.index[graphNode.properties.parent]);
		graphNode.CMT = matrixProduct(globalMatrix, localMatrix);

		object.children.push(graphNode);
		object.graph.push(graphNode);
		C3D.index[graphNode.id] = graphNode;
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
						var localMatrix = objMatrix(graphNode);
						var globalMatrix = getCMT(C3D.index[graphNode.properties.parent]);
						graphNode.CMT = matrixProduct(globalMatrix, localMatrix);
						
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
				//connectNodes(smallBucket,bucket.main);
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

			graphNode.parent = C3D.index[graphNode.properties.parent];
			object.children.push(graphNode);
			object.graph.push(graphNode);
			C3D.index[graphNode.id] = graphNode;
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
		var localMatrix = objMatrix(node);
		var globalMatrix = getCMT(C3D.index[node.properties.parent]);
		var nodeCMT = matrixProduct(globalMatrix, localMatrix);
		node.CMT = nodeCMT;
		
		node.parent = C3D.index[node.properties.parent];
		object.children.push(node);
		object.graph.push(node);
		C3D.index[node.id] = node;
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
}

function connectCentroid(bucket) {
	var centroid = bucket.centroid;
	for(idNode in bucket.mid) {
		var node = bucket.mid[idNode];
		var distance = distanceBetweenTwoNodes(centroid, node);
		node.properties.adj[centroid.id] = distance;
		centroid.properties.adj[node.id] = distance;	
	}
}

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
}

function calcuteTriangleMidPoint(point0, point1, point2) {
		return [((point0.x + point1.x + point2.x)/3), ((point0.y + point1.y + point2.y)/3),0 ]
}

function getNode(tVect, mainBucket) {
	for(idNode in mainBucket) {
		var bucketNode = mainBucket[idNode];
		if(tVect[0] === bucketNode.properties.tVector[0] && tVect[1] === bucketNode.properties.tVector[1]) {
			return bucketNode;			
		}
	}
	console.log('Error');
}

function connectNodes(smallBucket, mainBucket) {
	var node_0 = smallBucket[0];
	var node_1 = smallBucket[1];
	for(idNode in mainBucket) {
		var node = mainBucket[idNode];
		if(node_0.properties.tVector[0] === node.properties.tVector[0] && node_0.properties.tVector[1] === node.properties.tVector[1]) {
			node.properties.adj[node_1.id] = distanceBetweenTwoNodes(node_0, node_1);				
		}
		if(node_1.properties.tVector[0] === node.properties.tVector[0] && node_1.properties.tVector[1] === node.properties.tVector[1]) {
			node.properties.adj[node_0.id] = distanceBetweenTwoNodes(node_0, node_1);				
		}
	}
}

function distanceBetweenTwoNodes(node_0, node_1) {
	return distanceBetweenTwoPoints(getAbsoluteCoords(node_0), getAbsoluteCoords(node_1));
}

function distanceBetweenTwoPoints(point_0, point_1) {
	return Math.sqrt( 
		Math.pow( (point_1[0] - point_0[0]), 2) 
		+ 
		Math.pow( (point_1[1] - point_0[1]), 2)
	);	
}


function nodeInBucket(tVect, bucket) {
	var bool = false;
	
	for(node in bucket.main) {
		var graphNode = bucket.main[node];
		if(tVect[0] === graphNode.properties.tVector[0] && tVect[1] === graphNode.properties.tVector[1] ) {
			bool = true;
		}
	}
	return bool;
}

function getMidPoint(point1, point2) {
	return [((point1.x + point2.x)/2), ((point1.y + point2.y)/2)]
}

function getTriangles(object) {
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
}

function computeMatrix(landmarks) {
	var x1 = landmarks[0].local[0];
	var y1 = landmarks[0].local[1];
	var x2 = landmarks[1].local[0];
	var y2 = landmarks[1].local[1];
	var x3 = landmarks[2].local[0];
	var y3 = landmarks[2].local[1];
	var X1 = landmarks[0].lnglat[0];
	var Y1 = landmarks[0].lnglat[1];
	var X2 = landmarks[1].lnglat[0];
	var Y2 = landmarks[1].lnglat[1];
	var X3 = landmarks[2].lnglat[0];
	var Y3 = landmarks[2].lnglat[1];

	var matrixA = 
	[
		[x1,	y1,		0,		0,		1,		0],
		[0,		0,		x1,		y1,		0,		1],
		[x2, 	y2,		0,		0,		1,		0],
		[0,		0,		x2,		y2,		0,		1],
		[x3,	y3,		0,		0,		1,		0],
		[0,		0,		x3,		y3,		0,		1]
	];

	var vectorB =
	[
		X1, Y1, X2, Y2, X3, Y3
	];

	var sol = numeric.solve(matrixA, vectorB);
	var transformationMatrix =
	[
		[sol[0],	sol[1],		sol[4]],
		[sol[2],	sol[3],		sol[5]],
		[0,			0,			1]
	];

	return transformationMatrix;
}

function getAbsoluteCoords(object) {
    return applyTransformation([0, 0], object.CMT);
}

function getRoom(obj) {
    var ancestor = obj;
    if(obj.properties.class !== 'building' && obj.properties.class !== 'level') {
        while(ancestor.properties.class !== 'room') {
            ancestor = ancestor.parent;
        }
    }
    return ancestor;
}

//C3D.createSoJSON();
C3D.parseJSON();
module.exports = C3D;