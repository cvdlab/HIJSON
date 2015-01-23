var C3D = C3D || {};

C3D.obstaclesClasses = ['room', 'internal_wall', 'external_wall'];
C3D.interactiveClasses = ['server', 'surveillanceCamera', 'hotspot', 'antenna', 'fireExtinguisher', 'badgeReader', 'light'];

C3D.interactiveFeatures = [];
C3D.obstaclesFeatures = [];
var graphManager = new Graph(C3D.graph);

C3D.actualPosition = {
    coordinates: [C3D.config.startPosition.coordinates[0], C3D.config.startPosition.coordinates[1]],
    levelId: C3D.config.startPosition.levelId  
}
/*
    Generazione dell'indice e settaggio dei parent agli elementi.
*/
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

C3D.createTree = function(){
    C3D.tree = {
        id: 'building',
        properties: {
            class: 'building'
        },
        children: []
    };

    for(id in C3D.index) {
        if(id !== 'building') {
            var child = C3D.index[id];
            var parent = C3D.index[child.properties.parent];
            child.parent = parent;
            parent.children.push(child);
        }
    }
}

C3D.createTree();
C3D.setIndexAndParents();

C3D.handlers = {};
C3D.generator3D = {};

/*
    Funzioni per gestire gli eventi secondo il pattern GoF Observer
*/
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



