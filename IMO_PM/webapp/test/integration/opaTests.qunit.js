/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"com/sap/incture/IMO_PM/test/integration/AllJourneys"
	], function () {
		QUnit.start();
	});
});