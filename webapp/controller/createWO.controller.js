sap.ui.define([
	"com/sap/incture/IMO_PM/controller/BaseController",
	"com/sap/incture/IMO_PM/formatter/formatter",
	"com/sap/incture/IMO_PM/util/util",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (BaseController, formatter, util, JSONModel, Filter, FilterOperator) {
	"use strict";

	return BaseController.extend("com.sap.incture.IMO_PM.controller.createWO", {
		formatter: formatter,
		util: util,

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.mylan.createWorkOrder.view.createWO
		 */
		onInit: function () {
			var that = this;
			this.fnInitCreateWOApp("WK_CREATE_ORDER");
			this.resetCreateWOfields();
			this.router = sap.ui.core.UIComponent.getRouterFor(this);

			this.router.attachRoutePatternMatched(function (oEvent) {
				that.routePatternMatched(oEvent);
			});

		},

		routePatternMatched: function (oEvent) {
			var mLookupModel = this.mLookupModel;
			mLookupModel.setProperty("/sOrderTypeSel", "");
			mLookupModel.setProperty("/sEquip", "");
			mLookupModel.setProperty("/sFunLoc", "");
			mLookupModel.setProperty("/sPrior", "");
			mLookupModel.setProperty("/iSelectedIndex", 0);
			mLookupModel.setProperty("/sUnAssignedWOFlag", true);
			this.setColumnLayout(); //nischal -- 
			this.setColumnLayoutCreateWithNotif(); //nischal --
			// this.resetCreateWOfields();
		},
		//Function to reset Create WO fields
		resetCreateWOfields: function () {

			var oViewSettings = {
				"iSelectedIndex": 0, // 0-Create 1-Create by ref 2-Create by notif
				"sOrderTypeSel": "",
				"sEquip": "",
				"sFunLoc": "",
				"sPriorSel": "",
				"iProcessOrderNo": "",
				"iWONum": "",
				"iTop": 50,
				"iSkip": 0,
				"iTopNotif": 50,
				"iSkipNotif": 0,
				"iWONumFilter": "",
				"aStatus": [{
					"id": "CRTD"
				}, {
					"id": "REL"
				}, {
					"id": "PCNF"
				}, {
					"id": "CNF"
				}, {
					"id": "TECO"
				}],
				"sOrderTypeSelFilter": "",
				"sStatusSelFilter": "",
				"sWorderIdDesFilter": "",
				"sPriorSelFilter": "",
				"sAssignedTo": "",
				"sCreatedBy": "",
				"sNotifIDDesFilter": "",
				"sEquipFilter": "",
				"sNotifStatusFilter": "",
				"sNotifIdFilter": "",
				"sNotifEquipFilter": "",
				"sNotifBDFilter": "",
				"sNotifPriorFilter": "",
				"sNotifWkCenterFilter": "",
				"sWorkCenterFilter": "",
				"aBDown": [{
					"des": "YES"
				}, {
					"des": "NO"
				}],
				"sUnAssignedWOFlag": true
			};
			this.mLookupModel.setProperty("/", oViewSettings);
			this.getOrderType();
			this.getWOPriorities();
			this.getWorkCentersCreateWO();
			this.getFavEquips();
		},

		//Function to get Equipment List and show in a pop-up
		equipmentValueHelp: function (oEvent) {
			if (!this.equipmentsListDialog) {
				this.equipmentsListDialog = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.equipmentsListWO", this);
				this.getView().addDependent(this.equipmentsListDialog);
			}
			this.equipmentsListDialog.open();
		},

		//Function to select a Equipment and auto-populate Functional location
		onEquipSelect: function (oEvent) {
			var mLookupModel = this.mLookupModel;
			var oSource = oEvent.getParameter("listItem");
			var sPath = oSource.getBindingContextPath();
			var iEqId = mLookupModel.getProperty(sPath + "/Equnr");
			var iFunLoc = mLookupModel.getProperty(sPath + "/Tplnr");
			var equipDesc = mLookupModel.getProperty(sPath + "/Eqktu");
			var technicalId = mLookupModel.getProperty(sPath + "/Tidnr");
			var sWorkCenterSel = mLookupModel.getProperty(sPath + "/Gewrk");
			var sPlanGrpSel = mLookupModel.getProperty(sPath + "/Ingrp");
			var sCatelogProf = mLookupModel.getProperty(sPath + "/Rbnr");
			mLookupModel.setProperty("/sEquip", iEqId);
			mLookupModel.setProperty("/sWorkCenterSel", sWorkCenterSel);
			mLookupModel.setProperty("/sPlanGrpSel", sPlanGrpSel);
			mLookupModel.setProperty("/sCatelogProf", sCatelogProf);
			mLookupModel.setProperty("/sEquipFilter", iEqId);
			mLookupModel.setProperty("/sNotifEquipFilter", iEqId);
			mLookupModel.setProperty("/sFunLoc", iFunLoc);
			mLookupModel.setProperty("/EquipDesc", equipDesc);
			mLookupModel.setProperty("/AssetId", technicalId);
			this.setEquipWorkCenter(sWorkCenterSel, mLookupModel);
			this.getEquipsAssmebly(iEqId);
			// this.equipmentsListDialog.close();
			this.onCancelDialogEquip();
		},

		//Function to set Work center for a selected 
		setEquipWorkCenter: function (sWorkCenterSel, mLookupModel) {
			var workCenterId = "";
			var aWorkCenterSet = mLookupModel.getProperty("/aWorkCenterSet");
			aWorkCenterSet.filter(function (obj, i) {
				if (obj.ObjectId === sWorkCenterSel) {
					workCenterId = obj.WorkcenterId;
				}
			});
			mLookupModel.setProperty("/sWorkCenterSel", workCenterId);
		},

		//Function to get Equiments List
		onSearchWOFilter: function (oEvent) {
			var that = this;
			//this.busy.open();
			var mLookupModel = this.mLookupModel;
			var oPortalDataModel = this.oPortalDataModel;
			var userPlant = this.oUserDetailModel.getProperty("/userPlant");
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
			oFilter.push(new Filter("plant", "EQ", userPlant));

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
		},

		onSearchFavEqips: function (oEvent) {
			//this.validateIntegerValues(oEvent, this);
			var aFilters = [];
			var sQuery = oEvent.getSource().getValue();
			if (sQuery && sQuery.length > 0) {
				var oFilterByIDDes = new Filter({
					filters: [new Filter("Equnr", FilterOperator.Contains, sQuery), new Filter("Eqktu", FilterOperator.Contains, sQuery)],
					and: false
				});
				aFilters.push(oFilterByIDDes);
			}
			var oTable = oEvent.getSource().getParent().getContent()[1].getContent()[0];
			var oBinding = oTable.getBinding("items");
			oBinding.filter(aFilters);
		},

		onHandleAdvFilterWO: function (oEvent) {
			if (!this._oDialogWO) {
				this._oDialogWO = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.advanceFilter", this);
				this.getView().addDependent(this._oDialogWO);
			}
			var that = this;
			var mLookupModel = this.mLookupModel;
			this.busy.open();
			var sUrl = "/GetWorkOrderVariantSet";
			var oPortalDataModel = this.oPortalDataModel;
			var oFilter = [];
			var oRequest = {
				"userId": mLookupModel.getProperty("/userName"),
				"filterType": "reference"
			};
			oFilter.push(new Filter("REQUEST", "EQ", JSON.stringify(oRequest)));
			oPortalDataModel.read(sUrl, {
				filters: oFilter,
				success: function (oData) {
					var oComments = oData.results[0];
					if (oComments.RESPONSE) {
						oComments = JSON.parse(oComments.RESPONSE);
						mLookupModel.setProperty("/idwofilter", oComments.id);
						mLookupModel.setProperty("/sOrderTypeSelFilter", oComments.refWOType);
						mLookupModel.setProperty("/sPriorSelFilter", oComments.refPriority);
						mLookupModel.setProperty("/sStatusSelFilter", oComments.refStatus);
						mLookupModel.setProperty("/iWONumFilter", oComments.refWONumber);
						mLookupModel.setProperty("/sEquipFilter", oComments.refEquipment);
						mLookupModel.setProperty("/sCreatedBy", oComments.refCreatedBy);
						mLookupModel.setProperty("/sAssignedTo", oComments.refAssignedTo);
						mLookupModel.setProperty("/sWorkCenterFilter", "");
						mLookupModel.refresh();
					} else {
						mLookupModel.setProperty("/idwofilter", "");
						mLookupModel.setProperty("/sOrderTypeSelFilter", "");
						mLookupModel.setProperty("/sPriorSelFilter", "");
						mLookupModel.setProperty("/sStatusSelFilter", "");
						mLookupModel.setProperty("/iWONumFilter", "");
						mLookupModel.setProperty("/sEquipFilter", "");
						mLookupModel.setProperty("/sCreatedBy", "");
						mLookupModel.setProperty("/sAssignedTo", "");
						mLookupModel.setProperty("/sWorkCenterFilter", "");
						mLookupModel.refresh();
					}
					that.busy.close();
				},
				error: function (oData) {
					mLookupModel.setProperty("/idwofilter", "");
					mLookupModel.setProperty("/sOrderTypeSelFilter", "");
					mLookupModel.setProperty("/sPriorSelFilter", "");
					mLookupModel.setProperty("/sStatusSelFilter", "");
					mLookupModel.setProperty("/iWONumFilter", "");
					mLookupModel.setProperty("/sEquipFilter", "");
					mLookupModel.setProperty("/sCreatedBy", "");
					mLookupModel.setProperty("/sAssignedTo", "");
					mLookupModel.setProperty("/sWorkCenterFilter", "");
					mLookupModel.refresh();
					that.busy.close();
				}
			});
			this._oDialogWO.open();
		},

		onHandleNotifAdvFilter: function (oEvent) {
			if (!this._oDialogNotif) {
				this._oDialogNotif = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.advFilterNotifCreateWO", this);
				this.getView().addDependent(this._oDialogNotif);
			}
			var that = this;
			var mLookupModel = this.mLookupModel;
			this.busy.open();
			var sUrl = "/GetNotifVariantSet";
			var oPortalDataModel = this.oPortalDataModel;
			var oFilter = [];
			var oRequest = {
				"userId": mLookupModel.getProperty("/userName"),
				"filterType": "notification"
			};
			oFilter.push(new Filter("REQUEST", "EQ", JSON.stringify(oRequest)));
			oPortalDataModel.read(sUrl, {
				filters: oFilter,
				success: function (oData) {
					var oComments = oData.results[0];
					if (oComments.RESPONSE) {
						oComments = JSON.parse(oComments.RESPONSE);
						mLookupModel.setProperty("/idNotifFilter", oComments.id);
						mLookupModel.setProperty("/sNotifStatusFilter", oComments.notiStatus);
						mLookupModel.setProperty("/sNotifIdFilter", oComments.notiNotiId);
						mLookupModel.setProperty("/sNotifEquipFilter", oComments.notiEquipment);
						mLookupModel.setProperty("/sNotifBDFilter", oComments.notiBreakDown);
						mLookupModel.setProperty("/sNotifPriorFilter", oComments.notiPriority);
						mLookupModel.setProperty("/sNotifWkCenterFilter", "");
						mLookupModel.refresh();

					} else {
						mLookupModel.setProperty("/idNotifFilter", "");
						mLookupModel.setProperty("/sNotifStatusFilter", "");
						mLookupModel.setProperty("/sNotifIdFilter", "");
						mLookupModel.setProperty("/sNotifEquipFilter", "");
						mLookupModel.setProperty("/sNotifBDFilter", "");
						mLookupModel.setProperty("/sNotifPriorFilter", "");
						mLookupModel.setProperty("/sNotifWkCenterFilter", "");
						mLookupModel.refresh();
					}
					that.busy.close();
				},
				error: function (oData) {
					mLookupModel.setProperty("/idNotifFilter", "");
					mLookupModel.setProperty("/sNotifStatusFilter", "");
					mLookupModel.setProperty("/sNotifIdFilter", "");
					mLookupModel.setProperty("/sNotifEquipFilter", "");
					mLookupModel.setProperty("/sNotifBDFilter", "");
					mLookupModel.setProperty("/sNotifPriorFilter", "");
					mLookupModel.setProperty("/sNotifWkCenterFilter", "");
					mLookupModel.refresh();
				}
			});
			this._oDialogNotif.open();
		},

		onSearchWO: function (oEvent) {
			var mLookupModel = this.mLookupModel;
			mLookupModel.setProperty("/iSkip", 0);
			mLookupModel.setProperty("/aWorkOrderListSet", []);
			this.onCreateOptionChange();
		},

		onSearchNotif: function (oEvent) {
			var mLookupModel = this.mLookupModel;
			mLookupModel.setProperty("/iSkipNotif", 0);
			mLookupModel.setProperty("/aNotificationListSet", []);
			this.onCreateOptionChange();
		},

		onCancelDialogEquip: function (oEvent) {
			this.equipmentsListDialog.close();
			this.equipmentsListDialog.destroy();
			this.equipmentsListDialog = null;
		},

		onCancelDialogWO: function () {
			this._oDialogWO.close();
		},

		onCancelDialogNotif: function () {
			this._oDialogNotif.close();
		},

		onCreateWO: function () {
			var sMsg = "";
			var that = this;
			var mLookupModel = this.mLookupModel;
			var iSelectedOption = mLookupModel.getProperty("/iSelectedIndex");
			var iSelectedWO = mLookupModel.getProperty("/iSelectedWO");
			var aOperationListSet = mLookupModel.getProperty("/aOperationListSet");

			if (iSelectedOption === 1) { // create by ref
				if (!iSelectedWO) {
					sMsg = this.oResourceModel.getText("pleaseselectwo");
					this.showMessage(sMsg, "I");
				} else {
					if (!this._oDialogOperns) {
						this._oDialogOperns = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.operations", this);
						this.getView().addDependent(this._oDialogOperns);
					}
					this._oDialogOperns.getContent()[0].clearSelection();
					mLookupModel.setProperty("/aOperationListSet", []);
					this._oDialogOperns.open();
					this.busy.open();
					var sUrl = "/OperationListSet";
					var oFilter = [];
					var userPlant = this.oUserDetailModel.getProperty("/userPlant");
					oFilter.push(new Filter("Orderid", "EQ", iSelectedWO));
					oFilter.push(new Filter("Plant", "EQ", userPlant));

					var oPortalDataModel = this.oPortalDataModel;
					oPortalDataModel.read(sUrl, {
						filters: oFilter,
						success: function (oData) {
							aOperationListSet = oData.results;
							mLookupModel.setProperty("/aOperationListSet", aOperationListSet);
							mLookupModel.refresh();
							that.busy.close();
						},
						error: function (oData) {
							mLookupModel.setProperty("/aWorkOrderListSet", []);
							mLookupModel.refresh();
							that.busy.close();
						}
					});
				}
			} else if (iSelectedOption === 2) { // create by Notification
				var oTable = this.getView().byId("notifListId");
				var aSelectedNotifsContext = mLookupModel.getProperty("/selectedNotifs");
				var aSelectedIndices = mLookupModel.getProperty("/iSelectedIndices");

				if (aSelectedIndices < 1 || !aSelectedIndices) {
					sMsg = this.oResourceModel.getText("pleaseselectnotif");
					this.showMessage(sMsg, "I");
				} else {
					var aNotifListModel = oTable.getBindingInfo("rows").binding.getModel();
					var aSelectedNotifs = [];

					for (var i = 0; i < aSelectedNotifsContext.length; i++) {
						aSelectedNotifs.push(aNotifListModel.getProperty(aSelectedNotifsContext[i].sPath));
					}
					if (this.fnCheckSameEquipments(aSelectedNotifs)) {
						var oNotifs = this.addNotifWO(aSelectedNotifs);
						this.onCreateNotifWorkOrder(oNotifs, aSelectedNotifs);
					} else {
						this.showMessage(this.oResourceModel.getText("plnotifandequip"));
					}
				}
			}

		},

		onCancelDialogOperns: function () {
			this._oDialogOperns.close();
		},

		//Function to check mandatory fields in Create WO view on clcik of NEXT button
		validateMandatoryFields: function () {
			var oErrorMsg = "";
			var mLookupModel = this.mLookupModel;
			var oResourceModel = this.oResourceModel;
			var orderType = mLookupModel.getProperty("/sOrderTypeSel");
			var equipment = mLookupModel.getProperty("/sEquip");
			var priority = mLookupModel.getProperty("/sPrior");
			if (orderType) {
				if (equipment) {
					if (priority) {
						return true;
					} else {
						oErrorMsg = oResourceModel.getText("CREATE_SELECT_PRIORITY");
						this.showMessage(oErrorMsg);
					}
				} else {
					oErrorMsg = oResourceModel.getText("CREATE_SELECT_EQUIPMENT");
					this.showMessage(oErrorMsg);
				}
			} else {
				oErrorMsg = oResourceModel.getText("CREATE_SELECT_ORDER_TYPE");
				this.showMessage(oErrorMsg);
			}
			return false;
		},

		//Function to set mandatory fields from Create WO to Detail WO view
		setFieldValOnDetailNav: function () {
			var mLookupModel = this.mLookupModel;
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var orderType = mLookupModel.getProperty("/sOrderTypeSel");
			var equipment = mLookupModel.getProperty("/sEquip");
			var funcLocation = mLookupModel.getProperty("/sFunLoc");
			var priority = mLookupModel.getProperty("/sPrior");
			var sWorkCenterSel = mLookupModel.getProperty("/sWorkCenterSel");
			var equipDesc = mLookupModel.getProperty("/EquipDesc");
			var plannerGrp = mLookupModel.getProperty("/sPlanGrpSel");
			var technicalId = mLookupModel.getProperty("/AssetId");
			// var setOrderStatus = mLookupModel.getProperty("/SetOrderStatus");
			//nischal -- Setting RequiredStartDate and EndDate Value Based on Priority in WorkOrderDetailViewModel
			this.fnSetDateBasedOnPriority(priority);
			oWorkOrderDetailModel.setProperty("/OrderType", orderType);
			oWorkOrderDetailModel.setProperty("/Equipment", equipment);
			oWorkOrderDetailModel.setProperty("/FunctLoc", funcLocation);
			oWorkOrderDetailModel.setProperty("/Priority", priority);
			oWorkOrderDetailModel.setProperty("/MnWkCtr", sWorkCenterSel);
			oWorkOrderDetailModel.setProperty("/EquipDesc", equipDesc);
			oWorkOrderDetailModel.setProperty("/Plangroup", plannerGrp);
			this.oWorkOrderDetailViewModel.setProperty("/AssetId", technicalId);
			oWorkOrderDetailModel.refresh();
		},
		//function to set Required Start Date and End Date based on Priority
		fnSetDateBasedOnPriority: function (sVal) {
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var tempStartDate = new Date();
			var tempEndDate = new Date();
			var oReqStartDate, oReqEndDate;
			if (sVal === "1") {
				tempEndDate.setDate(tempEndDate.getDate() + 7);
				var someFormattedDate = this.getFormattedDate(tempEndDate);
				oReqEndDate = new Date(someFormattedDate);
				oReqStartDate = new Date();

			} else if (sVal === "2") {
				tempStartDate.setDate(tempStartDate.getDate() + 7);
				var someFormattedDate = this.getFormattedDate(tempStartDate);
				oReqStartDate = new Date(someFormattedDate);

				tempEndDate.setDate(tempEndDate.getDate() + 30);
				someFormattedDate = this.getFormattedDate(tempEndDate);
				oReqEndDate = new Date(someFormattedDate);
			} else if (sVal === "3") {
				tempStartDate.setDate(tempStartDate.getDate() + 14);
				var someFormattedDate = this.getFormattedDate(tempStartDate);
				oReqStartDate = new Date(someFormattedDate);

				tempEndDate.setDate(tempEndDate.getDate() + 90);
				someFormattedDate = this.getFormattedDate(tempEndDate);
				oReqEndDate = new Date(someFormattedDate);

			} else if (sVal === "4") {
				tempStartDate.setDate(tempStartDate.getDate() + 1);
				var someFormattedDate = this.getFormattedDate(tempStartDate);
				oReqStartDate = new Date(someFormattedDate);

				tempEndDate.setDate(tempEndDate.getDate() + 12);
				someFormattedDate = this.getFormattedDate(tempEndDate);
				oReqEndDate = new Date(someFormattedDate);
			} else if (sVal === "E") {
				tempEndDate.setDate(tempEndDate.getDate() + 3);
				var someFormattedDate = this.getFormattedDate(tempEndDate);
				oReqEndDate = new Date(someFormattedDate);
				oReqStartDate = new Date();
			}
			oWorkOrderDetailViewModel.setProperty("/oRequiredStartDate", oReqStartDate);
			oWorkOrderDetailViewModel.setProperty("/oRequiredEndDate", oReqEndDate);

		},
		getFormattedDate: function (sDate) {
			var dd = sDate.getDate();
			var mm = sDate.getMonth() + 1;
			var y = sDate.getFullYear();
			var someFormattedDate = y + '/' + mm + '/' + dd;
			return someFormattedDate;
		},

		//function to fetch data for work order list and notification list on change of create option(radio button)
		onCreateOptionChange: function () {
			var sUrl = "";
			var that = this;
			var mLookupModel = this.mLookupModel;
			var iSelectedIndex = mLookupModel.getProperty("/iSelectedIndex");
			var iTop = mLookupModel.getProperty("/iTop");
			if (!iTop) {
				iTop = 50;
				mLookupModel.setProperty("/iTop", iTop);
			}
			var iSkip = mLookupModel.getProperty("/iSkip");
			if (!iSkip) {
				iSkip = 0;
				mLookupModel.setProperty("/iSkip", iSkip);
			}
			var iTopNotif = mLookupModel.getProperty("/iTopNotif");
			if (!iTopNotif) {
				iTopNotif = 50;
				mLookupModel.setProperty("/iTopNotif", iTopNotif);
			}
			var iSkipNotif = mLookupModel.getProperty("/iSkipNotif");
			if (!iSkipNotif) {
				iSkipNotif = 0;
				mLookupModel.setProperty("/iSkipNotif", iSkipNotif);
			}
			var oPortalDataModel = this.oPortalDataModel;
			var userPlant = this.oUserDetailModel.getProperty("/userPlant");
			var oFilter = [];

			if (iSelectedIndex === 1) {
				var aWorkOrderListSet = mLookupModel.getProperty("/aWorkOrderListSet");
				this.busy.open();
				sUrl = "/WorkOrderListSet";
				oFilter.push(new Filter("Orderid", "EQ", mLookupModel.getProperty("/iWONumFilter")));
				oFilter.push(new Filter("OrderType", "EQ", mLookupModel.getProperty("/sOrderTypeSelFilter")));
				oFilter.push(new Filter("SysStatus", "EQ", mLookupModel.getProperty("/sStatusSelFilter")));
				oFilter.push(new Filter("WoDes", "EQ", mLookupModel.getProperty("/sWorderIdDesFilter")));
				oFilter.push(new Filter("EnteredByName", "EQ", mLookupModel.getProperty("/sCreatedBy")));
				oFilter.push(new Filter("Priority", "EQ", mLookupModel.getProperty("/sPriorSelFilter")));
				oFilter.push(new Filter("AssignedTech", "EQ", mLookupModel.getProperty("/sAssignedTo")));
				oFilter.push(new Filter("Equipment", "EQ", mLookupModel.getProperty("/sEquipFilter")));
				oFilter.push(new Filter("MnWkCtr", "EQ", mLookupModel.getProperty("/sWorkCenterFilter")));
				oFilter.push(new Filter("FunctLoc", "EQ", ""));
				oFilter.push(new Filter("Plant", "EQ", userPlant));
				oPortalDataModel.read(sUrl, {
					filters: oFilter,
					urlParameters: {
						"$top": iTop,
						"$skip": iSkip
					},
					success: function (oData) {
						mLookupModel.setProperty("/iSelectedWO", ""); // clear selected wo
						aWorkOrderListSet = oData.results;

						$.each(aWorkOrderListSet, function (index, value) { //AN: #obxSearch
							value.radio = false; // clear selected radio button
							value.PriorityDes = formatter.fnPriorityConversion(value.Priority);
							value.SysStatusDes = formatter.fnWOStatusConversion(value.SysStatus);
							if (value.StartDate) {
								value.StartDateString = that.fnDateConversion(value.StartDate);
							}
							if (value.FinishDate) {
								value.FinishDateString = that.fnDateConversion(value.FinishDate);
							}
							if (value.EnterDate) {
								value.EnterDateString = that.fnDateConversion(value.EnterDate);
							}

						});
						//nischal --concat after changing date format
						if (iSkip !== 0) {
							aWorkOrderListSet = aWorkOrderListSet.concat(mLookupModel.getProperty("/aWorkOrderListSet"));
						}
						mLookupModel.setProperty("/aWorkOrderListSet", aWorkOrderListSet);
						mLookupModel.setProperty("/iDisplayedWOCount", aWorkOrderListSet.length);
						mLookupModel.refresh();
						that.busy.close();
					},
					error: function (oData) {
						mLookupModel.setProperty("/aWorkOrderListSet", []);
						mLookupModel.refresh();
						that.busy.close();
					}
				});
			} else if (iSelectedIndex === 2) { // create from notification
				var aNotificationListSet = mLookupModel.getProperty("/aNotificationListSet");
				this.busy.open();
				sUrl = "/NotificationListSet";
				var sCreatedOnStart = mLookupModel.getProperty("/sCreatedOnStart");
				if (!sCreatedOnStart) {
					sCreatedOnStart = formatter.GetMonthsBackDate(90);
					sCreatedOnStart = new Date(sCreatedOnStart + " " + new Date().getHours() + ":" + new Date().getMinutes() + ":" + new Date().getSeconds());
				} else {
					sCreatedOnStart = new Date(sCreatedOnStart + " " + new Date().getHours() + ":" + new Date().getMinutes() + ":" + new Date().getSeconds());
				}
				var sCreatedOnEnd = mLookupModel.getProperty("/sCreatedOnEnd");
				if (!sCreatedOnEnd) {
					sCreatedOnEnd = new Date();
				} else {
					sCreatedOnEnd = new Date(sCreatedOnEnd + " " + new Date().getHours() + ":" + new Date().getMinutes() + ":" + new Date().getSeconds());
				}
				var sNotifIDDesFilter = mLookupModel.getProperty("/sNotifIDDesFilter");
				if (sNotifIDDesFilter === null || sNotifIDDesFilter === undefined) {
					sNotifIDDesFilter = "";
				}
				var sNotifIdFilter = mLookupModel.getProperty("/sNotifIdFilter");
				if (sNotifIdFilter === null || sNotifIdFilter === undefined) {
					sNotifIdFilter = "";
				}
				var sNotifStatusFilter = mLookupModel.getProperty("/sNotifStatusFilter");
				if (sNotifStatusFilter === null || sNotifStatusFilter === undefined) {
					sNotifStatusFilter = "";
				}
				var sNotifPriorFilter = mLookupModel.getProperty("/sNotifPriorFilter");
				if (sNotifPriorFilter === null || sNotifPriorFilter === undefined) {
					sNotifPriorFilter = "";
				}
				var sNotifEquipFilter = mLookupModel.getProperty("/sNotifEquipFilter");
				if (sNotifEquipFilter === null || sNotifEquipFilter === undefined) {
					sNotifEquipFilter = "";
				}
				var sNotifBDFilter = mLookupModel.getProperty("/sNotifBDFilter");
				if (sNotifBDFilter === null || sNotifBDFilter === undefined) {
					sNotifBDFilter = "";
				}
				var sUnAssignedWOFlag = mLookupModel.getProperty("/sUnAssignedWOFlag");
				if (sUnAssignedWOFlag === null || sUnAssignedWOFlag === undefined) {
					sUnAssignedWOFlag = "";
				}
				var sNotifWkCenterFilter = mLookupModel.getProperty("/sNotifWkCenterFilter");
				if (sNotifWkCenterFilter === null || sNotifWkCenterFilter === undefined) {
					sNotifWkCenterFilter = "";
				}
				oFilter.push(new Filter({
					filters: [new Filter("CreatedOn", "GE", formatter.fnDatewithTimezoneoffset(sCreatedOnStart)),
						new Filter("CreatedOn", "LE", formatter.fnDatewithTimezoneoffset(sCreatedOnEnd))
					],
					and: true
				}));
				oFilter.push(new Filter("Descriptn", "EQ", sNotifIDDesFilter));
				//oFilter.push(new Filter("SysStatus", "EQ",sNotifStatusFilter ));
				if (sNotifStatusFilter === "") {
					oFilter.push(new Filter({
						filters: [new Filter("SysStatus", "EQ", "OSNO"),
							new Filter("SysStatus", "EQ", "NOPR")
						],
						and: false
					}));
				} else {
					oFilter.push(new Filter("SysStatus", "EQ", sNotifStatusFilter));
				}
				oFilter.push(new Filter("Userstatus", "EQ", sUnAssignedWOFlag));
				oFilter.push(new Filter("NotifNo", "EQ", sNotifIdFilter));
				oFilter.push(new Filter("Equipment", "EQ", sNotifEquipFilter));
				oFilter.push(new Filter("Bdflag", "EQ", sNotifBDFilter));
				oFilter.push(new Filter("Priority", "EQ", sNotifPriorFilter));
				oFilter.push(new Filter("WorkCntr", "EQ", sNotifWkCenterFilter));
				oFilter.push(new Filter("Userstatus", "EQ", "")); // using this unused odara property for notifications w/o WO flag
				oFilter.push(new Filter("plant", "EQ", userPlant));

				oPortalDataModel.read(sUrl, {
					filters: oFilter,
					urlParameters: {
						"$top": iTopNotif,
						"$skip": iSkipNotif
					},
					success: function (oData) {
						aNotificationListSet = oData.results;

						$.each(aNotificationListSet, function (index, value) { //AN: #obxSearch
							value.PriorityDesNotif = formatter.fnPriorityConversion(value.Priority);
							if (value.Reqstartdate) {
								value.ReqstartdateString = that.fnDateSeperator(value.Reqstartdate);
							}
							if (value.CreatedOn) {
								value.CreatedOnString = that.fnDateConversion(value.CreatedOn);
							}
							if (value.Reqenddate) {
								value.ReqenddateString = that.fnDateSeperator(value.Reqenddate);
							}
							//nischal - starts
							if (value.Strmlfndate) {
								value.Strmlfndate = that.fnDateConversion(value.Strmlfndate);
							}
							if (value.Endmlfndate) {
								value.Endmlfndate = that.fnDateConversion(value.Endmlfndate);
							}
							//nischal -- ends
						});
						//nischal -- concat after changing dates of payload
						if (iSkipNotif !== 0) {
							aNotificationListSet = aNotificationListSet.concat(mLookupModel.getProperty("/aNotificationListSet"));
						}
						mLookupModel.setProperty("/aNotificationListSet", aNotificationListSet);
						mLookupModel.setProperty("/iDisplayedNotifCount", aNotificationListSet.length);
						mLookupModel.refresh();
						that.busy.close();
					},
					error: function (oData) {
						mLookupModel.setProperty("/aNotificationListSet", []);
						mLookupModel.refresh();
						that.busy.close();
					}
				});
			}
		},

		// clearing live search by id or desc
		onApplyFilter: function () {
			var mLookupModel = this.mLookupModel;
			mLookupModel.setProperty("/sWorderIdDesFilter", "");
			mLookupModel.refresh();
			this.onCreateOptionChange();
			//this._oDialogWO.close();
		},

		// clearing live search by id or desc
		onApplyFilterNotif: function () {
			var mLookupModel = this.mLookupModel;
			mLookupModel.setProperty("/sNotifIDDesFilter", "");
			mLookupModel.refresh();
			this.onCreateOptionChange();
			//this._oDialogNotif.close();
		},

		onSelectWordOrder: function (oEvent) {
			var oSource = oEvent.getSource().getAggregation("customData")[0];
			var iSelectedWO = oSource.getProperty("value");
			var sPath = oSource.getBindingInfo("value").binding.getContext().getPath();
			var oSelectedWODetails = oSource.getBindingInfo("value").binding.getContext().getModel().getProperty(sPath);
			this.mLookupModel.setProperty("/iSelectedWO", iSelectedWO);
			this.mLookupModel.setProperty("/oSelectedWODetails", oSelectedWODetails);
		},

		//Function to Select/Un-select Work orders
		onSelectionChange: function (oEvent) {
			var mLookupModel = this.mLookupModel;
			var rowContext = oEvent.getParameters().rowContext;
			if (!rowContext) {
				return;
			}
			var oSelectedRow = rowContext.getPath();
			var selectedNotifs = mLookupModel.getProperty("/selectedNotifs");
			if (!selectedNotifs) {
				selectedNotifs = [];
			}
			var bVal = this.isWOSelected(oSelectedRow, selectedNotifs);
			if (bVal[0]) {
				selectedNotifs.splice(bVal[1], 1);
			} else {
				var oTempObj = {
					sPath: oSelectedRow
				};
				selectedNotifs.push(oTempObj);
			}
			mLookupModel.setProperty("/selectedNotifs", selectedNotifs);
			mLookupModel.setProperty("/iSelectedIndices", selectedNotifs.length);
			mLookupModel.refresh(true);
		},

		//Function top check if an WO is already selected, else un-select the operation
		isWOSelected: function (oSelectedRow, selectedNotifs) {
			var bVal = [false];
			selectedNotifs.filter(function (obj, index) {
				if (obj.sPath === oSelectedRow) {
					bVal = [true, index];
				}
			});
			return bVal;
		},

		//Function to navigate to Work Order detail view
		onCreateViewWorkOrder: function () {
			var mLookupModel = this.mLookupModel;
			var bVal = this.validateMandatoryFields();
			if (bVal) {
				var orderType = mLookupModel.getProperty("/sOrderTypeSel");
				// this.getOrderTypeTasks(orderType); //SH: Commented for now as we are getting a hardcoded result from backend
				this.setFieldValOnDetailNav();
				this.router.navTo("detailWO", {
					workOrderID: "CREATE_ORDER"
				});
			}
		},

		handleLoadMoreRecords: function () {
			var mLookupModel = this.mLookupModel;
			var iSkip = mLookupModel.getProperty("/iSkip") + 50;
			mLookupModel.setProperty("/iSkip", iSkip);
			mLookupModel.refresh(true);
			this.onCreateOptionChange();
		},

		handleLoadMoreNotif: function () {
			var mLookupModel = this.mLookupModel;
			var iSkipNotif = mLookupModel.getProperty("/iSkipNotif") + 50;
			mLookupModel.setProperty("/iSkipNotif", iSkipNotif);
			mLookupModel.refresh(true);
			this.onCreateOptionChange();
		},

		onSelectOperation: function (oEvent) {
			var oTable = oEvent.getSource().getParent().getContent()[0];
			var aSelectedIndices = oTable.getSelectedIndices();
			if (!aSelectedIndices.length) {
				var sMsg = this.oResourceModel.getText("plsseloprns");
				this.showMessage(sMsg, "I");
			} else {
				var aOperationList = oTable.getBindingInfo("rows").binding.oList;
				var aSelectedOperations = [];
				for (var i = 0; i < aSelectedIndices.length; i++) {
					aSelectedOperations.push(aOperationList[aSelectedIndices[i]]);
				}
				this.onCreateRefWorkOrder(aSelectedOperations);
			}
		},

		addOperationWO: function (aSelectedOperations) {
			var oArry = [];
			for (var i = 0; i < aSelectedOperations.length; i++) {
				var oTempobj = {
					operationId: aSelectedOperations[i].Activity,
					workCenter: aSelectedOperations[i].WorkCntr,
					shortText: aSelectedOperations[i].Description,
					longTxt: "",
					spareParts: [],
					myWork: aSelectedOperations[i].WorkActivity,
					teamWork: "",
					totalHr: aSelectedOperations[i].WorkActual,
					systemCompletion: "",
					dateCompleted: ""
				};
				oArry.push(oTempobj);
			}
			return oArry;
		},

		//Function to navigate to Work Order detail view from Create by reference
		onCreateRefWorkOrder: function (aSelectedOperations) {
			var mLookupModel = this.mLookupModel;
			var oUserDetailModel = this.oUserDetailModel;
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var oSelectedWODetails = mLookupModel.getProperty("/oSelectedWODetails");

			util.initializeWODetailFields(oWorkOrderDetailModel, oWorkOrderDetailViewModel);
			util.resetDetailWOFields(oUserDetailModel, oWorkOrderDetailModel, oWorkOrderDetailViewModel, "CREATE_REF_WO");

			oWorkOrderDetailModel.setProperty("/OrderType", oSelectedWODetails.OrderType);
			oWorkOrderDetailModel.setProperty("/MnWkCtr", oSelectedWODetails.MnWkCtr);
			oWorkOrderDetailModel.setProperty("/Priority", oSelectedWODetails.Priority);
			oWorkOrderDetailModel.setProperty("/Equipment", oSelectedWODetails.Equipment);
			oWorkOrderDetailModel.setProperty("/FunctLoc", oSelectedWODetails.FunctLoc);
			oWorkOrderDetailModel.setProperty("/Planplant", oSelectedWODetails.Planplant);
			oWorkOrderDetailModel.setProperty("/ShortText", oSelectedWODetails.ShortText);
			oWorkOrderDetailModel.setProperty("/EquipDesc", oSelectedWODetails.EquipDes);
			oWorkOrderDetailModel.setProperty("/Plangroup", oSelectedWODetails.Plangroup);
			oWorkOrderDetailModel.setProperty("/SuperOrder", oSelectedWODetails.Orderid);

			// oWorkOrderDetailModel.setProperty("/SysStatusDes", oSelectedWODetails.SysStatusDes);//new 
			// oWorkOrderDetailModel.setProperty("/systemstatustext", oSelectedWODetails.SysStatusDes);//new 
			this.mLookupModel.setProperty("/sCatelogProf", oSelectedWODetails.Rbnr);
			oWorkOrderDetailModel.setProperty("/Damagecode", "");
			oWorkOrderDetailModel.setProperty("/Causecode", "");

			this.onSearchEquipments(oSelectedWODetails.Equipment, true);
			this.getEquipsAssmebly(oSelectedWODetails.Equipment);
			var userPlant = this.oUserDetailModel.getProperty("/userPlant");
			this.fnSetDateBasedOnPriority(oSelectedWODetails.Priority);
			var PlanStDate = this.oWorkOrderDetailViewModel.getProperty("/oRequiredStartDate");
			oWorkOrderDetailModel.setProperty("/PlanStartDate", PlanStDate);
			var PlanEndDate = this.oWorkOrderDetailViewModel.getProperty("/oRequiredEndDate");
			oWorkOrderDetailModel.setProperty("/PlanEndDate", PlanEndDate);
			var opsArr = [];
			for (var i = 0; i < aSelectedOperations.length; i++) {
				var oTempobj = {
					"Activity": aSelectedOperations[i].Activity,
					"WorkCntr": oSelectedWODetails.MnWkCtr,
					"LongText": aSelectedOperations[i].OperationLtext,
					"Plant": userPlant,
					"Description": aSelectedOperations[i].Description,
					"Systcond": "",
					"MyWork": "",
					"TWork": "",
					"T": "",
					"CompletedOn": new Date(),
					"SubActivity": "",
					"ControlKey": "PM01",
					"VendorNo": "",
					"PurchOrg": "",
					"PurGroup": "",
					"MatlGroup": "",
					"CalcKey": "",
					"Acttype": "",
					"Assembly": "",
					"Equipment": "",
					"BusArea": "",
					"WbsElem": "",
					"ProfitCtr": "",
					"OperCode": "C",
					"systemstatustext": ""
				};
				opsArr.push(oTempobj);
			}
			oWorkOrderDetailModel.setProperty("/HEADERTOOPERATIONSNAV", opsArr);
			// this.getOrderTypeTasks(oSelectedWODetails.OrderType); //SH: Commented for now as we are getting a hardcoded result from backend

			this.router.navTo("detailWO", {
				workOrderID: "CREATE_REF_WO"
			});
			oWorkOrderDetailModel.refresh();
		},

		addNotifWO: function (aNotifications) {
			var oArry = [];
			for (var i = 0; i < aNotifications.length; i++) {
				var currObj = aNotifications[i];
				var reqStartDate = currObj.Reqstartdate;
				var reqEndDate = currObj.Reqenddate;
				if ((reqStartDate === "00000000" && reqEndDate === "00000000") || (reqStartDate === "" && reqEndDate === "") || (reqStartDate ===
						undefined && reqEndDate === undefined)) {
					reqStartDate = new Date();
					reqEndDate = new Date();
				} else if (reqStartDate === "00000000" || reqStartDate === "" || reqStartDate === undefined) {
					reqStartDate = formatter.formatReqStartEndDate(reqEndDate);
					reqEndDate = formatter.formatReqStartEndDate(reqEndDate);
				} else if (reqEndDate === "00000000" || reqEndDate === "" || reqEndDate === undefined) {
					reqStartDate = formatter.formatReqStartEndDate(reqStartDate);
					reqEndDate = new Date();
				} else {
					reqStartDate = formatter.formatReqStartEndDate(reqStartDate);
					reqEndDate = formatter.formatReqStartEndDate(reqEndDate);
				}
				var obj = {};
				obj.NotifNo = currObj.NotifNo;
				obj.Reportedby = currObj.Reportedby;
				obj.ShortText = currObj.ShortText;
				obj.LongText = currObj.LongText;
				obj.Breakdown = currObj.Breakdown;
				obj.Desstdate = new Date(reqStartDate);
				obj.Desenddate = new Date(reqEndDate);
				obj.NotifStatus = "NEW";
				oArry.push(obj);
			}
			return oArry;
		},

		//Function to check if same equipments are same
		fnCheckSameEquipments: function (oNotifs) {
			var count = 0;
			var bVal = false;
			var currEquip = oNotifs[0].Equipment;
			for (var j = 0; j < oNotifs.length; j++) {
				var cEquip = oNotifs[j].Equipment;
				if (cEquip === currEquip) {
					count = count + 1;
				}
			}
			if (count === oNotifs.length) {
				bVal = true;
			}
			return bVal;
		},

		//Function to navigate to Work Order detail view from Create by reference
		onCreateNotifWorkOrder: function (oNotifs, selectedNotifs) {
			var oUserDetailModel = this.oUserDetailModel;
			var oWODetailFieldsModel = this.oWODetailFieldsModel;
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			util.fnEnableCreateWOFields(oWODetailFieldsModel);
			util.resetDetailWOFields(oUserDetailModel, oWorkOrderDetailModel, oWorkOrderDetailViewModel, "CREATE_ORDER");
			oWorkOrderDetailModel.setProperty("/MnWkCtr", selectedNotifs[0].WorkCntr);
			oWorkOrderDetailModel.setProperty("/Equipment", selectedNotifs[0].Equipment);
			oWorkOrderDetailModel.setProperty("/FunctLoc", selectedNotifs[0].FunctLoc);
			oWorkOrderDetailModel.setProperty("/Assembly", selectedNotifs[0].Assembly);
			oWorkOrderDetailModel.setProperty("/Planplant", selectedNotifs[0].Planplant);
			oWorkOrderDetailModel.setProperty("/EquipDesc", selectedNotifs[0].Equidescr);
			oWorkOrderDetailModel.setProperty("/Plangroup", selectedNotifs[0].Plangroup);
			oWorkOrderDetailModel.setProperty("/Breakdown", selectedNotifs[0].Breakdown);
			oWorkOrderDetailModel.setProperty("/Downtime", selectedNotifs[0].Downtime);
			oWorkOrderDetailModel.setProperty("/Damagecode", selectedNotifs[0].FECOD);
			oWorkOrderDetailModel.setProperty("/Causecode", selectedNotifs[0].URCOD);
			oWorkOrderDetailModel.setProperty("/HEADERTONOTIFNAV", oNotifs);
			this.mLookupModel.setProperty("/sCatelogProf", selectedNotifs[0].Rbnr);
			this.onSearchEquipments(selectedNotifs[0].Equipment, true);
			this.getEquipsAssmebly(selectedNotifs[0].Equipment);
			this.router.navTo("detailWO", {
				workOrderID: "CREATE_NOTIF_WO"
			});
			var notifTbl = this.getView().byId("notifListId");
			this.fnResetFilers(notifTbl, "mLookupModel");
			this.mLookupModel.setProperty("/selectedNotifs", []);
			this.mLookupModel.setProperty("/iSelectedIndices", 0);
		},

		onSaveWOFilter: function () {
			var that = this;
			var mLookupModel = this.mLookupModel;
			this.busy.open();
			var sUrl = "/SaveWorkOrderVariantSet";
			var oPortalDataModel = this.oPortalDataModel;
			var oFilter = [];
			var oRequest = {
				"id": mLookupModel.getProperty("/idwofilter"),
				"userId": mLookupModel.getProperty("/userName"),
				"filterType": "reference",
				"refWOType": mLookupModel.getProperty("/sOrderTypeSelFilter"),
				"refPriority": mLookupModel.getProperty("/sPriorSelFilter"),
				"refStatus": mLookupModel.getProperty("/sStatusSelFilter"),
				"refWONumber": mLookupModel.getProperty("/iWONumFilter"),
				"refEquipment": mLookupModel.getProperty("/sEquipFilter"),
				"refCreatedBy": mLookupModel.getProperty("/sCreatedBy"),
				"refAssignedTo": mLookupModel.getProperty("/sAssignedTo")
			};
			if (oRequest.id === undefined || !oRequest.id) {
				oRequest.id = "";
			}
			if (oRequest.userId === undefined || !oRequest.userId) {
				oRequest.userId = "";
			}
			if (oRequest.filterType === undefined || !oRequest.filterType) {
				oRequest.filterType = "";
			}
			if (oRequest.refWOType === undefined || !oRequest.refWOType) {
				oRequest.refWOType = "";
			}
			if (oRequest.refPriority === undefined || !oRequest.refPriority) {
				oRequest.refPriority = "";
			}
			if (oRequest.refStatus === undefined || !oRequest.refStatus) {
				oRequest.refStatus = "";
			}
			if (oRequest.refWONumber === undefined || !oRequest.refWONumber) {
				oRequest.refWONumber = "";
			}
			if (oRequest.refEquipment === undefined || !oRequest.refEquipment) {
				oRequest.refEquipment = "";
			}
			if (oRequest.refCreatedBy === undefined || !oRequest.refCreatedBy) {
				oRequest.refCreatedBy = "";
			}
			if (oRequest.refAssignedTo === undefined || !oRequest.refAssignedTo) {
				oRequest.refAssignedTo = "";
			}
			oFilter.push(new Filter("REQUEST", "EQ", JSON.stringify(oRequest)));
			oPortalDataModel.read(sUrl, {
				filters: oFilter,
				success: function (oData) {
					var sMsg = "";
					var oComments = oData.results[0];
					if (oComments.RESPONSE !== "null") {
						sMsg = that.oResourceModel.getText("savefilters");
						that.showMessage(sMsg, "I");

					} else {
						sMsg = that.oResourceModel.getText("savefiltererrmsg");
						that.showMessage(sMsg, "I");
					}
					that.busy.close();
				},
				error: function (oData) {
					var sMsg = that.oResourceModel.getText("savefiltererrmsg");
					that.showMessage(sMsg, "I");
					that.busy.close();
				}
			});
		},

		onSaveNotifFilter: function () {
			var that = this;
			var mLookupModel = this.mLookupModel;
			this.busy.open();
			var sUrl = "/SaveNotifVariantSet";
			var oPortalDataModel = this.oPortalDataModel;
			var oFilter = [];
			var oRequest = {
				"id": mLookupModel.getProperty("/idNotifFilter"),
				"userId": mLookupModel.getProperty("/userName"),
				"filterType": "notification",
				"notiStatus": mLookupModel.getProperty("/sNotifStatusFilter"),
				"notiNotiId": mLookupModel.getProperty("/sNotifIdFilter"),
				"notiEquipment": mLookupModel.getProperty("/sNotifEquipFilter"),
				"notiBreakDown": mLookupModel.getProperty("/sNotifBDFilter"),
				"notiPriority": mLookupModel.getProperty("/sNotifPriorFilter")
			};

			if (oRequest.id === undefined || !oRequest.id) {
				oRequest.id = "";
			}
			if (oRequest.userId === undefined || !oRequest.userId) {
				oRequest.userId = "";
			}
			if (oRequest.filterType === undefined || !oRequest.filterType) {
				oRequest.filterType = "";
			}
			if (oRequest.notiStatus === undefined || !oRequest.notiStatus) {
				oRequest.notiStatus = "";
			}
			if (oRequest.notiNotiId === undefined || !oRequest.notiNotiId) {
				oRequest.notiNotiId = "";
			}
			if (oRequest.notiEquipment === undefined || !oRequest.notiEquipment) {
				oRequest.notiEquipment = "";
			}
			if (oRequest.notiBreakDown === undefined || !oRequest.notiBreakDown) {
				oRequest.notiBreakDown = "";
			}
			if (oRequest.notiPriority === undefined || !oRequest.notiPriority) {
				oRequest.notiPriority = "";
			}

			oFilter.push(new Filter("REQUEST", "EQ", JSON.stringify(oRequest)));
			oPortalDataModel.read(sUrl, {
				filters: oFilter,
				success: function (oData) {
					var sMsg = "";
					var oComments = oData.results[0];
					if (oComments.RESPONSE) {
						sMsg = that.oResourceModel.getText("savefilters");
						that.showMessage(sMsg, "I");
					} else {
						sMsg = that.oResourceModel.getText("savefiltererrmsg");
						that.showMessage(sMsg, "I");
					}
					that.busy.close();
				},
				error: function (oData) {
					var sMsg = that.oResourceModel.getText("savefiltererrmsg");
					that.showMessage(sMsg, "I");
					that.busy.close();
				}
			});
		},

		//function to clear Wo Filter
		onClearWoFilter: function () {
			var mLookupModel = this.mLookupModel;
			mLookupModel.setProperty("/sOrderTypeSelFilter", "");
			mLookupModel.setProperty("/sPriorSelFilter", "");
			mLookupModel.setProperty("/sStatusSelFilter", "");
			mLookupModel.setProperty("/iWONumFilter", "");
			mLookupModel.setProperty("/sEquipFilter", "");
			mLookupModel.setProperty("/sCreatedBy", "");
			mLookupModel.setProperty("/sAssignedTo", "");
			mLookupModel.setProperty("/sWorkCenterFilter", "");
		},

		//function to clear Notification Filter
		onClearNotifFilter: function () {
			var mLookupModel = this.mLookupModel;
			mLookupModel.setProperty("/sNotifStatusFilter", "");
			mLookupModel.setProperty("/sNotifIdFilter", "");
			mLookupModel.setProperty("/sNotifEquipFilter", "");
			mLookupModel.setProperty("/sNotifBDFilter", "");
			mLookupModel.setProperty("/sNotifPriorFilter", "");
			mLookupModel.setProperty("/sNotifWkCenterFilter", "");
		},

		//Function to edit WO
		onEditWO: function () {

			var that = this;
			this.busy.open();
			var mLookupModel = this.mLookupModel;
			var orderId = mLookupModel.getProperty("/editOrderId");
			var userPlant = this.oUserDetailModel.getProperty("/userPlant");
			var sUrl = "/ValidateWOSet(Orderid='" + orderId + "',plant='" + userPlant + "')";
			var sMsg = this.oResourceModel.getText("invalidwo");

			var oPortalDataModel = this.oPortalDataModel;
			oPortalDataModel.read(sUrl, {
				success: function (oData) {
					that.busy.close();
					if (oData.OrderValid === "YES") {
						var sHost = window.location.origin;
						var sBSPPath = "/sap/bc/ui5_ui5/sap/ZMYL_WOCREATE/index.html#/detailTabWO/";
						// var sURL = sHost + sBSPPath + orderId;
						var sURL = "https://ub2qkdfhxg4ubmgqmta-imo-pm-imo-pm.cfapps.eu10.hana.ondemand.com/IMO_PM/index.html#/detailTabWO/" +
							orderId;
						sap.m.URLHelper.redirect(sURL, true);
					} else {
						that.busy.close();
						that.showMessage(sMsg, "E");
					}

				},
				error: function (oData) {
					that.busy.close();
					that.showMessage(sMsg, "E");
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
			var rowCount = (sap.ui.Device.resize.height - 250) / 40;
			rowCount = Math.floor(rowCount - 2);
			mLookupModel.setProperty("/rowCount", rowCount);
		},

		//Function to validate user entered Integer values
		validateIntegerValues: function (oEvent) {
			util.validateInputDataType(oEvent, this);
		},
		//nischal - Function to select functional location using dialog box(pop-up) 
		fnLocValueHelp: function () {
			if (!this.functionalLocationListDialog) {
				this.functionalLocationListDialog = sap.ui.xmlfragment("idFunctionalLocationFrag",
					"com.sap.incture.IMO_PM.fragment.functionalLocationList", this);
				this.getView().addDependent(this.functionalLocationListDialog);
			}
			this.functionalLocationListDialog.open();
		},
		onCancelDialogFunLoc: function () {
			this.functionalLocationListDialog.close();
			this.functionalLocationListDialog.destroy();
			this.functionalLocationListDialog = null;
		},
		onFnLocSelect: function (oEvent) {
			this.onFunlocChange();
			var mLookupModel = this.mLookupModel;
			// var oNotificationDataModel = this.oNotificationDataModel;
			var oSource = oEvent.getParameter("listItem");
			var sPath = oSource.getBindingContextPath();
			var iFunLoc = mLookupModel.getProperty(sPath + "/FuncLoc");
			mLookupModel.setProperty("/sFunLoc", iFunLoc);
			// oNotificationDataModel.setProperty("/FunctLoc", iFunLoc);
			this.onCancelDialogFunLoc();
		},
		//function to clear equipment details on change of functional location
		onFunlocChange: function () {
			var mLookupModel = this.mLookupModel;
			// var oNotificationDataModel = this.oNotificationDataModel;
			mLookupModel.setProperty("/sEquip", "");
			mLookupModel.setProperty("/sWorkCenterSel", "");
			mLookupModel.setProperty("/sEquipFilter", "");
			mLookupModel.setProperty("/sNotifEquipFilter", "");
			mLookupModel.setProperty("/sCatelogProf", "");
			// oNotificationDataModel.setProperty("/Plangroup", "");
			// oNotificationDataModel.setProperty("/Equipment", "");
			mLookupModel.setProperty("/aEquipAssemblyList", "");

		},
		handleEquipIconTabSelect: function (oEvent) {
			// var that = this;
			// var selectedKey = oEvent.getSource().getSelectedKey();
			// if (selectedKey === "idEqFunLoc") {
			// 	this.busy.open();
			// 	var mLookupModel = this.mLookupModel;
			// 	// var oNotificationDataModel = this.oNotificationDataModel;
			// 	var sFunctionalLocation = mLookupModel.getProperty("/sFunLoc");
			// 	var oPortalDataModel = this.oPortalDataModel;
			// 	// var userPlant = this.oUserDetailModel.getProperty("/userPlant");
			// 	var oFilter = [];
			// 	// oFilter.push(new Filter("Equnr", "EQ", ""));
			// 	// oFilter.push(new Filter("Tidnr", "EQ", ""));
			// 	// oFilter.push(new Filter("Eqktu", "EQ", ""));
			// 	// oFilter.push(new Filter("plant", "EQ", userPlant));
			// 	oFilter.push(new Filter("FuncLoc", "EQ", sFunctionalLocation));
			// 	oPortalDataModel.read("/EquipfuncSet", {
			// 		filters: oFilter,
			// 		success: function (oData, oResponse) {
			// 			var aEqListOfFunLoc = oData.results;
			// 			mLookupModel.setProperty("/aEqListOfFunLoc", aEqListOfFunLoc);
			// 			mLookupModel.refresh();
			// 			that.busy.close();
			// 		},
			// 		error: function (oResponse) {
			// 			mLookupModel.setProperty("/aEqListOfFunLoc", []);
			// 			that.busy.close();
			// 		}
			// 	});
			// }
			var that = this;
			var selectedKey = oEvent.getSource().getSelectedKey();
			if (selectedKey === "idEqFunLoc") {
				this.busy.open();
				var mLookupModel = this.mLookupModel;
				var oNotificationDataModel = this.oNotificationDataModel;
				var sFunctionalLocation = mLookupModel.getProperty("/sFunLoc");
				var sfunLoc = "'" + sFunctionalLocation.replace(/['"]+/g, '') + "'";
				var oPortalDataModel = this.oPortalDataModel;
				var userPlant = this.oUserDetailModel.getProperty("/userPlant");
				var oFilter = [];
				oFilter.push(new Filter("Equnr", "EQ", ''));
				oFilter.push(new Filter("Tidnr", "EQ", ''));
				oFilter.push(new Filter("Eqktu", "EQ", ''));
				oFilter.push(new Filter("plant", "EQ", userPlant));
				oFilter.push(new Filter("Tplnr ", "EQ", "'" + sFunctionalLocation.replace(/['"]+/g, '') + "'"));
				oPortalDataModel.read("/EquipmentDetailsSet", {
					filters: oFilter,
					success: function (oData, oResponse) {
						var aEqListOfFunLoc = oData.results;
						mLookupModel.setProperty("/aEqListOfFunLoc", aEqListOfFunLoc);
						mLookupModel.refresh();
						that.busy.close();
					},
					error: function (oResponse) {
						mLookupModel.setProperty("/aEqListOfFunLoc", []);
						that.busy.close();
					}
				});
			}
		},
		onEquipOfFunLocSelect: function (oEvent) {
			var mLookupModel = this.mLookupModel;
			// var oNotificationDataModel = this.oNotificationDataModel;
			var oSource = oEvent.getParameter("listItem");
			var sPath = oSource.getBindingContextPath();
			var iEqId = mLookupModel.getProperty(sPath + "/EquipId");
			var iFunLoc = mLookupModel.getProperty("/sFunLoc");
			mLookupModel.setProperty("/sEquip", iEqId);
			mLookupModel.setProperty("/sFunLoc", iFunLoc);
			this.getEquipsAssmebly(iEqId);
			this.equipmentsListDialog.close();
		},
		onCreateWOIconTabSelect: function (oEvent) {
			var selKey = oEvent.getSource().getSelectedKey();
			var mLookupModel = this.mLookupModel;

			if (selKey === "createWO") {
				mLookupModel.setProperty("/iSelectedIndex", 0);
			} else if (selKey === "createByRef") {
				mLookupModel.setProperty("/iSelectedIndex", 1);
			} else if (selKey === "createFromNotif") {
				mLookupModel.setProperty("/iSelectedIndex", 2);
			}
			this.onCreateOptionChange();
		},
		createByRefAdvFilterPanelOpen: function () {
			var oNotifWrapPanel = this.byId("filterWrapPanelCreateByRef");
			oNotifWrapPanel.setExpanded(!oNotifWrapPanel.getExpanded());
		},
		createFromNotifAdvFilterPanelOpen: function () {
			var oNotifWrapPanel = this.byId("filterWrapPanelCreateFromNotif");
			oNotifWrapPanel.setExpanded(!oNotifWrapPanel.getExpanded());
		},
		//nischal
		onPressColumnAdd: function (oEvent) {
			if (!this.addRemoveColumnDialog) {
				this.addRemoveColumnDialog = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.addRemoveColRef", this);
				this.getView().addDependent(this.addRemoveColumnDialog);
			}
			this.addRemoveColumnDialog.open();
		},
		//nischal
		onCloseColumnAdd: function (oEvent) {
			this.addRemoveColumnDialog.close();
			this.addRemoveColumnDialog.destroy();
			this.addRemoveColumnDialog = null;
		},
		setColumnLayout: function () {
			var mLookupModel = this.mLookupModel;
			var oTempObj = {
				sType: true,
				sOrder: true,
				sDesc: true,
				sFunLoc: true,
				sEquip: true,
				sEquipDesc: false,
				sTechId: false,
				sWrkCtr: true,
				sPlant: true,
				sAssTech: false,
				sSysStatus: true,
				sUserStatus: false,
				sReqStart: false,
				sReqEnd: false,
				sBdFlag: false,
				sPriority: false,
				sCreatedDate: false,
				sPlan: false,
				sPackage: false,
				sCreatedBy: true,
			};
			mLookupModel.setProperty("/oRefWOColumnVisible", oTempObj);
			mLookupModel.refresh();
		},
		//nischal --
		onSelectAll: function () {
			var mLookupModel = this.mLookupModel;
			var oTempObj = {
				sType: true,
				sOrder: true,
				sDesc: true,
				sFunLoc: true,
				sEquip: true,
				sEquipDesc: true,
				sTechId: true,
				sWrkCtr: true,
				sPlant: true,
				sAssTech: true,
				sSysStatus: true,
				sUserStatus: true,
				sReqStart: true,
				sReqEnd: true,
				sBdFlag: true,
				sPriority: true,
				sCreatedDate: true,
				sPlan: true,
				sPackage: true,
				sCreatedBy: true,
			};
			mLookupModel.setProperty("/oRefWOColumnVisible", oTempObj);
			mLookupModel.refresh();
		},
		//nischal 
		fnGetMalfunDate: function (oDate) {
			var dd = oDate.getDate();
			var mm = oDate.getMonth() + 1;
			var yy = oDate.getFullYear();
			var sDate = dd + "-" + mm + "-" + yy;
			return sDate;
		},
		//nischal
		onPressColAdd: function (oEvent) {
			if (!this.addRemColDialog) {
				this.addRemColDialog = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.addRemColCreateFromNotif", this);
				this.getView().addDependent(this.addRemColDialog);
			}
			this.addRemColDialog.open();
		},
		//nischal
		onCloseColAdd: function (oEvent) {
			this.addRemColDialog.close();
			this.addRemColDialog.destroy();
			this.addRemColDialog = null;
		},
		//nischal
		setColumnLayoutCreateWithNotif: function () {
			var mLookupModel = this.mLookupModel;
			var oTempObj = {
				sType: true,
				sNumber: true,
				sDesc: true,
				sOrder: true,
				sFunct: true,
				sFunctLocDesc: false,
				sEquip: true,
				sEquipDesc: false,
				sWrkCtr: true,
				sPlant: false,
				sTechId: false,
				sSysStatus: true,
				sUserStatus: true,
				sReqStart: false,
				sReqFinish: false,
				sBdFlag: true,
				sMalFunSt: false,
				sMalFunEnd: false,
				sPriority: true,
				sCreatedDate: false,
				sCreatedBy: false
			};
			mLookupModel.setProperty("/oCreateFromNotifColVisible", oTempObj);
			mLookupModel.refresh();
		},
		//nischal
		onSelectAllCrtFromNotif: function () {
			var mLookupModel = this.mLookupModel;
			var oTempObj = {
				sType: true,
				sNumber: true,
				sDesc: true,
				sOrder: true,
				sFunct: true,
				sFunctLocDesc: true,
				sEquip: true,
				sEquipDesc: true,
				sWrkCtr: true,
				sPlant: true,
				sTechId: true,
				sSysStatus: true,
				sUserStatus: true,
				sReqStart: true,
				sReqFinish: true,
				sBdFlag: true,
				sMalFunSt: true,
				sMalFunEnd: true,
				sPriority: true,
				sCreatedDate: true,
				sCreatedBy: true
			};
			mLookupModel.setProperty("/oCreateFromNotifColVisible", oTempObj);
			mLookupModel.refresh();
		}
	});
});