// jQuery.sap.require("./images/sapCompanyLogo.jpeg");
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
			//nischal -- modifications starts
			var oResourceModel = this.getOwnerComponent().getModel("i18n");
			this.oResourceModel = oResourceModel.getResourceBundle();

			var oPortalDataModel = this.getOwnerComponent().getModel("oPortalDataModel");
			this.oPortalDataModel = oPortalDataModel;

			var oLookupDataModel = this.getOwnerComponent().getModel("oLookupDataModel");
			this.oLookupDataModel = oLookupDataModel;

			var oWorkOrderOData = this.getOwnerComponent().getModel("oWorkOrderOData");
			this.oWorkOrderOData = oWorkOrderOData;
			oWorkOrderOData.setHeaders({
				"Accept": "application/json",
				"Content-Type": "application/json"
			});

			var oPortalUserLoginOData = this.getOwnerComponent().getModel("oPortalUserLoginOData");
			this.oPortalUserLoginOData = oPortalUserLoginOData;

			var mLookupModel = this.getOwnerComponent().getModel("mLookupModel");
			this.mLookupModel = mLookupModel;
			mLookupModel.setSizeLimit(10000);
			this.getLoggedInUser();
			//nischal -- modifications ends
		},
		onAfterRendering: function () {
			
			// this.getWOListTileCount();
		},
		getLoggedInUser: function () {
			var that = this;
			var sUrl = "/UserDetailsSet('')";
			var oPortalDataModel = this.oPortalDataModel;
			var mLookupModel = this.mLookupModel;
			oPortalDataModel.read(sUrl, {
				success: function (oData) {
					mLookupModel.setProperty("/userName", oData.UserName);
					mLookupModel.setProperty("/userRole", oData.Role);
					mLookupModel.setProperty("/userPlant", oData.UserPlant);
					that.fnInitializeLaunchView();
				},
				error: function (oData) {
					mLookupModel.setProperty("/userName", "");
				}
			});
		},
		fnInitializeLaunchView: function () {
			this.getNotifTileCount();
			this.getWOListTileCount();
		},
		//Function to get Work centers list
		getWorkCenters: function () {
			var sUrl = "/WorkcenterLookUpSet";
			var mLookupModel = this.mLookupModel;
			var oLookupDataModel = this.oLookupDataModel;
			var userPlant = mLookupModel.getProperty("/userPlant");
			var oFilter = [];
			oFilter.push(new Filter("Plant", "EQ", userPlant));
			oLookupDataModel.read(sUrl, {
				filters: oFilter,
				success: function (oData) {
					var aWorkCenterSet = oData.results;
					mLookupModel.setProperty("/aWorkCenterSet", aWorkCenterSet);
					mLookupModel.refresh();
				},
				error: function (oData) {
					mLookupModel.setProperty("/aWorkCenterSet", []);
					mLookupModel.refresh();
				}
			});
		},

		getWOListTileCount: function () {
			var that = this;
			// var mLookupModel = this.getOwnerComponent().getModel("mLookupModel");
			var mLookupModel = this.mLookupModel;
			// var oPortalDataModel = this.getOwnerComponent().getModel("oPortalDataModel");
			var oPortalDataModel = this.oPortalDataModel;
			var sWorkCenterSel = mLookupModel.getProperty("/sWorkCenterSel");
			var userPlant = mLookupModel.getProperty("/userPlant");
			mLookupModel.setProperty("/bBusyworkcenter", true);

			var oFilter = [];
			oFilter.push(new Filter("Plant", "EQ", userPlant));
			oFilter.push(new Filter("WorkCenter", "EQ", ""));
			oFilter.push(new Filter("Type", "EQ", "COUNT"));
			oPortalDataModel.read("/WorkOrderKPISet", {
				filters: oFilter,
				success: function (oData) {
					var oKPITilesCount = oData.results;
					var sCount = parseInt(oData.results[1].Number, 10);
					mLookupModel.setProperty("/woDueCount", sCount);
					// that.fnGetKPICounts(oKPITilesCount);
					// mLookupModel.setProperty("/bBusyworkcenter", false);
					mLookupModel.refresh();

				},
				error: function (oData) {
					mLookupModel.setProperty("/woDueCount", "0");
					mLookupModel.refresh();
				}
			});
		},
		getNotifTileCount: function () {
			var oModel = this.getView().getModel("oModel");
			var mLookupModel = this.mLookupModel;
			var userPlant = this.oUserDetailModel.getProperty("/userPlant");
			var sWorkCenterSel = "";

			var oFilter = [];
			oFilter.push(new Filter("Plant", "EQ", userPlant));
			oFilter.push(new Filter("WorkCenter", "EQ", sWorkCenterSel));
			oFilter.push(new Filter("Type", "EQ", "COUNT"));

			var oPortalDataModel = this.oPortalDataModel;
			oPortalDataModel.read("/KPISet", {
				filters: oFilter,
				success: function (oData) {
					var sCount = parseInt(oData.results[0].Number, 10);
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