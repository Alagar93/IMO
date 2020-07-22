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

	return BaseController.extend("com.sap.incture.IMO_PM.controller.equipDetail", {
		formatter: formatter,
		onInit: function () {
			this.busy = new BusyDialog();
			this.router = sap.ui.core.UIComponent.getRouterFor(this);
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("equipDetail").attachPatternMatched(this._onObjectMatched, this);
			//this.fnFetchFiveWOs();
			var mLookupModel = this.getOwnerComponent().getModel("mLookupModel");
			this.mLookupModel = mLookupModel;

		},
		onAfterRendering: function () {
			this._setScreenHeights();
			sap.ui.Device.resize.attachHandler(function () {
				this._setScreenHeights();
			}.bind(this));
		},

		_setScreenHeights: function () {
			var mLookupModel = this.mLookupModel;
			var detRowCount = (sap.ui.Device.resize.height - 200) / 40;
			detRowCount = Math.floor(detRowCount / 2);
			mLookupModel.setProperty("/detRowCount", detRowCount);
		},
		_onObjectMatched: function (oEvent) {
			var sBomFlag = this.getOwnerComponent().getModel("mEquipDetailModel").getProperty("/sBomFlag");
			var mEquipDetailModel = this.getOwnerComponent().getModel("mEquipDetailModel");
			if (sBomFlag === "YES") {
				this.fnFetchBOM();
			} else {

				mEquipDetailModel.setProperty("/aBOMSet", []);
			}
			this.fnFetchFiveWOs();
		},

		fnFetchBOM: function (oEvent) {
			var that = this;
			var oFilter = [];
			this.busy.open();
			var userPlant = this.mLookupModel.getProperty("/userPlant");
			this.fnResetFilers(this.getView().byId("idBOMTable"), "mEquipDetailModel");
			var oPortalDataModel = this.getOwnerComponent().getModel("oPortalDataModel");
			var sUrl = "/EquipBOMSet";
			var mEquipDetailModel = this.getOwnerComponent().getModel("mEquipDetailModel");
			oFilter.push(new Filter("equipId", "EQ", mEquipDetailModel.getProperty("/sEquipID")));
			
			oFilter.push(new Filter("plant", "EQ", userPlant));
			oFilter.push(new Filter("bomCategory", "EQ", "E"));
			oPortalDataModel.read(sUrl, {
				filters: oFilter,
				success: function (oData) {
					var aBOMSet = oData.results;
					mEquipDetailModel.setProperty("/aBOMSet", aBOMSet);
					mEquipDetailModel.refresh();
					that.busy.close();
				},
				error: function (oData) {
					mEquipDetailModel.setProperty("/aBOMSet", []);
					mEquipDetailModel.refresh();
					that.busy.close();
				}
			});
		},

		fnFetchFiveWOs: function () {
			var that = this;
			var oFilter = [];
			this.busy.open();
			var userPlant = this.mLookupModel.getProperty("/userPlant");
			this.fnResetFilers(this.getView().byId("idWOList"), "mEquipDetailModel");
			var oPortalDataModel = this.getOwnerComponent().getModel("oPortalDataModel");
			var sUrl = "/ConfirmationWOListSet";
			var mEquipDetailModel = this.getOwnerComponent().getModel("mEquipDetailModel");

			oFilter.push(new Filter("Equipment", "EQ", mEquipDetailModel.getProperty("/sEquipID")));
			oFilter.push(new Filter("FunLoc", "EQ", mEquipDetailModel.getProperty("/sFunLoc")));
			
			oFilter.push(new Filter("plant", "EQ", userPlant));
			oPortalDataModel.read(sUrl, {
				filters: oFilter,
				success: function (oData) {
					var aWorkOrderListSet = oData.results;
					$.each(aWorkOrderListSet, function (index, value) {
						value.PriorityDes = formatter.fnPriorityConversion(value.Priority);
					});

					mEquipDetailModel.setProperty("/aWorkOrderListSet", aWorkOrderListSet);
					mEquipDetailModel.refresh();
					that.busy.close();
				},
				error: function (oData) {
					mEquipDetailModel.setProperty("/aWorkOrderListSet", []);
					mEquipDetailModel.refresh();
					that.busy.close();
				}
			});

		}
	});
});