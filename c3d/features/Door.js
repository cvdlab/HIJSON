var Feature = require('./Feature.js');

Feature.inherits(Door, Feature);

function Door(feature) {
	Feature.call(this, feature);
}

Door.prototype.style =  {
							color: "#000000",
							zIndex: 6
    					};

Door.prototype.in_graph = true;
Door.prototype.in_2D_map = true;

module.exports = Door;