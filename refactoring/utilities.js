// initialize library object (namespace)
var utilities = {};

// import any dependencies (in browser must be included before this)
// var dependency = dependency || require('./dependency');

(function(){
	
	//library properties and functions (public an private)
	
	var getLevel = function(obj) {
		var ancestor = obj;
		while (ancestor.properties.class !== 'level') {
			ancestor = ancestor.parent;
		}

		if (ancestor.properties.class === 'building') {
			return undefined;
		} else {
			return ancestor.id;
		}
	};

	var getRoom = function(obj) {
	    var ancestor = obj;
	    if(obj.properties.class !== 'building' && obj.properties.class !== 'level') {
	        while(ancestor.properties.class !== 'room') {
	            ancestor = ancestor.parent;
	        }
	    }
	    return ancestor;
	};
	
	// end of library properties
	
	// exported things (public)
	utilities.getLevel = getLevel;
	utilities.getRoom = getRoom;
	// end exported things
	
	// export the namespace object
	if (typeof module !== 'undefined' && module.exports) {
	  module.exports = utilities;
	}	
})();