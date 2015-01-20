// template for js modules that works both in node and browsers

// (1) initialize library object (namespace)
var myLib = {};

// (2) import any dependencies (in browser must be included before this file)
// example: var dependency = dependency || require('./dependency');

(function(){
	
	// (3) library properties and functions (public an private)
	var two = 2;	// will be private
	var three = 3;	// will be public
	var privateSum = function(a,b) { return a+b }; // will be private
	var addTwo = function(a) { return privateSum(a,two) };	// will be public
	
	// (4) exported things (public)
	myLib.three = three;
	myLib.addTwo = addTwo;
	
	// (5) export the namespace object
	if (typeof module !== 'undefined' && module.exports) {
	  module.exports = myLib;
	}	
	
})();