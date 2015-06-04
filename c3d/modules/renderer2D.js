var eventEmitter = require('./eventEmitter.js');
var utilities = require('./utilities.js');

var orderLayers = function() {
	var orderClass = ['server','table','external_wall','internal_wall','stair','door','window','graphNode','graphArc','path'];
	while(orderClass.length !== 0) {
		var classElement = orderClass.shift();
		for(idLayer in data.map2D._layers) {
			layer = data.map2D._layers[idLayer];
			if(layer.feature !== undefined && layer.feature.properties !== undefined && layer.feature.properties.class === classElement) {
				layer.bringToFront();
			}
    	}
    }
};

var self = module.exports = {
	
	init: function(data) {
        
        data.index['building'].layer2D = L.layerGroup();
        
        var container2D = $("#container2D");
        var container2DWidth = container2D.width();
        var container2DHeight = container2D.width()/4*3;
        container2D.css('height', container2DHeight);

		data.map2D = L.map('container2D').setView([0, 0], 3);
		$(".leaflet-container").css({"background": data.config.style.background.color});
        $(".leaflet-control-attribution").css({"visibility": "hidden"});
	    window.addEventListener('resize', onWindowResize2D, false);
	
	    function onWindowResize2D() {
	        container2DWidth = container2D.width();
	        container2DHeight = container2D.width()/4*3;
	        container2D.css('height', container2DHeight);
	    }
	    
        eventEmitter.on('selectFeature', function fitBounds2D(idObject) {
        	var obj = data.index[idObject];
		    if(obj.properties.class === 'level' || obj.properties.class === 'building') {
                data.map2D.removeLayer(data.index[data.actualPosition.levelId].layer2D); 
                obj.layer2D.addTo(data.map2D);
		    }
			if(obj.properties.class !== 'building') {
		        data.map2D.fitBounds(utilities.getRoom(obj).layer2D.getBounds());
			}

           	orderLayers();
        });
        
        L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
            maxZoom: 50, //A quanto fissarlo?
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
                '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
                'Imagery © <a href="http://mapbox.com">Mapbox</a>',
            id: 'examples.map-i875mjb7'
        }).addTo(data.map2D);
	},
	
	generate2DModel: function(data) {
		for(geoJSONlevel in data.geoJSONmap) {
			var layer = L.geoJson(data.geoJSONmap[geoJSONlevel], {
																	style: styleFunction, 
																	pointToLayer: furnitureMarker,
	                                                                onEachFeature: onEachFeature
																});
			data.index[geoJSONlevel].layer2D = layer;
			var markers = new L.featureGroup();
			markers.addTo(data.index[geoJSONlevel].layer2D);
			data.index[geoJSONlevel].layer2D.userMarkers = markers;
		}
	    var firstView = data.index[data.actualPosition.levelId].layer2D;
	    firstView.addTo(data.map2D);

		data.map2D.fitBounds(firstView.getBounds());
	    orderLayers();	
		
		function styleFunction(feature) {
			var style;
			var obj = data.index[feature.id]; 
			if(obj!== undefined && obj.style !== undefined) {
				style = data.index[feature.id].style;
			}
			else {
				style = data.config.style[feature.properties.class];
			}
			return style;
		}
		
		function furnitureMarker(feature, latlng) {
			if (feature.properties.class === 'graphNode') {
				return L.circleMarker(latlng);
			} else {
				var obj = data.index[feature.id];
				var style;
				if(obj!== undefined && obj.style !== undefined) {
					style = data.index[feature.id].style;
				} else if (data.config.style[feature.properties.class] !== undefined) {
					style = data.config.style[feature.properties.class];
				} else {
					style = { icon: "asterisk" };
				}
				var markerIcon = L.AwesomeMarkers.icon(style);
				return L.marker(latlng, {icon: markerIcon});
			}
		}
		
		function onEachFeature(feature, layer) {
	        layer.on({
	            click: selectFeature
	        });
	        if (data.index[feature.id]) {
	        	data.index[feature.id].layer2D = layer;
	        }
	    }

	    function selectFeature(e) {
	        eventEmitter.emit('selectFeature', e.target.feature.id);
	    }
	}
	
}