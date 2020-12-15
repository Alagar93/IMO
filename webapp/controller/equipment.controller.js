sap.ui.define([
	"com/sap/incture/IMO_PM/controller/BaseController",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"com/sap/incture/IMO_PM/formatter/formatter",
	"sap/m/BusyDialog"
], function (BaseController, Controller, JSONModel, Filter, FilterOperator, formatter, BusyDialog) {
	"use strict";

	return BaseController.extend("com.sap.incture.IMO_PM.controller.equipment", {
		formatter: formatter,
		onInit: function () {

			this.busy = new BusyDialog();
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
			var mLookupModel = this.getOwnerComponent().getModel("mLookupModel");
			this.mLookupModel = mLookupModel;
			mLookupModel.setSizeLimit(10000);
			var oViewSetting = {
				"iTop": 100,
				"iSkip": 0,
				"sEquip": "",
				"sFunLoc": ""
			};
			this.mLookupModel.setProperty("/", oViewSetting);
			this.getLoggedInUser();
		},

		//Function to get logged in user
		getLoggedInUser: function (viewType) {
			var that = this;
			var sUrl = "/UserDetailsSet('')";
			var mLookupModel = this.mLookupModel;
			var oPortalDataModel = this.oPortalDataModel;
			oPortalDataModel.read(sUrl, {
				success: function (oData) {
					mLookupModel.setProperty("/firstName", oData.Firstname);
					mLookupModel.setProperty("/fullName", oData.Fullname);
					mLookupModel.setProperty("/secondName", oData.Secondname);
					mLookupModel.setProperty("/userName", oData.UserName);
					mLookupModel.setProperty("/userRole", oData.Role);
					mLookupModel.setProperty("/userPlant", oData.UserPlant);
					that.fnFetchEquipList();
					mLookupModel.refresh();
				},
				error: function (oData) {
					mLookupModel.setProperty("/userName", "");
					mLookupModel.refresh();
				}
			});
		},

		onAfterRendering: function () {
			this._setScreenHeights();
			sap.ui.Device.resize.attachHandler(function () {
				this._setScreenHeights();
			}.bind(this));
		},

		_setScreenHeights: function () {
			var mLookupModel = this.mLookupModel;
			var rowCount = (sap.ui.Device.resize.height - 80) / 40;
			rowCount = Math.floor(rowCount - 3);
			mLookupModel.setProperty("/rowCount", rowCount);
		},
		onSelectEquip: function (oEvent) {
			var sPath = oEvent.getSource().getBindingContext("mLookupModel").getPath();
			var oSelectedRowItem = this.getView().getModel("mLookupModel").getProperty(sPath);
			var sEquipID = oSelectedRowItem.Equnr;
			var sFunLoc = oSelectedRowItem.Tplnr;
			var sBomFlag = oSelectedRowItem.BomFlag;
			var mEquipDetailModel = this.getOwnerComponent().getModel("mEquipDetailModel");
			mEquipDetailModel.setProperty("/sEquipID", sEquipID);
			mEquipDetailModel.setProperty("/sFunLoc", sFunLoc);
			mEquipDetailModel.setProperty("/sBomFlag", sBomFlag);
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("equipDetail");

		},
		fnFetchEquipList: function (oEvent) {

			var that = this;
			this.busy.open();
			var mLookupModel = this.mLookupModel;
			var oPortalDataModel = this.oPortalDataModel;
			var TechId = mLookupModel.getProperty("/TechId");
			if (!TechId) {
				TechId = "";
			}
			var EqIdDes = mLookupModel.getProperty("/sEquip");
			if (!EqIdDes) {
				EqIdDes = "";
			}
			var sFunLoc = mLookupModel.getProperty("/sFunLoc");
			if (!sFunLoc) {
				sFunLoc = "";
			}

			var oFilter = [];
			oFilter.push(new Filter("Equnr", "EQ", EqIdDes.toUpperCase()));
			oFilter.push(new Filter("Tidnr", "EQ", ""));
			oFilter.push(new Filter("Eqktu", "EQ", EqIdDes.toUpperCase()));
			oFilter.push(new Filter("Tplnr", "EQ", sFunLoc.toUpperCase()));

			var userPlant = mLookupModel.getProperty("/userPlant");
			oFilter.push(new Filter("plant", "EQ", userPlant));

			oPortalDataModel.read("/EquipListSet", {
				filters: oFilter,
				success: function (oData, oResponse) {
					var aEquipmentsTable = oData.results;
					mLookupModel.setProperty("/aEquipmentsTable", aEquipmentsTable);
					that.busy.close();
				},
				error: function (oResponse) {
					mLookupModel.setProperty("/aEquipmentsTable", []);
					that.busy.close();
				}
			});
		},

		//Function to get Equipment List and show in a pop-up
		equipmentValueHelp: function (oEvent) {
			if (!this.equipmentsListDialog) {
				this.equipmentsListDialog = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.equipmentsList", this);
				this.getView().addDependent(this.equipmentsListDialog);
			}
			this.equipmentsListDialog.open();
		},
		onEquipSelect: function (oEvent) {
			var mLookupModel = this.mLookupModel;
			var oSource = oEvent.getParameter("listItem");
			var sPath = oSource.getBindingContextPath();
			var iEqId = mLookupModel.getProperty(sPath + "/Equnr");
			var iFunLoc = mLookupModel.getProperty(sPath + "/Tplnr");
			var sWorkCenterSel = mLookupModel.getProperty(sPath + "/Gewrk");
			mLookupModel.setProperty("/sEquip", iEqId);
			mLookupModel.setProperty("/sWorkCenterSel", sWorkCenterSel);
			mLookupModel.setProperty("/sEquipFilter", iEqId);
			mLookupModel.setProperty("/sNotifEquipFilter", iEqId);
			mLookupModel.setProperty("/sFunLoc", iFunLoc);
			this.equipmentsListDialog.close();
		},
		onCancelDialogEquip: function (oEvent) {
			this.equipmentsListDialog.close();
		},
		onSearchEquip: function (oEvent) {
			var that = this;
			this.busy.open();
			var mLookupModel = this.mLookupModel;
			var oPortalDataModel = this.oPortalDataModel;
			var TechId = mLookupModel.getProperty("/TechId");
			if (!TechId) {
				TechId = "";
			}
			var EqIdDes = mLookupModel.getProperty("/EqIdDes");
			if (!EqIdDes) {
				EqIdDes = "";
			}

			var oFilter = [];
			oFilter.push(new Filter("Equnr", "EQ", EqIdDes.toUpperCase()));
			oFilter.push(new Filter("Tidnr", "EQ", TechId.toUpperCase()));
			oFilter.push(new Filter("Eqktu", "EQ", EqIdDes.toUpperCase()));

			if (EqIdDes || TechId) {
				oPortalDataModel.read("/EquipmentDetailsSet", {
					filters: oFilter,
					success: function (oData, oResponse) {
						var aEquipmentsList = oData.results;
						mLookupModel.setProperty("/aEquipmentsList", aEquipmentsList);
						that.busy.close();
					},
					error: function (oResponse) {
						mLookupModel.setProperty("/aEquipmentsList", []);
						that.busy.close();
					}
				});
			}
		}

	});
});