var C3D = {};

C3D.handlers = {};

C3D.on = function(event, handler) {
    var handlers_list = this.handlers[event];

    if(handlers_list === undefined) {
        handlers_list = this.handlers[event] = [];
    }

    handlers_list.push(handler);
}

C3D.emit = function(event, id) {
    var handlers_list = this.handlers[event];

    if(handlers_list !== undefined) {
        handlers_list.forEach(function (handler) {
            handler(id);
        });
    }
}

C3D.setIndexAndParents = function() {
    var queue = [];
    var feature;
    C3D.index = {};
    C3D.index['building'] = C3D.tree;
    for (var i = 0; i < C3D.tree.children.length; i++) {
        queue.push(C3D.tree.children[i]);
    }
    
    while (queue.length > 0) {
        feature = queue.shift();
		C3D.index[feature.id] = feature;

        for(var i = 0; i < feature.children.length; i++) {
            queue.push(feature.children[i]);
        }
    }
    
    for (id in C3D.index) {
    	var feature = C3D.index[id];
		feature.parent = C3D.index[feature.properties.parent];
	}
}

C3D.init2D = function() {
        
        var container2D = $("#container2D");
        var container2DWidth = container2D.width();
        var container2DHeight = container2D.width()/4*3;
        container2D.css('height', container2DHeight);

		C3D.map2D = L.map('container2D').setView([0, 0], 3);
		$(".leaflet-container").css({"background": C3D.config.style.background.color});
	    window.addEventListener('resize', onWindowResize2D, false);
	
	    function onWindowResize2D() {
	        container2DWidth = container2D.width();
	        container2DHeight = container2D.width()/4*3;
	        container2D.css('height', container2DHeight);
	    }
	    
        C3D.on('selectFeature', function(idObject) {
		    if(C3D.index[idObject].properties.class === 'level') {
		        C3D.map2D.eachLayer(function(layer) { C3D.map2D.removeLayer(layer); });
		        C3D.index[idObject].layer2D.addTo(C3D.map2D);
		    }
		    if(C3D.index[idObject].properties.class !== 'building') 
		        C3D.map2D.fitBounds(C3D.getRoom(C3D.index[idObject]).layer2D.getBounds());

            orderLayer();
        });
        
        
		//Quando si posizionera' sulla mappa 
        // L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
        //     maxZoom: 18,
        //     attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
        //         '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        //         'Imagery © <a href="http://mapbox.com">Mapbox</a>',
        //     id: 'examples.map-i875mjb7'
        // }).addTo(map);

}

/*
    Funzione di inizializzazione three js
*/ 

