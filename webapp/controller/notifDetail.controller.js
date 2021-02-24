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
			///For Attachements///
			var oPortalDataModel = this.oPortalDataModel;
			var sericeUrl = oPortalDataModel.sServiceUrl;
			sericeUrl = sericeUrl + "/AttachmentSet";
			var rightPanel = this.getView().createId("idRightAttachmentPanel"); //SH: Right Panel for Attachments
			var oFileUploader = sap.ui.core.Fragment.byId(rightPanel, "MYLAN_CREATE_Notif_FILEUPLOADER");
			// var oFileUploader = this.getView().byId("MYLAN_CREATE_Notif_FILEUPLOADER");
			oFileUploader.setUploadUrl(sericeUrl);
			this._setNotificationPanelHeights(); //SH: Set right panel size

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
			oFilter.push(new Filter("Descriptn", "EQ", ""));
			oFilter.push(new Filter("NotifNo", "EQ", notifId));
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
			var notifid = this.oNotificationDataModel.getProperty("/Notifid");
			//this.fnsetBreakdownDur();
			this.fnGetNotifAttachmentLinks(notifid);
		},
		//function to set Breakdown Dur from Ui side
		fnsetBreakdownDur: function () {
			var oNotificationViewModel = this.oNotificationViewModel;
			var oNotificationDataModel = this.oNotificationDataModel;
			var sBreakDown = oNotificationDataModel.getProperty("/Breakdown");
			if (sBreakDown) {
				var MalEnddate = oNotificationDataModel.getProperty("/Enddate");
				var MalEndTime = oNotificationViewModel.getProperty("/EndTime");
				var MalStartdate = oNotificationDataModel.getProperty("/Startdate");
				var MalStartTime = oNotificationViewModel.getProperty("/StartTime");
				if (MalEnddate && MalEndTime !== "") {
					var nDuration = formatter.fnGetBreakdownDur(MalStartdate.toDateString(), MalStartTime, MalEnddate.toDateString(), MalEndTime);
					oNotificationDataModel.setProperty("/BreakdownDur", nDuration);
					//oNotificationViewModel.setProperty("/DownTime","")
				} else {
					oNotificationDataModel.setProperty("/BreakdownDur", "0");
				}
			} else {
				oNotificationDataModel.setProperty("/BreakdownDur", "");
			}

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
			// this.equipmentsListDialog.close(); //nischal
			// this.fnFilterSlectedDamageGroup();
			// this.fnFilterSlectedCauseGroup();
			this.onCancelDialogEquip();
		},

		//Function to show selected Equipment
		// fnFilterSlectedDamageGroup: function () {
		// 	var catGrp = this.mLookupModel.getProperty("/sCatelogProf");
		// 	var aFilters = [];
		// 	if (catGrp) {
		// 		var sFilter = new sap.ui.model.Filter("Codegruppe", "EQ", catGrp);
		// 		aFilters.push(sFilter);
		// 	}

		// 	var oDamageCode = this.getView().byId("NOTIF_DETAIL_DAMAGE_CODE");
		// 	var binding = oDamageCode.getBinding("items");
		// 	binding.filter(aFilters, "Application");
		// },

		//Function to show selected Equipment
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
				this.fnResetMalfnDateTimes();
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
			this.fnGetBreakdownDurNotif();
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

		////Attachments////
		fnGetNotifAttachmentLinks: function (notifId) {
			var that = this;
			this.busy.open();
			var oFilter = [];
			var oPortalDataModel = this.oPortalDataModel;
			var oNotificationViewModel = this.oNotificationViewModel;
			oFilter.push(new Filter("NotifId", "EQ", notifId));

			oPortalDataModel.read("/AttachmentListSet", {
				filters: oFilter,

				success: function (oData) {
					var attachments = oData.results;
					oNotificationViewModel.setProperty("/attachments", attachments);

					that.busy.close();
				},
				error: function (oData) {
					oNotificationViewModel.setProperty("/attachments", []);
					that.showMessage(that.oResourceModel.getText("atterror"));
					that.busy.close();
				}
			});
		},

		onOpenAttchNotiflinkPopup: function (oEvent) {
			if (!this.attachNotifLink) {
				this.attachNotifLink = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.attachNotifLink", this);
				this.getView().addDependent(this.attachNotifLink);
			}
			this.attachNotifLink.open();
		},
		onCloseAttachNotifLinkPopup: function (oEvent) {
			var oNotificationViewModel = this.oNotificationViewModel;
			oNotificationViewModel.setProperty("/linkTitle", "");
			oNotificationViewModel.setProperty("/linkAddress", "");
			this.attachNotifLink.close();
		},

		onAttachNotifLink: function () {
			var that = this;
			var oResourceModel = this.oResourceModel;
			var oNotificationViewModel = this.oNotificationViewModel;
			var linkTitle = oNotificationViewModel.getProperty("/linkTitle");
			var linkAddress = oNotificationViewModel.getProperty("/linkAddress");
			var notifid = this.oNotificationDataModel.getProperty("/Notifid");
			if (!linkTitle) {
				this.showMessage(oResourceModel.getText("plsprovidelinktitle"));
				return;
			}
			if (!linkAddress) {
				this.showMessage(oResourceModel.getText("plsprovdielinkaddr"));
				return;
			}
			this.busy.open();
			var oPayload = {
				"d": {
					"NotifId": notifid,
					"DocName": linkTitle,
					"AttachmentURL": linkAddress
				}
			};
			var oPortalDataModel = this.oPortalDataModel;
			oPortalDataModel.setHeaders({
				"X-Requested-With": "X"
			});
			oPortalDataModel.create("/AttachdocSet", oPayload, {
				success: function (oData) {
					that.fnGetNotifAttachmentLinks(notifid);
					that.onCloseAttachNotifLinkPopup();
					that.busy.close();
				},
				error: function (oData) {
					that.busy.close();
				}
			});
		},

		onUploadNotifAttachment: function (oEvent) {

			this.busy.open();
			var oSource = oEvent.getSource();
			var oFile = oEvent.getParameter("files")[0];
			var fileName = oFile.name.split(".")[0];
			var fileType = oFile.name.split(".")[1];

			var oPortalDataModel = this.oPortalDataModel;
			var notifid = this.oNotificationDataModel.getProperty("/Notifid");
			var slug = notifid + ":" + fileName + ":" + fileType + ":" + "N"; // To differentiate notification and Work order.
			var securityToken = oPortalDataModel.getSecurityToken();
			var oCSRFCustomHeader = new sap.ui.unified.FileUploaderParameter({
				name: "x-csrf-token",
				value: securityToken
			});
			var oSlugCustomHeader = new sap.ui.unified.FileUploaderParameter({
				name: "slug",
				value: slug
			});
			var oDisableCSRFHeader = new sap.ui.unified.FileUploaderParameter({
				name: "X-Requested-With",
				value: "X"

			});

			oSource.addHeaderParameter(oCSRFCustomHeader);
			oSource.addHeaderParameter(oSlugCustomHeader);
			oSource.addHeaderParameter(oDisableCSRFHeader);
			oSource.upload();
		},
		onUploadNotifComplete: function (oEvent) {

			var oResourceModel = this.oResourceModel;
			var statusCode = oEvent.getParameters().status;
			var notifid = this.oNotificationDataModel.getProperty("/Notifid");
			if (statusCode === 201) {
				this.fnGetNotifAttachmentLinks(notifid);
				this.showMessage(oResourceModel.getText("docuploadsuccess"));
			} else {
				this.showMessage(oResourceModel.getText("errinuploadfile"));
			}
			// var oFileUploader = sap.ui.core.Fragment.byId("idRightAttachmentPanel", "MYLAN_CREATE_Notif_FILEUPLOADER");
			var rightPanel = this.getView().createId("idRightAttachmentPanel"); //SH: Right Panel for Attachments
			var oFileUploader = sap.ui.core.Fragment.byId(rightPanel, "MYLAN_CREATE_Notif_FILEUPLOADER");
			oFileUploader.removeAllHeaderParameters();
			this.busy.close();
		},
		//Function to show error message on files uploaded with size more than 5mb
		handleFileSizeExceed: function (oEvent) {
			var oMsg = this.oResourceModel.getText("FILE_SIZE_EXCEEDED_5MB");
			this.showMessage(oMsg);
		},

		//Function to show error message on files uploaded with name more than 50 characters
		fnFilenameLengthExceed: function (oEvent) {
			var oMsg = this.oResourceModel.getText("PLS_UPLOAD_FILE_LESS_THAN_50CHAR");
			this.showMessage(oMsg);
		},

		//Function to show error message on files uploaded other than supported
		fnHandleFileType: function (oEvent) {
			var oMsg = this.oResourceModel.getText("PLS_UPLOAD_FILE_OF_PROPER_FORMAT");
			this.showMessage(oMsg);
		},
		getNotifAttachmentIdForDownload: function (oEvent) {
			var oSource = oEvent.getSource();
			var oNotificationViewModel = this.oNotificationViewModel;
			var sPath = oSource.getBindingContext("oNotificationViewModel").getPath();
			var fileType = oNotificationViewModel.getProperty(sPath + "/AttachmentType");
			var documentId = oNotificationViewModel.getProperty(sPath + "/DocumentId");
			var relType = oNotificationViewModel.getProperty(sPath + "/DocName");
			if (fileType === "DOC" && documentId) {
				var oPortalDataModel = this.oPortalDataModel;
				var sericeUrl = oPortalDataModel.sServiceUrl;
				sericeUrl = sericeUrl + "/AttachmentSet(DocumentId='" + documentId + "',MIME_TYPE='x',RelType='" + relType +
					"',OrderId='',NotifId='')/$value";
				sap.m.URLHelper.redirect(sericeUrl, true);
			}
		},
		//Function to delete Attachtment
		fnDeleteNotifAttachmentLink: function (oEvent) {
			var btnFld = "";
			var that = this;
			this.busy.open();
			var oSource = oEvent.getSource();
			var oResourceModel = this.oResourceModel;
			var btnType = oSource.getCustomData()[0].getValue();
			if (btnType === "URL") {
				btnFld = "Hyper Link";
			} else {
				btnFld = "Attachment";
				btnType = "ATTA";
			}

			var oNotificationViewModel = this.oNotificationViewModel;
			var sPath = oSource.getBindingContext("oNotificationViewModel").getPath();
			var type = oNotificationViewModel.getProperty(sPath + "/AttachmentType");
			var documentId = oNotificationViewModel.getProperty(sPath + "/DocumentId");
			var NotifId = this.oNotificationDataModel.getProperty("/Notifid");
			if (documentId) {
				var oPortalDataModel = this.oPortalDataModel;
				var sericeUrl = oPortalDataModel.sServiceUrl;
				sericeUrl = "/AttachmentListSet(DocumentId='" + documentId + "',OrderId='',AttachmentType='" + type + "',NotifId='" + NotifId +
					"')";
				oPortalDataModel.setHeaders({
					"X-Requested-With": "X"
				});
				oPortalDataModel.remove(sericeUrl, {
					method: "DELETE",
					success: function (data, response) {
						that.fnGetNotifAttachmentLinks(NotifId);
						that.showMessage(btnFld + " " + oResourceModel.getText("SUCCESSFULLY_DELETED"));
					},
					error: function (data, response) {
						that.busy.close();
						that.showMessage(oResourceModel.getText("ERROR_IN_DELETE") + btnFld);
					}
				});
			} else {
				this.showMessage(oResourceModel.getText("ERROR_IN_DELETE") + btnFld);
			}
		},

		////Attachments Completed///
		//Function to update notification to server
		onUpdateNotification: function (sVal) {
			var that = this;
			this.busy.open();
			var oPortalNotifOData = this.oPortalNotifOData;
			var oNotificationDataModel = this.oNotificationDataModel;
			var oNotificationViewModel = this.oNotificationViewModel;
			var oNotifData = oNotificationDataModel.getData();

			var tempLongText = oNotificationViewModel.getProperty("/Longtext");
			oNotifData.Longtext = tempLongText;

			oNotifData.Startdate = formatter.formatDateobjToString(oNotifData.Startdate);
			if (oNotifData.Enddate) {
				oNotifData.Enddate = formatter.formatDateobjToString(oNotifData.Enddate);
			} else {
				oNotifData.Enddate = "";
			}

			oNotifData.Notif_date = formatter.formatDateobjToString(oNotifData.Notif_date);
			oNotifData.ReqStartdate = formatter.formatDateobjToString(oNotifData.ReqStartdate);
			oNotifData.ReqEnddate = formatter.formatDateobjToString(oNotifData.ReqEnddate);
			oNotifData.Type = "UPDATE";
			if (oNotifData.Assembly === "NaN") {
				oNotifData.Assembly = "";
			}
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
			if (oNotifData.Enddate !== "") {
				var splitDate2 = oNotifData.Enddate.split("T")[0];
				oNotifData.Enddate = splitDate2 + "T" + endTime + ":00";
			}
			var BreakdownDur = oNotificationDataModel.getProperty("/BreakdownDur");
			if (BreakdownDur === "NaN") {
				oNotifData.BreakdownDur = "0";
			}

			oPortalNotifOData.setHeaders({
				"X-Requested-With": "X"
			});
			oPortalNotifOData.create("/NotificationSet", oNotifData, {
				success: function (sData, oResponse) {
					// var notifyMsg = sData.Notify.hasOwnProperty("results");
					var oNotifyMsg = sData.Notify;
					if (oNotifyMsg) {
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
					if (sVal === "SaveAndClose") {
						that.onCloseNotif();
					}
					that.busy.close();
				},
				error: function (error, oResponse) {
					var errorMsg = that.oResourceModel.getText("errormsg");
					that.showMessage(errorMsg);
					that.busy.close();
				}
			});
		},
		//Function to revert notification
		onRevertNotif: function () {
			var that = this;
			this.onPressRelease("revert");
		},
		//Funnction to Release the Notification
		onPressRelease: function (sVal) {
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
			if (oNotifData.Enddate) {
				oNotifData.Enddate = formatter.formatDateobjToString(oNotifData.Enddate, true);
			} else {
				oNotifData.Enddate = "";
			}
			oNotifData.Notif_date = formatter.formatDateobjToString(oNotifData.Notif_date);
			oNotifData.ReqStartdate = formatter.formatDateobjToString(oNotifData.ReqStartdate);
			oNotifData.ReqEnddate = formatter.formatDateobjToString(oNotifData.ReqEnddate);
			oNotifData.Type = "RELEASE";
			if (oNotifData.Assembly === "NaN") {
				oNotifData.Assembly = "";
			}
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
					var statusCode = oResponse.statusCode;
					var orderId = oResponse.Orderid;
					if (statusCode == 201) {
						if (sVal === "revert") {
							MessageBox.success("Notification Reverted Successfully", {
								actions: [MessageBox.Action.OK],
								emphasizedAction: MessageBox.Action.OK,
								onClose: function (sAction) {
									that.fnFetchDetailNotifList();
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
							MessageBox.success("Notification Approved Successfully", {
								actions: [MessageBox.Action.OK],
								emphasizedAction: MessageBox.Action.OK,
								onClose: function (sAction) {
									// that.getView().byId("releaseButton").setVisible(false);
									// mLookupModel.setProperty("/SysStatus", "NOPR");
									that.fnFetchDetailNotifList();
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
		fnSaveandCloseNotif: function () {
			var oNotificationDataModel = this.oNotificationDataModel;

			var oNotifData = oNotificationDataModel.getData();
			var bVal = formatter.fnBreakDownValidation(oNotifData.Breakdown, oNotifData.Enddate);
			if (bVal) {
				this.onUpdateNotification("SaveAndClose");
			} else {

				MessageBox.error("Please enter valid Malfunction Enddate.");
			}
		},

		onCloseNotif: function () {
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
			if (oNotifData.Enddate) {
				oNotifData.Enddate = formatter.formatDateobjToString(oNotifData.Enddate, true);
			} else {
				/*MessageBox.error("Please enter Break DownEnd Date");*/
				oNotifData.Enddate = "";
			}
			oNotifData.Notif_date = formatter.formatDateobjToString(oNotifData.Notif_date);
			oNotifData.ReqStartdate = formatter.formatDateobjToString(oNotifData.ReqStartdate);
			oNotifData.ReqEnddate = formatter.formatDateobjToString(oNotifData.ReqEnddate);
			oNotifData.Type = "CLOSE";
			if (oNotifData.Assembly === "NaN") {
				oNotifData.Assembly = "";
			}
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
					var statusCode = oResponse.statusCode;
					if (statusCode == 201) {
						MessageBox.success("Notification Closed Successfully", {
							actions: [MessageBox.Action.OK],
							emphasizedAction: MessageBox.Action.OK,
							onClose: function (sAction) {
								that.fnFetchDetailNotifList();
							}
						});
					}
					that.busy.close();
					// mLookupModel.setProperty("/SysStatus", "NOCO");
					// that.getView().byId("idcloseNotif").setVisible(false);
					// that.getView().byId("updateNotif").setVisible(false);
					// that.getView().byId("releaseButton").setVisible(false);

				},
				error: function (error, oResponse) {
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
		// handleEquipIconTabSelect: function (oEvent) {
		// 	var that = this;
		// 	var selectedKey = oEvent.getSource().getSelectedKey();
		// 	if (selectedKey === "idEqFunLoc") {
		// 		this.busy.open();
		// 		var mLookupModel = this.mLookupModel;
		// 		var oNotificationDataModel = this.oNotificationDataModel;
		// 		var sFunctionalLocation = oNotificationDataModel.getProperty("/FunctLoc");
		// 		var oPortalDataModel = this.oPortalDataModel;
		// 		// var userPlant = this.oUserDetailModel.getProperty("/userPlant");
		// 		var oFilter = [];
		// 		// oFilter.push(new Filter("Equnr", "EQ", ""));
		// 		// oFilter.push(new Filter("Tidnr", "EQ", ""));
		// 		// oFilter.push(new Filter("Eqktu", "EQ", ""));
		// 		// oFilter.push(new Filter("plant", "EQ", userPlant));
		// 		oFilter.push(new Filter("FuncLoc", "EQ", sFunctionalLocation));
		// 		oPortalDataModel.read("/EquipfuncSet", {
		// 			filters: oFilter,
		// 			success: function (oData, oResponse) {
		// 				var aEqListOfFunLoc = oData.results;
		// 				mLookupModel.setProperty("/aEqListOfFunLoc", aEqListOfFunLoc);
		// 				mLookupModel.refresh();
		// 				that.busy.close();
		// 			},
		// 			error: function (oResponse) {
		// 				mLookupModel.setProperty("/aEqListOfFunLoc", []);
		// 				that.busy.close();
		// 			}
		// 		});
		// 	}
		// },
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
		onCreateWODialogOpen: function (oEvent) {
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
			var that = this;
			var sOrderType = this.mLookupModel.getProperty("/sOrderTypeSel");
			if (sOrderType === "" || sOrderType === null) {
				MessageBox.warning("Work Order type is taken as PM02", {
					onClose: function () {
						that.mLookupModel.setProperty("/sOrderTypeSel", "PM02");
						that.onCancelWoNotifDetailDialog();
						that.busy.open();
						var oNotificationDataModel = that.oNotificationDataModel;
						var sData = oNotificationDataModel.getData();
						that.fnCreateWorkOrderForNotif(sData, "NOTIF_DETAIL");
					}
				});

			} else {
				this.onCancelWoNotifDetailDialog();
				this.busy.open();
				var oNotificationDataModel = this.oNotificationDataModel;
				var sData = oNotificationDataModel.getData();
				this.fnCreateWorkOrderForNotif(sData, "NOTIF_DETAIL");
			}

		},
		onAfterRendering: function () {
			this._setNotificationPanelHeights(); //SH: Set right panel size
		},
		onPressBack: function () {
			var mLookupModel = this.mLookupModel;
			mLookupModel.setProperty("/selectedTaskTab", undefined);
			mLookupModel.setProperty("/showTaskManagementPanel", false);
			mLookupModel.setProperty("/showAttachmentPanel", false);
			// mLookupModel.setProperty("/taskManagementPanel/showCommentsPanel", false);

		},
		onPressAttachments: function (oEvent) {
			// var oIcon = oEvent.getSource().getProperty("src");
			var mLookupModel = this.mLookupModel;
			// if (oIcon.includes("grid")) {
			mLookupModel.setProperty("/selectedTaskTab", "Attachments");
			mLookupModel.setProperty("/showTaskManagementPanel", true);
			mLookupModel.setProperty("/showAttachmentPanel", true);
			mLookupModel.refresh(true);
			// oEvent.getSource().setProperty("src", "sap-icon://decline");
			// oEvent.getSource().setAggregation("tooltip", "Close Attachments");
			/*} else if (oIcon.includes("decline")) {
				this.onPressBack();
				oEvent.getSource().setProperty("src", "sap-icon://grid");
				oEvent.getSource().setAggregation("tooltip", "Open Attachments");
			}*/
		}
	});
});