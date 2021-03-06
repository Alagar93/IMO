sap.ui.define([
	"com/sap/incture/IMO_PM/controller/BaseController",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/BusyDialog",
	"sap/ui/core/format/DateFormat",
	"com/sap/incture/IMO_PM/util/util",
	"com/sap/incture/IMO_PM/formatter/formatter",
	"sap/m/MessageBox"
], function (BaseController, Controller, JSONModel, Filter, FilterOperator, BusyDialog, DateFormat, util, formatter, MessageBox) {
	"use strict";

	return BaseController.extend("com.sap.incture.IMO_PM.controller.notifList", {

		formatter: formatter,
		util: util,

		onInit: function () {
			var that = this;
			this.fnInitNotificationListApp("NOTIF_LIST_VIEW");
			var oResourceModel = this.getOwnerComponent().getModel("i18n");
			this.oResourceModel = oResourceModel.getResourceBundle();
			this.router = sap.ui.core.UIComponent.getRouterFor(this);
			this.router.attachRoutePatternMatched(function (oEvent) {
				that.routePatternMatched(oEvent);
			});

			var oViewSetting = {
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
				"aBDown": [{
					"des": "YES"
				}, {
					"des": "NO"
				}],
				"sUnAssignedWOFlag": false,
				"sWorkCenterSel": "",
				"aNotifStatus": [{
					"key": "NOCO ORAS",
					"text": "Notification closed,Order Assigned"
				}, {
					"key": "NOCO",
					"text": "Notification closed"
				}, {
					"key": "NOPR ORAS",
					"text": "Notification in Progress, Order Assigned"
				}, {
					"key": "NOPR",
					"text": "Notification in Progress"
				}, {
					"key": "OSNO",
					"text": "Outsranding Notification"
				}],
				"sCreatedOnStart": formatter.GetMonthsBackDate(3),
				"sCreatedOnEnd": new Date().toLocaleDateString()
			};
			this.mLookupModel.setProperty("/", oViewSetting);
			this.getWOPriorities();
		},

		getFavEquips: function () {
			var that = this;
			this.busy.open();
			var sUrl = "/FavEquipListSet";
			var oPortalDataModel = this.oPortalDataModel;
			var mLookupModel = this.mLookupModel;
			oPortalDataModel.read(sUrl, {
				success: function (oData) {
					mLookupModel.setProperty("/aFavEquipList", oData.results);
					mLookupModel.refresh();
					that.busy.close();
				},
				error: function (oData) {
					mLookupModel.setProperty("/aFavEquipList", "");
					mLookupModel.refresh();
					that.busy.close();
				}
			});
		},

		//Function to get Work order priorities
		getWOPriorities: function () {

			// this.busy.open();
			var sUrl = "/PrioritySet";
			var mLookupModel = this.mLookupModel;
			var aPrioritySet = mLookupModel.getProperty("/aPrioritySet");
			if (!aPrioritySet) {
				var oLookupDataModel = this.oLookupDataModel;
				oLookupDataModel.read(sUrl, {
					success: function (oData) {
						aPrioritySet = oData.results;
						mLookupModel.setProperty("/aPrioritySet", aPrioritySet);
						mLookupModel.refresh();
						// that.busy.close();
					},
					error: function (oData) {
						mLookupModel.setProperty("/aPrioritySet", []);
						mLookupModel.refresh();
						// that.busy.close();
					}
				});
			}
		},

		routePatternMatched: function (oEvent) {
			var that = this;
			var viewName = oEvent.getParameter("name");
			if (viewName === "notifList") {
				var mLookupModel = this.mLookupModel;
				var oNotifTbl = that.getView().byId("notifListId");
				that.fnResetFilers(oNotifTbl, "mLookupModel");
				mLookupModel.setProperty("/selectedNotifs", []);
				mLookupModel.setProperty("/iSelectedIndices", 0);
				mLookupModel.refresh(true);
				var userPlant = this.oUserDetailModel.getProperty("/userPlant");
				if (userPlant) {
					this.fnFetchNotifList();
				}
			}
		},

		onSaveNotifFilter: function () {

			var that = this;
			var mLookupModel = this.mLookupModel;
			this.busy.open();
			var sUrl = "/SaveNotifVariantSet";
			var oPortalDataModel = this.oPortalDataModel;
			var oFilter = [];
			//"sCreatedOnStart": formatter.GetMonthsBackDate(3),
			//	"sCreatedOnEnd": new Date().toLocaleDateString()
			var oRequest = {
				"id": mLookupModel.getProperty("/idNotifFilter"),
				"userId": mLookupModel.getProperty("/userName"),
				"filterType": "notification",
				"notiStatus": mLookupModel.getProperty("/sNotifStatusFilter"),
				"notiNotiId": mLookupModel.getProperty("/sNotifIdFilter"),
				"notiEquipment": mLookupModel.getProperty("/sNotifEquipFilter"),
				"notiBreakDown": mLookupModel.getProperty("/sNotifBDFilter"),
				"notiPriority": mLookupModel.getProperty("/sNotifPriorFilter"),
				"sCreatedOnStart": mLookupModel.getProperty("/sCreatedOnStart"),
				"sCreatedOnEnd": mLookupModel.getProperty("/sCreatedOnEnd")
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
			if (oRequest.sCreatedOnStart === undefined || !oRequest.sCreatedOnStart) {

				oRequest.sCreatedOnStart = "";
			}
			if (oRequest.sCreatedOnEnd === undefined || !oRequest.sCreatedOnEnd) {

				oRequest.sCreatedOnEnd = "";
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
						sMsg = that.oResourceModel.getText("errorsavefilters");
						that.showMessage(sMsg, "I");
					}
					that.busy.close();
				},
				error: function (oData) {
					var sMsg = that.oResourceModel.getText("errorsavefilters");
					that.showMessage(sMsg, "I");
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

		fnFetchNotifList: function () {
			var that = this;

			//Trial for Date Range
			this.FilterDateFormat = DateFormat.getDateTimeInstance({
				pattern: "yyyy-MM-ddTHH:mm:ss"
			});

			var mLookupModel = this.mLookupModel;
			var aNotificationListSet = mLookupModel.getProperty("/aNotificationListSet");
			var iTopNotif = mLookupModel.getProperty("/iTopNotif");
			var iSkipNotif = mLookupModel.getProperty("/iSkipNotif");

			this.busy.open();
			var sUrl = "/NotificationListSet";
			var oPortalDataModel = this.oPortalDataModel;

			var sNotifIDDesFilter = mLookupModel.getProperty("/sNotifIDDesFilter");
			if (!sNotifIDDesFilter) {
				sNotifIDDesFilter = "";
			}
			var sNotifIdFilter = mLookupModel.getProperty("/sNotifIdFilter");
			if (!sNotifIdFilter) {
				sNotifIdFilter = "";
			}
			var sNotifStatusFilter = mLookupModel.getProperty("/sNotifStatusFilter");
			if (!sNotifStatusFilter) {
				sNotifStatusFilter = "";
			}
			var sNotifPriorFilter = mLookupModel.getProperty("/sNotifPriorFilter");
			if (!sNotifPriorFilter) {
				sNotifPriorFilter = "";
			}
			var sNotifEquipFilter = mLookupModel.getProperty("/sNotifEquipFilter");
			if (!sNotifEquipFilter) {
				sNotifEquipFilter = "";
			}
			var sNotifBDFilter = mLookupModel.getProperty("/sNotifBDFilter");
			if (!sNotifBDFilter) {
				sNotifBDFilter = "";
			}
			var sUnAssignedWOFlag = mLookupModel.getProperty("/sUnAssignedWOFlag");
			if (!sUnAssignedWOFlag) {
				sUnAssignedWOFlag = "";
			}
			var sNotifWkCenterFilter = mLookupModel.getProperty("/sNotifWkCenterFilter");
			if (!sNotifWkCenterFilter) {
				sNotifWkCenterFilter = "";
			}
			var sCreatedOnStart = mLookupModel.getProperty("/sCreatedOnStart");
			if (!sCreatedOnStart) {
				sCreatedOnStart = new Date(null);
			} else {
				sCreatedOnStart = new Date(sCreatedOnStart);
			}
			var sCreatedOnEnd = mLookupModel.getProperty("/sCreatedOnEnd");
			if (!sCreatedOnEnd) {
				sCreatedOnEnd = new Date();
			} else {
				sCreatedOnEnd = new Date(sCreatedOnEnd);
			}

			var oFilter = [];
			var userPlant = this.oUserDetailModel.getProperty("/userPlant");
			oFilter.push(new Filter({
				filters: [new Filter("CreatedOn", "GE", sCreatedOnStart),
					new Filter("CreatedOn", "LE", sCreatedOnEnd)
				],
				and: true
			}));

			oFilter.push(new Filter("Descriptn", "EQ", sNotifIDDesFilter));
			oFilter.push(new Filter("NotifNo", "EQ", sNotifIdFilter));
			oFilter.push(new Filter("SysStatus", "EQ", sNotifStatusFilter));
			oFilter.push(new Filter("Priority", "EQ", sNotifPriorFilter));
			oFilter.push(new Filter("Equipment", "EQ", sNotifEquipFilter));
			oFilter.push(new Filter("Bdflag", "EQ", sNotifBDFilter));
			oFilter.push(new Filter("Userstatus", "EQ", sUnAssignedWOFlag)); // using userstatus unused field for check box filter
			oFilter.push(new Filter("plant", "EQ", userPlant));
			oFilter.push(new Filter("WorkCntr", "EQ", sNotifWkCenterFilter));

			oPortalDataModel.read(sUrl, {
				filters: oFilter,
				urlParameters: {
					"$top": iTopNotif,
					"$skip": iSkipNotif
				},
				success: function (oData) {
					aNotificationListSet = oData.results;
					if (iSkipNotif !== 0) {
						aNotificationListSet = mLookupModel.getProperty("/aNotificationListSet").concat(aNotificationListSet);
					}
					$.each(aNotificationListSet, function (index, value) { //AN: #obxSearch

						value.PriorityDesNotif = formatter.fnPriorityConversion(value.Priority);
						if (value.Reqstartdate) {
							value.ReqstartdateString = that.fnDateSeperator(value.Reqstartdate);
						}
						if (value.CreatedOn) {
							value.CreatedOnString = that.fnDateConversionToSting(value.CreatedOn);
						}
						if (value.Reqenddate) {
							value.ReqenddateString = that.fnDateSeperator(value.Reqenddate);
						}
					});
					mLookupModel.setProperty("/aNotificationListSet", aNotificationListSet);
					mLookupModel.setProperty("/iDisplayedNotifCount", aNotificationListSet.length);
					mLookupModel.refresh();
					// that.getView().getContent()[0].getContent()[0].getFlexContent().rerender();

					var oNotifTbl = that.getView().byId("notifListId");
					that.fnResetFilers(oNotifTbl, "mLookupModel");
					that.busy.close();
				},
				error: function (oData) {
					mLookupModel.setProperty("/aNotificationListSet", []);
					mLookupModel.refresh();
					that.busy.close();
				}
			});
		},

		handleLoadMoreNotif: function () {
			var mLookupModel = this.mLookupModel;
			var iSkipNotif = mLookupModel.getProperty("/iSkipNotif") + 50;
			mLookupModel.setProperty("/iSkipNotif", iSkipNotif);
			mLookupModel.refresh(true);
			this.fnFetchNotifList();
		},

		//Release Notification function
		onPressReleaseMassNotif: function () {
			var mLookupModel = this.mLookupModel;
			var aSelectedpaths = mLookupModel.getProperty("/selectedNotifs");
			for (var i = 0; i < aSelectedpaths.length; i++) {

				var notifData = mLookupModel.getProperty(aSelectedpaths[i].sPath);
				this.fnPressReleaseNotif(notifData);
			}
			mLookupModel.setProperty("/selectedNotifs", []);
			mLookupModel.setProperty("/iSelectedIndices", 0);
		},
		onPressReleaseRowNotif: function (oEvent) {
			var notifDataPath = oEvent.getSource().getParent().getParent().getBindingContext("mLookupModel").sPath;
			var oNotifData = this.mLookupModel.getProperty(notifDataPath);
			this.fnPressReleaseNotif(oNotifData);
		},
		fnPressReleaseNotif: function (notifData) {
			var mLookupModel = this.mLookupModel;
			var oNotificationViewModel = this.oNotificationViewModel;
			var oNotificationDataModel = this.oNotificationDataModel;
			util.resetCreateNotificationFieldsNotifList(oNotificationDataModel, oNotificationViewModel, mLookupModel, notifData, this);
			this.fnReleaseNotif("release");
		},
		fnReleaseNotif: function (sVal) {
			var that = this;
			this.busy.open();
			var mLookupModel = this.mLookupModel;
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
			oNotifData.Type = "RELEASE";
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
				async: false,
				success: function (sData, oResponse) {
					var statusCode = oResponse.statusCode;
					var orderId = oResponse.Orderid;
					if (statusCode === 201) {
						if (sVal === "revert") {
							MessageBox.success("Notification Reverted Successfully", {
								actions: [MessageBox.Action.OK],
								emphasizedAction: MessageBox.Action.OK,
								onClose: function (sAction) {
									that.mLookupModel.setProperty("/iSkipNotif", 0);
									that.fnResetUItable();
									// that.getView().byId("idrevertNotif").setVisible(false);
									// if(orderId === "" || orderId === undefined){
									// mLookupModel.setProperty("/SysStatus", "NOPR");
									// }else{
									// mLookupModel.setProperty("/SysStatus", "NOPR ORAS");	
									// }
									// mLookupModel.refresh();
								}
							});
						} else {
							MessageBox.success("Notification Released Successfully", {
								actions: [MessageBox.Action.OK],
								emphasizedAction: MessageBox.Action.OK,
								onClose: function (sAction) {
									// that.getView().byId("releaseButton").setVisible(false);
									// mLookupModel.setProperty("/SysStatus", "NOPR");
									that.fnFetchNotifList();
								}
							});
						}
					}

					that.busy.close();
				},
				error: function (error, oResponse) {
					that.busy.close();
				}
			});

		},

		//Release notification complete

		//Create Work Order from Notification List
		onPressCreateRowNotif: function (oEvent) {
			var notifDataPath = oEvent.getSource().getParent().getParent().getBindingContext("mLookupModel").sPath;
			var oNotifData = this.mLookupModel.getProperty(notifDataPath);
			var mLookupModel = this.mLookupModel;

			var oNotificationViewModel = this.oNotificationViewModel;
			var oNotificationDataModel = this.oNotificationDataModel;
			util.resetCreateNotificationFieldsNotifList(oNotificationDataModel, oNotificationViewModel, mLookupModel, oNotifData, this);
			//mLookupModel.getProperty("/selectedNotifs").splice(1);
			mLookupModel.setProperty("/CreationWOType", "NOTIF_LIST_SINGLENOTIF");
			this.onCreateWODialogOpen();
		},

		onPressCreateMassWO: function () {

			var mLookupModel = this.mLookupModel;

			var aSelectedpaths = mLookupModel.getProperty("/selectedNotifs");

			var notifData = mLookupModel.getProperty(aSelectedpaths[0].sPath);
			var oNotificationViewModel = this.oNotificationViewModel;
			var oNotificationDataModel = this.oNotificationDataModel;
			util.resetCreateNotificationFieldsNotifList(oNotificationDataModel, oNotificationViewModel, mLookupModel, notifData, this);
			//mLookupModel.getProperty("/selectedNotifs").splice(1);
			mLookupModel.setProperty("/CreationWOType", "NOTIF_LIST_MULTINOTIF");
			this.onCreateWODialogOpen();
		},
		onCreateWODialogOpen: function (oEvent) {
			this.getOrderType();
			if (!this.createWoNotifListDialog) {
				this.createWoNotifListDialog = sap.ui.xmlfragment("com/sap/incture/IMO_PM.fragment.CreateWONotifList", this);
				this.getView().addDependent(this.createWoNotifListDialog);
			}
			this.createWoNotifListDialog.open();
		},

		//Function to close equipment pop-up
		onCancelWoNotifDetailDialog: function (oEvent) {
			this.createWoNotifListDialog.close();
			this.createWoNotifListDialog.destroy();
			this.createWoNotifListDialog = null;
		},
		onCreateWO: function (oEvent) {
			this.onCancelWoNotifDetailDialog();
			this.busy.open();
			var oNotificationDataModel = this.oNotificationDataModel;
			var sData = oNotificationDataModel.getData();
			var btnType = this.mLookupModel.getProperty("/CreationWOType");
			this.fnCreateWorkOrderForNotif(sData, btnType); //in BaseController

		},

		AssignNotiftoCreatedWO: function (orderId) {
			var oArry = [];
			var mLookupModel = this.mLookupModel;
			var selectedNotifs = mLookupModel.getProperty("/selectedNotifs");

			for (var i = 1; i < selectedNotifs.length; i++) {
				var currObj = mLookupModel.getProperty(selectedNotifs[i].sPath);
				var obj = {};
				var reqStartDate = formatter.formatReqStartEndDate(currObj.Reqstartdate);
				var reqEndDate = formatter.formatReqStartEndDate(currObj.Reqenddate);
				obj.NotifNo = currObj.NotifNo;
				obj.Reportedby = currObj.Reportedby;
				obj.ShortText = currObj.ShortText;
				obj.LongText = currObj.LongText;
				obj.Breakdown = currObj.Breakdown;
				if (reqStartDate) {
					obj.Desstdate = new Date(reqStartDate);
				} else {
					obj.Desstdate = null;
				}
				if (reqEndDate) {
					obj.Desenddate = new Date(reqEndDate);
				} else {
					obj.Desenddate = null;
				}
				obj.NotifStatus = "NEW";
				oArry.push(obj);
			}
			this.busy.open();
			this.fnGetWOHeaderDetailsnotiflist(orderId, oArry);
			if (this._oDialogAssignWO) {
				this.onCancelDialogAssign();
			}

			mLookupModel.setProperty("/selectedNotifs", []);
			mLookupModel.refresh();
		},

		//Create Work Order Complete
		onHandleNotifAdvFilter: function (oEvent) {
			if (!this._oDialogNotif) {

				this._oDialogNotif = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.advFilterNotif", this);

				this.getView().addDependent(this._oDialogNotif);
			}
			var that = this;
			// var mLookupModel = this.mLookupModel;
			// this.busy.open();
			// var sUrl = "/GetNotifVariantSet";
			// var oPortalDataModel = this.oPortalDataModel;
			// var oFilter = [];
			// var oRequest = {
			// 	"userId": mLookupModel.getProperty("/userName"),
			// 	"filterType": "notification"
			// };
			// oFilter.push(new Filter("REQUEST", "EQ", JSON.stringify(oRequest)));
			// oPortalDataModel.read(sUrl, {
			// 	filters: oFilter,
			// 	success: function (oData) {
			// 		var oComments = oData.results[0];
			// 		if (oComments.RESPONSE) {
			// 			oComments = JSON.parse(oComments.RESPONSE);
			// 			mLookupModel.setProperty("/idNotifFilter", oComments.id);
			// 			mLookupModel.setProperty("/sNotifStatusFilter", oComments.notiStatus);
			// 			mLookupModel.setProperty("/sNotifIdFilter", oComments.notiNotiId);
			// 			mLookupModel.setProperty("/sNotifEquipFilter", oComments.notiEquipment);
			// 			mLookupModel.setProperty("/sNotifBDFilter", oComments.notiBreakDown);
			// 			mLookupModel.setProperty("/sNotifPriorFilter", oComments.notiPriority);
			// 			mLookupModel.setProperty("/sNotifWkCenterFilter", "");
			// 			mLookupModel.refresh();
			// 		} else {
			// 			mLookupModel.setProperty("/idNotifFilter", "");
			// 			mLookupModel.setProperty("/sNotifStatusFilter", "");
			// 			mLookupModel.setProperty("/sNotifIdFilter", "");
			// 			mLookupModel.setProperty("/sNotifEquipFilter", "");
			// 			mLookupModel.setProperty("/sNotifBDFilter", "");
			// 			mLookupModel.setProperty("/sNotifPriorFilter", "");
			// 			mLookupModel.setProperty("/sNotifWkCenterFilter", "");
			// 			mLookupModel.refresh();
			// 		}
			// 		that.busy.close();
			// 	},
			// 	error: function (oData) {
			// 		mLookupModel.setProperty("/idNotifFilter", "");
			// 		mLookupModel.setProperty("/sNotifStatusFilter", "");
			// 		mLookupModel.setProperty("/sNotifIdFilter", "");
			// 		mLookupModel.setProperty("/sNotifEquipFilter", "");
			// 		mLookupModel.setProperty("/sNotifBDFilter", "");
			// 		mLookupModel.setProperty("/sNotifPriorFilter", "");
			// 		mLookupModel.setProperty("/sNotifWkCenterFilter", "");
			// 		mLookupModel.refresh();
			// 	}
			// });
			this._oDialogNotif.open();
		},

		onSearchNotif: function (oEvent) {
			var mLookupModel = this.mLookupModel;
			//	if (mLookupModel.getProperty("/sNotifIDDesFilter").length >= 3) {
			mLookupModel.setProperty("/iSkipNotif", 0);
			mLookupModel.setProperty("/aNotificationListSet", []);
			this.fnFetchNotifList();
		},

		onCancelDialogNotif: function () {
			this._oDialogNotif.close();
		},

		onApplyFilterNotif: function () {
			var mLookupModel = this.mLookupModel;
			var oNotifTbl = this.getView().byId("notifListId");
			this.fnResetFilers(oNotifTbl, "mLookupModel");
			mLookupModel.setProperty("/selectedNotifs", []);
			mLookupModel.setProperty("/iSelectedIndices", 0);
			mLookupModel.setProperty("/sNotifIDDesFilter", ""); // clearing live search by id or desc
			mLookupModel.refresh();
			this.fnFetchNotifList();
			this._oDialogNotif.close();
		},

		onSearchFavEqips: function (oEvent) {

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

		onCancelDialogEquip: function (oEvent) {
			this.equipmentsListDialog.close();
		},

		onEquipSelect: function (oEvent) {
			var mLookupModel = this.mLookupModel;
			var oSource = oEvent.getParameter("listItem");
			var sPath = oSource.getBindingContextPath();
			var iEqId = mLookupModel.getProperty(sPath + "/Equnr");
			mLookupModel.setProperty("/sEquip", iEqId);
			mLookupModel.setProperty("/sEquipFilter", iEqId);
			mLookupModel.setProperty("/sNotifEquipFilter", iEqId);
			this.equipmentsListDialog.close();
		},

		//Function to get Equiments List
		onSearchWOFilter: function (oEvent) {
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

		onNotifDetail: function () {
			var mLookupModel = this.mLookupModel;
			var sPath = mLookupModel.getProperty("/selectedNotifs/0/sPath");
			var selNotification = mLookupModel.getProperty(sPath);
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var iNotifID = selNotification.NotifNo;
			oRouter.navTo("notifDetail", {
				notifID: iNotifID
			});
		},
		// Function to navigate to Notification Detail page after pressing the corresponding Notification Id
		handleLinkPress: function (oEvent) {
			var sNotifID = oEvent.getSource().getText();
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("notifDetail", {
				notifID: sNotifID
			});
		},
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
			var bVal = this.isNotifSelected(oSelectedRow, selectedNotifs);
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
		isNotifSelected: function (oSelectedRow, selectedNotifs) {
			var bVal = [false];
			selectedNotifs.filter(function (obj, index) {
				if (obj.sPath === oSelectedRow) {
					bVal = [true, index];
				}
			});
			return bVal;
		},

		onAssignWO: function () {
			var mLookupModel = this.mLookupModel;
			var selectedNotifs = mLookupModel.getProperty("/selectedNotifs");
			if (!selectedNotifs || selectedNotifs.length === 0) {
				this.showMessage(this.oResourceModel.getText("selectnotifmsg"));
				return;
			}

			if (!this._oDialogAssignWO) {
				this._oDialogAssignWO = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.assignWONotif", this);
				this.getView().addDependent(this._oDialogAssignWO);
			}
			this._oDialogAssignWO.open();
			this._oDialogAssignWO.setModel(this.getView().getModel("oWOListModel"));
			this._oDialogAssignWO.open();
			mLookupModel.setProperty("/aWorkOrders", "");
		},
		onCancelDialogAssign: function () {
			this._oDialogAssignWO.close();
		},
		onSearchWO: function (oEvent) {

			var aFilters = [];
			var sQuery = oEvent.getSource().getValue();
			if (sQuery && sQuery.length > 0) {
				var oFilterByIDDes = new Filter({
					filters: [new Filter("WONUM", FilterOperator.Contains, sQuery), new Filter("WOTYPE", FilterOperator.Contains, sQuery), new Filter(
						"OWNER", FilterOperator.Contains, sQuery), new Filter("EQUIP", FilterOperator.Contains, sQuery)],
					and: false
				});
				aFilters.push(oFilterByIDDes);
			}
			var oTable = oEvent.getSource().getParent().getContent()[1].getContent()[0];
			var oBinding = oTable.getBinding("items");
			oBinding.filter(aFilters);
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
			var userPlant = this.oUserDetailModel.getProperty("/userPlant");
			oFilter.push(new Filter("Plant", "EQ", userPlant));

			oPortalDataModel.read("/WorkOrderListSet", {
				filters: oFilter,
				urlParameters: {
					"$top": 100,
					"$skip": 0
				},
				success: function (oData) {
					var aWorkOrderListSet = [];
					var aData = oData.results;
					for (var i = 0; i < aData.length; i++) {
						if (aData[i].SysStatus.indexOf("TECO") === -1 && aData[i].SysStatus.indexOf("CLSD") === -1) {
							/*if (aData[i].SysStatus.indexOf("CNF") !== -1 && aData[i].SysStatus.indexOf("PCNF") === -1) {
								continue; // if found CNF and not PCNF then do not push
							}*/
							aWorkOrderListSet.push(aData[i]);
						}
					}
					mLookupModel.setProperty("/aWorkOrders", aWorkOrderListSet);
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
			damageCodes.filter(function (obj) {
				if (obj.Code === oSelectedKey) {
					oNotificationDataModel.setProperty("/DamageCode", obj.Code);
					oNotificationDataModel.setProperty("/DamgeText", obj.Codetext);
					oNotificationDataModel.setProperty("/DamageGroup", obj.Codegruppe);
				}
			});
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
			aCauseCode.filter(function (obj) {
				if (obj.Code === oSelectedKey) {
					oNotificationDataModel.setProperty("/CauseCode", obj.Code);
					oNotificationDataModel.setProperty("/CauseText", obj.Codetext);
					oNotificationDataModel.setProperty("/CauseGroup", obj.Codegruppe);
				}
			});
		},

		//Function to assign Notifications for a WO
		onAssignNotifToWO: function () {
			var oArry = [];
			var mLookupModel = this.mLookupModel;
			var selectedNotifs = mLookupModel.getProperty("/selectedNotifs");
			var oWorkOrderTbl = sap.ui.getCore().byId("NOTIF_ASSIGN_WO");
			if (oWorkOrderTbl.getSelectedItem() === null) {
				this.showMessage(this.oResourceModel.getText("selectwomsg"));
				return;
			}
			var orderId = oWorkOrderTbl.getSelectedItem().getCells()[0].getText();
			for (var i = 0; i < selectedNotifs.length; i++) {
				var currObj = mLookupModel.getProperty(selectedNotifs[i].sPath);
				var obj = {};
				var reqStartDate = formatter.formatReqStartEndDate(currObj.Reqstartdate);
				var reqEndDate = formatter.formatReqStartEndDate(currObj.Reqenddate);
				obj.NotifNo = currObj.NotifNo;
				obj.Reportedby = currObj.Reportedby;
				obj.ShortText = currObj.ShortText;
				obj.LongText = currObj.LongText;
				obj.Breakdown = currObj.Breakdown;
				if (reqStartDate) {
					obj.Desstdate = new Date(reqStartDate);
				} else {
					obj.Desstdate = null;
				}
				if (reqEndDate) {
					obj.Desenddate = new Date(reqEndDate);
				} else {
					obj.Desenddate = null;
				}
				obj.NotifStatus = "NEW";
				oArry.push(obj);
			}
			this.busy.open();
			this.fnGetWOHeaderDetailsnotiflist(orderId, oArry);
			this.onCancelDialogAssign();
			mLookupModel.setProperty("/selectedNotifs", []);
			mLookupModel.refresh();
		},

		onAfterRendering: function () {
			this._setScreenHeights();
			sap.ui.Device.resize.attachHandler(function () {
				this._setScreenHeights();
			}.bind(this));

			//Attaching click event for the KPI tiles
			var that = this;
			var oHbox = this.getView().byId("NOTIF_LIST_KPI_TILES");
			var oItems = oHbox.getItems();
			for (var i = 0; i < oItems.length; i++) {
				var oVbox = oItems[i];
				oVbox.onclick = function (oEvent) {
					that.getKPIsNotifList(oEvent);
				};
			}
		},

		//Function to get KPI notifications list
		getKPIsNotifList: function (oEvent) {
			var headerText = "";
			var serviceType = "";
			var oVbox = oEvent.srcControl;
			var selVBox = oVbox.getCustomData()[0].getValue();
			switch (selVBox) {
			case "NOTIF_LIST_BREAKDOWNS":
				headerText = "Breakdown Notifications";
				serviceType = "BD_NOTIF";
				break;
			case "NOTIF_LIST_NOTIFICATIONS_DUE":
				headerText = "Notifications Due";
				serviceType = "DUE_NOTIF";
				break;
			case "NOTIF_LIST_ASSIGNED_TO_ME":
				headerText = "Assigned to Me";
				serviceType = "USER_NOTIF";
				break;
			case "NOTIF_LIST_ASSIGNED_TO_WC":
				headerText = "Assigned to Work Center";
				serviceType = "WC_ORDERS";
				break;
			}
			this.fnGetKPIsNotifs(serviceType, headerText);
		},

		//Function to get KPI's tile count Notificationss
		fnGetKPIsNotifs: function (serviceType, headerText) {
			var that = this;
			this.busy.open();
			var mLookupModel = this.mLookupModel;
			mLookupModel.setProperty("/kpiNotiflist", []);
			var oPortalDataModel = this.oPortalDataModel;
			var userPlant = this.oUserDetailModel.getProperty("/userPlant");
			var sWorkCenterSel = mLookupModel.getProperty("/sWorkCenterSel");

			var oFilter = [];
			oFilter.push(new Filter("Plant", "EQ", userPlant));
			if (serviceType === "WC_ORDERS") {
				oFilter.push(new Filter("WorkCenter", "EQ", sWorkCenterSel));
			}
			oFilter.push(new Filter("Type", "EQ", serviceType));
			oPortalDataModel.read("/KPISet", {
				filters: oFilter,
				success: function (oData) {
					var kpiNotiflist = oData.results;
					mLookupModel.setProperty("/kpiNotiflist", kpiNotiflist);
					mLookupModel.setProperty("/kpiNotifHeader", headerText);
					mLookupModel.refresh();
					that.openKPINotifListPopover();
					that.busy.close();
				},
				error: function (oData) {
					mLookupModel.setProperty("/kpiNotiflist", []);
					mLookupModel.refresh();
					that.busy.close();
				}
			});
		},

		//Function to open KPI Notification list pop-over
		openKPINotifListPopover: function () {
			if (!this.kpiNotifList) {
				this.kpiNotifList = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.kpiNotifList", this);
				this.getView().addDependent(this.kpiNotifList);
			}
			this.kpiNotifList.open();
		},

		//Function to close KPI Notification list pop-over
		closeKPINotifListPopover: function () {
			this.kpiNotifList.close();
			this.mLookupModel.setProperty("/selectedKPINotifs", []);
			sap.ui.getCore().byId("NOTIF_KPI_LIST_TBL").clearSelection();
		},

		//Function to get selected Notifications
		getSelectedKPIsNotifs: function (oEvent) {
			var sURL;
			var sHost = window.location.origin;
			var mLookupModel = this.mLookupModel;
			var rowContext = oEvent.getParameters().rowContext;
			if (!rowContext) {
				return;
			}
			var oSelectedRow = rowContext.getPath();
			var selectedObj = mLookupModel.getProperty(oSelectedRow);
			var oNotifId = selectedObj.Number;
			var sBSPPath = "/sap/bc/ui5_ui5/sap/ZMYL_NOTIFLIST/index.html#/notifDetail/";
			// sURL = sHost + sBSPPath + oNotifId;
			sURL = "https://ub2qkdfhxg4ubmgqmta-imo-pm-imo-pm.cfapps.eu10.hana.ondemand.com/IMO_PM/index.html#/notifDetail/" + oNotifId;
			sap.m.URLHelper.redirect(sURL, true);
			//sap.ui.getCore().byId("NOTIF_KPI_LIST_TBL").clearSelection();
		},

		//Function to get KPI Tile counts on load
		fnGetKPICounts: function (oKPITilesCount) {
			var mLookupModel = this.mLookupModel;
			for (var i = 0; i < oKPITilesCount.length; i++) {
				if (oKPITilesCount[i].Description === "BD_NOTIF") {
					mLookupModel.setProperty("/breakDownNotificationCount", oKPITilesCount[i].Number);
				}
				if (oKPITilesCount[i].Description === "DUE_NOTIF") {
					mLookupModel.setProperty("/notificationsDueCount", oKPITilesCount[i].Number);
				}
				if (oKPITilesCount[i].Description === "USER_NOTIF") {
					mLookupModel.setProperty("/assignedtoMeCount", oKPITilesCount[i].Number);
				}
				if (oKPITilesCount[i].Description === "WC_ORDERS") {
					mLookupModel.setProperty("/assignedtoWCCount", oKPITilesCount[i].Number);
				}
			}
			mLookupModel.setProperty("/bBusyworkcenter", false);
			mLookupModel.refresh();
		},

		_setScreenHeights: function () {
			var mLookupModel = this.mLookupModel;
			var rowCount = (sap.ui.Device.resize.height - 276) / 40;
			rowCount = Math.floor(rowCount - 2);
			mLookupModel.setProperty("/rowCount", rowCount);
		},

		//function to clear notification list advance filter
		onClearNotifFilter: function () {
			var mLookupModel = this.mLookupModel;
			mLookupModel.setProperty("/sNotifStatusFilter", "");
			mLookupModel.setProperty("/sNotifIdFilter", "");
			mLookupModel.setProperty("/sNotifEquipFilter", "");
			mLookupModel.setProperty("/sNotifBDFilter", "");
			mLookupModel.setProperty("/sNotifPriorFilter", "");
			mLookupModel.setProperty("/sNotifWkCenterFilter", "");
			mLookupModel.setProperty("/sCreatedOnStart", formatter.GetMonthsBackDate(3));
			mLookupModel.setProperty("/sCreatedOnEnd", new Date().toLocaleDateString());
		}
	});
});