C3D.init3D = function() {
	
    var container3D = $('#container3D');
    var container3DWidth = container3D.width();
    var container3DHeight = container3D.width()/4*3;
    container3D.css('height', container3DHeight);
    
    var stats = new Stats();
    stats.setMode(0); // 0: fps, 1: ms
    container3D.append(stats.domElement);
   
    var scene = new THREE.Scene();
    C3D.scene3D = scene;
    
    var camera = new THREE.PerspectiveCamera(45, container3DWidth / container3DHeight, 0.1, 1000);
    C3D.camera3D = camera;
    
    camera.position.set(-40,-40,40);
    camera.up = new THREE.Vector3(0,0,1);
    camera.lookAt(scene.position);
	
    var trackballControls = new THREE.TrackballControls(camera, container3D[0]);
    trackballControls.enabled = true;
    var pointerLockControls = { enabled: false };
    
    //var FPenabled = false;
	var objects = [];
    
    var renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(new THREE.Color(C3D.config.style.background.color, 1.0)); 
    renderer.setSize(container3DWidth, container3DHeight);
    renderer.shadowMapEnabled = true;
    container3D.append(renderer.domElement);

    var ambiColor = "#1c1c1c";
    var ambientLight = new THREE.AmbientLight(ambiColor);
    scene.add(ambientLight);
    
    var axisHelper = new THREE.AxisHelper(3);
    scene.add(axisHelper); 
        
    window.addEventListener( 'resize', onWindowResize3D, false );

    function onWindowResize3D() {
        container3DWidth = container3D.width();
        container3DHeight = container3D.width()/4*3;
        container3D.css('height', container3DHeight);
    
        camera.aspect = container3DWidth / container3DHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( container3DWidth, container3DHeight );
    }

    C3D.on('selectFeature', function(idObject) {
	    C3D.index["building"].obj3D.traverse(function(object) {
	        object.visible = false;
	    });
	    
	    C3D.index[idObject].obj3D.traverse(function(object) {
	        object.visible = true;
	    });
	    
	    for(var i in C3D.index) {
	        var elementClass = C3D.index[i].properties.class;
	        if((elementClass === "internal_wall") || (elementClass === "external_wall")) {
	            if($.inArray(idObject, C3D.index[i].properties.connections) !== -1) {
	                C3D.index[i].obj3D.traverse(function(object) { object.visible = true; });
	            }   
	        }
	    } 
    });

	var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
	
	if (havePointerLock) {
	
		var element = container3D[0];
		
		C3D.on('startFPV', function() {
			
            element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
			if (/Firefox/i.test(navigator.userAgent)) {
				var fullscreenchange = function(event) {
					if (document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element) {
						document.removeEventListener('fullscreenchange', fullscreenchange);
						document.removeEventListener('mozfullscreenchange', fullscreenchange);
						element.requestPointerLock();
					}
				}
				document.addEventListener('fullscreenchange', fullscreenchange, false);
				document.addEventListener('mozfullscreenchange', fullscreenchange, false);
				element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;
				element.requestFullscreen();
			} else {
				element.requestPointerLock();
			}
		});
	
		//questo evento viene richiamato ad ogni attivazione/disattivazione del pointerlock, in paricolare il blocco if all'avvio del pointerlock, il blocco else alla disattivazione del pointerlock
		var pointerlockchange = function(event) {
			if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
				camera.position.set(0,0,0);
				pointerLockControls = new THREE.PointerLockControls(camera);
				scene.add(pointerLockControls.getObject());
				trackballControls.enabled = false;
				pointerLockControls.enabled = true;
				$("#pointer").css('display', 'block');
                //camera.up = new THREE.Vector3(0, 1, 0);
                camera.position.set(10, 10, 20)
				pointerLockControls.getObject().position.set(0, 0, 40);
			} else {
				scene.add(camera); //ripristina la camera originaria
				camera.position.set(-40,-40,40);
				camera.lookAt(scene.position);
				scene.remove(pointerLockControls.getObject());
				pointerLockControls.enabled = false;
				trackballControls.enabled = true;
				$("#pointer").css('display', 'none');
				trackballControls.reset();
			}
		}
	
		var pointerlockerror = function(event) {
			alert('PointerLock error');
		}
	
		document.addEventListener('pointerlockchange', pointerlockchange, false);
		document.addEventListener('mozpointerlockchange', pointerlockchange, false);
		document.addEventListener('webkitpointerlockchange', pointerlockchange, false);
		
		document.addEventListener('pointerlockerror', pointerlockerror, false);
		document.addEventListener('mozpointerlockerror', pointerlockerror, false);
		document.addEventListener('webkitpointerlockerror', pointerlockerror, false);
	
		function computePointerLockControls() {
			/*
			// questo serviva nell'esempio per verificare se si stava sopra un cubo
			pointerLockControls.isOnObject(false);
			rayMove.ray.origin.copy(pointerLockControls.getObject().position);
			rayMove.ray.origin.y -= 4;
			var intersections = rayMove.intersectObjects(objects);
			if (intersections.length > 0) {
				var distance = intersections[0].distance;
				if (distance > 0 && distance < 4) {
					pointerLockControls.isOnObject(true);
				}
			}
			*/
			pointerLockControls.update();
		}
	} else {
        alert('Your browser doesn\'t seem to support Pointer Lock API');
    }

	
	
	
	// mouse interaction
	/*
	var projector = new THREE.Projector();
	document.addEventListener('mousedown', onDocumentMouseDown, false);
	function onDocumentMouseDown(event) {
		event.preventDefault();
		if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
			var vector = new THREE.Vector3(0, 0, 0.5);
			projector.unprojectVector(vector, camera);
			var raycaster = new THREE.Raycaster( vector, pointerLockControls.getDirection( new THREE.Vector3(0, 0, 0) ).clone() );
		} else {
			var vector = new THREE.Vector3((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1, 0.5);
			projector.unprojectVector(vector, camera);
			var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
		}
		var intersects = raycaster.intersectObjects(toIntersect);
		if (intersects.length > 0) {
			intersects[0].object.interact && intersects[0].object.interact();
		}
	}
	var toIntersect = [];
	*/


	/*
	// questo serviva nell'esempio per verificare se si stava sopra un cubo
	var rayMove = new THREE.Raycaster();
	rayMove.ray.direction.set(0, 0, -1);
	*/
	
	function render() {
		requestAnimationFrame(render);
		stats.update();
        if (pointerLockControls.enabled) {
			computePointerLockControls();
		}
		if (trackballControls.enabled) {
			trackballControls.update();
		}
		renderer.render(scene, camera);
	}
	render();
}

