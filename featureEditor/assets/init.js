        // once everything is loaded, we run our Three.js stuff.
        $(function () {
            var stats = initStats();

            var scene = new THREE.Scene();
            var camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 1000);
            var renderer = new THREE.WebGLRenderer();
            var trackballControls = new THREE.TrackballControls(camera);

            renderer.setClearColor(new THREE.Color(0xEEEEEE,1.0));
            renderer.setSize(window.innerWidth,window.innerHeight);
            renderer.shadowMapEnabled = true;

            camera.position.set(5, 3, 2);
            camera.up = new THREE.Vector3(0,0,1);
            camera.lookAt(scene.position);
            var axisHelper = new THREE.AxisHelper(1);
            scene.add(axisHelper);

            var light = new THREE.AmbientLight( 0x404040 ); // soft white light
            scene.add( light );


            $('body').append(renderer.domElement);

            scene.add(get3DModel());
            render();

            function render() {
                stats.update();
                trackballControls.update();

                requestAnimationFrame(render);
                renderer.render(scene, camera);
            }

            function initStats() {
                var stats = new Stats();
                stats.setMode(0); // 0: fps, 1: ms
                $('body').append(stats.domElement);
                return stats;
            }

        });