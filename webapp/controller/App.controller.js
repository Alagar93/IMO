sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/IconPool",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/Fragment",
	'sap/m/Dialog',
	'sap/m/Text',
	'sap/m/Button',
	"com/sap/incture/IMO_PM/controller/BaseController",
	'sap/m/MessageBox',
	'sap/m/MessageToast',
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (Controller, IconPool, JSONModel, Fragment, Dialog, Text, Button, BaseController, MessageBox, MessageToast, Filter, FilterOperator) {
	"use strict";

	return BaseController.extend("com.sap.incture.IMO_PM.controller.App", {
		onInit: function () {
			this._router = this.getOwnerComponent().getRouter();
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
			var oMasterModel = new sap.ui.model.json.JSONModel(); //SH: Side navigation
			this.getView().setModel(oMasterModel, "oMasterModel");
			this.loadMasterData();
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
			if (sWorkCenterSel === undefined || sWorkCenterSel === null) {
				sWorkCenterSel = "";
			}

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
			if (sWorkCenterSel === null || sWorkCenterSel === undefined) {
				sWorkCenterSel = "";
			}
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
		},
		loadMasterData: function () {
			var oMasterModel = this.getView().getModel("oMasterModel");
			if (window.origin.indexOf("webidetesting") >= 0) {
				var sUrl = "/webapp/model/masterData.json";
			} else {
				sUrl = "/model/masterData.json";
			}
			var oModel = new sap.ui.model.json.JSONModel();
			oModel.loadData(sUrl, true, "GET", false, false);
			oModel.attachRequestCompleted(function (oEvent) {
				if (oEvent.getParameter("success")) {
					var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
					oRouter.navTo("dashboard"); //set initial page
					var resultData = oEvent.getSource().getData();
					if (resultData) {
						oMasterModel.setData(resultData);
						var oSideNavigation = this.getView().byId('idSideNavigation');
						var oToolPage = this.getView().byId("idToolPage");
						oMasterModel.setProperty("/isLocked", true);
						oToolPage.setSideExpanded(false);
						oSideNavigation.removeStyleClass("murphySideNavHover");
						oSideNavigation.addStyleClass("murphySideNavNormal");
						oMasterModel.refresh(true);
						//Comparing list items by looping as SelectedKey is not available in 1.56
						//Can be modified by using selectedKey when MCQ/MCP upgraded to min 1.62
						var oNavList = this.getView().byId("idNavList");
						var oNavText = window.location.href.split("/")[window.location.href.split("/").length - 1];
						var oNavListItems = oNavList.getItems();
						for (var i = 0; i < oNavListItems.length; i++) {
							var oNavListItemTabKey = oNavListItems[i].getBindingContext("oMasterModel").getObject().tabKey;
							if (oNavListItemTabKey === oNavText) {
								oNavList.setSelectedItem(oNavListItems[i]);
								return "";
							}
						}
						oNavList.setSelectedItem(oNavList.getItems()[0]);
					}
				} else {
					MessageToast.show("Error in Loading Master Data");
				}
			}.bind(this));
			oModel.attachRequestFailed(function (oEvent) {
				MessageToast.show("Error in Loading Master Data");
			}.bind(this));
		},
		onSideNavSelect: function (oEvent) {
			var oBindingContext = oEvent.getSource().getBindingContext('oMasterModel');
			if (!oBindingContext) {
				return "";
			}
			var oBindingKey = oBindingContext.getObject().tabKey;
			this._router.navTo(oBindingKey);
		},
		onLockSideNav: function () {
			var oSideNavigation = this.getView().byId('idSideNavigation');
			var oToolPage = this.getView().byId("idToolPage");
			var bExpanded = oSideNavigation.getExpanded();
			var bExpanded = this.getView().getModel("oMasterModel").getProperty("/isLocked");
			if (!bExpanded) {
				//when the side panel is made to lock
				oSideNavigation.$().hover();
				oToolPage.setSideExpanded(false);
				oSideNavigation.removeStyleClass("murphySideNavHover");
				oSideNavigation.addStyleClass("murphySideNavNormal");
			} else {
				oSideNavigation.$().hover(() => {
						if (!(this.getView().getModel("oMasterModel").getProperty("/isLocked"))) {
							oToolPage.setSideExpanded(true);
							oSideNavigation.removeStyleClass("murphySideNavNormal");
							oSideNavigation.addStyleClass("murphySideNavHover");
						}
					},
					() => {
						if (!(this.getView().getModel("oMasterModel").getProperty("/isLocked"))) {
							oToolPage.setSideExpanded(false);
							oSideNavigation.removeStyleClass("murphySideNavHover");
							oSideNavigation.addStyleClass("murphySideNavNormal");
						}
					});
			}
			this.getView().getModel("oMasterModel").setProperty("/isLocked", !bExpanded);
		},
	});
});