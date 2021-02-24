sap.ui.define([
	"com/sap/incture/IMO_PM/controller/BaseController",
	"com/sap/incture/IMO_PM/formatter/formatter",
	"com/sap/incture/IMO_PM/util/util",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox"
], function (BaseController, formatter, util, JSONModel, Filter, FilterOperator, MessageBox) {
	"use strict";

	return BaseController.extend("com.sap.incture.IMO_PM.controller.createNotif", {
		formatter: formatter,
		util: util,
		onInit: function () {
			var that = this;
			this.fnInitCreateNotifApp();
			this.router = sap.ui.core.UIComponent.getRouterFor(this);
			this.router.attachRoutePatternMatched(function (oEvent) {
				that.routePatternMatched(oEvent);
			});
		},

		routePatternMatched: function () {
			this.setAppInitDataCreateNotif("CREATE_NOTIFCATION");
			// this.resetUIFields();
			// this.fnGetObjectPart();
			// this.getItemKeyForCause();
		},

		//Function to reset UI fields
		resetUIFields: function () {
			var mLookupModel = this.mLookupModel;
			var oUserDetailModel = this.oUserDetailModel;
			var oNotificationViewModel = this.oNotificationViewModel;
			var oNotificationDataModel = this.oNotificationDataModel;
			util.resetCreateNotificationFields(oNotificationDataModel, oNotificationViewModel, mLookupModel, oUserDetailModel);
		},
		onselectNotif: function (oEvent) {
			var mLookupModel = this.mLookupModel;
			var oNotificationDataModel = this.oNotificationDataModel;
			var oSource = oEvent.getParameter("listItem");
			var sPath = oSource.getBindingContextPath();
			var iEqId = mLookupModel.getProperty(sPath + "/Equipment");
			var iFunLoc = mLookupModel.getProperty(sPath + "/FunctLoc");
			var sPlanGrpSel = mLookupModel.getProperty(sPath + "/Plangroup");
			var sWorkCenterSel = mLookupModel.getProperty(sPath + "/WorkCntr");
			var sPlant = mLookupModel.getProperty(sPath + "/Planplant");
			var sPriority = mLookupModel.getProperty(sPath + "/Priority");
			this.fnSetDateBasedOnPriority(sPriority); // nischal 
			var sNotifType = mLookupModel.getProperty(sPath + "/NotifType");
			var sDescription = mLookupModel.getProperty(sPath + "/Descriptn");
			var sLongText = mLookupModel.getProperty(sPath + "/LongText");
			var bBreakDown = mLookupModel.getProperty(sPath + "/Breakdown");
			if (bBreakDown === true) {
				bBreakDown = "X";
			} else {
				bBreakDown = " ";
			}
			var stempAssembly = mLookupModel.getProperty(sPath + "/Assembly");
			var sRefnotif = mLookupModel.getProperty(sPath + "/NotifNo");
			mLookupModel.setProperty("/sRefnotif", sRefnotif);
			var stempAssembly = parseInt(stempAssembly);
			var sSubAssembly = stempAssembly.toString();
			oNotificationDataModel.setProperty("/Equipment", iEqId);
			oNotificationDataModel.setProperty("/FunctLoc", iFunLoc);
			oNotificationDataModel.setProperty("/Plangroup", sPlanGrpSel);
			oNotificationDataModel.setProperty("/PlanPlant", sPlant); //nischal
			oNotificationDataModel.setProperty("/WorkCenter", sWorkCenterSel); //nischal
			oNotificationDataModel.setProperty("/Priority", sPriority);
			oNotificationDataModel.setProperty("/NotifType", sNotifType);
			oNotificationDataModel.setProperty("/ShortText", sDescription);
			oNotificationDataModel.setProperty("/Longtext", sLongText);
			oNotificationDataModel.setProperty("/Breakdown", bBreakDown);
			oNotificationDataModel.setProperty("/Assembly", sSubAssembly);
			this.getEquipsAssmebly(iEqId);
			this.onCloseRefNotif();
		},
		//nischal -- Function to set Required Start Date and End Date based on Priority
		fnSetDateBasedOnPriority: function (sVal) {
			var oNotificationDataModel = this.oNotificationDataModel;
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
			oNotificationDataModel.setProperty("/ReqStartdate", oReqStartDate);
			oNotificationDataModel.setProperty("/ReqEnddate", oReqEndDate);

		},
		//nischal
		onSearchNotifData: function (oEvent) {
			var mLookupModel = this.mLookupModel;
			var sQuery = oEvent.getSource().getValue();
			mLookupModel.setProperty("/notifData", sQuery);
			this.refNotifValueHelp();
		},
		refNotifValueHelp: function () {
			var that = this;
			var mLookupModel = this.mLookupModel;
			var iTopNotif = 50;
			var iSkipNotif = 0;
			var sUrl = "/NotificationListSet";
			var oPortalDataModel = this.oPortalDataModel;
			if (!this.referenceNotifDialog) {
				this.referenceNotifDialog = sap.ui.xmlfragment("com/sap/incture/IMO_PM.fragment.refNotification", this);
				this.getView().addDependent(this.referenceNotifDialog);
			}
			this.referenceNotifDialog.open();
			this.busy.open();
			var oFilter = [];
			var userPlant = this.oUserDetailModel.getProperty("/userPlant");
			var notifData = mLookupModel.getProperty("/notifData");
			if (notifData !== "undefined") {
				oFilter.push(new Filter("NotifNo", "EQ", notifData));
			} else {
				oFilter.push(new Filter("NotifNo", "EQ", ""));
			}
			oFilter.push(new Filter("plant", "EQ", userPlant));
			oPortalDataModel.read(sUrl, {
				filters: oFilter,
				urlParameters: {
					"$top": iTopNotif,
					"$skip": iSkipNotif
				},
				success: function (oData) {
					var aNotificationListSet = oData.results;
					mLookupModel.setProperty("/aNotifListSet", aNotificationListSet);
					that.busy.close();
				},
				error: function (oData) {
					mLookupModel.setProperty("/aNotifListSet", []);
					mLookupModel.refresh();
					that.busy.close();
				}
			});

		},
		onCloseRefNotif: function () {
			this.referenceNotifDialog.close();
			this.referenceNotifDialog.destroy();
			this.referenceNotifDialog = null;

		},
		//Function to get Equipment List and show in a pop-up
		openEquipmentListValueHelp: function (oEvent) {
			if (!this.equipmentsListDialog) {
				this.equipmentsListDialog = sap.ui.xmlfragment("com/sap/incture/IMO_PM.fragment.equipmentsListCreateNotif", this);
				this.getView().addDependent(this.equipmentsListDialog);
			}
			this.equipmentsListDialog.open();
		},

		//Function to close equipment pop-up
		onCancelDialogEquip: function (oEvent) {
			this.equipmentsListDialog.close();
			this.equipmentsListDialog.destroy();
			this.equipmentsListDialog = null;
		},

		//Function to select a Equipment and auto-populate Functional location
		onEquipSelect: function (oEvent) {
			var mLookupModel = this.mLookupModel;
			var oNotificationDataModel = this.oNotificationDataModel;
			var oSource = oEvent.getParameter("listItem");
			var sPath = oSource.getBindingContextPath();
			var iEqId = mLookupModel.getProperty(sPath + "/Equnr");
			var iFunLoc = mLookupModel.getProperty(sPath + "/Tplnr");
			var sCatelogProf = mLookupModel.getProperty(sPath + "/Rbnr");
			var sPlanGrpSel = mLookupModel.getProperty(sPath + "/Ingrp");
			var sWorkCenterSel = mLookupModel.getProperty(sPath + "/Gewrk");
			var sWorkCenterDesc = mLookupModel.getProperty(sPath + "/WorkCenter");
			var sPlant = mLookupModel.getProperty(sPath + "/plant");
			oNotificationDataModel.setProperty("/Equipment", iEqId);
			mLookupModel.setProperty("/sWorkCenterSel", sWorkCenterSel);
			mLookupModel.setProperty("/sEquipFilter", iEqId);
			mLookupModel.setProperty("/sNotifEquipFilter", iEqId);
			mLookupModel.setProperty("/sCatelogProf", sCatelogProf);
			oNotificationDataModel.setProperty("/FunctLoc", iFunLoc);
			oNotificationDataModel.setProperty("/Plangroup", sPlanGrpSel);
			oNotificationDataModel.setProperty("/PlanPlant", sPlant); //nischal
			oNotificationDataModel.setProperty("/WorkCenter", sWorkCenterDesc); //nischal
			this.getEquipsAssmebly(iEqId);
			// this.equipmentsListDialog.close();
			// this.fnFilterSlectedDamageGroup();
			// this.fnFilterSlectedCauseGroup();
			this.onCancelDialogEquip();
		},
		onEquipOfFunLocSelect: function (oEvent) {
			var mLookupModel = this.mLookupModel;
			var oNotificationDataModel = this.oNotificationDataModel;
			var oSource = oEvent.getParameter("listItem");
			var sPath = oSource.getBindingContextPath();
			var iEqId = mLookupModel.getProperty(sPath + "/EquipId");
			var iFunLoc = oNotificationDataModel.getProperty("/FunctLoc");
			oNotificationDataModel.setProperty("/Equipment", iEqId);
			oNotificationDataModel.setProperty("/FunctLoc", iFunLoc);
			this.getEquipsAssmebly(iEqId);
			this.equipmentsListDialog.close();
		},
		//Function to show selected Equipment
		fnFilterSlectedDamageGroup: function () {
			var catGrp = this.mLookupModel.getProperty("/sCatelogProf");
			var aFilters = [];
			if (catGrp) {
				var sFilter = new sap.ui.model.Filter("Codegruppe", "EQ", catGrp);
				aFilters.push(sFilter);
			}

			var oDamageCode = this.getView().byId("CREATE_NOTIF_DAMAGE_CODE");
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

			var oCauseCode = this.getView().byId("CREATE_NOTIF_CAUSE_CODE");
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
					filters: [new Filter("EqId", FilterOperator.Contains, sQuery), new Filter("EqDes", FilterOperator.Contains, sQuery),
						new Filter("Equnr", FilterOperator.Contains, sQuery), new Filter("Eqktu", FilterOperator.Contains, sQuery)
					],
					and: false
				});
				aFilters.push(oFilterByIDDes);
			}
			var oTable = oEvent.getSource().getParent().getContent()[1].getContent()[0];
			var oBinding = oTable.getBinding("items");
			oBinding.filter(aFilters);
		},

		//Function to validate Start and End date for a Notification
		fnValidateDates: function (oEvent) {
			var startDate, endDate;
			var oSource = oEvent.getSource();
			var dateValue = oSource.getDateValue();
			var oResourceModel = this.oResourceModel;
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
					this.fnDateObjToGWDateFormat(oEvent, false, dateField, startDate, endDate);
					var errText = oResourceModel.getText("STARTDATE_GREATER_ENDATE");
					this.showMessage(errText);
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
					this.fnDateObjToGWDateFormat(oEvent, false, dateField, startDate, endDate);
					var erorText = oResourceModel.getText("ENDATE_GREATER_STARTDATE");
					this.showMessage(erorText);
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
			var splitDate = "";
			var startDate, endDate;
			var oSource = oEvent.getSource();
			var oResourceModel = this.oResourceModel;
			var fieldType = oSource.getCustomData()[0].getValue();
			var oNotificationDataModel = this.oNotificationDataModel;
			var oNotificationViewModel = this.oNotificationViewModel;
			var startTime = oNotificationViewModel.getProperty("/StartTime");
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
						startDate = formatter.formatDateobjToStringNotif(startDate);
						splitDate = startDate.split("T")[0];
						startDate = splitDate + "T" + startTime + ":00";
						this.fnDateObjToGWDateFormat(oEvent, true, fieldType, startDate, endDate);
					} else if (startDate > endDate) {
						this.fnDateObjToGWDateFormat(oEvent, false, fieldType, startDate, endDate);
						//var erorText = oResourceModel.getText("MAL_STARTDATE_GREATER_MAL_ENDATE");
						//this.showMessage(erorText);
					} else {
						startDate = formatter.formatDateobjToStringNotif(startDate);
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
						endDate = formatter.formatDateobjToStringNotif(endDate);
						splitDate = endDate.split("T")[0];
						endDate = splitDate + "T" + endTime + ":00";
						this.fnDateObjToGWDateFormat(oEvent, true, fieldType, startDate, endDate);
					} else if (endDate < startDate) {
						this.fnDateObjToGWDateFormat(oEvent, false, fieldType, startDate, endDate);
						var errorText = oResourceModel.getText("MAL_ENDATE_GREATER_MAL_STARTDATE");
						this.showMessage(errorText);
					} else {
						endDate = formatter.formatDateobjToStringNotif(endDate);
						splitDate = endDate.split("T")[0];
						endDate = splitDate + "T" + endTime + ":00";
						this.fnDateObjToGWDateFormat(oEvent, true, fieldType, startDate, endDate);
					}
				}
			} else if (fieldType === "StartTime" || fieldType === "EndTime") {
				dateValue = oSource.getValue();
				if (fieldType === "StartTime") {
					startDate = oNotificationDataModel.getProperty("/Startdate");
					startDate = formatter.formatDateobjToStringNotif(startDate);
					splitDate = startDate.split("T")[0];
					dateValue = splitDate + "T" + dateValue + ":00";
					dateValue = new Date(dateValue);
					oNotificationDataModel.setProperty("/Startdate", dateValue);
				} else if (fieldType === "EndTime") {
					endDate = oNotificationDataModel.getProperty("/Enddate");
					endDate = formatter.formatDateobjToStringNotif(endDate);
					splitDate = endDate.split("T")[0];
					dateValue = splitDate + "T" + dateValue + ":00";
					dateValue = new Date(dateValue);
					oNotificationDataModel.setProperty("/Enddate", dateValue);
				}
			}

			//to Calculate Breakdown Duration
			this.fnGetBreakdownDurNotif();

			oNotificationDataModel.refresh();
		},

		//Function to update Breakdown boolean status
		fnUpdateBreakDownStatus: function (oEvent) {
			var bVal = oEvent.getSource().getState();
			var oNotificationDataModel = this.oNotificationDataModel;
			if (bVal) {
				oNotificationDataModel.setProperty("/Breakdown", "X");
				this.fnResetMalfnDateTimes();
			} else {
				oNotificationDataModel.setProperty("/Breakdown", " ");
				oNotificationDataModel.setProperty("/BreakdownDur", "0");
				this.fnResetMalfnDateTimes();
			}
			oNotificationDataModel.refresh();
		},

		//Function to check Mandaorty fields validation
		checkMandatoryFields: function (oEvent) {
			var that = this;
			var oSource = oEvent.getSource();
			var oBtnType = oSource.getCustomData()[0].getValue();
			var oResourceModel = this.oResourceModel;
			var oNotificationDataModel = this.oNotificationDataModel;
			var oNotificationViewModel = this.oNotificationViewModel;
			var bVal = util.checkMandatoryFields(oNotificationDataModel, oNotificationViewModel, oResourceModel);
			if (bVal[0] === true) {
				that.showMessage(bVal[1]);
				return;
			} else if (bVal[0] === false && oBtnType === "CREATE_ORDER") {
				this.onCreateNotifWithWO(oBtnType);
			} else {
				this.onCreateNotification();
			}
		},

		//Function to create Notification
		onCreateNotification: function () {
			var that = this;
			this.busy.open();
			var oResourceModel = this.oResourceModel;
			var oPortalNotifOData = this.oPortalNotifOData;
			var oNotificationDataModel = this.oNotificationDataModel;
			var oNotifData = oNotificationDataModel.getData();
			oNotifData.Startdate = formatter.formatDateobjToStringNotif(oNotifData.Startdate, true);
			//oNotifData.Enddate = formatter.formatDateobjToStringNotif(oNotifData.Enddate, false);
			if (oNotifData.Enddate) {
				oNotifData.Enddate = formatter.formatDateobjToStringNotif(oNotifData.Enddate, true);
			} else {
				oNotifData.Enddate = "";
			}
			oNotifData.ReqStartdate = formatter.formatDateobjToStringNotif(oNotifData.ReqStartdate);
			oNotifData.ReqEnddate = formatter.formatDateobjToStringNotif(oNotifData.ReqEnddate);
			oNotifData.Notif_date = formatter.formatDateobjToStringNotif(new Date());
			oNotifData.Type = "CREATE";
			if (oNotifData.Assembly === "NaN") {
				oNotifData.Assembly = "";
			}

			var oNotificationViewModel = this.oNotificationViewModel;
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
			if (oNotifData.Enddate !== "") {
				var splitDate2 = oNotifData.Enddate.split("T")[0];
				oNotifData.Enddate = splitDate2 + "T" + endTime + ":00";
			}

			oPortalNotifOData.setHeaders({
				"X-Requested-With": "X"
			});

			oPortalNotifOData.create("/NotificationSet", oNotifData, {
				async: false,
				success: function (sData, oResponse) {
					var successErrMsg = "";
					var isSuccess;
					var oNotificationId = parseInt(sData.Notifid);
					this.notifID = oNotificationId;
					that.createdNotifID = oNotificationId;
					if (oNotificationId) {
						that.resetUIFields();
						var successText = oResourceModel.getText("SUCCSESS_CREATING_NOTIF");
						successErrMsg = successText + oNotificationId;
						isSuccess = true;

					} else {
						var notifyMsgbVal = sData.Notify.hasOwnProperty("results");
						if (notifyMsgbVal) {
							successErrMsg = sData.Notify.results[0].Message;
						} else {
							successErrMsg = oResourceModel.getText("ERROR_CREATING_NOTIF");
						}
						that.fnFormatDateObjects(sData);
						oNotificationDataModel.setData(sData);
						that.showMessage(successErrMsg);
					}

					that.busy.close();
					if (isSuccess === true) {
						// MessageBox.success("Notification Created Successfully with Notification ID: " + this.notifID);
						MessageBox.success("Notification Created Successfully with Notification ID: " + this.notifID, {
							actions: [MessageBox.Action.OK],
							emphasizedAction: MessageBox.Action.OK,
							onClose: function (sAction) {
								// that.fnNavLaunchpadHome();
								var oRouter = sap.ui.core.UIComponent.getRouterFor(that);
								oRouter.navTo("notifDetail", {
									notifID: that.createdNotifID
								});
							}
						});

					}
				},
				error: function (error, oResponse) {
					var errorMsg = oResourceModel.getText("ERROR_CREATING_NOTIF");
					that.showMessage(errorMsg);
					that.busy.close();
				}
			});

		},
		onCreateNotifWithWO: function (btnType) {
			var that = this;
			var oResourceModel = this.oResourceModel;
			var oPortalNotifOData = this.oPortalNotifOData;
			var oNotificationDataModel = this.oNotificationDataModel;
			var oNotifData = oNotificationDataModel.getData();
			oNotifData.Startdate = formatter.formatDateobjToStringNotif(oNotifData.Startdate, true);
			if (oNotifData.Enddate) {
				oNotifData.Enddate = formatter.formatDateobjToStringNotif(oNotifData.Enddate, true);
			} else {
				oNotifData.Enddate = "";
			}
			oNotifData.ReqStartdate = formatter.formatDateobjToStringNotif(oNotifData.ReqStartdate);
			oNotifData.ReqEnddate = formatter.formatDateobjToStringNotif(oNotifData.ReqEnddate);
			oNotifData.Notif_date = formatter.formatDateobjToStringNotif(new Date());
			oNotifData.Type = "CREATE";
			if (oNotifData.Assembly === "NaN") {
				oNotifData.Assembly = "";
			}

			var oNotificationViewModel = this.oNotificationViewModel;
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
			if (oNotifData.Enddate !== "") {
				var splitDate2 = oNotifData.Enddate.split("T")[0];
				oNotifData.Enddate = splitDate2 + "T" + endTime + ":00";
			}
			oPortalNotifOData.setHeaders({
				"X-Requested-With": "X"
			});

			oPortalNotifOData.create("/NotificationSet", oNotifData, {
				async: false,
				success: function (sData, oResponse) {
					var successErrMsg = "";
					var isSuccess;
					var oNotificationId = parseInt(sData.Notifid, 10);
					this.notifID = oNotificationId;
					if (oNotificationId) {
						that.fnCreateWorkOrderForNotif(sData, btnType);
					}
				},
				error: function (error, oResponse) {
					var errorMsg = oResourceModel.getText("ERROR_CREATING_NOTIF");
					that.showMessage(errorMsg);
					that.busy.close();
				}
			});

		},
		//Function to nvaigate to Launchpad home page after creating Notification
		fnNavLaunchpadHome: function () {
			// var sHost = window.location.origin;
			// var sBSPPath = "/IMO_PM/index.html";
			// var sURL = sHost + sBSPPath;
			// sap.m.URLHelper.redirect(sURL);
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("createNotif");
		},

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

		//Function to get damage code values
		getDamageGroupCode: function (oEvent) {
			var oSource = oEvent.getSource();
			var mLookupModel = this.mLookupModel;
			var oSelectedKey = oSource.getSelectedKey();
			var oNotificationDataModel = this.oNotificationDataModel;
			var damageCodes = mLookupModel.getProperty("/aDamageCode");
			damageCodes.filter(function (obj) {
				if (obj.Code === oSelectedKey) {
					oNotificationDataModel.setProperty("/DamageCode", obj.Code);
					oNotificationDataModel.setProperty("/DamgeText", obj.Codetext);
					oNotificationDataModel.setProperty("/DamageGroup", obj.Codegruppe);
				}
			});
		},

		//Function to get Cause code values
		getCauseGroupCode: function (oEvent) {
			var oSource = oEvent.getSource();
			var mLookupModel = this.mLookupModel;
			var oSelectedKey = oSource.getSelectedKey();
			var oNotificationDataModel = this.oNotificationDataModel;
			var aCauseCode = mLookupModel.getProperty("/aCauseCode");
			aCauseCode.filter(function (obj) {
				if (obj.Code === oSelectedKey) {
					oNotificationDataModel.setProperty("/CauseCode", obj.Code);
					oNotificationDataModel.setProperty("/CauseText", obj.Codetext);
					oNotificationDataModel.setProperty("/CauseGroup", obj.Codegruppe);
				}
			});
		},

		//Function to open User search PopUp
		handleValueHelp: function () {
			if (!this.usersListDialog) {
				this.usersListDialog = sap.ui.xmlfragment("com/sap/incture/IMO_PM.fragment.usersListNotif", this);
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
		},
		//Function to enable/disable the switch button based on Notification Type
		onChangeNotifType: function (oEvent) {
			var sSelectedKey = oEvent.getSource().getSelectedItem().getKey();
			if (sSelectedKey === "M2") {
				this.getView().byId("idBreakDownSwitch").setEnabled(true);
			} else {
				this.getView().byId("idBreakDownSwitch").setEnabled(false);
			}
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

		onSearchFnLocs: function (oEvent) {
			var aFilters = [];
			var sQuery = oEvent.getSource().getValue();
			var oList = sap.ui.core.Fragment.byId("idFunctionalLocationFrag", "idFunLocListTable");
			var oBinding = oList.getBinding("items");
			if (sQuery && sQuery.length > 0) {
				var filter = new Filter("FuncLoc", FilterOperator.Contains, sQuery);
				aFilters.push(filter);
			}
			oBinding.filter(aFilters);
		},
		onFnLocSelect: function (oEvent) {
			this.onFunlocChange();
			var mLookupModel = this.mLookupModel;
			var oNotificationDataModel = this.oNotificationDataModel;
			var oSource = oEvent.getParameter("listItem");
			var sPath = oSource.getBindingContextPath();
			var iFunLoc = mLookupModel.getProperty(sPath + "/FuncLoc");
			mLookupModel.setProperty("/sFunLoc", iFunLoc);
			oNotificationDataModel.setProperty("/FunctLoc", iFunLoc);
			this.onCancelDialogFunLoc();
		},
		//function to clear equipment details on change of functional location
		onFunlocChange: function () {
			var mLookupModel = this.mLookupModel;
			var oNotificationDataModel = this.oNotificationDataModel;
			mLookupModel.setProperty("/sWorkCenterSel", "");
			mLookupModel.setProperty("/sEquipFilter", "");
			mLookupModel.setProperty("/sNotifEquipFilter", "");
			mLookupModel.setProperty("/sCatelogProf", "");
			oNotificationDataModel.setProperty("/Plangroup", "");
			oNotificationDataModel.setProperty("/Equipment", "");
			mLookupModel.setProperty("/aEquipAssemblyList", "");
		},
		handleEquipIconTabSelect: function (oEvent) {
			var that = this;
			var selectedKey = oEvent.getSource().getSelectedKey();
			if (selectedKey === "idEqFunLoc") {
				this.busy.open();
				var mLookupModel = this.mLookupModel;
				var oNotificationDataModel = this.oNotificationDataModel;
				var sFunctionalLocation = oNotificationDataModel.getProperty("/FunctLoc");
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
		onCreateWODialogOpen: function (oEvent) {
			if (!this.createWoDialog) {
				this.createWoDialog = sap.ui.xmlfragment("com/sap/incture/IMO_PM.fragment.createWONotifDialog", this);
				this.getView().addDependent(this.createWoDialog);
			}
			this.createWoDialog.open();
		},

		//Function to close equipment pop-up
		onCancelWoDialog: function (oEvent) {
			this.createWoDialog.close();
			this.createWoDialog.destroy();
			this.createWoDialog = null;
		},

		//function to clear all the fields in the create notification
		onClearCreateNotif: function () {
			var mLookupModel = this.mLookupModel;
			this.resetUIFields();
			mLookupModel.setProperty("/sRefnotif", "");

		},
		onChangePriority: function (oEvent) {
			var that = this;
			var mLookupModel = this.mLookupModel;
			var oNotificationDataModel = this.oNotificationDataModel;
			var sVal = oEvent.getSource().getSelectedKey();
			var oReqStartDate = new Date();
			var tempStartDate = new Date();
			var tempEndDate = new Date();
			var oReqEndDate;
			MessageBox.confirm("Do you want to specify new Date ?", {
				actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
				emphasizedAction: MessageBox.Action.OK,
				onClose: function (sAction) {
					if (sAction === "OK") {
						if (sVal === "1") {
							tempEndDate.setDate(tempEndDate.getDate() + 7);
							var someFormattedDate = that.getFormattedDate(tempEndDate);
							oReqEndDate = new Date(someFormattedDate);

						} else if (sVal === "2") {
							tempStartDate.setDate(tempStartDate.getDate() + 7);
							var someFormattedDate = that.getFormattedDate(tempStartDate);
							oReqStartDate = new Date(someFormattedDate);

							tempEndDate.setDate(tempEndDate.getDate() + 30);
							someFormattedDate = that.getFormattedDate(tempEndDate);
							oReqEndDate = new Date(someFormattedDate);
						} else if (sVal === "3") {
							tempStartDate.setDate(tempStartDate.getDate() + 14);
							var someFormattedDate = that.getFormattedDate(tempStartDate);
							oReqStartDate = new Date(someFormattedDate);

							tempEndDate.setDate(tempEndDate.getDate() + 90);
							someFormattedDate = that.getFormattedDate(tempEndDate);
							oReqEndDate = new Date(someFormattedDate);

						} else if (sVal === "4") {
							tempStartDate.setDate(tempStartDate.getDate() + 1);
							var someFormattedDate = that.getFormattedDate(tempStartDate);
							oReqStartDate = new Date(someFormattedDate);

							tempEndDate.setDate(tempEndDate.getDate() + 12);
							someFormattedDate = that.getFormattedDate(tempEndDate);
							oReqEndDate = new Date(someFormattedDate);
						} else if (sVal === "E") {
							tempEndDate.setDate(tempEndDate.getDate() + 3);
							var someFormattedDate = that.getFormattedDate(tempEndDate);
							oReqEndDate = new Date(someFormattedDate);
						}
						oNotificationDataModel.setProperty("/ReqStartdate", oReqStartDate);
						oNotificationDataModel.setProperty("/ReqEnddate", oReqEndDate);
					}

				}
			});

		},
		getFormattedDate: function (sDate) {
			var dd = sDate.getDate();
			var mm = sDate.getMonth() + 1;
			var y = sDate.getFullYear();
			var someFormattedDate = y + '/' + mm + '/' + dd;
			return someFormattedDate;
		},
		onPressBackCreateNotif: function () {
			var mLookupModel = this.mLookupModel;
			mLookupModel.setProperty("/showTaskManagementPanelCreateNotif", false);
			mLookupModel.setProperty("/showAttachmentPanelCreateNotif", false);

		},
		onPressAttachmentsCreateNotif: function (oEvent) {
			var mLookupModel = this.mLookupModel;
			mLookupModel.setProperty("/showTaskManagementPanelCreateNotif", true);
			mLookupModel.setProperty("/showAttachmentPanelCreateNotif", true);
		}

	});
});