/*
    Inizializzazione 2D    
*/
C3D.init2D = function() {
        
        C3D.index['building'].layer2D = L.layerGroup();
        
        var container2D = $("#container2D");
        var container2DWidth = container2D.width();
        var container2DHeight = container2D.width()/4*3;
        container2D.css('height', container2DHeight);

		C3D.map2D = L.map('container2D').setView([0, 0], 3);
		$(".leaflet-container").css({"background": C3D.config.style.background.color});
        $(".leaflet-control-attribution").css({"visibility": "hidden"});
	    window.addEventListener('resize', onWindowResize2D, false);
	
	    function onWindowResize2D() {
	        container2DWidth = container2D.width();
	        container2DHeight = container2D.width()/4*3;
	        container2D.css('height', container2DHeight);
	    }
	    
        C3D.on('selectFeature', function(idObject) {
		    if(C3D.index[idObject].properties.class === 'level' || C3D.index[idObject].properties.class === 'building') {
                C3D.map2D.removeLayer(C3D.index[C3D.actualPosition.levelId].layer2D); 
                C3D.index[idObject].layer2D.addTo(C3D.map2D);
		    }

		    if(C3D.index[idObject].properties.class !== 'building') 
		        C3D.map2D.fitBounds(utilities.getRoom(C3D.index[idObject]).layer2D.getBounds());

            C3D.orderLayer();
        });
        
        
        L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
            maxZoom: 50, //A quanto fissarlo?
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
                '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
                'Imagery © <a href="http://mapbox.com">Mapbox</a>',
            id: 'examples.map-i875mjb7'
        }).addTo(C3D.map2D);

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
    //container3D.append(stats.domElement);
   
    var scene = new THREE.Scene();
    C3D.scene3D = scene;
    
    var camera = new THREE.PerspectiveCamera(45, container3DWidth / container3DHeight, 0.1, 1000);
    C3D.camera3D = camera;
    
    camera.position.set(40,50,40);
    camera.up = new THREE.Vector3(0,1,0);
    camera.lookAt(scene.position);
	
    var trackballControls = new THREE.TrackballControls(camera, container3D[0]);
    trackballControls.enabled = true;
    var pointerLockControls = { enabled: false };
    
    //var FPenabled = false;
	var objects = [];
    
    var renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setClearColor(new THREE.Color(C3D.config.style.background.color, 1.0)); 
    renderer.setSize(container3DWidth, container3DHeight);
    renderer.shadowMapEnabled = false;
    container3D.append(renderer.domElement);

    var ambiColor = "#1c1c1c";
    var ambientLight = new THREE.AmbientLight(ambiColor);
    scene.add(ambientLight);
    
    var spotLight = new THREE.SpotLight(0xFFFFFF);
    spotLight.position.set(-40,50,-50);
    scene.add( spotLight );
    
    var spotLight2 = new THREE.SpotLight(0xFFFFFF);
    spotLight2.position.set(50,50,60);
    scene.add( spotLight2 );

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
        utilities.show3DObject(C3D.index["building"].obj3D, false);
        utilities.show3DObject(C3D.index[idObject].obj3D, true);
	    
	    for(var i in C3D.index) {
	        var elementClass = C3D.index[i].properties.class;
	        if((elementClass === "internal_wall") || (elementClass === "external_wall")) {
	            if($.inArray(idObject, C3D.index[i].properties.connections) !== -1) {
	                utilities.show3DObject(C3D.index[i].obj3D, true);
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
				utilities.show3DObject(C3D.index["building"].obj3D, true);
                //C3D.index['building'].obj3D.rotation.x = -Math.PI/2;
				pointerLockControls = new THREE.PointerLockControls(camera, {
                    cameraHeight: 1.7,
                    jumpEnabled: false,
                    collisionsEnabled: true,
                    horizontalRadius: 0.5,
                    overHead: 0,
                    stepHeight: 0.1,
                    obstaclesArray: C3D.obstaclesFeatures
                });
                
                scene.add(pointerLockControls.getObject());
				trackballControls.enabled = false;
				pointerLockControls.enabled = true;
				$("#pointer").css('display', 'block');
                //camera.up = new THREE.Vector3(0, 1, 0);
                camera.position.set(0, 0, 0);
				pointerLockControls.getObject().position = coordinatesUtilities.fromGeneralTo3DScene(C3D.actualPosition);
				pointerLockControls.getObject().position.y += 1.7;
			} else {
                var actualLevel = C3D.actualPosition.levelId;
                C3D.emit('selectFeature', actualLevel);
                //C3D.index['building'].obj3D.rotation.x = 0;
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
	} 
    else {
        alert('Your browser doesn\'t seem to support Pointer Lock API');
    }

	
	
	
	// mouse interaction
	
	var projector = new THREE.Projector();
	document.getElementById('container3D').addEventListener('mousedown', onDocumentMouseDown, false);
	
    function onDocumentMouseDown(event) {
    		var container3D = $('#container3D');
            var container3DWidth = container3D.width();
            var container3DHeight = container3D.width()/4*3;
            event.preventDefault();
    		if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
    			console.log('clickPL');
                var raycaster = new THREE.Raycaster();
                var direction = new THREE.Vector3( 0, 0, -1 );
                var rotation = new THREE.Euler(0, 0, 0, "YXZ");

                rotation.set(C3D.camera3D.parent.rotation.x, C3D.camera3D.parent.parent.rotation.y, 0);
                raycaster.ray.direction.copy(direction).applyEuler(rotation);
                raycaster.ray.origin.copy(C3D.camera3D.parent.parent.position);
                
       //          var vector = new THREE.Vector3(0, 0, 0.5);
    			// projector.unprojectVector(vector, C3D.camera3D);
    			// var raycaster = new THREE.Raycaster( vector, pointerLockControls.getDirection( new THREE.Vector3(0, 0, 0) ).clone() );
    		} else {
                console.log('clickTB');
    			var vector = new THREE.Vector3((event.clientX / container3DWidth) * 2 - 1, -(event.clientY / container3DHeight) * 2 + 1, 0.5);
    			projector.unprojectVector(vector, camera);
    			var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
    		}

    		var intersects = raycaster.intersectObjects(C3D.unionFeatures);
            //console.log(intersects[0].object.feature.id);

            if((intersects.length > 0)&&(intersects[0].object.feature !== undefined)) {
                if($.inArray(intersects[0].object.feature.properties.class, C3D.interactiveClasses)> -1) {
                    C3D.emit('showFeatureInfo', intersects[0].object.feature.id);
                }
            }
            else {
                C3D.emit('clearFeatureInfo');
            }  
	}
    
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
            el3D.feature = feature;
            if (feature.properties.rVector !== undefined) {
                var conv = Math.PI/180;
                var rotation = [
                            feature.properties.rVector[0]*conv, 
                            feature.properties.rVector[1]*conv,
                            feature.properties.rVector[2]*conv
                            ];
                //el3D.rotation.set(rotation[0], rotation[1], rotation[2]);
                el3D.rotation.x += rotation[0];
                el3D.rotation.y += rotation[1];
                el3D.rotation.z += rotation[2];
            }
            if (feature.properties.tVector !== undefined) {
                el3D.position.x += feature.properties.tVector[0];
                el3D.position.y += feature.properties.tVector[1];
                el3D.position.z += feature.properties.tVector[2];
            }
            C3D.index[feature.parent.id].obj3D.add(el3D);
        }
        if(feature.properties.class === 'level') {
	        var userModels = new THREE.Object3D();
	        el3D.add(userModels);
	        el3D.userModels = userModels;
        }
        for(var i=0;i< feature.children.length;i++) {
            queue.push(feature.children[i]);
        }

        if($.inArray(feature.properties.class, C3D.interactiveClasses)> -1) {
            C3D.interactiveFeatures.push(el3D);
        }

        if($.inArray(feature.properties.class, C3D.obstaclesClasses)> -1) {
            if(feature.properties.class === 'internal_wall' || feature.properties.class === 'external_wall')
            {
                C3D.obstaclesFeatures.push(el3D.wall);
            }
            else if(feature.properties.class === 'level')
            {
	            C3D.obstaclesFeatures.push(el3D.floor);
            }
            else
            {
                C3D.obstaclesFeatures.push(el3D);
            }

        }
    }
    C3D.index['building'].obj3D.rotation.x = -Math.PI/2;

    C3D.scene3D.add(C3D.index["building"].obj3D);
    C3D.unionFeatures = C3D.obstaclesFeatures.concat(C3D.interactiveFeatures);
    //setLight();

    function setLight() {
        var light = C3D.scene3D.__lights[1];
        var sceneCenter = new THREE.Object3D();
        sceneCenter.position = utilities.getCentroid(C3D.index['building'].obj3D);
        light.shadowCameraVisible = true;
        light.position.set(sceneCenter.position.x*2 + 10,sceneCenter.position.y + 20,sceneCenter.position.z);
        light.castShadow = true;
        light.shadowCameraNear = 0.1;
        light.shadowCameraFar = light.position.y*2;
        light.shadowCameraFov = sceneCenter.position.x*4;
        light.intensity = 2;
        light.shadowMapHeight = 4096;
        light.shadowMapWidth = 4096;
        light.target.position = utilities.getCentroid(C3D.index['building'].obj3D);
    }

    // var centroid = C3D.getCentroid(C3D.index['building'].obj3D);
    // C3D.index['building'].obj3D.position.set(-centroid.x, -centroid.y, -centroid.z);
    
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
    var firstView = C3D.index[C3D.actualPosition.levelId].layer2D;
    firstView.addTo(C3D.map2D);

	C3D.map2D.fitBounds(firstView.getBounds());
    C3D.orderLayer();	
	
	function styleFunction(feature) {
		return C3D.config.style[feature.properties.class];
	}
	
	function furnitureMarker(feature, latlng) {
		
		if (feature.properties.class === 'graphNode') {
			return L.circleMarker(latlng);
		} else {
			if (C3D.config.style[feature.properties.class] !== undefined) {
				var markerIcon = L.AwesomeMarkers.icon(C3D.config.style[feature.properties.class]);
			} else {
				var markerIcon = L.AwesomeMarkers.icon({ icon: "asterisk" });
			}
			return L.marker(latlng, {icon: markerIcon});
		}
	}
	
	function onEachFeature(feature, layer) {
        layer.on({
            //mouseover: highlightFeature,
            //mouseout: resetHighlight,
            click: selectFeature
        });
        if (C3D.index[feature.id]) C3D.index[feature.id].layer2D = layer;
    }

    function selectFeature(e) {
        C3D.emit('selectFeature', e.target.feature.id);
    }
}	// Chiude generate2DModel