/*
    Funzione che genera il modello 3D
 */ 

C3D.generate3DModel = function() {
    var queue = [];
    var feature;
    C3D.index["building"].obj3D = new THREE.Object3D();

    for (var i=0; i < C3D.tree.children.length; i++) {
        queue.push(C3D.tree.children[i]);
    }
    
    while (queue.length>0) {
        feature = queue.shift();
        if(feature.properties.class in C3D.generator3D) {
            var el3D = C3D.generator3D[feature.properties.class](feature);
            feature.obj3D = el3D;

            if (feature.properties.rVector !== undefined) {
                var conv = Math.PI/180;
                var rotation = [
                            feature.properties.rVector[0]*conv, 
                            feature.properties.rVector[1]*conv,
                            feature.properties.rVector[2]*conv];
                el3D.rotation.set(rotation[0], rotation[1], rotation[2]);
            }
            if (feature.properties.tVector !== undefined) {
                el3D.position.x += feature.properties.tVector[0];
                el3D.position.y += feature.properties.tVector[1];
                el3D.position.z += feature.properties.tVector[2];
            }
            C3D.index[feature.parent.id].obj3D.add(el3D);
        }
        for(var i=0;i< feature.children.length;i++) {
            queue.push(feature.children[i]);
        }
    }
    C3D.scene3D.add(C3D.index["building"].obj3D);
} // Chiude generate3DModel

/*
    Funzione che genera il modello 2D per Leaflet
*/ 
C3D.generate2DModel = function() {
	for(geoJSONlevel in C3D.geoJSONmap) {
		var layer = L.geoJson(C3D.geoJSONmap[geoJSONlevel], {
																style: styleFunction, 
																pointToLayer: furnitureMarker,
                                                                onEachFeature: onEachFeature
															});
		C3D.index[geoJSONlevel].layer2D = layer;
		var markers = new L.featureGroup();
		markers.addTo(C3D.index[geoJSONlevel].layer2D);
		C3D.index[geoJSONlevel].layer2D.userMarkers = markers;
	}
	
    C3D.index['level_0'].layer2D.addTo(C3D.map2D);

	C3D.map2D.fitBounds(C3D.index['level_0'].layer2D.getBounds());
    orderLayer();	
	
	function styleFunction(feature) {
		return C3D.config.style[feature.properties.class];
	}
	
	function furnitureMarker(feature, latlng) {
		
		if (C3D.config.style[feature.properties.class] !== undefined) {
			var markerIcon = L.AwesomeMarkers.icon(C3D.config.style[feature.properties.class]);
		} else {
			var markerIcon = L.AwesomeMarkers.icon({ icon: "asterisk" });
		}
		return L.marker(latlng, {icon: markerIcon});
	}
	
	function onEachFeature(feature, layer) {
        layer.on({
            //mouseover: highlightFeature,
            //mouseout: resetHighlight,
            click: selectFeature
        });
        C3D.index[feature.id].layer2D = layer;
    }

    function selectFeature(e) {
        C3D.emit('selectFeature', e.target.feature.id);
    }
}	// Chiude generate2DModel

function getActualLevelId() {
    var id;
    for(idLayer in C3D.map2D._layers){
        layer = C3D.map2D._layers[idLayer];
        if(layer.feature !== undefined) {
            if(layer.feature.properties.class === 'level') { 
	            id = layer.feature.id; 
	        }
        }
    }   
    return id;
}

