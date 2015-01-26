var eventEmitter = require('./eventEmitter.js');
var utilities = require('./utilities.js');
var coordinatesUtilities = require('./coordinatesUtilities.js');

function onWindowResize3D() {
	var container3D = $('#container3D');
	container3DWidth = container3D.width();
    container3DHeight = container3D.width()/4*3;
    container3D.css('height', container3DHeight);

    camera.aspect = container3DWidth / container3DHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( container3DWidth, container3DHeight );
}

var self = module.exports = {
	scene3D: {},
	camera3D: {},

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
	    
	    camera.position.set(40,50,40);
	    camera.up = new THREE.Vector3(0,1,0);
	    camera.lookAt(scene.position);
		
	    var trackballControls = new THREE.TrackballControls(camera, container3D[0]);
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
	    
	    var spotLight = new THREE.SpotLight(0xFFFFFF);
	    spotLight.position.set(-40,50,-50);
	    scene.add( spotLight );
	    
	    var spotLight2 = new THREE.SpotLight(0xFFFFFF);
	    spotLight2.position.set(50,50,60);
	    scene.add( spotLight2 );

	    var axisHelper = new THREE.AxisHelper(3);
	    scene.add(axisHelper); 
	        
	    window.addEventListener( 'resize', onWindowResize3D, false );



	    eventEmitter.on('selectFeature', function(idObject) {
	        utilities.show3DObject(data.index["building"].obj3D, false);
	        utilities.show3DObject(data.index[idObject].obj3D, true);
		    
		    for(var i in data.index) {
		        var elementClass = data.index[i].properties.class;
		        if((elementClass === "internal_wall") || (elementClass === "external_wall")) {
		            if($.inArray(idObject, data.index[i].properties.connections) !== -1) {
		                utilities.show3DObject(data.index[i].obj3D, true);
		            }   
		        }
		    }
	    });

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
					utilities.show3DObject(data.index["building"].obj3D, true);
	                //data.index['building'].obj3D.rotation.x = -Math.PI/2;
					pointerLockControls = new THREE.PointerLockControls(camera, {
	                    cameraHeight: 1.7,
	                    jumpEnabled: false,
	                    collisionsEnabled: true,
	                    horizontalRadius: 0.5,
	                    overHead: 0,
	                    stepHeight: 0.1,
	                    obstaclesArray: data.obstaclesFeatures
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
	                //data.index['building'].obj3D.rotation.x = 0;
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

	                rotation.set(data.camera3D.parent.rotation.x, data.camera3D.parent.parent.rotation.y, 0);
	                raycaster.ray.direction.copy(direction).applyEuler(rotation);
	                raycaster.ray.origin.copy(data.camera3D.parent.parent.position);
	                
					// var vector = new THREE.Vector3(0, 0, 0.5);
	    			// projector.unprojectVector(vector, data.camera3D);
	    			// var raycaster = new THREE.Raycaster( vector, pointerLockControls.getDirection( new THREE.Vector3(0, 0, 0) ).clone() );
	    		} else {
	                console.log('clickTB');
	    			var vector = new THREE.Vector3((event.clientX / container3DWidth) * 2 - 1, -(event.clientY / container3DHeight) * 2 + 1, 0.5);
	    			projector.unprojectVector(vector, camera);
	    			var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
	    		}

	    		var intersects = raycaster.intersectObjects(data.unionFeatures);
	            //console.log(intersects[0].object.feature.id);

	            if((intersects.length > 0)&&(intersects[0].object.feature !== undefined)) {
	                if($.inArray(intersects[0].object.feature.properties.class, data.interactiveClasses)> -1) {
	                    eventEmitter.emit('showFeatureInfo', intersects[0].object.feature.id);
	                }
	            }
	            else {
	                eventEmitter.emit('clearFeatureInfo');
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
	    data.index["building"].obj3D = new THREE.Object3D();

	    for (var i=0; i < data.tree.children.length; i++) {
	        queue.push(data.tree.children[i]);
	    }
	    
	    while (queue.length>0) {
	        feature = queue.shift();
	        if(feature.get3DModel !== undefined) {
	           	var el3D = feature.get3DModel();
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
	            data.index[feature.parent.id].obj3D.add(el3D);
	        }
	        if(feature.properties.class === 'level') {
		        var userModels = new THREE.Object3D();
		        el3D.add(userModels);
		        el3D.userModels = userModels;
	        }
	        for(var i=0;i< feature.children.length;i++) {
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

	        }
	    }
	    data.index['building'].obj3D.rotation.x = -Math.PI/2;

	    scene3D.add(data.index["building"].obj3D);
	    data.unionFeatures = data.obstaclesFeatures.concat(data.interactiveFeatures);
	    //setLight();

	    function setLight() {
	        var light = data.scene3D.__lights[1];
	        var sceneCenter = new THREE.Object3D();
	        sceneCenter.position = utilities.getCentroid(data.index['building'].obj3D);
	        light.shadowCameraVisible = true;
	        light.position.set(sceneCenter.position.x*2 + 10,sceneCenter.position.y + 20,sceneCenter.position.z);
	        light.castShadow = true;
	        light.shadowCameraNear = 0.1;
	        light.shadowCameraFar = light.position.y*2;
	        light.shadowCameraFov = sceneCenter.position.x*4;
	        light.intensity = 2;
	        light.shadowMapHeight = 4096;
	        light.shadowMapWidth = 4096;
	        light.target.position = utilities.getCentroid(data.index['building'].obj3D);
	    }
	}
}