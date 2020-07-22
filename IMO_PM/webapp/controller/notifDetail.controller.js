sap.ui.define([
	"com/sap/incture/IMO_PM/controller/BaseController",
	"com/sap/incture/IMO_PM/formatter/formatter",
	"com/sap/incture/IMO_PM/util/util",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (BaseController, formatter, util, JSONModel, Filter, FilterOperator) {
	"use strict";

	return BaseController.extend("com.sap.incture.IMO_PM.controller.notifDetail", {

		formatter: formatter,
		util: util,

		onInit: function () {
			var that = this;
			this.fnInitNotificationListApp();
			this.router = sap.ui.core.UIComponent.getRouterFor(this);
			var oResourceModel = this.getOwnerComponent().getModel("i18n");
			this.oResourceModel = oResourceModel.getResourceBundle();

			this.router.attachRoutePatternMatched(function (oEvent) {
				that.routePatternMatched(oEvent);
			});
		},

		routePatternMatched: function (oEvent) {
			var viewName = oEvent.getParameter("name");
			if (viewName === "notifDetail") {
				this.fnFetchDetailNotifList();
			}
		},

		//Function to fetch Notification details by Notif Id
		fnFetchDetailNotifList: function () {
			var that = this;
			this.busy.open();
			var sUrl = "/NotificationListSet";
			var mLookupModel = this.mLookupModel;
			var oPortalDataModel = this.oPortalDataModel;
			var notifId = window.location.hash.split("/")[2];

			var oFilter = [];
			oFilter.push(new Filter("Descriptn", "EQ", notifId));
			oFilter.push(new Filter("NotifNo", "EQ", ""));
			oFilter.push(new Filter("SysStatus", "EQ", ""));
			oFilter.push(new Filter("Priority", "EQ", ""));
			oFilter.push(new Filter("Equipment", "EQ", ""));
			oFilter.push(new Filter("Bdflag", "EQ", ""));
			oFilter.push(new Filter("Userstatus", "EQ", ""));
			var userPlant = this.oUserDetailModel.getProperty("/userPlant");
			if (!userPlant) {
				userPlant = "";
			}
			oFilter.push(new Filter("plant", "EQ", userPlant));
			oPortalDataModel.read(sUrl, {
				filters: oFilter,
				urlParameters: {
					"$top": 20,
					"$skip": 0
				},
				success: function (oData) {
					var notifData = oData.results[0];
					that.resetUIFields(notifData);
					that.busy.close();
				},
				error: function (oData) {
					mLookupModel.setProperty("/aNotificationListSet", []);
					mLookupModel.refresh();
					that.busy.close();
				}
			});
		},

		//Function to reset UI fields
		resetUIFields: function (notifData) {
			var mLookupModel = this.mLookupModel;
			var oNotificationViewModel = this.oNotificationViewModel;
			var oNotificationDataModel = this.oNotificationDataModel;
			util.resetCreateNotificationFieldsNotifList(oNotificationDataModel, oNotificationViewModel, mLookupModel, notifData, this);
		},

		//Function to get Equipment List and show in a pop-up
		openEquipmentListValueHelp: function (oEvent) {
			if (!this.equipmentsListDialog) {
				this.equipmentsListDialog = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.equipmentsList", this);
				this.getView().addDependent(this.equipmentsListDialog);
			}
			this.equipmentsListDialog.open();
		},

		//Function to close equipment pop-up
		onCancelDialogEquip: function (oEvent) {
			this.equipmentsListDialog.close();
		},

		//Function to select a Equipment and auto-populate Functional location
		onEquipSelect: function (oEvent) {
			var mLookupModel = this.mLookupModel;
			var oSource = oEvent.getParameter("listItem");
			var sPath = oSource.getBindingContextPath();
			var iEqId = mLookupModel.getProperty(sPath + "/Equnr");
			var iFunLoc = mLookupModel.getProperty(sPath + "/Tplnr");
			var sCatelogProf = mLookupModel.getProperty(sPath + "/Rbnr");
			var sPlanGrpSel = mLookupModel.getProperty(sPath + "/Ingrp");
			var oNotificationDataModel = this.oNotificationDataModel;
			oNotificationDataModel.setProperty("/Equipment", iEqId);
			oNotificationDataModel.setProperty("/FunctLoc", iFunLoc);
			oNotificationDataModel.setProperty("/Plangroup", sPlanGrpSel);
			mLookupModel.setProperty("/sCatelogProf", sCatelogProf);
			this.getEquipsAssmebly(iEqId);
			this.equipmentsListDialog.close();
			this.fnFilterSlectedDamageGroup();
			this.fnFilterSlectedCauseGroup();
		},

		//Function to show selected Equipment
		fnFilterSlectedDamageGroup: function () {
			var catGrp = this.mLookupModel.getProperty("/sCatelogProf");
			var aFilters = [];
			if (catGrp) {
				var sFilter = new sap.ui.model.Filter("Codegruppe", "EQ", catGrp);
				aFilters.push(sFilter);
			}

			var oDamageCode = this.getView().byId("NOTIF_DETAIL_DAMAGE_CODE");
			var binding = oDamageCode.getBinding("items");
			binding.filter(aFilters, "Application");
		},

		//Function to show selected Equipment
		fnFilterSlectedCauseGroup: function () {
			var catGrp = this.mLookupModel.getProperty("/sCatelogProf");
			var aFilters = [];
			if (catGrp) {
				var sFilter = new sap.ui.model.Filter("Codegruppe", "EQ", catGrp);
				aFilters.push(sFilter);
			}

			var oCauseCode = this.getView().byId("NOTIF_DETAIL_CAUSE_CODE");
			var binding = oCauseCode.getBinding("items");
			binding.filter(aFilters, "Application");
		},

		//Function to get Equiments List
		onSearchEquipments: function (oEvent) {
			var that = this;
			this.busy.open();
			var mLookupModel = this.mLookupModel;
			var oPortalDataModel = this.oPortalDataModel;
			var oNotificationViewModel = this.oNotificationViewModel;
			var TechId = oNotificationViewModel.getProperty("/TechId");
			if (!TechId) {
				TechId = "";
			}
			var EqIdDes = oNotificationViewModel.getProperty("/EqIdDes");
			if (!EqIdDes) {
				EqIdDes = "";
			}

			var oFilter = [];
			oFilter.push(new Filter("Equnr", "EQ", EqIdDes.toUpperCase()));
			oFilter.push(new Filter("Tidnr", "EQ", TechId.toUpperCase()));
			oFilter.push(new Filter("Eqktu", "EQ", EqIdDes.toUpperCase()));
			var userPlant = this.oUserDetailModel.getProperty("/userPlant");
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
			var aFilters = [];
			var sQuery = oEvent.getSource().getValue();
			if (sQuery && sQuery.length > 0) {
				var oFilterByIDDes = new Filter({
					filters: [new Filter("EqId", FilterOperator.Contains, sQuery), new Filter("EqDes", FilterOperator.Contains, sQuery)],
					and: false
				});
				aFilters.push(oFilterByIDDes);
			}
			var oTable = oEvent.getSource().getParent().getContent()[1].getContent()[0];
			var oBinding = oTable.getBinding("items");
			oBinding.filter(aFilters);
		},

		//Function to update Breakdown boolean status
		fnUpdateBreakDownStatus: function (oEvent) {
			var bVal = oEvent.getSource().getState();
			var oNotificationDataModel = this.oNotificationDataModel;
			var oNotificationViewModel = this.oNotificationViewModel;
			if (bVal) {
				var breakdownDur = oNotificationViewModel.getProperty("/BreakdownDur");
				oNotificationDataModel.setProperty("/Breakdown", "X");
				oNotificationDataModel.setProperty("/BreakdownDur", breakdownDur);
				oNotificationViewModel.setProperty("/enableBreakDur", true);
			} else {
				oNotificationDataModel.setProperty("/Breakdown", " ");
				oNotificationDataModel.setProperty("/BreakdownDur", "0");
				oNotificationViewModel.setProperty("/enableBreakDur", false);
			}
			oNotificationDataModel.refresh();
		},

		//Function to validate Start and End date for a Notification
		fnValidateDates: function (oEvent) {
			var startDate, endDate;
			var oSource = oEvent.getSource();
			var dateValue = oSource.getDateValue();
			if (dateValue === null) {
				dateValue = new Date();
			}
			var dateField = oSource.getCustomData()[0].getValue();
			var oNotificationDataModel = this.oNotificationDataModel;
			if (dateField === "ReqStartdate") {
				var planEndDate = oNotificationDataModel.getProperty("/ReqEnddate");
				startDate = new Date(dateValue);
				endDate = new Date(planEndDate);
				if (!planEndDate) {
					this.fnDateObjToGWDateFormat(oEvent, true, dateField, startDate, endDate);
				} else if (startDate > endDate) {
					this.fnDateObjToGWDateFormat(oEvent, false, dateField, endDate, endDate);
					this.showMessage(this.oResourceModel.getText("reqsdatemsg"));
				} else {
					this.fnDateObjToGWDateFormat(oEvent, true, dateField, startDate, endDate);
				}
			} else if (dateField === "ReqEnddate") {
				var planStartDate = oNotificationDataModel.getProperty("/ReqStartdate");
				startDate = new Date(planStartDate);
				endDate = new Date(dateValue);
				if (!startDate) {
					this.fnDateObjToGWDateFormat(oEvent, true, dateField, startDate, endDate);
				} else if (endDate < startDate) {
					this.fnDateObjToGWDateFormat(oEvent, false, dateField, startDate, startDate);
					this.showMessage(this.oResourceModel.getText("reqedatemsg"));
				} else {
					this.fnDateObjToGWDateFormat(oEvent, true, dateField, startDate, endDate);
				}
			}
		},

		//Function to set GW date format on selecting date from Datepicker
		fnDateObjToGWDateFormat: function (oEvent, bVal, dateField, startDate, endDate) {
			var oSource = oEvent.getSource();
			var oNotificationDataModel = this.oNotificationDataModel;
			if (bVal) {
				var dateValue;
				if (oSource.getDateValue() === null) {
					dateValue = new Date();
				} else {
					dateValue = oSource.getDateValue();
				}
				oNotificationDataModel.setProperty("/" + dateField, dateValue);
				oNotificationDataModel.refresh();
			} else {
				if (dateField === "Startdate") {
					oNotificationDataModel.setProperty("/" + dateField, endDate);
				} else if (dateField === "Enddate") {
					oNotificationDataModel.setProperty("/" + dateField, startDate);
				} else if (dateField === "ReqStartdate") {
					oNotificationDataModel.setProperty("/" + dateField, startDate);
				} else if (dateField === "ReqEnddate") {
					oNotificationDataModel.setProperty("/" + dateField, startDate);
				}
			}
			oNotificationDataModel.refresh();
		},

		//Function to validate Malfunction Start/End Date/Time
		fnValidateMalFunDates: function (oEvent) {
			var dateValue = "";
			var oSource = oEvent.getSource();
			var fieldType = oSource.getCustomData()[0].getValue();
			var oNotificationDataModel = this.oNotificationDataModel;
			var oNotificationViewModel = this.oNotificationViewModel;
			var startTime = oNotificationViewModel.getProperty("/StartTime");
			var startDate, endDate, splitDate;
			if (!startTime) {
				startTime = "00:00";
			}
			var endTime = oNotificationViewModel.getProperty("/EndTime");
			if (!endTime) {
				endTime = "00:00";
			}
			if (fieldType === "Startdate" || fieldType === "Enddate") {
				if (fieldType === "Startdate") {
					var planEndDate = oNotificationDataModel.getProperty("/Enddate");
					startDate = oNotificationDataModel.getProperty("/Startdate");
					startDate = new Date(startDate);
					endDate = new Date(planEndDate);
					if (!planEndDate) {
						startDate = formatter.formatDateobjToString(startDate);
						splitDate = startDate.split("T")[0];
						startDate = splitDate + "T" + startTime + ":00";
						this.fnDateObjToGWDateFormat(oEvent, true, fieldType, startDate, endDate);
					} else if (startDate > endDate) {
						this.fnDateObjToGWDateFormat(oEvent, false, fieldType, startDate, endDate);
						this.showMessage(this.oResourceModel.getText("malfnsdatemsg"));
					} else {
						startDate = formatter.formatDateobjToString(startDate);
						splitDate = startDate.split("T")[0];
						dateValue = splitDate + "T" + startTime + ":00";
						this.fnDateObjToGWDateFormat(oEvent, true, fieldType, startDate, endDate);
					}
				} else if (fieldType === "Enddate") {
					var planStartDate = oNotificationDataModel.getProperty("/Startdate");
					endDate = oNotificationDataModel.getProperty("/Enddate");
					startDate = new Date(planStartDate);
					endDate = new Date(endDate);
					if (!startDate) {
						endDate = formatter.formatDateobjToString(endDate);
						splitDate = endDate.split("T")[0];
						endDate = splitDate + "T" + endTime + ":00";
						this.fnDateObjToGWDateFormat(oEvent, true, fieldType, startDate, endDate);
					} else if (endDate < startDate) {
						this.fnDateObjToGWDateFormat(oEvent, false, fieldType, startDate, endDate);
						this.showMessage(this.oResourceModel.getText("malfnEdatemsg"));
					} else {
						endDate = formatter.formatDateobjToString(endDate);
						splitDate = endDate.split("T")[0];
						endDate = splitDate + "T" + endTime + ":00";
						this.fnDateObjToGWDateFormat(oEvent, true, fieldType, startDate, endDate);
					}
				}
			} else if (fieldType === "StartTime" || fieldType === "EndTime") {
				splitDate = "";
				dateValue = oSource.getValue();
				if (fieldType === "StartTime") {
					startDate = oNotificationDataModel.getProperty("/Startdate");
					startDate = formatter.formatDateobjToString(startDate);
					splitDate = startDate.split("T")[0];
					dateValue = splitDate + "T" + dateValue + ":00";
					dateValue = new Date(dateValue);
					oNotificationDataModel.setProperty("/Startdate", dateValue);
				} else if (fieldType === "EndTime") {
					endDate = oNotificationDataModel.getProperty("/Enddate");
					endDate = formatter.formatDateobjToString(endDate);
					splitDate = endDate.split("T")[0];
					dateValue = splitDate + "T" + dateValue + ":00";
					dateValue = new Date(dateValue);
					oNotificationDataModel.setProperty("/Enddate", dateValue);
				}
			}
			oNotificationDataModel.refresh();
		},

		//Function to search Work Orders
		onSearchWorkOrders: function (oEvent) {
			var that = this;
			this.busy.open();
			var mLookupModel = this.mLookupModel;
			var oPortalDataModel = this.oPortalDataModel;
			var Orderid = oEvent.getSource().getValue();

			var oFilter = [];
			oFilter.push(new Filter("Orderid", "EQ", ""));
			oFilter.push(new Filter("OrderType", "EQ", ""));
			oFilter.push(new Filter("SysStatus", "EQ", ""));
			oFilter.push(new Filter("WoDes", "EQ", Orderid));
			oFilter.push(new Filter("EnteredBy", "EQ", ""));
			oFilter.push(new Filter("Priority", "EQ", ""));
			oFilter.push(new Filter("AssignedTech", "EQ", ""));

			oPortalDataModel.read("/WorkOrderListSet", {
				filters: oFilter,
				urlParameters: {
					"$top": 100,
					"$skip": 0
				},
				success: function (oData) {
					var oWorkOrders = oData.results;
					mLookupModel.setProperty("/aWorkOrders", oWorkOrders);
					mLookupModel.refresh();
					that.busy.close();
				},
				error: function (oData) {
					mLookupModel.setProperty("/aWorkOrders", []);
					mLookupModel.refresh();
					that.busy.close();
				}
			});
		},

		//Function to check Mandaorty fields validation
		checkMandatoryFields: function (oEvent) {
			var that = this;
			var oNotificationDataModel = this.oNotificationDataModel;
			var oNotificationViewModel = this.oNotificationViewModel;
			var bVal = util.checkMandatoryFields(oNotificationDataModel, oNotificationViewModel);
			if (bVal[0] === true) {
				that.showMessage(bVal[1]);
				return;
			} else {
				//this.onOpenDigitalSignPopup();
				this.onUpdateNotification();
			}
		},

		//Function to update notification to server
		onUpdateNotification: function () {
			var that = this;
			this.busy.open();
			var oPortalNotifOData = this.oPortalNotifOData;
			var oNotificationDataModel = this.oNotificationDataModel;
			var oNotificationViewModel = this.oNotificationViewModel;
			var oNotifData = oNotificationDataModel.getData();

			var tempLongText = oNotificationViewModel.getProperty("/Longtext");
			oNotifData.Longtext = tempLongText;

			oNotifData.Startdate = formatter.formatDateobjToString(oNotifData.Startdate);
			oNotifData.Enddate = formatter.formatDateobjToString(oNotifData.Enddate);
			oNotifData.Notif_date = formatter.formatDateobjToString(oNotifData.Notif_date);
			oNotifData.ReqStartdate = formatter.formatDateobjToString(oNotifData.ReqStartdate);
			oNotifData.ReqEnddate = formatter.formatDateobjToString(oNotifData.ReqEnddate);
			oNotifData.Type = "UPDATE";
			if (oNotifData.Breakdown === true) {
				oNotifData.Breakdown = "X";
			} else if (oNotifData.Breakdown === false) {
				oNotifData.Breakdown = " ";
			}

			var startTime = oNotificationViewModel.getProperty("/StartTime");
			if (!startTime) {
				startTime = "00:00";
			}
			var splitDate1 = oNotifData.Startdate.split("T")[0];
			oNotifData.Startdate = splitDate1 + "T" + startTime + ":00";

			var endTime = oNotificationViewModel.getProperty("/EndTime");
			if (!endTime) {
				endTime = "00:00";
			}
			var splitDate2 = oNotifData.Enddate.split("T")[0];
			oNotifData.Enddate = splitDate2 + "T" + endTime + ":00";
			oPortalNotifOData.setHeaders({
				"X-Requested-With": "X"
			});
			oPortalNotifOData.create("/NotificationSet", oNotifData, {
				success: function (sData, oResponse) {
					var oNotifyMsg = sData.Notify;
					if (oNotifyMsg.hasOwnProperty("results")) {
						var notifLength = oNotifyMsg.results.length;
						if (notifLength > 0) {
							var messages = oNotifyMsg.results;
							var tempArr = [];
							for (var i = 0; i < messages.length; i++) {
								var obj = {};
								obj.Status = messages[i].Type;
								obj.Message = messages[i].Message;
								tempArr.push(obj);
							}
							that.fnShowSuccessErrorMsg(tempArr);
						} else {
							that.fnFetchDetailNotifList();
							that.showMessage(that.oResourceModel.getText("succesnotifmsg"));
						}
					} else {
						that.fnFetchDetailNotifList();
						that.showMessage(that.oResourceModel.getText("succesnotifmsg"));
					}
					that.fnFormatDateObjects(sData);
					oNotificationDataModel.setData(sData);
					that.busy.close();
				},
				error: function (error, oResponse) {
					var errorMsg = that.oResourceModel.getText("errormsg");
					that.showMessage(errorMsg);
					that.busy.close();
				}
			});
		},

		//Function to get damage code values
		getDamageGroupCode: function (oEvent, damageCode) {
			var oSelectedKey = "";
			var mLookupModel = this.mLookupModel;
			var oNotificationDataModel = this.oNotificationDataModel;
			if (!oEvent && !damageCode) {
				oNotificationDataModel.setProperty("/DamageCode", "");
				oNotificationDataModel.setProperty("/DamgeText", "");
				oNotificationDataModel.setProperty("/DamageGroup", "");
			} else if (damageCode) {
				oSelectedKey = damageCode;
			} else if (oEvent) {
				var oSource = oEvent.getSource();
				oSelectedKey = oSource.getSelectedKey();
			}

			var damageCodes = mLookupModel.getProperty("/aDamageCode");
			if (damageCodes) {
				damageCodes.filter(function (obj) {
					if (obj.Code === oSelectedKey) {
						oNotificationDataModel.setProperty("/DamageCode", obj.Code);
						oNotificationDataModel.setProperty("/DamgeText", obj.Codetext);
						oNotificationDataModel.setProperty("/DamageGroup", obj.Codegruppe);
					}
				});
			}
		},

		//Function to get Cause code values
		getCauseGroupCode: function (oEvent, causeCode) {
			var oSelectedKey = "";
			var mLookupModel = this.mLookupModel;
			var oNotificationDataModel = this.oNotificationDataModel;
			if (!oEvent && !causeCode) {
				oNotificationDataModel.setProperty("/CauseCode", "");
				oNotificationDataModel.setProperty("/CauseText", "");
				oNotificationDataModel.setProperty("/CauseGroup", "");
			} else if (causeCode) {
				oSelectedKey = causeCode;
			} else if (oEvent) {
				var oSource = oEvent.getSource();
				oSelectedKey = oSource.getSelectedKey();
			}
			var aCauseCode = mLookupModel.getProperty("/aCauseCode");
			if (aCauseCode) {
				aCauseCode.filter(function (obj) {
					if (obj.Code === oSelectedKey) {
						oNotificationDataModel.setProperty("/CauseCode", obj.Code);
						oNotificationDataModel.setProperty("/CauseText", obj.Codetext);
						oNotificationDataModel.setProperty("/CauseGroup", obj.Codegruppe);
					}
				});
			}
		},

		//Function to show selected Equipment
		/*fnFilterSlectedDamageGroup: function () {
			var catGrp = this.mLookupModel.getProperty("/sCatelogProf");
			var aFilters = [];
			if (catGrp) {
				var sFilter = new sap.ui.model.Filter("Codegruppe", "EQ", catGrp);
				aFilters.push(sFilter);
			}

			var oDamageCode = this.getView().byId("NOTIF_DETAIL_DAMAGE_CODE");
			var binding = oDamageCode.getBinding("items");
			binding.filter(aFilters, "Application");
		},*/

		// //Function to show selected Equipment
		// fnFilterSlectedCauseGroup: function () {
		// 	var catGrp = this.mLookupModel.getProperty("/sCatelogProf");
		// 	var aFilters = [];
		// 	if (catGrp) {
		// 		var sFilter = new sap.ui.model.Filter("Codegruppe", "EQ", catGrp);
		// 		aFilters.push(sFilter);
		// 	}

		// 	var oCauseCode = this.getView().byId("NOTIF_DETAIL_CAUSE_CODE");
		// 	var binding = oCauseCode.getBinding("items");
		// 	binding.filter(aFilters, "Application");
		// },

		//Function to format Notification date format fetching from service
		fnFormatDateObjects: function (oData) {
			if (oData.Startdate) {
				oData.Startdate = new Date(oData.Startdate);
			} else if (oData.Startdate === "" || oData.Startdate === null) {
				oData.Startdate = null;
			}
			if (oData.Enddate) {
				oData.Enddate = new Date(oData.Enddate);
			} else if (oData.Enddate === "" || oData.Enddate === null) {
				oData.Enddate = null;
			}
			if (oData.ReqStartdate) {
				oData.ReqStartdate = new Date(oData.ReqStartdate);
			} else if (oData.ReqStartdate === "" || oData.ReqStartdate === null) {
				oData.ReqStartdate = null;
			}
			if (oData.ReqEnddate) {
				oData.ReqEnddate = new Date(oData.ReqEnddate);
			} else if (oData.ReqEnddate === "" || oData.ReqEnddate === null) {
				oData.ReqEnddate = null;
			}
			var oNotifMsg = [{
				"Type": "",
				"Message": ""
			}];
			oData.Notify = oNotifMsg;
			return oData;
		},

		//Function to open User search PopUp
		handleValueHelp: function () {
			if (!this.usersListDialog) {
				this.usersListDialog = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.usersListNotif", this);
				this.getView().addDependent(this.usersListDialog);
			}
			var oDialog = this.usersListDialog.getContent();
			oDialog[1].removeSelections(true);
			oDialog[0].setValue();
			this.usersListDialog.open();
		},

		//Function to close User search PopUp
		onCancelDialogAssignUser: function () {
			this.usersListDialog.close();
		}
	});
});