/**
 * @author mrdoob / http://mrdoob.com/
 * @author virgafox
 *
 *
 * camera = THREE.camera
 *
 * parameters = {
 *  cameraHeight: <float>,
 *  jumpEnabled: <bool>,
 *  collisionsEnabled: <bool>,
 *  horizontalRadius: <float>,
 *  overHead: <float>,
 *  stepHeight: <float>,
 *  obstaclesArray: [ THREE.Object3D ]
 * }
 */

THREE.PointerLockControls = function ( camera, parameters ) {

	// Collision detection parameters
	
	this.cameraHeight = 10;
	this.jumpEnabled = true;
	this.collisionsEnabled = false;
	this.horizontalRadius = 5;
	this.overHead = 2.5;
	this.stepHeight = 2.5;
	this.obstaclesArray = [];
	
	
	if (typeof parameters !== 'undefined') {
		for (var key in parameters) {
			var newValue = parameters[ key ];
			if ( newValue === undefined ) {
				console.warn( "THREE.PointerLockControls: '" + key + "' parameter is undefined." );
				continue;
			}
			if (key in this) {
				this[ key ] = newValue;
			}
		} 
	}
	
	// End collision detection parameters

	var scope = this;
	
	camera.rotation.set( 0, 0, 0 );

	var pitchObject = new THREE.Object3D();
	pitchObject.add( camera );

	var yawObject = new THREE.Object3D();
	yawObject.position.y = this.cameraHeight;
	yawObject.add( pitchObject );

	var moveForward = false;
	var moveBackward = false;
	var moveLeft = false;
	var moveRight = false;

	//var isOnObject = false;
	var jumpEnabled = this.jumpEnabled;
	var canJump = false;

	var prevTime = performance.now();

	var velocity = new THREE.Vector3();

	var PI_2 = Math.PI / 2;

	var onMouseMove = function ( event ) {

		if ( scope.enabled === false ) return;

		var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

		yawObject.rotation.y -= movementX * 0.002;
		pitchObject.rotation.x -= movementY * 0.002;

		pitchObject.rotation.x = Math.max( - PI_2, Math.min( PI_2, pitchObject.rotation.x ) );

	};

	var onKeyDown = function ( event ) {

		switch ( event.keyCode ) {

			case 38: // up
			case 87: // w
				moveForward = true;
				break;

			case 37: // left
			case 65: // a
				moveLeft = true; break;

			case 40: // down
			case 83: // s
				moveBackward = true;
				break;

			case 39: // right
			case 68: // d
				moveRight = true;
				break;

			case 32: // space
				if ( jumpEnabled === true && canJump === true ) velocity.y += 250;
				canJump = false;
				break;

		}

	};

	var onKeyUp = function ( event ) {

		switch( event.keyCode ) {

			case 38: // up
			case 87: // w
				moveForward = false;
				break;

			case 37: // left
			case 65: // a
				moveLeft = false;
				break;

			case 40: // down
			case 83: // s
				moveBackward = false;
				break;

			case 39: // right
			case 68: // d
				moveRight = false;
				break;

		}

	};

	document.addEventListener( 'mousemove', onMouseMove, false );
	document.addEventListener( 'keydown', onKeyDown, false );
	document.addEventListener( 'keyup', onKeyUp, false );

	this.enabled = false;

	this.getObject = function () {

		return yawObject;

	};

	this.getDirection = function() {

		// assumes the camera itself is not rotated

		var direction = new THREE.Vector3( 0, 0, -1 );
		var rotation = new THREE.Euler( 0, 0, 0, "YXZ" );

		return function( v ) {

			rotation.set( pitchObject.rotation.x, yawObject.rotation.y, 0 );

			v.copy( direction ).applyEuler( rotation );

			return v;

		}

	}();
		
	// START ADDITION FOR NodeFPS
	// var lastRototranslationUpdate = performance.now();
	// var lastRototranslation = {
	// 	position: yawObject.position.clone(),
	// 	rotation: new THREE.Vector3(pitchObject.rotation.x, yawObject.rotation.y, 0)
	// }
	// END ADDITION FOR NodeFPS
	
	//INTEGRATION OF COLLISION DETECTION
	
	//collision distances from camera position
	
	
	var collisionDistances = {
		front: this.horizontalRadius,
		left: this.horizontalRadius,
		back: this.horizontalRadius,
		right: this.horizontalRadius,
		up: this.overHead,
		down: this.cameraHeight
	};
	

	//max step height (excluded)
	
	
	var verticalCollisionsShift = ( this.cameraHeight - this.stepHeight ) / 2;
	
	var collisionsRaycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3(), 0, 0 );
	
	var getWalkingDirection = function() {

		// assumes the camera itself is not rotated

		var direction = new THREE.Vector3( 0, 0, -1 );
		var rotation = new THREE.Euler( 0, 0, 0, "YXZ" );

		return function( v ) {

			rotation.set( 0, yawObject.rotation.y, 0 );

			v.copy( direction ).applyEuler( rotation );

			return v;

		}

	}();
	
	var collisions = {
		front: false,
		left: false,
		back: false,
		right: false,
		up: false,
		down: false
	};
	
	var computeCollisionDirection = {
		front: function() { return getWalkingDirection(new THREE.Vector3(0,0,0)).applyEuler(new THREE.Euler(0,0,0)); },
		left: function() { return getWalkingDirection(new THREE.Vector3(0,0,0)).applyEuler(new THREE.Euler(0,Math.PI*2/4,0)); },
		back: function() { return getWalkingDirection(new THREE.Vector3(0,0,0)).applyEuler(new THREE.Euler(0,Math.PI,0)); },
		right: function() { return getWalkingDirection(new THREE.Vector3(0,0,0)).applyEuler(new THREE.Euler(0,-Math.PI*2/4,0)); },
		up: function() { return new THREE.Vector3(0,1,0); },
		down: function() { return new THREE.Vector3(0,-1,0); }
	};

	var checkCollision = function(direction, obstacles) {
		collisionsRaycaster.ray.origin.copy( yawObject.position );
		collisionsRaycaster.ray.direction.copy( computeCollisionDirection[direction]() );
		collisionsRaycaster.near = 0;
		collisionsRaycaster.far = collisionDistances[direction];
		
		var intersections = collisionsRaycaster.intersectObjects( obstacles, true );
		var collision = (intersections.length > 0);
		if (direction !== 'up' && direction !== 'down') {
			for (var i = 2; i <= 3; i++) {
				collisionsRaycaster.ray.origin.y -= verticalCollisionsShift;
				intersections = collisionsRaycaster.intersectObjects( obstacles, true );
				collision = collision || (intersections.length > 0);
			}
		}
		
		return collision;
	};
	
	//END INTEGRATION OF COLLISION DETECTION

	// ADDITION FOR SENDING POSITION
	var oldPosition = yawObject.position.clone();
	var lastPositionUpdate = performance.now();
	// END ADDITION

	this.update = function () {

		if ( scope.enabled === false ) return;

		var time = performance.now();
		var delta = ( time - prevTime ) / 1000;

		velocity.x -= velocity.x * 10.0 * delta;
		velocity.z -= velocity.z * 10.0 * delta;

		velocity.y -= 9.8 * 80.0 * delta; // 100.0 = mass

		if ( moveForward ) velocity.z -= 50.0 * delta;
		if ( moveBackward ) velocity.z += 50.0 * delta;

		if ( moveLeft ) velocity.x -= 50.0 * delta;
		if ( moveRight ) velocity.x += 50.0 * delta;
		
		//START ADDITION FOR NodeFPS
		
		// block movement on key up for more precision and less network flooding.
		if (!moveForward && !moveBackward) velocity.z = 0;
		if (!moveLeft && !moveRight) velocity.x = 0;
		
		//END ADDITION FOR NodeFPS
		
		//INTEGRATION OF COLLISION DETECTION
		
		if (this.collisionsEnabled) {
			
			for(direction in collisions) {
				collisions[direction] = checkCollision(direction, this.obstaclesArray);
			}
			
			if(collisions.up) console.log('detected up');
			
			if (collisions.front) { 
				velocity.z = Math.max( 0, velocity.z );
			}
			
			if (collisions.left) {
				velocity.x = Math.max( 0, velocity.x );
			}
			
			if (collisions.back) {
				velocity.z = Math.min( 0, velocity.z );
			}
			
			if (collisions.right) {
				velocity.x = Math.min( 0, velocity.x );
			}
			
			if (collisions.up) {
				velocity.y = Math.min( 0, velocity.y );
			}
			
			if (collisions.down) { 
				velocity.y = Math.max( 0, velocity.y ); 
				canJump = true;
				while(checkCollision('down', this.obstaclesArray)) {
					yawObject.position.y += 0.001;
				}
				yawObject.position.y -= 0.001;
			}
					
		}

		//END INTEGRATION OF COLLISION DETECTION

		yawObject.translateX( velocity.x * delta );
		yawObject.translateY( velocity.y * delta ); 
		yawObject.translateZ( velocity.z * delta );

		
		// now integrated in collision detection
		
		if ( yawObject.position.y < this.cameraHeight ) {

			velocity.y = 0;
			yawObject.position.y = this.cameraHeight;

			canJump = true;

		}
		
		
		// START ADDITION FOR NodeFPS
		// emit event on rototranslation change
		// if( time - lastRototranslationUpdate > 1000/25 )	{
		// 	lastRototranslationUpdate = time;
		// 	var newPosition = yawObject.position.clone();
		// 	var newRotation = new THREE.Vector3(pitchObject.rotation.x, yawObject.rotation.y, 0);
		// 	if (!lastRototranslation.position.equals(newPosition) ||
		// 		!lastRototranslation.rotation.equals(newRotation)) {
				
		// 		//console.log('updateRototranslation event fired');
				
		// 		player.playerData.rototranslation.position = newPosition;
		// 		player.playerData.rototranslation.rotation = newRotation;
		// 		lastRototranslation.position = newPosition;
		// 		lastRototranslation.rotation = newRotation;
		// 		eventManager.emit('updateRototranslation');
		// 	}
		// }
		// END ADDITION FOR NodeFPS

		// ADDITION FOR SENDING POSITION
		if( time - lastPositionUpdate > 1000/25 )	{
			lastPositionUpdate = time;
			if (!oldPosition.equals(yawObject.position)) {
				c3dclient.eventEmitter.emit('FPVmoved');
				//console.log('FPVmoved event fired');
				oldPosition = yawObject.position.clone();
			}
		}
		// END ADDITION
		prevTime = time;

	};

};