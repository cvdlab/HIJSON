/* Parser e funzioni di supporto per C3D */

/* set floor height */
var levelHeight = 5;

/* convert Floor level to actual height */
function zLevel(level) {
    return level*levelHeight;
}

var C3D = {};

C3D.parseJSON = function() {
    var map = {};
    var index = {};
    
    var indexMapPaths = {
        index: index,
        map: map,
        path_architecture: 'json_input/architecture_new.json',
        path_furniture: 'json_input/furnitures_new.json'    
    };
    
    JSONtoJS(indexMapPaths);
    console.log(map);
    console.log(index);
};

function JSONtoJS(indexMapPaths) {
    var index = indexMapPaths.index;
    var map = indexMapPaths.map;
    var path_architecture = indexMapPaths.path_architecture;
    var path_furnitures = indexMapPaths.path_furnitures;
    
    map.id = data.id;
    map.coordinates = data.coordinates;
    map.children = [];
    index['map'] = map;
    
    function readJSON(type, path) {
        $.getJSON(path, function(data) { 
            if (data.type == "FeatureCollection") 
            {
                console.log('FeatureCollection detected for '+type+'.');
                //foreach data.features
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
    }
    
    readJSON('architecture', path_architecture);
    readJSON('furnitures', path_furnitures);
}

function architectureParsing(scene, pathname) {
    
    var planimetry = new THREE.Object3D();

    $.getJSON(pathname, function(data) { 
        if (data.type == "FeatureCollection") 
        {
            console.log('FeatureCollection detected for Architecture.');
            
            //foreach data.features invocare in base al geometry.type uno dei metodi descritti in seguito, una o più volte (multi-*)
            $.each( data.features, function( key, feature ) 
            {
                if(feature.geometry.type in archGen) 
                {
					archGen[feature.geometry.type](planimetry, feature.geometry.coordinates, feature.properties);
				}
                else 
                {
					console.log('ERROR: geometry Type: ' + feature.geometry.type + 'not recognized.');
				}
            });
        } 
        else 
        {
            console.log('ERROR: No FeatureCollection detected');
    	}
    });
    
    scene.add(planimetry);

}


function furnitureParsing(scene, pathname) {
    
    var furnitures = new THREE.Object3D();

    $.getJSON(pathname, function(data) { 
        if (data.type == "FeatureCollection") 
        {
            console.log('FeatureCollection detected for Furnitures.');
            
            //foreach data.features invocare in base al geometry.type uno dei metodi descritti in seguito, una o più volte (multi-*)
            $.each( data.features, function( key, feature ) 
            {
                if(feature.properties.geomType in furnitureGen) 
                {
					furnitureGen[feature.properties.geomType](furnitures, feature);
				}
                else 
                {
					simpleFurnitureAdd(furnitures, feature);
				}
            });
        } 
        else 
        {
            console.log('ERROR: No FeatureCollection detected');
    	}
    });
    
    scene.add(furnitures);

}

/*
    La funzione parsing richiede in input un oggetto javascript con i seguenti parametri
        - scene: la scena in cui bisogna generare il modello 3D.
        - pathname_architecture: pathname del file JSON contenenti le feature che descrivono 
          l'architettura del modello 3D da rappresentare;
        - pathname_furniture: pathname del file JSON contenenti le feature che descrivono 
          gli elementi d'arredo che caratterizzano il modello 3D da rappresentare;
 */
function parsing(parsing_object) {
    architectureParsing(parsing_object.scene, parsing_object.architecturePathname);
    furnitureParsing(parsing_object.scene, parsing_object.furniturePathname);
}
