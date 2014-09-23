/* Parser e funzioni di supporto per C3D */

/* set floor height */
var levelHeight = 5;

/* convert Floor level to actual height */
function zLevel(level) {
    return level*levelHeight;
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
					archGen[feature.geometry.type](planimetry,feature.geometry.coordinates,feature.properties);
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

function parsing(scene, pathname_architecture, pathname_furnitures) {
    architectureParsing(scene, pathname_architecture);
    furnitureParsing(scene, pathname_furnitures);
}
