// (1) dependencies
var eventEmitter = require('./eventEmitter.js');
var utilities = require('./utilities.js');
var coordinatesUtilities = require('./coordinatesUtilities.js');

// (2) private things
var scene3D;
var camera3D;
var trackballControls3D;

var self = module.exports = {
	init: function init(data) {
		
	    var container3D = $('#container3D');
	    var container3DWidth = container3D.width();
	    var container3DHeight = container3D.width()/4*3;
	    container3D.css('height', container3DHeight);
	    
	    var stats = new Stats();
	    stats.setMode(0); // 0: fps, 1: ms
	    //container3D.append(stats.domElement);
	    scene = new THREE.Scene();
	    scene3D = scene;
	    camera = new THREE.PerspectiveCamera(45, container3DWidth / container3DHeight, 0.1, 1000);
	    camera3D = camera;
	    
	    var cameraLightTarget = new THREE.Object3D();

    	camera.add(cameraLightTarget);
    	cameraLightTarget.position.set(0,0,-2);
	    
	    scene.add(camera);

	    camera.position.set(42,35,42);
	    camera.up = new THREE.Vector3(0,1,0);
	    camera.lookAt(scene.position);
		
		var cameraLight = new THREE.SpotLight(0xFFFFFF);
	    camera.add(cameraLight);
	    cameraLight.position.set(0,0,0.5);
	    cameraLight.target = cameraLightTarget;

	    var trackballControls = new THREE.TrackballControls(camera, container3D[0]);
	    trackballControls3D = trackballControls;
	    trackballControls.enabled = true;
	    var pointerLockControls = { enabled: false };
	    
	    //var FPenabled = false;
		var objects = [];
	    
	    var renderer = new THREE.WebGLRenderer({antialias: true});
	    renderer.setClearColor(new THREE.Color(data.config.style.background.color, 1.0)); 
	    renderer.setSize(container3DWidth, container3DHeight);
	    renderer.shadowMapEnabled = false;
	    container3D.append(renderer.domElement);

	    var ambiColor = "#1c1c1c";
	    var ambientLight = new THREE.AmbientLight(ambiColor);
	    scene.add(ambientLight);
	    
	    var directionalLight = new THREE.DirectionalLight(0xFFFFFF);
	    directionalLight.position.set(0, 1000, 0);
	    scene.add( directionalLight );

	    var axisHelper = new THREE.AxisHelper(3);
	    scene.add(axisHelper); 
	        
	    window.addEventListener( 'resize', onWindowResize3D, false );

	    eventEmitter.on('selectFeature', utilities.highlightFeature);

		var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
		
		if (havePointerLock) {
		
			var element = container3D[0];
			
			eventEmitter.on('startFPV', function() {
				
	            element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
				if (/Firefox/i.test(navigator.userAgent)) {
					var fullscreenchange = function(event) {
						if (document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element) {
							document.removeEventListener('fullscreenchange', fullscreenchange);
							document.removeEventListener('mozfullscreenchange', fullscreenchange);
							element.requestPointerLock();
						}
					};
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
					utilities.setVisibility(data.index.building.obj3D, true);
	                //data.index.building.obj3D.rotation.x = -Math.PI/2;
					pointerLockControls = new THREE.PointerLockControls(camera, {
	                    cameraHeight: 1.7,
	                    jumpEnabled: false,
	                    collisionsEnabled: true,
	                    horizontalRadius: 0.5,
	                    overHead: 0,
	                    stepHeight: 0.1,
	                    obstaclesArray: data.obstaclesFeatures
	                });

	                eventEmitter.on('updateObstacles', function updateObstacles(obstacles){
	                	pointerLockControls.obstaclesArray = obstacles;
	                });
	                
	                scene.add(pointerLockControls.getObject());
					trackballControls.enabled = false;
					pointerLockControls.enabled = true;
					$("#pointer").css('display', 'block');
	                //camera.up = new THREE.Vector3(0, 1, 0);
	                camera.position.set(0, 0, 0);
					pointerLockControls.getObject().position = coordinatesUtilities.fromGeneralTo3DScene(data.actualPosition);
					pointerLockControls.getObject().position.y += 1.7;
				} else {
	                var actualLevel = data.actualPosition.levelId;
	                eventEmitter.emit('selectFeature', actualLevel);
	                //data.index.building.obj3D.rotation.x = 0;
					scene.add(camera); //ripristina la camera originaria
					camera.position.set(-40,-40,40);
					camera.lookAt(scene.position);
					scene.remove(pointerLockControls.getObject());
					pointerLockControls.enabled = false;
					trackballControls.enabled = true;
					$("#pointer").css('display', 'none');
					trackballControls.reset();
				}
			};
		
			var pointerlockerror = function(event) {
				alert('PointerLock error');
			};
		
			document.addEventListener('pointerlockchange', pointerlockchange, false);
			document.addEventListener('mozpointerlockchange', pointerlockchange, false);
			document.addEventListener('webkitpointerlockchange', pointerlockchange, false);
			
			document.addEventListener('pointerlockerror', pointerlockerror, false);
			document.addEventListener('mozpointerlockerror', pointerlockerror, false);
			document.addEventListener('webkitpointerlockerror', pointerlockerror, false);
		
			var computePointerLockControls = function() {
				pointerLockControls.update();
			};
		} 
	    else {
	        alert('Your browser doesn\'t seem to support Pointer Lock API');
	    }

		// mouse interaction
		
		var projector = new THREE.Projector();
		document.getElementById('container3D').addEventListener('mousedown', onDocumentMouseDown, false);
		function onWindowResize3D() {
			var container3D = $('#container3D');
			container3DWidth = container3D.width();
		    container3DHeight = container3D.width()/4*3;
		    container3D.css('height', container3DHeight);

		    camera.aspect = container3DWidth / container3DHeight;
		    camera.updateProjectionMatrix();
		    renderer.setSize( container3DWidth, container3DHeight );
		}
		
	    function onDocumentMouseDown(event) {
	    		var container3D = $('#container3D');
	            var container3DWidth = container3D.width();
	            var container3DHeight = container3D.width()/4*3;
	            event.preventDefault();
	            var raycaster;
	    		if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
	    			console.log('clickPL');
	                raycaster = new THREE.Raycaster();
	                var direction = new THREE.Vector3( 0, 0, -1 );
	                var rotation = new THREE.Euler(0, 0, 0, "YXZ");
	                rotation.set(camera.parent.rotation.x, camera.parent.parent.rotation.y, 0);
	                raycaster.ray.direction.copy(direction).applyEuler(rotation);
	                raycaster.ray.origin.copy(camera3D.parent.parent.position);
	                
	                //instersect
	                var intersects = raycaster.intersectObjects(data.unionFeatures);
		    		console.log("intersections: "+intersects.length);
		            console.log(intersects);

		            if((intersects.length > 0)&&(intersects[0].object.feature !== undefined)) {
		                if($.inArray(intersects[0].object.feature.properties.class, data.interactiveClasses)> -1) {
		                    eventEmitter.emit('showFeatureInfo', intersects[0].object.feature.id);
		                }
		            }
		            else {
		                eventEmitter.emit('clearFeatureInfo');
		            }  
		            //endintersect
					
	    		} else {
	                console.log('clickTB');
/*	                var vector = new THREE.Vector3();
	                vector.x = 2 * (event.clientX / container3DWidth) - 1;
					vector.y = 1 - 2 * ( event.clientY / container3DHeight );
	    			raycaster = projector.pickingRay( vector.clone(), camera );*/
	    			// projector.unprojectVector(vector, camera);
	    			// raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
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
	},

	generate3DModel: function generate3DModel(data) {
	    var queue = [];
	    var feature;
	    data.index.building.obj3D = new THREE.Object3D();
	    data.index.building.obj3D.feature = data.index.building;
	    for (var i=0; i < data.tree.children.length; i++) {
	        queue.push(data.tree.children[i]);
	    }
	    
	    while (queue.length>0) {
	        feature = queue.shift();
	        if(feature.id === 'stair_0.3') {
	        	console.log(feature.id);
	        }
           	var el3D = feature.get3DModel();
	        if(feature.id === 'stair_0.3') {
	        	console.log(el3D);
	        }
            el3D.feature = feature;
            feature.obj3D = el3D;
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
            data.index[feature.parent.id].obj3D.add(el3D);
	        
	        if(feature.properties.class === 'level') {
		        var userModels = new THREE.Object3D();
		        el3D.add(userModels);
		        el3D.userModels = userModels;
	        }
	        for(i = 0; i< feature.children.length; i++) {
	        	if (feature.children[i].properties.class !== "graphNode")
	            	queue.push(feature.children[i]);
	        }

	        if($.inArray(feature.properties.class, data.interactiveClasses)> -1) {
	            data.interactiveFeatures.push(el3D);
	        }

	        if($.inArray(feature.properties.class, data.obstaclesClasses)> -1) {
	            if(feature.properties.class === 'internal_wall' || feature.properties.class === 'external_wall')
	            {
	                data.obstaclesFeatures.push(el3D.wall); 
	            }
	            else if(feature.properties.class === 'level')
	            {
		            data.obstaclesFeatures.push(el3D.floor);
	            }
	            else
	            {
	                data.obstaclesFeatures.push(el3D);
	            }
	            //console.log(feature.id);

	        }
	    }
	    data.index.building.obj3D.rotation.x = -Math.PI/2;

	    scene3D.add(data.index.building.obj3D);
	    data.unionFeatures = data.obstaclesFeatures.concat(data.interactiveFeatures);
	    //setLightAndCamera();

	    function setLightAndCamera() {
	        var light = self.getScene3D().__lights[1];
	        var sceneCenter = new THREE.Object3D();
	        var pos;
	        if (data.config.centerPosition) {
	        	pos = data.config.centerPosition;
	        	sceneCenter.position.copy(new THREE.Vector3(pos[0],pos[2],-1*pos[1]));
	        } else {
	        	pos = [40,40,0];
	        	sceneCenter.position.copy(new THREE.Vector3(40,0,-40));
	        }
	        
	        light.shadowCameraVisible = true;
	        light.position.set(sceneCenter.position.x*2.5, 70, sceneCenter.position.z*2.5);
	        light.castShadow = false;
	        light.shadowCameraNear = 0.1;
	        light.shadowCameraFar = light.position.y*2;
	        light.shadowCameraFov = sceneCenter.position.x*4;
	        light.intensity = 1.3;
	        //light.shadowMapHeight = 4096;
	        //light.shadowMapWidth = 4096;
	        
	        light.target.position.copy(sceneCenter.position);
	        trackballControls3D.target.copy(new THREE.Vector3(pos[0],pos[2],-1*pos[1]));
	    }

	    //console.log(data.obstaclesFeatures);
	},

	getScene3D: function() {
		return scene3D;
	},

	getCamera3D: function() {
		return camera3D;
	},
	
	getTrackballControls3D: function() {
		return trackballControls3D;
	}
};