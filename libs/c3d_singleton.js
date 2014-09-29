var C3D = (function() {
    var instance;

    function init() {
        var path_architecture =  'json_input/architecture_new.json';
        var path_furnitures = 'json_input/furnitures_new.json'; 

        return {
            tree: {
                id: '',
                children: []
            },
            
            index: {},

            scene:  new THREE.Scene(),      
        
            parseJSON: function() {
                this.index['building'] = this.tree;
                
                readJSON('architecture', this.path_architecture, this.tree, this.index);
                readJSON('furnitures', this.path_furnitures, this.tree, this.index);
                
                function readJSON(typeJSON, path, tree, index) {
                    $.getJSON(path, function(data) { 
                        if (data.type == "FeatureCollection") 
                        {
                            console.log('FeatureCollection detected for '+typeJSON+'.');
                            if (typeJSON === "architecture") 
                            {
                                tree.id = data.id;
                                tree.coordinates = data.coordinates;
                            }
                            
                            //THREE.FogExp2( hex, density );reach data.features
                            $.each( data.features, function( key, feature ) 
                            {
                                var obj = {};
                                obj.id = feature.id;
                                obj.parent = index[feature.properties.parent];
                                obj.parent.children.push(obj);
                                obj.children = [];
                                obj.geometry = feature.geometry;
                                obj.properties = feature.properties;
                                index[feature.id] = obj;
                            });
                        } 
                        else 
                        {
                            console.log('ERROR: No FeatureCollection detected');
                        }
                    });
                };

            }, // Chiude il this.parseJSON
            
            init3D: function() {
                var stats = initStats();
                // create a scene, that will hold all our elements such as objects, cameras and lights.
                var scene = this.scene;
                // create a camera, which defines where we're looking at.
                var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
                // create a render and set the size
                var renderer = new THREE.WebGLRenderer();
                
                var trackballControls = new THREE.TrackballControls(camera);
                
                renderer.setClearColor(new THREE.Color(0x092D52, 1.0)); 
                //renderer.setClearColor(new THREE.Color(0x2C3848, 1.0));
                renderer.setSize(window.innerWidth, window.innerHeight);
                renderer.shadowMapEnabled = true;
                
                // position and point the camera to the center of the scene
                camera.position.set(-40,-40,40);
                camera.up = new THREE.Vector3(0,0,1);
                camera.lookAt(scene.position);
                
                // add subtle ambient lighting
                var ambiColor = "#1c1c1c";
                var ambientLight = new THREE.AmbientLight(ambiColor);
                scene.add(ambientLight);
                
                // add axis helper
                var axisHelper = new THREE.AxisHelper(3);
                scene.add(axisHelper);

                var controls = new function () {
                    this.showAxisHelper = true;
                    this.enableTrackball = false;
                };
                
                var enableTrackball = false;
                var gui = new dat.GUI();
                
                gui.add(controls, 'showAxisHelper').onChange(function (value) {
                    axisHelper.visible = value;
                });
                
                gui.add(controls, 'enableTrackball').onChange(function (value) {
                    enableTrackball = value;
                });

                $('body').append(renderer.domElement);
                
                render();
                
                function render() {
                    stats.update();
                    if (enableTrackball) trackballControls.update();
                    
                    requestAnimationFrame(render);
                    renderer.render(scene, camera);
                }
                
                function initStats() {
                    var stats = new Stats();
                    stats.setMode(0); // 0: fps, 1: ms
                    $('body').append(stats.domElement);
                    return stats;
                }
            },

            generate3DModel: function() {
                var queue = [];
                console.log(this.tree);

                var feature;
                $.each(this.tree.children, function(key, child) {
                    queue.push(child);
                });
                
                while(queue.length>0) {
                    feature = queue.pop();
                    
                    if(feature.geometry.type in archGen) {
                        var el3D = archGen[feature.geometry.type](feature);
                        this.scene.add(el3D);
                    }
                    else {
                        console.log('ERROR: Class: ' + feature.geometry.type + 'not recognized.');
                    }

                    for(childrenElement in element.children) {
                        queue.push(childrenElement);
                    }
                }           
            }      
        };

        return 
        {
            getInstance: function() {
                if(!instance) {
                    instance = init();
                }

                return instance;
            }
        };
    })();
*/