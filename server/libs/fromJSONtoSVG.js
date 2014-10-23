function fromJSONtoSVGConverter() {

	var pathname_input = 'json_input/architecture.json';
	var pathname_output = 'svg_output/floor0.svg';

    $.getJSON(pathname_input, function(data) { 
        if (data.type == "FeatureCollection") 
        {
            
            $.each( data.features, function( key, feature ) 
            {
            	var line='';
				if(feature.geometry.type==='LineString') {
					line = '<polyline points="';
					//MultiLine, per definire i contorni della stanza.
                    $.each(feature.geometry.coordinates, function (key, pointCoordinates){
		
						line= line.concat(pointCoordinates[0] + ','+  pointCoordinates[1]+' ');
					})

				}
				line = line.concat('" style="fill:none;stroke:black;stroke-width:3" />');
            	console.log(line);
            });
        } 
        else 
        {
            console.log('ERROR: No FeatureCollection detected');
    	}

    });
}