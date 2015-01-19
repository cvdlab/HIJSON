module.exports = {
	getLevel: function getLevel(obj) {
		var ancestor = obj;
		while (ancestor.properties.class !== 'level') {
			ancestor = ancestor.parent;
		}

		if (ancestor.properties.class === 'building') {
			return undefined;
		} else {
			return ancestor.id;
		}
	},

	getRoom: function getRoom(obj) {
	    var ancestor = obj;
	    if(obj.properties.class !== 'building' && obj.properties.class !== 'level') {
	        while(ancestor.properties.class !== 'room') {
	            ancestor = ancestor.parent;
	        }
	    }
	    return ancestor;
	}
}