	// create the module and name it C3DApp
	var C3DApp = angular.module('C3DApp', ['ngRoute']);

	// configure our routes
	C3DApp.config(function($routeProvider) {
		$routeProvider

			// route for the home page
			.when('/', {
				templateUrl : 'pages/overview.html',
				controller  : 'mainController'
			})

			// route for the about page
			.when('/2DModel', {
				templateUrl : 'pages/2DModel.html',
				controller  : '2DModelController'
			})
			
			.when('/3DModel', {
				templateUrl : 'pages/3DModel.html',
				controller  : '3DModelController'
			})
			// route for the contact page
			.when('/about', {
				templateUrl : 'pages/about.html',
				controller  : 'aboutController'
			});
	});

	// create the controller and inject Angular's $scope
	C3DApp.controller('mainController', function($scope) {
		// create a message to display in our view
		$scope.message = 'Everyone come and see how good I look!';
	});

	C3DApp.controller('2DModelController', function($scope) {
		$scope.message = 'Look! I am an about page.';
	});

	C3DApp.controller('3DModelController', function($scope) {
		$scope.message = 'Look! I am an about page.';
	});

	C3DApp.controller('aboutController', function($scope) {
		$scope.message = 'Contact us! JK. This is just a demo.';
	});