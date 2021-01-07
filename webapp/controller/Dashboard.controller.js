sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function (Controller) {
	"use strict";

	return Controller.extend("com.sap.incture.IMO_PM.controller.Dashboard", {

		onInit: function () {
			var that = this;
			this.router = sap.ui.core.UIComponent.getRouterFor(this);
			this.router.attachRoutePatternMatched(function (oEvent) {
				that.routePatternMatched(oEvent);
			});

		}, 
		routePatternMatched: function(oEvent){
			
		}
	});

});