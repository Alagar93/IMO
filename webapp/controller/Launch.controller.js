sap.ui.define([
	"com/sap/incture/IMO_PM/controller/BaseController",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (BaseController, Controller, JSONModel, Filter, FilterOperator) {
	"use strict";

	return BaseController.extend("com.sap.incture.IMO_PM.controller.Launch", {
		onInit: function () {

		},
		onAfterRendering: function () {
			this.getNotifTileCount();
		},
		getNotifTileCount: function () {
			var oModel = this.getView().getModel("oModel");
			var mLookupModel = this.getOwnerComponent().getModel("mLookupModel");
			var userPlant = "4321";
			var sWorkCenterSel = "";

			var oFilter = [];
			oFilter.push(new Filter("Plant", "EQ", userPlant));
			oFilter.push(new Filter("WorkCenter", "EQ", sWorkCenterSel));
			oFilter.push(new Filter("Type", "EQ", "COUNT"));

			var oPortalDataModel = this.getOwnerComponent().getModel("oPortalDataModel");
			oPortalDataModel.read("/KPISet", {
				filters: oFilter,
				success: function (oData) {
					var sCount = parseInt(oData.results[0].Number);
					mLookupModel.setProperty("/breakDownCount", sCount);
				},
				error: function (oData) {
					oModel.setProperty("/breakDownCount", 0);
					oModel.setProperty("/woDueCount", 0);
				}
			});
		},
		onPressReviewWO: function (oEvent) {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("reviewWO");
		},
		onPressWoList: function (oEvent) {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("WOList");
		},
		onPressspareParts: function (oEvent) {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("spareParts");
		},
		onPressEquipment: function (oEvent) {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("equipment");
		},
		onPressCrEdWo: function (oEvent) {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("createWO");
		},
		onPressCreateNotif: function (oEvent) {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("createNotif");
		},
		onPressNotifList: function (oEvent) {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("notifList");
		},
		onPressAnalysis: function (oEvent) {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("reports");
		},
		onPressShiftReport: function (oEvent) {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("shiftReport");
		}

	});
});