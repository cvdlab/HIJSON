var Feature = require('./Feature.js');

Feature.inherits(GraphNode, Feature);

function GraphNode(feature) {
	Feature.call(this, feature);
}

GraphNode.prototype.style =  {
								fillColor: "#00ff00",
								fillOpacity: 1,
								radius: 7,
								zIndex: 8
    					};
GraphNode.prototype.in_graph = false;
GraphNode.prototype.in_2D_map = false;    					
module.exports = GraphNode;