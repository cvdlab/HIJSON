var C3D = C3D || {};

C3D.obstaclesClasses = ['room', 'internal_wall', 'external_wall'];
C3D.interactiveClasses = ['server', 'surveillanceCamera', 'hotspot', 'antenna', 'fireExtinguisher', 'badgeReader', 'light'];

C3D.interactiveFeatures = [];
C3D.obstaclesFeatures = [];

var graphManager = new Graph(C3D.graph);
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

C3D.setIndexAndParents();

C3D.actualPosition = {
	coordinates: [C3D.config.startPosition.coordinates[0], C3D.config.startPosition.coordinates[1]],
	levelId: C3D.config.startPosition.levelId
};

//console.log(C3D.actualPosition.levelId);

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
		        C3D.map2D.fitBounds(C3D.getRoom(C3D.index[idObject]).layer2D.getBounds());

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
        C3D.show3DObject(C3D.index["building"].obj3D, false);
        C3D.show3DObject(C3D.index[idObject].obj3D, true);
	    
	    for(var i in C3D.index) {
	        var elementClass = C3D.index[i].properties.class;
	        if((elementClass === "internal_wall") || (elementClass === "external_wall")) {
	            if($.inArray(idObject, C3D.index[i].properties.connections) !== -1) {
	                C3D.show3DObject(C3D.index[i].obj3D, true);
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
				C3D.show3DObject(C3D.index["building"].obj3D, true);
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
				pointerLockControls.getObject().position = C3D.fromGeneralTo3DScene(C3D.actualPosition);
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
        sceneCenter.position = C3D.getCentroid(C3D.index['building'].obj3D);
        light.shadowCameraVisible = true;
        light.position.set(sceneCenter.position.x*2 + 10,sceneCenter.position.y + 20,sceneCenter.position.z);
        light.castShadow = true;
        light.shadowCameraNear = 0.1;
        light.shadowCameraFar = light.position.y*2;
        light.shadowCameraFov = sceneCenter.position.x*4;
        light.intensity = 2;
        light.shadowMapHeight = 4096;
        light.shadowMapWidth = 4096;
        light.target.position = C3D.getCentroid(C3D.index['building'].obj3D);
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
Qui sono presenti tutte le funzioni necessarie per generare(3D) gli elementi di arredamento:
    - server (Modello creato)
    - surveillanceCamera (Modello creato)
    - hotspot (Modello creato)
    - light (Modello creato)
    - antenna
    - fire Extinguisher
*/

C3D.generator3D['server'] = function (feature) {
    var coords = feature.geometry.coordinates;
    console.log(coords);
    var geometry = new THREE.BoxGeometry(coords[0][2][0], coords[0][2][1], feature.properties.height);
    var material = new THREE.MeshLambertMaterial( {color: 0xf49530} );
    var wireMaterial = new THREE.MeshLambertMaterial( {color: 0x000000, wireframe: true, wireframeLinewidth: 2} );
    //var server = new THREE.SceneUtils.createMultiMaterialObject(geometry, [material, wireMaterial]);
    var server = new THREE.Mesh(geometry, material);
    //server.position.z += dimensions[2]/2;
    
    server.receiveShadow = true;
    server.castShadow = true;
    var model = C3D.packageModel(server);

    return model;
};

C3D.generator3D['surveillanceCamera'] = function(feature) {

    var material = new THREE.MeshLambertMaterial( {color: 0x38a9dc} );
    var camera = new THREE.Object3D();
    

    //Creazione corpo macchina
    var widthBody = 0.2;
    var depthBody = 0.1;
    var heightBody = 0.1;

    var bodyCameraGeometry = new THREE.BoxGeometry(widthBody, depthBody, heightBody);
    var bodyCamera = new THREE.Mesh( bodyCameraGeometry, material );

    //Creazione obiettivo
    var radiusTopCameraLens = 0.04;
    var radiusBottomCameraLens = 0.06;
    var heightCylinderCamenraLens =  0.08;
    var cameraLensGeometry = new THREE.CylinderGeometry(radiusTopCameraLens, radiusBottomCameraLens, heightCylinderCamenraLens, 32 );
    var cameraLens = new THREE.Mesh( cameraLensGeometry, material );
    cameraLens.rotation.z = Math.PI/2;
    cameraLens.position.x += 2*widthBody/3;
   
    //Creazione asse sostegno
    var radiusTopRod = 0.005;
    var radiusBottomRod = 0.005;
    var heightRod = 0.15;

    var rodGeometry = new THREE.CylinderGeometry(radiusTopRod, radiusBottomRod, heightRod, 32 );
    var rod = new THREE.Mesh( rodGeometry, material );
    rod.rotation.z = Math.PI/2;
    rod.position.x -= widthBody/2;

    camera.add(bodyCamera);
    camera.add(cameraLens);

    
    camera.receiveShadow = true;
    camera.castShadow = true;
    var box = new THREE.Box3();
    box.setFromObject(camera);
    camera.add(box);
    camera.rotation.y += Math.PI*1/9;
    var model = C3D.packageModel(camera);
    return model;
}


C3D.generator3D['hotspot'] = function(feature) {
    var hotspot = new THREE.Object3D();

    var material = new THREE.MeshLambertMaterial( {color: 0x38a9dc} );
    var bodyGeometry = new THREE.BoxGeometry( 0.1, 0.02, 0.1);
    var body = new THREE.Mesh( bodyGeometry, material );


    var antennaGeometry = new THREE.CylinderGeometry( 0.001, 0.005, 0.1 , 32);
    var antennaDx= new THREE.Mesh(antennaGeometry, material);
    var antennaSx= new THREE.Mesh(antennaGeometry, material);

    antennaDx.rotation.x = Math.PI/2;
    antennaSx.rotation.x = Math.PI/2;
    antennaSx.position.x += 0.08/2;
    antennaDx.position.x -= 0.08/2;
    
    antennaSx.position.z += 0.05;
    antennaDx.position.z += 0.05;

    hotspot.add(body);
    hotspot.add(antennaDx);
    hotspot.add(antennaSx);

    hotspot.receiveShadow = true;
    hotspot.castShadow = true;
    var model = C3D.packageModel(hotspot);
    
    return model;
};


C3D.generator3D['light'] = function(feature) {

    var light = new THREE.Object3D();
    var height = 0.05;
    var width = 0.6;
    var externalPlaneGeometry = new THREE.PlaneGeometry(width,width);
    var externalPlaneMaterial = new THREE.MeshLambertMaterial({
                                                                color:0xE7E6DD,
                                                                side: THREE.DoubleSide
                                                            });

    var plane3D = new THREE.Mesh(externalPlaneGeometry, externalPlaneMaterial);
    plane3D.position.z += height;
    light.add(plane3D);
    var groupNeon = new THREE.Object3D();
    var neonMaterial = new THREE.MeshLambertMaterial( {color: 0xffffff} );
    var neonGeometry = new THREE.CylinderGeometry( 0.015, 0.015, 0.58, 32 );
    var translations = [(-0.075*3), (-0.075), (0.075), (0.075*3)];
    for(i in translations)
    {
        var neon = new THREE.Mesh( neonGeometry, neonMaterial );
        neon.position.x += translations[i];
        groupNeon.add(neon);
    }
    light.add(groupNeon);
    //light.position.z -= (height/2) + 0.001;

    var model = C3D.packageModel(light);
    
    return model;
} 

C3D.generator3D['antenna'] = function(feature) {
    var material = new THREE.MeshLambertMaterial( {color: 0x38a9dc} );
    
    var antenna = new THREE.Object3D();
    var geometry = new THREE.BoxGeometry( 0.3, 0.1, 0.3 );
    var base = new THREE.Mesh( geometry, material );
    base.position.z += 0.3/2;
    

    var geometry = new THREE.CylinderGeometry( 0.01, 0.01, 0.065, 32 );
    var baseCylinder = new THREE.Mesh( geometry, material );
    baseCylinder.position.y += 0.05;
    baseCylinder.position.z += 0.3/2;

    var geometry = new THREE.CylinderGeometry( 0.001, 0.01, 0.5, 32 );
    var cylinderAntenna = new THREE.Mesh( geometry, material );
    cylinderAntenna.rotation.x = Math.PI/2;
    cylinderAntenna.position.z += 0.3/2 +  0.5/2;
    cylinderAntenna.position.y += 0.08;

    var geometry = new THREE.SphereGeometry( 0.01, 32, 32 );
    var sphere = new THREE.Mesh( geometry, material );
    sphere.position.z += 0.3/2;
    sphere.position.y += 0.08;
    antenna.add(base);
    antenna.add(baseCylinder);
    antenna.add(cylinderAntenna);
    antenna.add( sphere );

    var model = C3D.packageModel(antenna);
    return model;
};


C3D.generator3D['fireExtinguisher'] = function(feature) {

    var fireExtinguisher = new THREE.Object3D();
    
    var material = new THREE.MeshLambertMaterial( {color: 0xff0000} );
    var bodyGeometry = new THREE.CylinderGeometry( 0.1, 0.1, 0.6, 32 );
    var body = new THREE.Mesh( bodyGeometry, material );
    body.rotation.x = Math.PI/2;
    
    fireExtinguisher.add(body);

    var geometrySphereUp = new THREE.SphereGeometry( 0.1, 32, 32 );
    var sphereUp = new THREE.Mesh( geometrySphereUp, material );
    sphereUp.position.z += 0.3;
    
    fireExtinguisher.add(sphereUp);
    
    var headGeometry = new THREE.BoxGeometry(0.02, 0.02, 0.2);
    var materialHead = new THREE.MeshLambertMaterial( {color: 0x000000} );
    var head = new THREE.Mesh( headGeometry, materialHead );
    head.position.z += 0.4;
    
    fireExtinguisher.add(head);

    var materialCylinder = new THREE.MeshLambertMaterial( {color: 0x000000} );
    var cylinderGeometry = new THREE.CylinderGeometry( 0.015, 0.08, 0.25, 32 );
    var cylinder = new THREE.Mesh(cylinderGeometry, materialCylinder);
    cylinder.position.z += 0.5;
    cylinder.rotation.z = Math.PI/2;
    cylinder.position.x += 0.1;
    
    fireExtinguisher.add(cylinder);
    
    var model = C3D.packageModel(fireExtinguisher);    
    return  model;
}

C3D.generator3D['table'] = function(feature) {
    var table = new THREE.Object3D();

    var geometry = new THREE.CylinderGeometry( 0.03, 0.03, 0.8, 32 );
    var material = new THREE.MeshLambertMaterial( {color: 0xd9d7d7} );
    
    var p1 = new THREE.Mesh( geometry, material );
    p1.rotation.x += Math.PI/2;
    p1.position.z += 0.8/2;

    var p2 = new THREE.Mesh( geometry, material );
    p2.rotation.x += Math.PI/2;
    p2.position.z += 0.8/2;
    p2.position.y += 1;

    var p3 = new THREE.Mesh( geometry, material );
    p3.rotation.x += Math.PI/2;
    p3.position.z += 0.8/2;
    p3.position.x += 2;

    var p4 = new THREE.Mesh( geometry, material );
    p4.rotation.x += Math.PI/2;
    p4.position.z += 0.8/2;
    p4.position.y += 1;
    p4.position.x += 2;
    

    var geometry = new THREE.BoxGeometry( 2.1, 1.1, 0.04 );
    var material = new THREE.MeshLambertMaterial( {color: 0x9b8c75} );
    var plane = new THREE.Mesh( geometry, material );
    plane.position.x -= 0.05 - 2.1/2;
    plane.position.y -= 0.05 - 1.1/2;
    plane.position.z += 0.8;

    table.add(p1);
    table.add(p2);
    table.add(p3);
    table.add(p4);
    table.add(plane);

    var model = C3D.packageModel(table);

    return model;
}

C3D.generator3D['chair'] = function(feature) {
    var chair = new THREE.Object3D();

    var geometry = new THREE.CylinderGeometry( 0.015, 0.015, 0.5, 32 );
    var material = new THREE.MeshLambertMaterial( {color: 0xd9d7d7} );

    var p1 = new THREE.Mesh( geometry, material );
    p1.rotation.x += Math.PI/2;
    p1.position.z += 0.5/2;

    var p2 = new THREE.Mesh( geometry, material );
    p2.rotation.x += Math.PI/2;
    p2.position.z += 0.5/2;
    p2.position.y += 0.4;

    var p3 = new THREE.Mesh( geometry, material );
    p3.rotation.x += Math.PI/2;
    p3.position.z += 0.5/2;
    p3.position.x += 0.4;

    var p4 = new THREE.Mesh( geometry, material );
    p4.rotation.x += Math.PI/2;
    p4.position.z += 0.5/2;
    p4.position.y += 0.4;
    p4.position.x += 0.4;
    
    var p5 = new THREE.Mesh( geometry, material );
    p5.rotation.x += Math.PI/2;
    p5.position.z += 0.5*3/2;

    var p6 = new THREE.Mesh( geometry, material );
    p6.rotation.x += Math.PI/2;
    p6.position.z += 0.5*3/2;
    p6.position.x += 0.4;

    var geometry = new THREE.BoxGeometry( 0.45, 0.45, 0.02 );
    var material = new THREE.MeshLambertMaterial( {color: 0x9b8c75} );
    var plane = new THREE.Mesh( geometry, material );
    plane.position.x += 0.4/2;
    plane.position.y += 0.4/2;
    plane.position.z += 0.5;
    
    var geometry = new THREE.BoxGeometry( 0.38, 0.02, 0.15);
    var back = new THREE.Mesh( geometry, material );
    back.position.x += 0.4/2;
    back.position.y += 0.001;
    back.position.z += 0.5*12/7;
    
    chair.add(back);
    chair.add(plane);
    chair.add(p1);
    chair.add(p2);
    chair.add(p3);
    chair.add(p4);
    chair.add(p5);
    chair.add(p6);
    var model = C3D.packageModel(chair);
    
    return model;
}

/*
    In seguito sono presenti le funzioni per disegnare l'architettura.
*/
C3D.generateLineString = function(geoJSONgeometry) {
	var lineString = new THREE.Geometry();
    for(var i = 0; i < geoJSONgeometry.coordinates.length; i++){
        lineString.vertices.push( new THREE.Vector3( geoJSONgeometry.coordinates[i][0], geoJSONgeometry.coordinates[i][1], 0) );
    }
    return lineString;
}

C3D.generatePolygonShape = function(geoJSONgeometry){
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
    return shape;
}

C3D.generatePolygon = function(geoJSONgeometry) {
    return C3D.generatePolygonShape(geoJSONgeometry).makeGeometry();  
}

C3D.generateWallGeometry = function (wallFeature) {
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
    var material = new THREE.MeshLambertMaterial({ 
    	color: C3D.config.style.external_wall.color, 
        side: THREE.DoubleSide
	});
	
	var shape = C3D.generatePolygonShape(C3D.generateWallGeometry(feature));
	
	var extrudedGeometry = shape.extrude({
                curveSegments: 1,
                steps: 1,
                amount: feature.properties.thickness,
                bevelEnabled: false
            });
            
	var wall = new THREE.Mesh(extrudedGeometry, material);
	var container = new THREE.Object3D();
	container.add(wall);
	container.wall = wall;
	wall.rotation.x += Math.PI/2;
	wall.position.y += feature.properties.thickness/2;    

    return container;	
}

C3D.generator3D['internal_wall'] = function(feature) {
    var material = new THREE.MeshLambertMaterial({ 
        color: C3D.config.style.internal_wall.color, 
        side: THREE.DoubleSide
    });
    
	var shape = C3D.generatePolygonShape(C3D.generateWallGeometry(feature));
	
	var extrudedGeometry = shape.extrude({
                curveSegments: 1,
                steps: 1,
                amount: feature.properties.thickness,
                bevelEnabled: false
            });
            
	var wall = new THREE.Mesh(extrudedGeometry, material);
	var container = new THREE.Object3D();
	container.add(wall);
	container.wall = wall;
	wall.rotation.x += Math.PI/2;
	wall.position.y += feature.properties.thickness/2;
    
    return container;   
}

/*
C3D.generator3D['door'] = function(feature) {
    var material = new THREE.LineBasicMaterial({ 
        color: C3D.config.style.door.color, 
        linewidth: feature.properties.thickness 
    });
    return new THREE.Line(C3D.generateLineString(feature.geometry), material);
}
*/

 C3D.generator3D['level'] = function(feature) {

	//return new THREE.Line(C3D.generateLineString(feature.geometry), material);
    
    var material = new THREE.MeshLambertMaterial({ 
        color: C3D.config.style.level.color, 
        side: THREE.DoubleSide
    });
    
    var shape = C3D.generatePolygonShape(feature.geometry);
    
    var extrudedGeometry = shape.extrude({
                curveSegments: 1,
                steps: 1,
                amount: feature.properties.thickness,
                bevelEnabled: false
    });
            
    var floor = new THREE.Mesh(extrudedGeometry, material);
    var container = new THREE.Object3D();
    container.add(floor);
    container.floor = floor;
	floor.position.z -= feature.properties.thickness-0.01;
    
    return container;   
}


C3D.generator3D['room'] = function(feature) {
    var material = new THREE.MeshLambertMaterial({
        color: C3D.config.style.room.fillColor,
        transparent: false, 
        opacity: 0.9, 
        side: THREE.DoubleSide
    });

    var model = new THREE.Mesh(C3D.generatePolygon(feature.geometry), material);
    
    model.receiveShadow = true;

    return model;
}

C3D.generator3D['badgeReader'] = function(feature) {
    var geometry = new THREE.BoxGeometry( 0.2, 0.3, 0.25 );
    var material = new THREE.MeshLambertMaterial( {color: 0x38a9dc} );
    var badgeReader = new THREE.Mesh( geometry, material );
    
    var model = C3D.packageModel(badgeReader);


    return model;
}

/*
    Funzioni di supporto
*/

C3D.getRoom = function(obj) {
    var ancestor = obj;
    if(obj.properties.class !== 'building' && obj.properties.class !== 'level') {
        while(ancestor.properties.class !== 'room') {
            ancestor = ancestor.parent;
        }
    }
    return ancestor;
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
C3D.packageModel = function (model3D) {
        
        var bbox = new THREE.BoundingBoxHelper(model3D, 0xff0000);
        bbox.update();
    
        var boxGeometry = new THREE.BoxGeometry( bbox.box.size().x, bbox.box.size().y, bbox.box.size().z );
        var boxMaterial = new THREE.MeshBasicMaterial( {color: 0x000000, transparent: true, opacity: 0} );
        var el3D = new THREE.Mesh( boxGeometry, boxMaterial );
    
        el3D.add(model3D);
    
        var bboxCentroid = C3D.getCentroid(bbox);
    
        model3D.position.set(-bboxCentroid.x,-bboxCentroid.y,-bboxCentroid.z);    
    
        el3D.position.z = bbox.box.size().z/2;
        el3D.package = true;
        
        return el3D;
    }

/* 
    Funzione che prendei in input un obj3D e un booleano ed effettua il traverse
*/

/*
C3D.show3DObject = function(obj3D, booleanValue) {
    console.log(obj3D);
    if(booleanValue) {
        obj3D.traverse(function(object) { 
            if((object.material !== undefined) && (object.package === undefined)) {
                object.material.opacity = 1;
            }
        });
    }
    else
    {
        obj3D.traverse(function(object) { 
            if((object.material !== undefined) && (object.package === undefined)) {
                object.material.transparent = true;
                object.material.opacity = 0.1;
            }
        });    
    }
}
*/

C3D.show3DObject = function(obj3D, booleanValue) {

    obj3D.traverse(function(object) { 
        object.visible = booleanValue;
    });

}


/*
	funzioni di traduzioni coordinate, tra generali, 3D (rotazione) e 2D (latitudine e longitudine). 
*/


// input: un oggetto posizione generale, output: un THREE.Vector3 da usare come posizione
C3D.fromGeneralTo3DScene = function(genPosition) {
	var threePosition = new THREE.Vector3(genPosition.coordinates[0], C3D.index[genPosition.levelId].properties.tVector[2], -genPosition.coordinates[1]);
	return threePosition;
}

// trasformazione inversa della precedente.
C3D.from3DSceneToGeneral = function(threePosition) {
	var genPosition = {
		coordinates: [threePosition.x, -threePosition.z],
		levelId: C3D.actualPosition.levelId
	}
	return genPosition;
}


// input: un oggetto posizione generale, output: un THREE.Vector3 da usare come posizione
C3D.fromGeneralTo3D = function(genPosition) {
	var threePosition = new THREE.Vector3(genPosition.coordinates[0], genPosition.coordinates[1], 0);
	return threePosition;
}

// trasformazione inversa della precedente.
C3D.from3DToGeneral = function(threePosition) {
	var genPosition = {
		coordinates: [threePosition.x, threePosition.y],
		levelId: C3D.actualPosition.levelId
	}
	return genPosition;
}

// input: un oggetto posizione generale, output: un oggetto L.latLng
C3D.fromGeneralTo2D = function(genPosition) {
    var convertedCoordinates = C3D.fromXYToLngLat(genPosition.coordinates);
    var leafletPosition = L.latLng(convertedCoordinates[1], convertedCoordinates[0]);

	return leafletPosition;
}

// inversa
C3D.from2DToGeneral = function(leafletPosition) {
    var genPosition = {
		coordinates: C3D.fromLngLatToXY([leafletPosition.lng, leafletPosition.lat]),
		levelId: C3D.actualPosition.levelId
	}
	return genPosition;
}


C3D.fromXYToLngLat = function (coordinates) {
    return C3D.applyTransformation(coordinates, C3D.transformationMatrix);
}

C3D.fromLngLatToXY = function(coordinates) {
    return C3D.applyTransformation(coordinates, C3D.inverseTransformationMatrix);
}

C3D.from2Dto3D = function(leafletPosition) {
	var genPosition = C3D.from2DToGeneral(leafletPosition);
	var threePosition = C3D.fromGeneralTo3D(genPosition);
	
    return threePosition;
}

C3D.from3Dto2D = function(threePosition) {
	var genPosition = C3D.from3DToGeneral(threePosition);
	var leafletPosition = C3D.fromGeneralTo2D(genPosition);
	
    return leafletPosition;
}

C3D.getCentroid = function(object3D) {
    var boundingBox = new THREE.BoundingBoxHelper(object3D,0xff0000 );
    boundingBox.update();
    var center = new THREE.Vector3( (boundingBox.box.min.x + boundingBox.box.max.x)/2, (boundingBox.box.min.y + boundingBox.box.max.y)/2, (boundingBox.box.min.z + boundingBox.box.max.z)/2 );
    return center;
}

C3D.getAbsoluteCoords = function(object) {
    return C3D.applyTransformation([0, 0], object.CMT);
}

C3D.applyTransformation = function (v, m) {
    return [ v[0]*m[0][0] + v[1]*m[0][1] + m[0][2], v[0]*m[1][0] + v[1]*m[1][1] + m[1][2] ];
}
C3D.getLevel = function(obj) {
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
        var level = C3D.getLevel(node);
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
        var nodeCoordinates = C3D.getAbsoluteCoords(node);
        var geographicalCoordinates = C3D.fromXYToLngLat(nodeCoordinates);
        pathsGeoJSON[level].geometry.coordinates.push(geographicalCoordinates);
    }
    console.log(pathsGeoJSON);
    for(idLevel in pathsGeoJSON) {
        var layer = L.geoJson(pathsGeoJSON[idLevel]);
        C3D.index[idLevel].layer2D.addLayer(layer);
        C3D.index[idLevel].layer2D.directionsLayer = layer;
    }
});