function orderLayer() {
    var orderClass = ['room','external_wall','internal_wall','door'];
    while(orderClass.length !== 0) {
        var classElement = orderClass.shift();
        for(idLayer in C3D.map2D._layers) {
            layer = C3D.map2D._layers[idLayer];
            if(layer.feature !== undefined) {
                if(layer.feature.properties.class === classElement) {
                    layer.bringToFront();
                }
            }     
        }
    }
}

C3D.generator3D = {};

C3D.generator3D['server'] = function (feature) {
    if(feature.properties.dimensions === undefined) { var dimensions = [1,1,2]; }
    else { var dimensions = feature.properties.dimensions; }
    
    var geometry = new THREE.BoxGeometry(dimensions[0], dimensions[1], dimensions[2]);
    var material = new THREE.MeshLambertMaterial( {color: 0x008080} );
    var server = new THREE.Mesh(geometry, material);
    server.position.z += dimensions[2]/2;
    return server;
};

C3D.generator3D['surveillanceCamera'] = function(feature) {
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
    var surveillanceCamera = new THREE.Object3D();
    surveillanceCamera.add(model);
    return surveillanceCamera;
}

C3D.generator3D['hotspot'] = function(feature) {
    var width = 0.1;
    var depth = 0.2;
    var height = 0.3;
    var geometry = new THREE.BoxGeometry(width, depth, height);
    var material = new THREE.MeshLambertMaterial( {color: 0x0000ff});
    
    var model = new THREE.Mesh( geometry, material );
    model.position.z = model.position.z + levelHeight - height/2;
    
    var hotspot = new THREE.Object3D();
    hotspot.add(model);
    return hotspot;
};

C3D.generator3D['light'] = function(feature) {
    var target = new THREE.Object3D();
    target.position.set(feature.properties.tVector[0], feature.properties.tVector[1],0);
    // var geometry = new THREE.BoxGeometry( 1, 1, 1 );
    // var material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
    // var cube = new THREE.Mesh( geometry, material );
    // target.add( cube );
    function createLight() {
        var spotLight = new THREE.SpotLight(0x404040);

        spotLight.castShadow = true; 
        spotLight.shadowMapWidth = 1024; 
        spotLight.shadowMapHeight = 1024; 
        spotLight.shadowCameraNear = 500; 
        spotLight.shadowCameraFar = 4000; 
        spotLight.shadowCameraFov = 30; 
        spotLight.target = target;
        //eventuali parametri di configurazione
        return spotLight;
    }
    
    function createNeon() {
        var radiusNeon = 0.01;
        var heightNeon = 0.4;
        var geometry = new THREE.CylinderGeometry( radiusNeon, radiusNeon, heightNeon, 32 );
        var material = new THREE.MeshBasicMaterial( {color: 0xffffff} );
        var neon = new THREE.Mesh( geometry, material );
        neon.add(createLight());
        return neon;
    }

    function createNeonGroup() {
        var groupNeon = new THREE.Object3D();
        var singleNeon;
        var light;
        for(var i = 0; i < 4; i++) {
            singleNeon = createNeon();
            singleNeon.position.x += 0.1*i;
            groupNeon.add(singleNeon);
        }
        groupNeon.position.x -= 0.15;
        return groupNeon;        
    }

    function createStructure() {
        var height = 0.05;
        var width = 0.4;
        var externalCubeGeometry = new THREE.BoxGeometry(0.4,0.4,0.05);
        var externalCubeMaterial = new THREE.MeshLambertMaterial({
                                                                    color:0xE7E6DD,
                                                                    transparent: true, 
                                                                    opacity: 0.1, 
                                                                    side: THREE.DoubleSide
                                                                });
        var externalCube = new THREE.Mesh(externalCubeGeometry, externalCubeMaterial);

        externalCube.position.x += width/2;
        externalCube.position.y += width/2;
        externalCube.position.z += height/2;
        return externalCube;
    }

    function createModel() {
        var lightBox = createStructure();
        lightBox.add(createNeonGroup()); 
        return lightBox;       
    }

    var model = createModel();

    return model;
}


