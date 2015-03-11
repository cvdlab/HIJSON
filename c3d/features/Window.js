var Feature = require('./Feature.js');

Feature.inherits(Window, Feature);

function Window(feature) {
	Feature.call(this, feature);
}

Window.prototype.style =  {
							color: "#0000FF",
							zIndex: 7
    					};

Window.prototype.in_graph = false;
Window.prototype.in_2D_map = false;

module.exports = Window;