C3D.generator3D['cube'] = function(color) {
	var geometry = new THREE.BoxGeometry(0.5, 0.5, 1.8);
    var material = new THREE.MeshLambertMaterial( {color: 0x00ff00} );
    var cube = new THREE.Mesh(geometry, material);
    cube.position.z += 0.9;
    var container = new THREE.Object3D();
    container.add(cube);
    return container;
    
}




/*
    getActualLevelId ritorna il livello che al momento si sta visualizzando.
*/
C3D.getActualLevelId = function() {
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

/*
    orderLayer si occupa di ordinare i layer diversi per la mappa 2D leaflet. 
    L'ordine viene stabilito dall'array orderClass.
*/

C3D.orderLayer = function() {
    var orderClass = ['room','external_wall','internal_wall','door','graphNode','graphArc','server','path'];
    while(orderClass.length !== 0) {
        var classElement = orderClass.shift();
        for(idLayer in C3D.map2D._layers) {
            layer = C3D.map2D._layers[idLayer];
            if(layer.feature !== undefined) {
                if(layer.feature.properties !== undefined) {
                    if(layer.feature.properties.class === classElement) {
                        layer.bringToFront();
                    }
                }
            }     
        }
    }
}

C3D.on('getDirections', function(directionInfo) {
    for(id in C3D.index) {
        var obj = C3D.index[id];
        if(obj.properties.class === 'level' && obj.layer2D.directionsLayer !== undefined) {
            obj.layer2D.removeLayer(obj.layer2D.directionsLayer);
        }
    }

    var fromNodeId = directionInfo.fromNodeId;
    var toNodeId = directionInfo.toNodeId; 
    var path = graphManager.findShortestPath(fromNodeId, toNodeId);
    console.log(path);
    var pathsGeoJSON = {};
    for(id in path) {

        var node = C3D.index[ path[id] ];
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
            }
        }
        var nodeCoordinates = coordinatesUtilities.getPointAbsoluteCoords(node);
        var geographicalCoordinates = coordinatesUtilities.fromXYToLngLat(nodeCoordinates, C3D.config.transformationMatrix);
        pathsGeoJSON[level].geometry.coordinates.push(geographicalCoordinates);
    }
    console.log(pathsGeoJSON);
    for(idLevel in pathsGeoJSON) {
        var layer = L.geoJson(pathsGeoJSON[idLevel]);
        C3D.index[idLevel].layer2D.addLayer(layer);
        C3D.index[idLevel].layer2D.directionsLayer = layer;
    }
});