C3D.generator3D['antenna'] = function(feature) {
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

function generateLineString(geoJSONgeometry) {
	var lineString = new THREE.Geometry();
    for(var i = 0; i < geoJSONgeometry.coordinates.length; i++){
        lineString.vertices.push( new THREE.Vector3( geoJSONgeometry.coordinates[i][0], geoJSONgeometry.coordinates[i][1], 0) );
    }
    return lineString;
}

function generatePolygon(geoJSONgeometry) {
	var coords = geoJSONgeometry.coordinates;
	var shape = new THREE.Shape();
    for (var j = 0; j < coords[0].length; j++) //scorro le singole coordinate del perimetro esterno
    { 
        if (j == 0) { // primo punto
            shape.moveTo(coords[0][j][0], coords[0][j][1]);
        } else { // altri punti
            shape.lineTo(coords[0][j][0], coords[0][j][1]);
        }
    }
    for (var i = 1; i < coords.length; i++) { //scorro eventuali holes
        var hole = new THREE.Path();
        for (var j = 0; j < coords[i].length; j++) { //scorro le singole coordinate dei vari perimetri
            if (j == 0) { // primo punto
                hole.moveTo(coords[i][j][0], coords[i][j][1]);
            } else { // altri punti
                hole.lineTo(coords[i][j][0], coords[i][j][1]);
            }  
        }
        shape.holes.push(hole);
    }
    return shape.makeGeometry();  
}

function generateWallGeometry(wallFeature) {
	var wallLength = wallFeature.geometry.coordinates[1][0];
	var wallHeight = wallFeature.parent.properties.height;
	var coordinates = [
		[ [0, 0], [wallLength, 0], [wallLength, wallHeight], [0, wallHeight] ]
	];
	for (var i = 0; i < wallFeature.children.length; i++) {
		var child = wallFeature.children[i];
		if (child.properties.class === 'door') {
			var doorLength = child.geometry.coordinates[1][0];
//			var doorHeight = child.properties.height;
			var doorHeight = 2;
			var doorShift = child.properties.tVector[0];
			var hole = [
				[doorShift,0], [doorShift+doorLength, 0], [doorShift+doorLength, doorHeight], [doorShift, doorHeight]	
			];
			coordinates.push(hole);
		}
	}
	return { coordinates: coordinates }
}

C3D.generator3D['external_wall'] = function(feature) {
    var material = new THREE.LineBasicMaterial({ 
    	color: C3D.config.style.external_wall.color, 
        side: THREE.DoubleSide
	});
	
	var geometry = generatePolygon(generateWallGeometry(feature));
	var wall = new THREE.Mesh(geometry, material);
	
	var container = new THREE.Object3D();
	container.add(wall);
	wall.rotation.x += Math.PI/2;
	return container;	
}

C3D.generator3D['internal_wall'] = function(feature) {
    var material = new THREE.LineBasicMaterial({ 
        color: C3D.config.style.internal_wall.color, 
        side: THREE.DoubleSide
    });
    
	var geometry = generatePolygon(generateWallGeometry(feature));
	var wall = new THREE.Mesh(geometry, material);
	
	var container = new THREE.Object3D();
	container.add(wall);
	wall.rotation.x += Math.PI/2;
	return container;
}

C3D.generator3D['door'] = function(feature) {
    var material = new THREE.LineBasicMaterial({ 
        color: C3D.config.style.door.color, 
        linewidth: feature.properties.thickness 
    });
	return new THREE.Line(generateLineString(feature.geometry), material);
}

C3D.generator3D['level'] = function(feature) {
    var material = new THREE.LineBasicMaterial({ 
        color:C3D.config.style.level.color, 
        linewidth: feature.properties.thickness 
    });
	return new THREE.Line(generateLineString(feature.geometry), material);
}

C3D.generator3D['room'] = function(feature) {
    var material = new THREE.MeshBasicMaterial({
        color: C3D.config.style.room.fillColor,
        transparent: true, 
        opacity: 0.9, 
        side: THREE.DoubleSide
    });
    
    return new THREE.Mesh(generatePolygon(feature.geometry), material);
}

C3D.getRoom = function(obj) {
    var ancestor = obj;
    if(obj.properties.class !== 'building' && obj.properties.class !== 'level') {
        console.log(ancestor);
        while(ancestor.properties.class !== 'room') {
            ancestor = ancestor.parent;
        }
    }
    return ancestor;
}