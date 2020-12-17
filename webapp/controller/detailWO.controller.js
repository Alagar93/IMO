sap.ui.define([
	"com/sap/incture/IMO_PM/controller/BaseController",
	"com/sap/incture/IMO_PM/formatter/formatter",
	"com/sap/incture/IMO_PM/util/util",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox",
	"sap/m/MessageToast"
], function (BaseController, formatter, util, JSONModel, Filter, FilterOperator, MessageBox, MessageToast) {
	"use strict";

	return BaseController.extend("com.sap.incture.IMO_PM.controller.detailWO", {

		formatter: formatter,
		util: util,

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.mylan.createWorkOrder.CreateWorkOrder
		 */
		onInit: function () {
			var that = this;
			this.fnInitCreateWOApp("WK_ORDER_DETAIL");
			this.router = sap.ui.core.UIComponent.getRouterFor(this);
			this.router.attachRoutePatternMatched(function (oEvent) {
				that.routePatternMatched(oEvent);
			});
		},

		routePatternMatched: function (oEvent) {
			var oUserDetailModel = this.oUserDetailModel;
			var oWODetailFieldsModel = this.oWODetailFieldsModel;
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			//	this.fnGetTechUserName(oWorkOrderDetailViewModel.getProperty("/HEADERTOPARTNERNAV/0/AssignedTo"));
			var viewName = oEvent.getParameter("name");
			if (viewName === "createWO") {
				util.initializeWODetailFields(oWorkOrderDetailModel, oWorkOrderDetailViewModel);
				document.title = "Create/Edit WO";
			} else if (viewName === "detailWO") {
				var viewType = oEvent.getParameter("arguments").workOrderID;
				if (viewType === "CREATE_ORDER") {
					util.fnEnableCreateWOFields(oWODetailFieldsModel);
					util.resetDetailWOFields(oUserDetailModel, oWorkOrderDetailModel, oWorkOrderDetailViewModel, "CREATE_ORDER", this.oPortalDataModel);
					this.fnCreateUpdateBtnTxt("CREATE_ORDER");
					// this.fnFilterSlectedDamageGroup(); //nischal -- this functionality is removed
					// this.fnFilterSlectedCauseGroup(); //nischal -- this functionality is removed
					this.fnFilterCNFOperations(true);
					var workCenter = oWorkOrderDetailModel.getProperty("/MnWkCtr");
					this.setOrderTypeOperation(oWorkOrderDetailModel, oWorkOrderDetailViewModel, [], workCenter);
					this.getOperationIdLookup();
				} else if (viewType === "CREATE_REF_WO") {
					this.fnCreateUpdateBtnTxt("CREATE_ORDER");
					util.fnEnableCreateWOFields(oWODetailFieldsModel);
					this.getOperationIdLookup();
					this.fnFilterSlectedDamageGroup();
					this.fnFilterSlectedCauseGroup();
					this.fnFilterCNFOperations(true);
					/*	var mLookupModel = this.mLookupModel;
					var oSelectedWODetails = mLookupModel.getProperty("/oSelectedWODetails");
					oWorkOrderDetailModel.setProperty("/systemstatustext", oSelectedWODetails.SysStatusDes);//new 
*/
				} else if (viewType === "CREATE_NOTIF_WO") {
					this.fnCreateUpdateBtnTxt("CREATE_ORDER");
					this.fnFilterSlectedDamageGroup();
					this.fnFilterSlectedCauseGroup();
					this.fnFilterCNFOperations(true);
				} else {
					util.initializeWODetailFields(oWorkOrderDetailModel, oWorkOrderDetailViewModel);
					util.resetDetailWOFields(oUserDetailModel, oWorkOrderDetailModel, oWorkOrderDetailViewModel, "VIEW_WO");
					this.fnCreateUpdateBtnTxt("UPDATE_ORDER");
					this.getWODetails(viewType);
				}
			} else if (viewName === "detailTabWO") {
				var oViewType = oEvent.getParameter("arguments").workOrderID;
				util.initializeWODetailFields(oWorkOrderDetailModel, oWorkOrderDetailViewModel);
				util.resetDetailWOFields(oUserDetailModel, oWorkOrderDetailModel, oWorkOrderDetailViewModel, "VIEW_WO");
				this.fnCreateUpdateBtnTxt("UPDATE_ORDER");
				this.getWODetails(oViewType);
			}

			var oPortalDataModel = this.oPortalDataModel;
			var sericeUrl = oPortalDataModel.sServiceUrl;
			sericeUrl = sericeUrl + "/AttachmentSet";
			var oFileUploader = this.getView().byId("MYLAN_CREATE_WO_FILEUPLOADER");
			oFileUploader.setUploadUrl(sericeUrl);
		},
		//nischal -- function to open popup for enter additional details for operations
		onControlKeyChange: function (oEvent) {
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var sKey = oEvent.getSource().getSelectedKey();
			var oSource = oEvent.getSource();
			var sPath = oSource.getBindingContext("oWorkOrderDetailModel").getPath();
			if (sKey === "PM03") {
				oWorkOrderDetailViewModel.setProperty("/sPathControlKey", sPath);
				var oOpertionDetails = jQuery.extend(true, {}, oWorkOrderDetailModel.getProperty(sPath));
				oWorkOrderDetailViewModel.setProperty("/oControlkeyOperation", oOpertionDetails);
				if (!this.controlKeyDialog) {
					this.controlKeyDialog = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.controlKeyPopUp", this);
					this.getView().addDependent(this.controlKeyDialog);
				}
				this.controlKeyDialog.open();
			}

		},
		onSaveControlKey: function (oEvent) {
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var sPath = oWorkOrderDetailViewModel.getProperty("/sPathControlKey");
			var oData = oWorkOrderDetailViewModel.getProperty("/oControlkeyOperation");
			oWorkOrderDetailModel.setProperty(sPath, oData);
			this.onCancelControlKeyDialog();
		},
		onCancelControlKeyDialog: function (oEvent) {
			this.controlKeyDialog.close();
			this.controlKeyDialog.destroy();
			this.controlKeyDialog = null;
		},

		//nischal -- function to set Required Start Date and End Date based on priority

		onChangePriority: function (oEvent) {
			var that = this;
			var mLookupModel = this.mLookupModel;
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
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
						oWorkOrderDetailModel.setProperty("/PlanStartDate", oReqStartDate);
						oWorkOrderDetailModel.setProperty("/PlanEndDate", oReqEndDate);
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
		fnGetTechUserName: function (userid) {
			var oModel = this.oPortalDataModel;
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var oFilter = [];
			oFilter.push(new sap.ui.model.Filter("Bname", "EQ", userid));
			oModel.read("/UsersListSet", {
				filters: oFilter,
				async: false,
				success: function (oData, oResponse) {
					oWorkOrderDetailViewModel.setProperty("/HEADERTOPARTNERNAV/0/AssigedTechName", oData.results[0].NameTextc);
					oWorkOrderDetailViewModel.refresh();
				},
				error: function (oResponse) {
					oWorkOrderDetailViewModel.setProperty("/HEADERTOPARTNERNAV/0/AssigedTechName", "");
					oWorkOrderDetailViewModel.refresh();
				}
			});
		},

		//Function to show selected Equipment
		fnFilterSlectedDamageGroup: function () {
			var catGrp = this.mLookupModel.getProperty("/sCatelogProf");
			var aFilters = [];
			if (catGrp) {
				var sFilter = new sap.ui.model.Filter("Codegruppe", "EQ", catGrp);
				aFilters.push(sFilter);
			}
			var oDamageCode = this.getView().byId("WO_DETAIL_DAMAGE_CODE");
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
			var oCauseCode = this.getView().byId("WO_DETAIL_CAUSE_CODE");
			var binding = oCauseCode.getBinding("items");
			binding.filter(aFilters, "Application");
		},

		//Function to get Work Order details by WOid
		getWODetails: function (workOrderId) {
			this.fnGetWOHeaderDetailsCreateWO(workOrderId);
			document.title = workOrderId;
		},

		/////////////////////////////////Header Details/////////////////////////////////
		//Function to validate Start and End date for Planned Date field
		fnValidateDates: function (oEvent) {
			var startDate, endDate;
			var oSource = oEvent.getSource();
			var dateValue = oSource.getDateValue();
			if (dateValue === null) {
				dateValue = new Date();
			}
			var dateField = oSource.getCustomData()[0].getValue();
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			if (dateField === "PlanStartDate") {
				var planEndDate = oWorkOrderDetailModel.getProperty("/PlanEndDate");
				startDate = new Date(dateValue);
				endDate = new Date(planEndDate);
				if (!planEndDate) {
					this.fnDateObjToGWDateFormat(oEvent, true, dateField, startDate, endDate);
				} else if (startDate > endDate) {
					this.fnDateObjToGWDateFormat(oEvent, false, dateField, startDate, endDate);
					this.showMessage(this.oResourceModel.getText("plannedsdatevalidation"));
				} else {
					this.fnDateObjToGWDateFormat(oEvent, true, dateField, startDate, endDate);
				}
			} else if (dateField === "PlanEndDate") {
				var planStartDate = oWorkOrderDetailModel.getProperty("/PlanStartDate");
				startDate = new Date(planStartDate);
				endDate = new Date(dateValue);
				if (!startDate) {
					this.fnDateObjToGWDateFormat(oEvent, true, dateField, startDate, endDate);
				} else if (endDate < startDate) {
					this.fnDateObjToGWDateFormat(oEvent, false, dateField, startDate, endDate);
					this.showMessage(this.oResourceModel.getText("plannededatevalidation"));
				} else {
					this.fnDateObjToGWDateFormat(oEvent, true, dateField, startDate, endDate);
				}
			}
		},

		//Function to set GW date format on selecting date from Datepicker
		fnDateObjToGWDateFormat: function (oEvent, bVal, dateField, startDate, endDate) {
			var oSource = oEvent.getSource();
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			if (bVal) {
				var dateValue;
				if (oSource.getDateValue() === null) {
					dateValue = new Date();
				} else {
					dateValue = oSource.getDateValue();
				}
				oWorkOrderDetailModel.setProperty("/" + dateField, dateValue);
				oWorkOrderDetailModel.refresh();
			} else {
				if (dateField === "PlanStartDate") {
					oWorkOrderDetailModel.setProperty("/" + dateField, endDate);
				} else if (dateField === "PlanEndDate") {
					oWorkOrderDetailModel.setProperty("/" + dateField, startDate);
				}
			}
			oWorkOrderDetailModel.refresh();
		},

		//Function to set Malfunction Start Date and Time
		fnSetMalfunctionDateTime: function (oEvent) {
			var oSource = oEvent.getSource();
			var dateValue = oSource.getDateValue();
			if (dateValue === null) {
				dateValue = new Date();
			}
			var dateTimeField = oSource.getCustomData()[0].getValue();
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			if (dateTimeField === "MalFunStartTime") {
				var malFuncDate = oWorkOrderDetailModel.getProperty("/MalFunStartDate");
				var splitDate = malFuncDate.split("T")[0];
				dateValue = splitDate + "T" + dateValue + ":00";
			}
			oWorkOrderDetailModel.setProperty("/MalFunStartDate", dateValue);
			oWorkOrderDetailModel.refresh();
		},

		/////////////////////////////////Header Details/////////////////////////////////

		/////////////////////////////////Operations & Spare Parts /////////////////////////////////
		//Function to set visible fields in Operations Tab and Spare parts Tab 
		setVisibleOperationComment: function (oEvent) {
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var selectedTab = oEvent.getParameters().item.getText();
			if (selectedTab === "Spare Parts") {
				oWorkOrderDetailViewModel.setProperty("/visibleOperationComment", false);
			} else {
				oWorkOrderDetailViewModel.setProperty("/visibleOperationComment", true);
			}
			this.oWorkOrderDetailModel.refresh(true);
		},
		/////////////////////////////////Operations & Spare Parts /////////////////////////////////
		//Function to show Work Order comment in pop-up
		showWorkOrderCommentDialog: function () {
			if (!this.workOrderCommentDialog) {
				this.workOrderCommentDialog = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.workOrderCommentDialog", this);
				this.getView().addDependent(this.workOrderCommentDialog);
			}
			this.workOrderCommentDialog.open();
		},

		//Function to close work order comment pop-up
		closeWordOrderCommentPopup: function () {
			this.workOrderCommentDialog.close();
		},

		//Function to change button text
		fnCreateUpdateBtnTxt: function (status) {
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			if (status === "CREATE_ORDER") {
				oWorkOrderDetailViewModel.setProperty("/createVisible", true);
				oWorkOrderDetailViewModel.setProperty("/createExitVisible", true);
				oWorkOrderDetailViewModel.setProperty("/updateVisible", false);
				oWorkOrderDetailViewModel.setProperty("/updateExitVisible", false);
			} else if (status === "WO_RELEASE") {
				oWorkOrderDetailViewModel.setProperty("/createVisible", false);
				oWorkOrderDetailViewModel.setProperty("/createExitVisible", false);
				oWorkOrderDetailViewModel.setProperty("/updateVisible", true);
				oWorkOrderDetailViewModel.setProperty("/updateExitVisible", true);
			} else if (status === "WO_TECO") {
				oWorkOrderDetailViewModel.setProperty("/createVisible", false);
				oWorkOrderDetailViewModel.setProperty("/createExitVisible", false);
				oWorkOrderDetailViewModel.setProperty("/updateVisible", false);
				oWorkOrderDetailViewModel.setProperty("/updateExitVisible", false);
			} else {
				oWorkOrderDetailViewModel.setProperty("/createVisible", false);
				oWorkOrderDetailViewModel.setProperty("/createExitVisible", false);
				oWorkOrderDetailViewModel.setProperty("/updateVisible", true);
				oWorkOrderDetailViewModel.setProperty("/updateExitVisible", true);
			}
			oWorkOrderDetailViewModel.refresh();
		},

		//Function to remove Twork and Mywork fields during Create/Update/Release of WO
		fnDeleteOperationsFields: function (operations) {
			for (var i = 0; i < operations.length; i++) {
				delete operations[i].MyWork;
				delete operations[i].TWork;
			}
			return operations;
		},

		//Function to update oepration status on Confirm/Full Confirm/Mass Update of Operations
		setOperationSet: function (operations, operationStatus) {
			for (var i = 0; i < operations.length; i++) {
				operations[i].systemstatustext = operationStatus;
			}
			return operations;
		},

		//Function to Create/Update and Exit WO detail screen
		onCreateUpdateAndExitWO: function (oEvent) {
			var that = this;
			var oSource = oEvent.getSource();
			var oBtnType = oSource.getCustomData()[0].getValue();
			switch (oBtnType) {
			case "WO_DETAIL_CREATE_NOTIF":
				var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
				var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
				var headerNotifnav = oWorkOrderDetailModel.getProperty("/HEADERTONOTIFNAV");
				if (headerNotifnav.length === 0) {
					oWorkOrderDetailViewModel.setProperty("/isNotifCreated", true);
				} else {
					oWorkOrderDetailViewModel.setProperty("/isNotifCreated", false);
				}
				this.fnMandateUiFields("WO_DETAIL_CREATE_NOTIF");
				break;
			case "WO_DETAIL_CREATE":
				var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
				var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
				var headerNotifnav = oWorkOrderDetailModel.getProperty("/HEADERTONOTIFNAV");
				if (headerNotifnav.length === 0) {
					oWorkOrderDetailViewModel.setProperty("/isNotifCreated", true);
				} else {
					oWorkOrderDetailViewModel.setProperty("/isNotifCreated", false);
				}
				this.fnMandateUiFields("WO_DETAIL_CREATE");
				break;
			case "WO_DETAIL_CREATE_EXIT":
				this.fnMandateUiFields("WO_DETAIL_CREATE_EXIT");
				break;
			case "WO_DETAIL_UPDATE":
				this.fnMandateUiFields("WO_DETAIL_UPDATE");
				break;
			case "WO_DETAIL_UPDATE_EXIT":
				this.fnMandateUiFields("WO_DETAIL_UPDATE_EXIT");
				break;
			case "WO_DETAIL_RELEASE":
				this.fnCheckOpsSpareBeforeRelease(); //nischal -- just for debugging
				// this.fnMandateUiFields("WO_DETAIL_RELEASE");
				break;
			case "WO_DETAIL_TECHO":
				//nischal -- TECO based on user status
				var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
				var sUserStatus = oWorkOrderDetailModel.getProperty("/UserStatus");
				if (sUserStatus === "HOLD") {
					MessageBox.warning("The order is on Hold status. Do you want to proceed with TECO?", {
						actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
						emphasizedAction: MessageBox.Action.OK,
						onClose: function (sAction) {
							if(sAction === "OK"){
								that.fnMandateUiFields("WO_DETAIL_TECHO");
							}
						}
					});
				} else {
					this.fnMandateUiFields("WO_DETAIL_TECHO"); //nischal -- TECO based on user status
				}
						
				break;
			case "WO_DETAIL_OPERATION_CONFIRM":
				this.fnMandateUiFields("WO_DETAIL_OPERATION_CONFIRM");
				break;
			case "WO_DETAIL_OPERATION_FINAL_CONFIRM":
				this.fnMandateUiFields("WO_DETAIL_OPERATION_FINAL_CONFIRM");
				break;
			}
		},

		//Function to save Operations/Spare parts before release of WO
		fnCheckOpsSpareBeforeRelease: function () {
			var message = "";
			var unSavedOps = [];
			var unSavedComps = [];
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;

			var operations = oWorkOrderDetailModel.getProperty("/HEADERTOOPERATIONSNAV");
			for (var i = 0; i < operations.length; i++) {
				var obj = oWorkOrderDetailModel.getProperty("/HEADERTOOPERATIONSNAV/" + [i]);
				var isVal = this.fnCheckOperationIsChecked(obj);
				if (isVal[0] === false && isVal[2] === "CREATE") {
					unSavedOps.push(isVal[1]);
				}
			}
			var spareParts = oWorkOrderDetailModel.getProperty("/HEADERTOCOMPONENTNAV");
			for (var j = 0; j < spareParts.length; j++) {
				var selectedObj = oWorkOrderDetailModel.getProperty("/HEADERTOCOMPONENTNAV/" + [j]);
				if (selectedObj.CompCode === "" || selectedObj.CompCode === "C") {
					unSavedComps.push(selectedObj);
				}
			}

			if (unSavedOps.length > 0 && unSavedComps.length > 0) {
				message = this.oResourceModel.getText("pleasesaveoprnsandsparts");
				this.showMessage(message, "W");
			} else if (unSavedOps.length > 0) {
				message = this.oResourceModel.getText("pleasesaveoprntorelwo");
				this.showMessage(message, "W");
			} else if (unSavedComps.length > 0) {
				message = this.oResourceModel.getText("pleasesavespartstorelwo");
				this.showMessage(message, "W");
			} else {
				this.fnMandateUiFields("WO_DETAIL_RELEASE");
			}
		},

		//Function to validate mandatory fields before digital signature pop-up
		fnMandateUiFields: function (woCreateNavType) {
			var that = this;
			var oResourceModel = this.oResourceModel;
			var oPortalNotifOData = this.oPortalNotifOData;
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var bVal = util.fnMandateDetailWOFields(oWorkOrderDetailModel, this, woCreateNavType);
			if (bVal[0] === true) {
				if (bVal[1]) {
					this.showMessage(bVal[1]);
				}
				return;
			} else if (bVal[0] === false && woCreateNavType === "WO_DETAIL_CREATE_NOTIF") {
				var bBreakdown = oWorkOrderDetailModel.getProperty("/Breakdown");
				var oReqEndDate = oWorkOrderDetailModel.getProperty("/PlanEndDate");
				var oReqStartDate = oWorkOrderDetailModel.getProperty("/PlanStartDate");
				var sReportedby = oWorkOrderDetailModel.getProperty("/ReportedBy");
				var sShortText = oWorkOrderDetailModel.getProperty("/ShortText");
				var oNotifDetails = [{
					"Breakdown": bBreakdown,
					"Desenddate": oReqEndDate,
					"Desstdate": oReqStartDate,
					"LongText": "",
					"NotifNo": "",
					"NotifStatus": "NEW",
					"Reportedby": sReportedby,
					"ShortText": sShortText
				}];
				util.fnSetPayLoadForCreateNotif(oWorkOrderDetailModel, oWorkOrderDetailViewModel, this); //nischal - take value from oWorkOrderDetailModel to CreateNotification Payload
				var oNotifData = oWorkOrderDetailViewModel.getProperty("/oNotifPayLoad");
				oPortalNotifOData.setHeaders({
					"X-Requested-With": "X"
				});

				oPortalNotifOData.create("/NotificationSet", oNotifData, {
					async: false,
					success: function (sData, oResponse) {
						var successErrMsg = "";
						var isSuccess;
						var oNotificationId = parseInt(sData.Notifid, 10);
						var sNotifId = oNotificationId.toString();
						if (oNotificationId) {
							oNotifDetails[0].NotifNo = sNotifId;
							oWorkOrderDetailModel.setProperty("/HEADERTONOTIFNAV", oNotifDetails);
							woCreateNavType = "WO_DETAIL_CREATE";
							that.onCreateUpdateWO(woCreateNavType);
						} else {
							MessageToast.show("Error Creating Notification");
						}

					},
					error: function (error, oResponse) {
						MessageToast.show("Error Creating Notification");
					}
				});
			} else if (bVal[0] === false) {
				this.onCreateUpdateWO(woCreateNavType);
				/*	if (woCreateNavType === "WO_DETAIL_CREATE" || woCreateNavType === "WO_DETAIL_CREATE_EXIT" ||
					woCreateNavType === "WO_DETAIL_UPDATE" || woCreateNavType === "WO_DETAIL_UPDATE_EXIT") {
					this.onCreateUpdateWO(woCreateNavType);
				} else {
					oWorkOrderDetailViewModel.setProperty("/digitalSignBtnTrigger", woCreateNavType);
					this.onOpenDigitalSignPopup();
				}*/
			}
		},

		onUpdateAssignedTo: function (oEvent) {
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var assignedTo = oWorkOrderDetailModel.getProperty("/HEADERTOPARTNERNAV/0/AssignedTo");
			var uiAssignedTo = oWorkOrderDetailViewModel.getProperty("/HEADERTOPARTNERNAV/0/AssignedTo");
			var uiPartnerNav = oWorkOrderDetailViewModel.getProperty("/HEADERTOPARTNERNAV/0/PARTNERNAV");
			if (uiAssignedTo !== assignedTo) {
				if (uiPartnerNav === "N" || uiPartnerNav === "U") {
					oWorkOrderDetailViewModel.setProperty("/HEADERTOPARTNERNAV/0/PARTNERNAV", "U");
					oWorkOrderDetailViewModel.setProperty("/HEADERTOPARTNERNAV/0/AssignedTo", uiAssignedTo);
					oWorkOrderDetailViewModel.setProperty("/HEADERTOPARTNERNAV/0/PARTNEROLD", assignedTo);
				}
			} else {
				if (uiPartnerNav === "U") {
					oWorkOrderDetailViewModel.setProperty("/HEADERTOPARTNERNAV/0/PARTNERNAV", "N");
					oWorkOrderDetailViewModel.setProperty("/HEADERTOPARTNERNAV/0/AssignedTo", uiAssignedTo);
					oWorkOrderDetailViewModel.setProperty("/HEADERTOPARTNERNAV/0/PARTNEROLD", "");
				}
			}
			oWorkOrderDetailModel.refresh();
			oWorkOrderDetailViewModel.refresh();
		},

		//Function to format Malfunction time
		fnSetMalfunctionStTime: function (workOrderData) {
			var malFnStartTime = workOrderData.MalFunStartTime;
			var hh = parseInt(malFnStartTime.split(":")[0], 10);
			var mm = parseInt(malFnStartTime.split(":")[1], 10);
			var newDate = new Date();
			var milliSec = newDate.setHours(hh, mm);
			var format1 = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "PTHH'H'mm'M'ss'S"
			});

			var oTime = format1.format(new Date(milliSec));
			workOrderData.MalFunStartTime = oTime;
			return workOrderData;
		},

		//Function to Create/Update and Work Order
		onCreateUpdateWO: function (woCreateNavType) {
			var that = this;
			this.busy.open();
			var oConfirmTexts = "";
			var oResourceModel = this.oResourceModel;
			var oWorkOrderOData = this.oWorkOrderOData;
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var oWorkOrderData = oWorkOrderDetailModel.getData();

			if (woCreateNavType === "WO_DETAIL_OPERATION_CONFIRM" || woCreateNavType === "WO_DETAIL_OPERATION_FINAL_CONFIRM") {
				oWorkOrderDetailViewModel.setProperty("/HEADERTOOPERATIONSNAV", oWorkOrderData.HEADERTOOPERATIONSNAV);
			}

			var operations = oWorkOrderData.HEADERTOOPERATIONSNAV;
			if (woCreateNavType === "WO_DETAIL_CREATE" || woCreateNavType === "WO_DETAIL_CREATE_EXIT") {
				delete oWorkOrderData.SetOrderStatus;
				operations = this.fnDeleteOperationsFields(operations);
				oWorkOrderData.HEADERTOOPERATIONSNAV = operations;
			} else if (woCreateNavType === "WO_DETAIL_UPDATE" || woCreateNavType === "WO_DETAIL_UPDATE_EXIT") {
				// operations = this.fnDeleteOperationsFields(operations); //nischal--MyWork field should not be deleted 
				oWorkOrderData.HEADERTOOPERATIONSNAV = operations;
				oWorkOrderData.SetOrderStatus = "";
			} else if (woCreateNavType === "WO_DETAIL_RELEASE") {
				oWorkOrderData.SetOrderStatus = "REL";
			} else if (woCreateNavType === "WO_DETAIL_TECHO") {
				// oWorkOrderData.UserStatus = "COMP";
				oWorkOrderData.SetOrderStatus = "TECO";
			} else if (woCreateNavType === "WO_DETAIL_OPERATION_CONFIRM") {
				var operationsList = oWorkOrderDetailViewModel.getProperty("/confirmOperations");
				oConfirmTexts = that.getConfirmLongText(operationsList, oWorkOrderData.Orderid);
				oWorkOrderDetailViewModel.setProperty("/listOperationCommentsDto", oConfirmTexts);
				operationsList = this.setOperationSet(operationsList, "PCNF");
				oWorkOrderData.HEADERTOOPERATIONSNAV = operationsList;
				oWorkOrderData.SetOrderStatus = "PCNF";
			} else if (woCreateNavType === "WO_DETAIL_OPERATION_FINAL_CONFIRM") {
				var oOperationsList = oWorkOrderDetailViewModel.getProperty("/confirmOperations");
				oConfirmTexts = that.getConfirmLongText(oOperationsList, oWorkOrderData.Orderid);
				oWorkOrderDetailViewModel.setProperty("/listOperationCommentsDto", oConfirmTexts);
				oOperationsList = this.setOperationSet(oOperationsList, "CNF");
				oWorkOrderData.HEADERTOOPERATIONSNAV = oOperationsList;
				oWorkOrderData.SetOrderStatus = "CNF";
			}
			var headerMessage = [{
				"Message": "",
				"Status": ""
			}];
			oWorkOrderData.HEADERTOMESSAGENAV = headerMessage;
			this.fnGetNewNotifications(oWorkOrderData);
			this.fnFormatWODateObjectsToStr(oWorkOrderData);
			oWorkOrderData = this.fnSetMalfunctionStTime(oWorkOrderData);

			var uiAssignedTo = oWorkOrderDetailViewModel.getProperty("/HEADERTOPARTNERNAV/0/AssignedTo");
			var uiPartnerNav = oWorkOrderDetailViewModel.getProperty("/HEADERTOPARTNERNAV/0/PARTNERNAV");
			var partnerOld = oWorkOrderDetailViewModel.getProperty("/HEADERTOPARTNERNAV/0/PARTNEROLD");
			oWorkOrderData.HEADERTOPARTNERNAV[0].AssignedTo = uiAssignedTo;
			oWorkOrderData.HEADERTOPARTNERNAV[0].PARTNERNAV = uiPartnerNav;
			if (!partnerOld) {
				partnerOld = "";
			}
			oWorkOrderData.HEADERTOPARTNERNAV[0].PARTNEROLD = partnerOld;
			oWorkOrderOData.setHeaders({
				"X-Requested-With": "X"
			});
			oWorkOrderOData.create("/WorkorderHeaderSet", oWorkOrderData, {
				async: false,
				success: function (sData, oResponse) {
					var successErrMsg = "";
					var confirmationTexts = "";
					var orderId = sData.Orderid;
					if (orderId) {
						orderId = parseInt(orderId, 10);
						orderId = orderId.toString();
					} else {
						orderId = "";
					}
					sData.Orderid = orderId;
					var messages = sData.HEADERTOMESSAGENAV.results;
					if (messages[0].Status === "S" && messages[0].Message === "Success") {
						switch (woCreateNavType) {
						case "WO_DETAIL_CREATE":
							successErrMsg = oResourceModel.getText("WO_CREATED_SUCCESFULLY") + orderId;
							that.onUpdateNotifcationFields(sData);
							break;
						case "WO_DETAIL_CREATE_EXIT":
							successErrMsg = oResourceModel.getText("WO_CREATED_SUCCESFULLY") + orderId;
							that.onUpdateNotifcationFields(sData, "WO_DETAIL_CREATE_EXIT");
							break;
						case "WO_DETAIL_UPDATE":
							successErrMsg = oResourceModel.getText("WO_UPDATED_SUCCESFULLY") + orderId;
							that.onUpdateNotifcationFields(sData);
							break;
						case "WO_DETAIL_UPDATE_EXIT":
							successErrMsg = oResourceModel.getText("WO_UPDATED_SUCCESFULLY") + orderId;
							that.onUpdateNotifcationFields(sData, "WO_DETAIL_UPDATE_EXIT");
							break;
						case "WO_DETAIL_RELEASE":
							successErrMsg = oResourceModel.getText("WO_RELEASED_SUCCESFULLY") + orderId;
							that.onUpdateNotifcationFields(sData);
							break;
						case "WO_DETAIL_OPERATION_CONFIRM":
							confirmationTexts = oWorkOrderDetailViewModel.getProperty("/listOperationCommentsDto");
							that.onSaveOperationComments(confirmationTexts);
							successErrMsg = oResourceModel.getText("WO_CONFIRMED_SUCCESFULLY") + orderId;
							that.onUpdateNotifcationFields(sData, woCreateNavType);
							// that.fnGetWOHeaderDetails(orderId, woCreateNavType);
							break;
						case "WO_DETAIL_OPERATION_FINAL_CONFIRM":
							confirmationTexts = oWorkOrderDetailViewModel.getProperty("/listOperationCommentsDto");
							that.onSaveOperationComments(confirmationTexts);
							successErrMsg = oResourceModel.getText("WO_CONFIRMED_SUCCESFULLY") + orderId;
							that.onUpdateNotifcationFields(sData, woCreateNavType);
							// that.fnGetWOHeaderDetails(orderId, woCreateNavType);
							break;
						case "WO_DETAIL_TECHO":
							successErrMsg = oResourceModel.getText("WO_TECOED_SUCCESFULLY") + orderId;
							that.onUpdateNotifcationFields(sData, woCreateNavType);
							// that.fnGetWOHeaderDetails(orderId, woCreateNavType);
							break;
						}
						messages[0].Message = successErrMsg;
						var oFilter = [];
						oFilter.push(new Filter("OrderNo", "EQ", orderId));
						oWorkOrderOData.read("/purchaseReqSet", {
							async: false,
							filters: oFilter,
							success: function (oData) {
								var aResults = oData.results;
								console.log(aResults);
								if (aResults.length > 0) {
									for (var i = 0; i < aResults.length; i++) {
										var pr = aResults[i].PurchaseReq;
										var resItem = aResults[i].ResItem;
										var oObj = {
											"Message": "Purchase Request Number :" + pr + " for ResItem :" + resItem,
											"Status": "S"
										};
										messages.push(oObj);
									}

								}
							},
							error: function (oData) {
								console.log(oData);
							}
						});
					} else {
						sData = that.fnFormatWODateObjects(sData);
						var operationList = sData.HEADERTOOPERATIONSNAV.results;
						var notifications = sData.HEADERTONOTIFNAV;
						if (sData.HEADERTONOTIFNAV === null) {
							notifications = [];
						} else {
							var notifbVal = notifications.hasOwnProperty("results");
							if (notifbVal) {
								notifications = notifications.results;
								if (notifications.length >= 1) {
									sData.ReportedBy = notifications[0].Reportedby;
								}
							} else {
								notifications = [];
							}
						}
						var spareParts = sData.HEADERTOCOMPONENTNAV;
						if (sData.HEADERTOCOMPONENTNAV === null) {
							spareParts = [];
						} else {
							spareParts = spareParts.hasOwnProperty("results");
							if (notifbVal) {
								spareParts = spareParts.results;
								if (spareParts === undefined) {
									spareParts = [];
								}
							} else {
								spareParts = [];
							}
						}
						var bHeaderMessage = [{
							"Message": "",
							"Status": ""
						}];
						var headerPartner = oWorkOrderDetailViewModel.getProperty("/HEADERTOPARTNERNAV");
						sData.HEADERTOOPERATIONSNAV = operationList;
						sData.HEADERTOCOMPONENTNAV = spareParts;
						sData.HEADERTOMESSAGENAV = bHeaderMessage;
						sData.HEADERTOPARTNERNAV = headerPartner;
						sData.HEADERTONOTIFNAV = notifications;

						sData.MalFunStartTime = formatter.getMalfunctionStTime(sData.MalFunStartTime.ms);
						oWorkOrderDetailModel.setProperty("/", sData);
						that.sortOperations();
						oWorkOrderDetailModel.refresh(true);
						that.getOperationIdLookup();
						that.getDamageGroupCode("", sData.Damagecode);
						that.getCauseGroupCode("", sData.Causecode);
						that.busy.close();
					}
					that.fnShowSuccessErrorMsg(messages);
					that.fnClearTblSelection();
				},
				error: function (error, oResponse) {
					var errorMsg = that.oResourceModel.getText("errorcreatewo");
					that.showMessage(errorMsg);
					that.busy.close();
				}
			});
		},
		setPrToTable: function () {
			var mLookupModel = this.mLookupModel;
			var aMsg = mLookupModel.getProperty("/messages");
			var oObj = {
				"Message": "Its Working",
				"status": "S"
			};
			aMsg.push(oObj);
			mLookupModel.setProperty("/messages", aMsg);
			mLookupModel.refresh("true");
		},

		//Function to save operation comments for a Work Order
		onSaveOperationComments: function (confirmationTexts) {
			var that = this;
			this.busy.open();
			var oPortalDataModel = this.oPortalDataModel;
			var oFilter = [];
			oFilter.push(new Filter("REQUEST", "EQ", JSON.stringify(confirmationTexts)));
			oPortalDataModel.read("/OperationSaveSet", {
				filters: oFilter,
				success: function (oData) {
					that.busy.close();
				},
				error: function (oData) {
					that.showMessage(this.oResourceModel.getText("errinsavcomment"));
					that.busy.close();
				}
			});
		},

		//Function to get and send only new added notifications
		fnGetNewNotifications: function (workOrderData) {
			var oTempArr = [];
			var notifications = workOrderData.HEADERTONOTIFNAV;
			for (var i = 0; i < notifications.length; i++) {
				var obj = notifications[i];
				if (obj.NotifStatus === "NEW") {
					delete obj.NotifStatus;
					oTempArr.push(obj);
				}
			}
			workOrderData.HEADERTONOTIFNAV = oTempArr;
		},

		//Function to format Work Order data format fetching from service
		fnFormatWODateObjects: function (oData) {
			if (oData.DateCreated) {
				oData.DateCreated = new Date(oData.DateCreated);
			} else if (oData.DateCreated === "" || oData.DateCreated === null) {
				oData.DateCreated = new Date();
			}
			if (oData.MalFunStartDate) {
				oData.MalFunStartDate = new Date(oData.MalFunStartDate);
			} else if (oData.MalFunStartDate === "" || oData.MalFunStartDate === null) {
				oData.MalFunStartDate = new Date();
			}
			if (oData.PlanEndDate) {
				oData.PlanEndDate = new Date(oData.PlanEndDate);
			} else if (oData.PlanEndDate === "" || oData.PlanEndDate === null) {
				oData.PlanEndDate = new Date();
			}
			if (oData.PlanStartDate) {
				oData.PlanStartDate = new Date(oData.PlanStartDate);
			} else if (oData.PlanStartDate === "" || oData.PlanStartDate === null) {
				oData.PlanStartDate = new Date();
			}

			var operations = oData.HEADERTOOPERATIONSNAV.results;
			for (var i = 0; i < operations.length; i++) {
				var completedDate = operations[i].CompletedOn;
				if (completedDate) {
					completedDate = new Date(completedDate);
				} else if (completedDate === "" || completedDate === null) {
					completedDate = new Date();
				}
				completedDate = new Date(completedDate);
				operations[i].CompletedOn = completedDate;
			}
			oData.HEADERTOOPERATIONSNAV.results = operations;
			return oData;
		},

		//Function to format Work Order data's Date format to string
		fnFormatWODateObjectsToStr: function (oData) {
			oData.DateCreated = formatter.formatDateobjToString(oData.DateCreated);
			oData.MalFunStartDate = formatter.formatDateobjToString(oData.MalFunStartDate);
			oData.PlanEndDate = formatter.formatDateobjToString(oData.PlanEndDate);
			oData.PlanStartDate = formatter.formatDateobjToString(oData.PlanStartDate);

			var operations = oData.HEADERTOOPERATIONSNAV;
			for (var i = 0; i < operations.length; i++) {
				var completedDate = operations[i].CompletedOn;
				// convert local time to UTC 
				completedDate = formatter.formatCompOnDateobjToString(completedDate); // get date and time from UI dont set time as 00:00:00
				operations[i].CompletedOn = completedDate;
			}
			oData.HEADERTOOPERATIONSNAV = operations;
			var notifications = oData.HEADERTONOTIFNAV;
			for (var j = 0; j < notifications.length; j++) {
				var stDate = notifications[j].Desstdate;
				var endDate = notifications[j].Desenddate;
				stDate = formatter.formatDateobjToString(stDate);
				endDate = formatter.formatDateobjToString(endDate);
				notifications[j].Desstdate = stDate;
				notifications[j].Desenddate = endDate;
			}
			oData.HEADERTONOTIFNAV = notifications;
			return oData;
		},

		//Function to generate Operation Id while adding new Operation for a WO
		generateOperationId: function (operations) {
			var newOperationId = "";
			var length = operations.length;
			if (length === 0) {
				newOperationId = "0010";
			} else if (length > 0) {
				var prevOperation = operations[length - 1];
				var prevOperationId = prevOperation.Activity;
				prevOperationId = parseInt(prevOperationId, 10);
				newOperationId = prevOperationId + 10;
				if (newOperationId < 100) {
					newOperationId = "00" + newOperationId;
				} else if (newOperationId >= 100 && newOperationId < 1000) {
					newOperationId = "0" + newOperationId;
				} else if (newOperationId >= 1000) {
					newOperationId = newOperationId.toString();
				}
			}
			return newOperationId;
		},

		//Function to generate Operations ID lookup
		getOperationIdLookup: function () {
			var oArray = [];
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var operations = oWorkOrderDetailModel.getProperty("/HEADERTOOPERATIONSNAV");
			if (!operations) {
				return;
			}
			for (var i = 0; i < operations.length; i++) {
				var oTempObj = {
					id: operations[i].Activity,
					text: operations[i].Activity
				};
				oArray.push(oTempObj);
			}
			this.oWorkOrderDetailViewModel.setProperty("/operationsLookup", oArray);
			oWorkOrderDetailModel.refresh();
		},

		//Function to add Operations for a Work Order
		onAddWOOperations: function () {
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var operations = oWorkOrderDetailModel.getProperty("/HEADERTOOPERATIONSNAV");
			var workCenter = oWorkOrderDetailModel.getProperty("/MnWkCtr");
			var userPlant = this.oUserDetailModel.getProperty("/userPlant");

			var bVal = this.addOperationMandatoryValidation();
			if (!bVal) {
				return;
			}
			if (!operations) {
				operations = [];
			}
			var newOperationId = this.generateOperationId(operations);
			var oTempobj = {
				"Activity": newOperationId,
				"WorkCntr": workCenter,
				"LongText": "",
				"Plant": userPlant,
				"Description": "",
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
			operations.push(oTempobj);
			oWorkOrderDetailModel.setProperty("/HEADERTOOPERATIONSNAV", operations);
			oWorkOrderDetailModel.refresh();
			this.getOperationIdLookup();
		},

		//Function to check for mandatory fields for adding an Operation
		addOperationMandatoryValidation: function () {
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var workCenter = oWorkOrderDetailModel.getProperty("/MnWkCtr");
			if (!workCenter) {
				this.showMessage(this.oResourceModel.getText("plsselectwotoaddoprn"));
				return false;
			}
			return true;
		},

		//Function top check if an operation is already selected, else un-select the operation
		isOperationSelected: function (oSelectedRow, selectedOps) {
			var bVal = [false];
			selectedOps.filter(function (obj, index) {
				if (obj.sPath === oSelectedRow) {
					bVal = [true, index];
				}
			});
			return bVal;
		},

		//Function to get filtered operations on Select all operations
		getFilteredSelectAllOps: function () {
			var tempArr = [];
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var isOperationsFiltered = oWorkOrderDetailViewModel.getProperty("/isOperationsFiltered");
			var operations = oWorkOrderDetailModel.getProperty("/HEADERTOOPERATIONSNAV");
			var cOperations = jQuery.extend(true, [], operations);
			for (var i = 0; i < cOperations.length; i++) {
				var operationStatus = cOperations[i].systemstatustext;
				if (isOperationsFiltered) {
					if (operationStatus !== "CNF") {
						tempArr.push(i);
					}
				} else {
					tempArr.push(i);
				}
			}
			return tempArr;
		},

		//Function to select all operations
		onSelectAllOperations: function (oEvent) {
			var isSelectAll = this.getFilteredSelectAllOps();
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var selectedOps = oWorkOrderDetailViewModel.getProperty("/selectedOps");
			selectedOps = [];
			for (var i = 0; i < isSelectAll.length; i++) {
				var oSelectedRow = "/HEADERTOOPERATIONSNAV/" + isSelectAll[i];
				var bVal = this.isOperationSelected(oSelectedRow, selectedOps);
				if (bVal[0]) {
					selectedOps.splice(bVal[1], 1);
				} else {
					var oTempObj = {
						sPath: oSelectedRow
					};
					selectedOps.push(oTempObj);
				}
			}
			oWorkOrderDetailViewModel.setProperty("/selectedOps", selectedOps);
			oWorkOrderDetailViewModel.refresh();
		},

		//Function to Select/Un-select operations
		onSelectOperation: function (oEvent) {
			var isSelectAll = oEvent.getParameters().selectAll;
			if (isSelectAll) {
				if (oEvent.getSource().getSelectedIndices().length > 1) {
					this.onSelectAllOperations(oEvent);
					return;
				}
			}
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var rowContext = oEvent.getParameters().rowContext;
			if (!isSelectAll && !rowContext) {
				oWorkOrderDetailViewModel.setProperty("/selectedOps", []);
				oWorkOrderDetailViewModel.setProperty("/Activity", "");
				oWorkOrderDetailViewModel.setProperty("/operationLongTxt", "");
				oWorkOrderDetailViewModel.setProperty("/enableOperationComment", false);
				oWorkOrderDetailViewModel.setProperty("/enableOpCnfmLongText", false);
				oWorkOrderDetailViewModel.setProperty("/confirmationLongText", "");
				this.fnFilterSlectedOperationComment();
				oWorkOrderDetailViewModel.refresh();
				return;
			}
			if (!rowContext) {
				return;
			}
			var oSelectedRow = rowContext.getPath();
			var selectedOps = oWorkOrderDetailViewModel.getProperty("/selectedOps");
			if (!selectedOps) {
				selectedOps = [];
			}
			var bVal = this.isOperationSelected(oSelectedRow, selectedOps);
			if (bVal[0]) {
				selectedOps.splice(bVal[1], 1);
			} else {
				var oTempObj = {
					sPath: oSelectedRow
				};
				selectedOps.push(oTempObj);
			}
			if (selectedOps.length === 1) {
				var sPath = selectedOps[0].sPath;
				var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
				var longTxt = oWorkOrderDetailModel.getProperty(sPath + "/LongText");
				var operationId = oWorkOrderDetailModel.getProperty(sPath + "/Activity");
				var confrmLongText = oWorkOrderDetailModel.getProperty(sPath + "/ConfLongText");
				var operationStatus = oWorkOrderDetailModel.getProperty(sPath + "/systemstatustext");
				var systemCondition = oWorkOrderDetailModel.getProperty(sPath + "/Systcond");
				var orderStatus = oWorkOrderDetailModel.getProperty("/OrderStatus");
				if (operationStatus === "CRTD" && systemCondition !== "") {
					oWorkOrderDetailViewModel.setProperty("/enableOperationComment", false);
				} else if ((operationStatus === "" || operationStatus === "CRTD") && (orderStatus === "CRTD" || orderStatus === "" ||
						orderStatus === "REL" || orderStatus === "PCNF" || orderStatus === "CNF")) {
					oWorkOrderDetailViewModel.setProperty("/enableOperationComment", true);
				} else {
					oWorkOrderDetailViewModel.setProperty("/enableOperationComment", false);
				}
				if (operationStatus === "" || operationStatus === "REL" || operationStatus === "PCNF") {
					oWorkOrderDetailViewModel.setProperty("/enableOpCnfmLongText", true);
				} else {
					oWorkOrderDetailViewModel.setProperty("/enableOpCnfmLongText", false);
				}

				if (this.oUserDetailModel.getProperty("/userRole") === "REVIEWER") {
					oWorkOrderDetailViewModel.setProperty("/enableOperationComment", false);
					oWorkOrderDetailViewModel.setProperty("/enableOpCnfmLongText", false);
				}
				oWorkOrderDetailViewModel.setProperty("/operationLongTxt", longTxt);
				oWorkOrderDetailViewModel.setProperty("/confirmationLongText", confrmLongText);
				oWorkOrderDetailViewModel.setProperty("/Activity", operationId);
			} else {
				oWorkOrderDetailViewModel.setProperty("/Activity", "");
				oWorkOrderDetailViewModel.setProperty("/operationLongTxt", "");
				oWorkOrderDetailViewModel.setProperty("/enableOperationComment", false);
				oWorkOrderDetailViewModel.setProperty("/enableOpCnfmLongText", false);
				oWorkOrderDetailViewModel.setProperty("/confirmationLongText", "");
			}
			oWorkOrderDetailViewModel.setProperty("/selectedOps", selectedOps);
			this.fnFilterSlectedOperationComment();
			oWorkOrderDetailViewModel.refresh();
		},

		//Function to show selected operations comments
		fnFilterSlectedOperationComment: function () {
			var aFilters = [];
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var selectedOps = oWorkOrderDetailViewModel.getProperty("/selectedOps");
			for (var i = 0; i < selectedOps.length; i++) {
				var sPath = selectedOps[i].sPath;
				var operationId = oWorkOrderDetailModel.getProperty(sPath + "/Activity");
				var sFilter = new sap.ui.model.Filter("operationId", "EQ", operationId);
				aFilters.push(sFilter);
			}

			var oVbox = this.getView().byId("WO_DETAIL_OPS_COMMENTS_LAY");
			var binding = oVbox.getBinding("items");
			binding.filter(aFilters, "Application");
		},

		//Function to update Operation ling text
		updateOperationLongTxt: function () {
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var selectedOps = oWorkOrderDetailViewModel.getProperty("/selectedOps");
			var operationLongTxt = oWorkOrderDetailViewModel.getProperty("/operationLongTxt");
			if (selectedOps.length === 1) {
				oWorkOrderDetailModel.setProperty(selectedOps[0].sPath + "/LongText", operationLongTxt);
			}
			oWorkOrderDetailModel.refresh();
		},

		//Function to update confirm long text for a Operation
		updateOperationCnfrmLongTxt: function (oEvent) {
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var selectedOps = oWorkOrderDetailViewModel.getProperty("/selectedOps");
			var operationLongTxt = oWorkOrderDetailViewModel.getProperty("/confirmationLongText");
			if (selectedOps.length === 1) {
				oWorkOrderDetailModel.setProperty(selectedOps[0].sPath + "/ConfLongText", operationLongTxt);
			}
			oWorkOrderDetailModel.refresh();
		},

		//Function to sort Operations by ascending order
		sortOperations: function (oEvent) {
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var operations = oWorkOrderDetailModel.getProperty("/HEADERTOOPERATIONSNAV");
			operations.sort(function (a, b) {
				return a.Activity === b.Activity ? 0 : a.Activity < b.Activity ? -1 : 1;
			});
			oWorkOrderDetailModel.setProperty("/HEADERTOOPERATIONSNAV", operations);
			oWorkOrderDetailModel.refresh();
			this.fnOperationUpdateStatus(oEvent);
		},

		fnOperationUpdateStatus: function (oEvent) {
			if (!oEvent) {
				return;
			}
			var oSource = oEvent.getSource();
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var sPath = oSource.getBindingContext("oWorkOrderDetailModel").getPath();
			var currObj = oWorkOrderDetailModel.getProperty(sPath);
			if (currObj.OperCode === "N") {
				currObj.OperCode = "U";
				oWorkOrderDetailModel.setProperty(sPath, currObj);
			}
			oWorkOrderDetailModel.refresh();
		},

		//Function to change Component code based on value changed
		fnComponentUpdateStatus: function (oEvent, isComboBox) {
			var oSource = oEvent.getSource();
			if (!isComboBox) {
				var bVal = util.validateInputDataType(oEvent, this);
				if (!bVal) {
					return;
				}
			}

			var oResourceModel = this.oResourceModel;
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var sPath = oSource.getBindingContext("oWorkOrderDetailModel").getPath();
			var currObj = oWorkOrderDetailModel.getProperty(sPath);
			var stockAvailable = currObj.StockAvail;
			stockAvailable = parseInt(stockAvailable, 10);
			var requiredQty = currObj.RequirementQuantity;
			requiredQty = parseInt(requiredQty, 10);

			if (requiredQty > stockAvailable) {
				var errorMsg = oResourceModel.getText("REQ_QTY_GREATER_STOCK");
				this.showMessage(errorMsg);
				if (currObj.CompCode === "N") {
					currObj.CompCode = "U";
					oWorkOrderDetailModel.setProperty(sPath, currObj);
				}
			} else {
				if (currObj.CompCode === "N") {
					currObj.CompCode = "U";
					oWorkOrderDetailModel.setProperty(sPath, currObj);
				}
			}
			oWorkOrderDetailModel.refresh(true);
		},

		//Function to check if an operation is in Created status else dont delete the operations
		fnCheckOperationsStatus: function (operations) {
			var bVal = false;
			var oNewOperations = [];
			var oldOperations = [];
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			for (var i = 0; i < operations.length; i++) {
				var obj = oWorkOrderDetailModel.getProperty(operations[i].sPath);
				var operCode = obj.OperCode;
				var operationId = obj.Activity;
				var systemStatus = obj.systemstatustext;
				if (systemStatus === "" && operCode === "C") {
					oNewOperations.push(operationId);
				} else {
					oldOperations.push(operationId);
				}
			}
			if (oldOperations.length > 0) {
				this.fnDelteOnlyUnsavedOps(oldOperations);
			} else {
				bVal = true;
			}
			return bVal;
		},

		//Function to show warning message for User cannot delete saved ops
		fnDelteOnlyUnsavedOps: function (unSavedOps) {
			var message = "";
			var operationsId = "";
			var oResourceModel = this.oResourceModel;
			if (unSavedOps) {
				if (unSavedOps.length === 1) {
					operationsId = unSavedOps.join("");
					message = oResourceModel.getText("OPERATION") + operationsId + " " + oResourceModel.getText("CANNOT_BE_REMOVED_AS_IT_IS_SAVED");
				} else if (unSavedOps.length > 1) {
					operationsId = unSavedOps.join(", ");
					message = oResourceModel.getText("OPERATIONS") + operationsId + " " + oResourceModel.getText("CANNOT_BE_REMOVED_AS_THEY_SAVED");
				}
			}
			this.MessageBox.warning(message, {
				icon: "WARNING",
				title: "Warning",
				actions: [sap.m.MessageBox.Action.OK]
			});
		},

		//Function to remove selected operations from WO detail view
		onDeleteSelectedOperations: function () {
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var operationsTbl = this.getView().byId("MYLAN_OPERATIONS_TABLE");
			var operations = oWorkOrderDetailModel.getProperty("/HEADERTOOPERATIONSNAV");
			var selectedOps = oWorkOrderDetailViewModel.getProperty("/selectedOps");
			if (!selectedOps || selectedOps.length === 0) {
				this.showMessage(this.oResourceModel.getText("plsseloprntoberemoved"));
			} else {
				var bVal = this.fnCheckOperationsStatus(selectedOps);
				if (bVal) {
					for (var i = selectedOps.length - 1; i >= 0; i--) {
						var sPath = selectedOps[i].sPath;
						var interval = sPath.split("/")[2];
						interval = parseInt(interval, 32);
						operations.splice(interval, 1);
						selectedOps.splice(i, 1);
					}
					operationsTbl.clearSelection();
					operationsTbl.rerender();
					oWorkOrderDetailViewModel.setProperty("/selectedOps", selectedOps);
					oWorkOrderDetailViewModel.setProperty("/Activity", "");
					oWorkOrderDetailViewModel.setProperty("/operationLongTxt", "");
					oWorkOrderDetailViewModel.setProperty("/enableOperationComment", false);
					oWorkOrderDetailViewModel.setProperty("/confirmationLongText", "");
					oWorkOrderDetailModel.refresh(true);
					this.getOperationIdLookup();
				}
			}
		},

		//Function to get selected Icon tab filter in Spare part pop-up
		getSelectedIconTab: function (oEvent) {
			var selectedKey = oEvent;
			if (oEvent !== "BOM") {
				selectedKey = oEvent.getSource().getSelectedKey();
			}
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			switch (selectedKey) {
			case "BOM":
				oWorkOrderDetailViewModel.setProperty("/setSearchLayVisible", false);
				var equipId = this.oWorkOrderDetailModel.getProperty("/Equipment");
				var prevEquipId = oWorkOrderDetailViewModel.getProperty("/prevEquipId");
				var aBOMsList = oWorkOrderDetailViewModel.getProperty("/aBOMsList");
				if (equipId) {
					if (equipId !== prevEquipId) {
						this.getMaterialsList("", equipId);
					} else {
						oWorkOrderDetailViewModel.setProperty("/aMaterialsList", aBOMsList);
					}
				}
				oWorkOrderDetailViewModel.setProperty("/selectedMaterials", []);
				sap.ui.getCore().byId("MYLAN_MATERIALS_SEARCH_TBL").clearSelection();
				break;
			case "SEARCH":
				var aSearchMatList = oWorkOrderDetailViewModel.getProperty("/aSearchMatList");
				oWorkOrderDetailViewModel.setProperty("/aMaterialsList", aSearchMatList);
				oWorkOrderDetailViewModel.setProperty("/selectedMaterials", []);
				oWorkOrderDetailViewModel.setProperty("/setSearchLayVisible", true);
				sap.ui.getCore().byId("MYLAN_MATERIALS_SEARCH_TBL").clearSelection();
				break;
			case "FREQ_USED":
				var fEquipId = this.oWorkOrderDetailModel.getProperty("/Equipment");
				var fPrevEquipId = oWorkOrderDetailViewModel.getProperty("/prevEquipId");
				var aFrequentlyUsedList = oWorkOrderDetailViewModel.getProperty("/aFrequentlyUsedList");
				if (!aFrequentlyUsedList) {
					this.getMaterialsList("", fEquipId, true);
				}
				if (fEquipId) {
					if (fEquipId !== fPrevEquipId) {
						this.getMaterialsList("", fEquipId, true);
					} else {
						oWorkOrderDetailViewModel.setProperty("/aFrequentlyUsedList", aFrequentlyUsedList);
					}
				}
				oWorkOrderDetailViewModel.setProperty("/setSearchLayVisible", false);
				oWorkOrderDetailViewModel.setProperty("/aMaterialsList", aFrequentlyUsedList);
				oWorkOrderDetailViewModel.setProperty("/selectedMaterials", []);
				sap.ui.getCore().byId("MYLAN_MATERIALS_SEARCH_TBL").clearSelection();
				break;
			}
			oWorkOrderDetailViewModel.refresh(true);
		},

		//Function to open spare parts pop-up
		openSparePartDialog: function () {
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var operations = oWorkOrderDetailModel.getProperty("/HEADERTOOPERATIONSNAV");
			if (!operations || operations.length === 0) {
				this.showMessage(this.oResourceModel.getText("plsaddanoprntoaddspart"));
				return;
			}
			if (!this.adSparePartsDialog) {
				this.adSparePartsDialog = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.addSparePart", this);
				this.getView().addDependent(this.adSparePartsDialog);
			}
			this.oWorkOrderDetailViewModel.setProperty("/selectedMaterials", []);
			this.adSparePartsDialog.getContent()[0].setSelectedKey("BOM");
			this.getSelectedIconTab("BOM");
			this.adSparePartsDialog.open();
		},

		//Function to add materials to spare parts table after material search
		onSelectMaterials: function (oEvent) {
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var rowContext = oEvent.getParameters().rowContext;
			if (!rowContext) {
				return;
			}
			var oSelectedMaterials = oWorkOrderDetailViewModel.getProperty("/selectedMaterials");
			if (!oSelectedMaterials) {
				oSelectedMaterials = [];
			}
			var oSelectedRow = rowContext.getPath();
			var bVal = this.isOperationSelected(oSelectedRow, oSelectedMaterials);
			if (bVal[0]) {
				oSelectedMaterials.splice(bVal[1], 1);
			} else {
				var oTempObj = {
					sPath: oSelectedRow
				};
				oSelectedMaterials.push(oTempObj);
			}
			oWorkOrderDetailViewModel.setProperty("/selectedMaterials", oSelectedMaterials);
			oWorkOrderDetailViewModel.refresh();
		},

		//Function to add materials to spare parts table after material search
		addMaterialstoSpareParts: function () {
			var oArry = [];
			var duplicateParts = [];
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var oSelectedMaterials = oWorkOrderDetailViewModel.getProperty("/selectedMaterials");
			var spareParts = oWorkOrderDetailModel.getProperty("/HEADERTOCOMPONENTNAV");
			var userPlant = this.oUserDetailModel.getProperty("/userPlant");
			if (!spareParts) {
				spareParts = [];
			}
			if (!oSelectedMaterials) {
				oSelectedMaterials = [];
				this.showMessage(this.oResourceModel.getText("selspartstobeadded"));
				return;
			}
			for (var i = 0; i < oSelectedMaterials.length; i++) {
				var material = oWorkOrderDetailViewModel.getProperty(oSelectedMaterials[i].sPath);
				//var bVal = this.isMaterialAddedToSparepart(material, spareParts);
				var bVal = false;
				if (!bVal) {
					var oTempObj = {
						"ReservNo": "",
						"ActivityOperation": "",
						"Material": material.Material,
						"MatlDesc": material.MaterialDesc,
						"StgeLoc": material.StorLocId,
						"OutQtyOrd": material.OutstandingQty,
						"StockAvail": material.CurrentStock,
						"Plant": userPlant,
						"RequirementQuantity": "",
						"ItemCat": "L",
						"RequirementQuantityUnit": material.Uom,
						"CompCode": "C",
						"bin": material.BinNo,
						"IssueQty": "0",
						"returnQty": "0",
						"MinStockReq": material.MinSafetyStock
					};
					oArry.push(oTempObj);
				} else {
					duplicateParts.push(material);
				}
			}
			if (duplicateParts.length) {
				this.showDuplicateMaterialsNotAdded(duplicateParts);
			}
			var otempArr = [];
			if (!spareParts) {
				otempArr = oArry;
			} else {
				otempArr = spareParts.concat(oArry);
			}
			oWorkOrderDetailModel.setProperty("/HEADERTOCOMPONENTNAV", otempArr);
			oWorkOrderDetailModel.refresh();
			this.adSparePartsDialog.close();
		},

		//Function to show Duplicate materials not added to Spare parts pop-up
		showDuplicateMaterialsNotAdded: function (oArray) {
			var that = this;
			var oResourceModel = this.oResourceModel;
			var oMessage = oResourceModel.getText("COULDNT_ADD_MATERIALS");
			for (var i = 0; i < oArray.length; i++) {
				var material = oArray[i].Material;
				oMessage = oMessage + material;
				if (i !== oArray.length - 1) {
					oMessage = oMessage + ", ";
				}
			}
			oMessage = oMessage + " " + oResourceModel.getText("AS_THEY_HAVE_BEEN_ALREADY_ADDED");
			this.MessageBox.warning(oMessage, {
				icon: "WARNING",
				title: "Warning",
				actions: [sap.m.MessageBox.Action.OK],
				onClose: function (oAction) {
					that.adSparePartsDialog.close();
				}
			});
		},

		//Function to check if same material is added to spare part
		isMaterialAddedToSparepart: function (material, spareParts) {
			var isMaterialExist = false;
			spareParts.filter(function (obj, i) {
				if (obj.Material === material.Material) {
					isMaterialExist = true;
				}
			});
			return isMaterialExist;
		},

		//Function to clear material search data with parameters in pop-up
		onClearMaterialSearch: function () {
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			oWorkOrderDetailViewModel.setProperty("/sapId", "");
			oWorkOrderDetailViewModel.setProperty("/supplier", "");
			oWorkOrderDetailViewModel.setProperty("/supplierPartno", "");
			oWorkOrderDetailViewModel.setProperty("/mfgPartNo", "");
			oWorkOrderDetailViewModel.setProperty("/mfgPartDesc", "");
			oWorkOrderDetailViewModel.setProperty("/aMaterialsList", []);
			oWorkOrderDetailViewModel.setProperty("/selectedMaterials", []);
			oWorkOrderDetailViewModel.refresh(true);
			sap.ui.getCore().byId("MYLAN_MATERIALS_SEARCH_TBL").clearSelection();
		},

		//Function to close Material search pop-up
		onCloseSpareParts: function () {
			this.adSparePartsDialog.close();
		},

		//Function to Select/Un-select Spare part
		onSelectSparePart: function (oEvent) {
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var rowContext = oEvent.getParameters().rowContext;
			if (!rowContext) {
				return;
			}
			var oSelectedRow = rowContext.getPath();
			var selectedSpareParts = oWorkOrderDetailViewModel.getProperty("/selectedSpareParts");
			if (!selectedSpareParts) {
				selectedSpareParts = [];
			}
			var bVal = this.isSparePartSelected(oSelectedRow, selectedSpareParts);
			if (bVal[0]) {
				selectedSpareParts.splice(bVal[1], 1);
			} else {
				var oTempObj = {
					sPath: oSelectedRow
				};
				selectedSpareParts.push(oTempObj);
			}
			if (selectedSpareParts.length === 1) {
				this.fnCheckOperationStatus(selectedSpareParts);
			} else {
				oWorkOrderDetailViewModel.setProperty("/enableIssuePartBtn", false);
				oWorkOrderDetailViewModel.setProperty("/enableReturnPartBtn", false);
			}
			oWorkOrderDetailViewModel.setProperty("/selectedSpareParts", selectedSpareParts);
			oWorkOrderDetailViewModel.refresh(true);
		},

		//Function to enable Issue/Return button from Operation status
		fnCheckOperationStatus: function (selectedSpare) {
			var operationStatus = "";
			var sPath = selectedSpare[0].sPath;
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var oSparePart = oWorkOrderDetailModel.getProperty(sPath);
			var spareMovement = oSparePart.Movement;
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var operations = oWorkOrderDetailModel.getProperty("/HEADERTOOPERATIONSNAV");
			var oSelOperationId = oSparePart.ActivityOperation;
			operations.filter(function (obj) {
				if (obj.Activity === oSelOperationId) {
					operationStatus = obj.systemstatustext;
				}
			});
			if (operationStatus === "REL" || operationStatus === "PCNF") {
				if (!spareMovement) {
					oWorkOrderDetailViewModel.setProperty("/enableIssuePartBtn", true);
					oWorkOrderDetailViewModel.setProperty("/enableReturnPartBtn", true);
				} else {
					oWorkOrderDetailViewModel.setProperty("/enableIssuePartBtn", false);
					oWorkOrderDetailViewModel.setProperty("/enableReturnPartBtn", false);
				}

			} else {
				oWorkOrderDetailViewModel.setProperty("/enableIssuePartBtn", false);
				oWorkOrderDetailViewModel.setProperty("/enableReturnPartBtn", false);
			}
		},

		//Function top check if an Spare part is already selected, else un-select the operation
		isSparePartSelected: function (oSelectedRow, selectedSpareParts) {
			var bVal = [false];
			selectedSpareParts.filter(function (obj, index) {
				if (obj.sPath === oSelectedRow) {
					bVal = [true, index];
				}
			});
			return bVal;
		},

		//Function to delete Spare Parts for a selected Operation
		onDeleteSpareParts: function () {
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var sparePartTbl = this.getView().byId("MYLAN_OP_SPARE_PART_TBL");
			var selectedSpareParts = oWorkOrderDetailViewModel.getProperty("/selectedSpareParts");
			var spareParts = oWorkOrderDetailModel.getProperty("/HEADERTOCOMPONENTNAV");
			var copySpareParts = jQuery.extend(true, [], spareParts);

			if (selectedSpareParts.length === 0 || !spareParts || spareParts.length === 0) {
				this.showMessage(this.oResourceModel.getText("plsselspartstoberemoved"));
			} else {
				var bVal = this.fnCheckSparePartsStatus(selectedSpareParts);
				if (bVal) {
					for (var i = selectedSpareParts.length - 1; i >= 0; i--) {
						var sPath = selectedSpareParts[i].sPath;
						var interval = sPath.split("/")[2];
						copySpareParts.splice(interval, 1);
						interval = parseInt(interval, 32);
						sparePartTbl.removeSelectionInterval(interval, interval);
						selectedSpareParts.splice(i, 1);
					}
				}
			}
			oWorkOrderDetailModel.setProperty("/HEADERTOCOMPONENTNAV", copySpareParts);
			this.fnClearTblSelection();
		},

		//Function to check if an operation is in Created status else dont delete the operations
		fnCheckSparePartsStatus: function (spareParts) {
			var bVal = false;
			var oldParts = [];
			var oNewParts = [];
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			for (var i = 0; i < spareParts.length; i++) {
				var obj = oWorkOrderDetailModel.getProperty(spareParts[i].sPath);
				var compCode = obj.CompCode;
				var material = obj.Material;
				if (compCode === "" || compCode === "C") {
					oNewParts.push(material);
				} else {
					oldParts.push(material);
				}
			}
			if (oldParts.length > 0) {
				this.fnDelteOnlyUnsavedSpareParts(oldParts);
			} else {
				bVal = true;
			}
			return bVal;
		},

		//Function to show message that saved spare parts cannot be delete
		fnDelteOnlyUnsavedSpareParts: function (spareParts) {
			var message = "";
			var materialId = "";
			var oResourceModel = this.oResourceModel;
			if (spareParts) {
				if (spareParts.length === 1) {
					materialId = spareParts.join("");
					message = oResourceModel.getText("MATERIAL") + materialId + " " + oResourceModel.getText("CANT_BE_REMOVED_AS_IT_IS_SAVED");
				} else if (spareParts.length > 1) {
					materialId = spareParts.join(", ");
					message = oResourceModel.getText("MATERIALS") + materialId + " " + oResourceModel.getText("CANT_BE_REMOVED_AS_THEY_SAVED");
				}
			}
			this.showMessage(message, "W");
		},

		//Function to update Spare part count to Operations table
		onUpdateSpareCount: function (oEvent) {
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var selRow = oEvent.getSource().getBindingContext("oWorkOrderDetailModel");
			selRow = selRow.getPath();
			var index = selRow.split("/")[2];
			index = parseInt(index, 10);
			var selObj = oWorkOrderDetailModel.getProperty(selRow);
			var operation = selObj.ActivityOperation;
			var material = selObj.Material;
			var bVal = this.fnCheckIsMaterialAssignedSameOp(operation, material, index);
			if (bVal[0] === true) {
				oWorkOrderDetailModel.setProperty(selRow + "/ActivityOperation", "");
				this.showMessage(this.oResourceModel.getText("matalreadyasstooprnmsg", [material, operation]));
			} else {
				this.fnComponentUpdateStatus(oEvent, true);
			}
			oWorkOrderDetailModel.refresh(true);
		},

		//Function to check if an Operation is set for second time for same material
		fnCheckIsMaterialAssignedSameOp: function (operation, material, index) {
			var bVal = false;
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var materials = oWorkOrderDetailModel.getProperty("/HEADERTOCOMPONENTNAV");
			for (var i = 0; i < materials.length; i++) {
				if (index !== i) {
					var cMaterial = materials[i];
					if (cMaterial.ActivityOperation === operation && cMaterial.Material === material) {
						bVal = [true, i];
						break;
					}
				}
			}
			return bVal;
		},

		changeCompletedDate: function (operations) {
			for (var i = 0; i < operations.length; i++) {
				var CompletedOn = operations[i].CompletedOn;
				if (typeof (CompletedOn) === "string") {
					CompletedOn = CompletedOn;
				} else {
					CompletedOn = formatter.fnDateConversion(CompletedOn, true);
					CompletedOn = CompletedOn + "T00:00:00";
				}
				operations[i].CompletedOn = CompletedOn;
			}
			return operations;
		},

		//Function to set visible/enable of comments section [View: WorkOrder Detail]
		setCommentsVisibleLayout: function (oEvent) {
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			util.setCommentsVisibleLayout(oEvent, oWorkOrderDetailViewModel);
		},

		//Function to get Operation's previous state of System Condition
		getPreviousSysCondtState: function (selectedOperation) {
			var sysCondition = "";
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var operationBackUp = oWorkOrderDetailViewModel.getProperty("/operationBackUp");
			if (operationBackUp) {
				for (var i = 0; i < operationBackUp.length; i++) {
					if (operationBackUp[i].Activity === selectedOperation.Activity) {
						var systcond = operationBackUp[i].Systcond;
						if (!systcond) {
							systcond = "Null";
						}
						return systcond;
					}
				}
			} else {
				return "Null";
			}
			return sysCondition;
		},

		//Function to update System condition status text for an Operation
		fnUpdateSystcondShortTxt: function (oEvent) {
			var oSource = oEvent.getSource();
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var sPath = oSource.getBindingContext("oWorkOrderDetailModel").getPath();
			var currObj = oWorkOrderDetailModel.getProperty(sPath);
			var presentSysCond = currObj.Systcond;
			var previousSysCond = this.getPreviousSysCondtState(currObj);
			var shortTxt = this.oResourceModel.getText("SC_CHANGED_FROM") + previousSysCond + " to " + presentSysCond;
			currObj.ConfShortText = shortTxt;
			oWorkOrderDetailModel.setProperty(sPath, currObj);
			oWorkOrderDetailModel.refresh();
			this.fnOperationUpdateStatus(oEvent);
		},

		//Function to check if an Operation is already saved before confirmation
		fnCheckOperationIsChecked: function (operation) {
			var bVal = [true];
			var operCode = operation.OperCode;
			var operationId = operation.Activity;
			var systemStatus = operation.systemstatustext;
			if (systemStatus === "" && operCode === "C") {
				bVal = [false, operationId, "CREATE"];
			} else if (systemStatus === "CNF") {
				bVal = [false, operationId, "CNF"];
			} else {
				bVal = [true];
			}
			return bVal;
		},

		//Function to partially Confirm an Operation for a WO
		fnConfirmOperation: function (oEvent) {
			var oTempArr = [];
			var unSavedOps = [];
			var confOpsArr = [];
			var oOperationsList = [];
			var oResourceModel = this.oResourceModel;
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var oSelectedOps = oWorkOrderDetailViewModel.getProperty("/selectedOps");
			if (oSelectedOps.length === 0) {
				this.showMessage(oResourceModel.getText("plsseloprnstoconfirm"));
				return;
			}
			for (var i = 0; i < oSelectedOps.length; i++) {
				var obj = oWorkOrderDetailModel.getProperty(oSelectedOps[i].sPath);
				var isVal = this.fnCheckOperationIsChecked(obj);
				if (isVal[0] === true) {
					if (obj.OperCode !== "C") {
						obj.OperCode = "U";
					}
					oTempArr.push(obj);
					oOperationsList.push(obj);
				} else if (isVal[0] === false && isVal[2] === "CREATE") {
					unSavedOps.push(isVal[1]);
				} else if (isVal[0] === false && isVal[2] === "CNF") {
					confOpsArr.push(isVal[1]);
				}
			}

			if (unSavedOps.length > 0 && confOpsArr.length > 0) {
				this.fnShowUnsavedOpsMessage(unSavedOps, confOpsArr);
			} else if (unSavedOps.length > 0) {
				this.fnShowUnsavedOpsMessage(unSavedOps, "");
			} else if (confOpsArr.length > 0) {
				this.fnShowUnsavedOpsMessage("", confOpsArr);
			} else {
				var bVal = this.onMandateOperationSCStatus(oTempArr);
				if (bVal) {
					this.oWorkOrderDetailViewModel.setProperty("/confirmOperations", oOperationsList);
					this.onCreateUpdateAndExitWO(oEvent);
				}
			}
		},

		//Function to get Operation's confirmation long text
		getConfirmLongText: function (operations, orderId) {
			var oTempArr = [];
			var oUserDetailModel = this.oUserDetailModel;
			var userFullName = oUserDetailModel.getProperty("/fullName");
			var userName = oUserDetailModel.getProperty("/userName");
			for (var i = 0; i < operations.length; i++) {
				if (operations[i].ConfLongText) {
					var obj = {
						operationComments: operations[i].ConfLongText,
						operationId: operations[i].Activity,
						userName: userFullName,
						userId: userName,
						woId: orderId
					};
					oTempArr.push(obj);
				}
			}
			var oTempObj = {
				listOperationCommentsDto: oTempArr
			};
			return oTempObj;
		},

		//Function to show warning message for not confirming unsaved operations
		fnShowUnsavedOpsMessage: function (unSavedOps, confOpsArr) {
			var message = "";
			var operationsId = "";
			var oResourceModel = this.oResourceModel;
			if (unSavedOps) {
				if (unSavedOps.length === 1) {
					operationsId = unSavedOps.join("");
					message = oResourceModel.getText("UPDATE_WO_TO_CONFIRM_OPERATION") + operationsId;
				} else if (unSavedOps.length > 1) {
					operationsId = unSavedOps.join(", ");
					message = oResourceModel.getText("UPDATE_WO_TO_CONFIRM_OPERATIONS") + operationsId;
				}
			} else if (confOpsArr) {
				if (confOpsArr.length === 1) {
					operationsId = confOpsArr.join("");
					message = oResourceModel.getText("UNCHECK_OPERATION") + operationsId + " " + oResourceModel.getText(
						"AS_IT_IS_ALREADY_FINAL_CONFIRMED");
				} else if (confOpsArr.length > 1) {
					operationsId = confOpsArr.join(", ");
					message = oResourceModel.getText("UNCHECK_OPERATIONS") + operationsId + " " + oResourceModel.getText(
						"AS_IT_IS_ALREADY_FINAL_CONFIRMED");
				}
			}
			this.MessageBox.warning(message, {
				icon: "WARNING",
				title: "Warning",
				actions: [sap.m.MessageBox.Action.OK]
			});
		},

		//Function to fully Confirm an Operations for a WO
		fnFullyConfirmOperation: function (oEvent) {
			var oTempArr = [];
			var unSavedOps = [];
			var confOpsArr = [];
			var oOperationsList = [];
			var oResourceModel = this.oResourceModel;
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var oSelectedOps = oWorkOrderDetailViewModel.getProperty("/selectedOps");
			if (oSelectedOps.length === 0) {
				this.showMessage(oResourceModel.getText("plsseloprnstoconfirm"));
				return;
			}
			for (var i = 0; i < oSelectedOps.length; i++) {
				var obj = oWorkOrderDetailModel.getProperty(oSelectedOps[i].sPath);
				var isVal = this.fnCheckOperationIsChecked(obj);
				if (isVal[0] === true) {
					if (obj.OperCode !== "C") {
						obj.OperCode = "U";
					}
					oTempArr.push(obj);
					oOperationsList.push(obj);
				} else if (isVal[0] === false && isVal[2] === "CREATE") {
					unSavedOps.push(isVal[1]);
				} else if (isVal[0] === false && isVal[2] === "CNF") {
					confOpsArr.push(isVal[1]);
				}
			}
			if (unSavedOps.length > 0 && confOpsArr.length > 0) {
				this.fnShowUnsavedOpsMessage(unSavedOps, confOpsArr);
			} else if (unSavedOps.length > 0) {
				this.fnShowUnsavedOpsMessage(unSavedOps, "");
			} else if (confOpsArr.length > 0) {
				this.fnShowUnsavedOpsMessage("", confOpsArr);
			} else {
				var bVal = this.onMandateOperationSCStatus(oTempArr);
				if (bVal) {
					this.oWorkOrderDetailViewModel.setProperty("/confirmOperations", oOperationsList);
					this.onCreateUpdateAndExitWO(oEvent);
				}
			}
		},

		//Function to mandate System condition on Operation Confirm
		onMandateOperationSCStatus: function (operations) {
			var bVal = false;
			var oErrorMsg = "";
			var myWorkAr = [];
			var sysCondArr = [];
			var sysCond1Arr = [];
			var sysCond0Arr = [];

			for (var j = 0; j < operations.length; j++) {
				var myWork = operations[j].MyWork;
				var systcond = operations[j].Systcond;
				var operationId = operations[j].Activity;
				if (!myWork) {
					myWorkAr.push(operationId);
				} else if (!systcond) {
					sysCondArr.push(operationId);
				} else if (systcond === "1") {
					sysCond1Arr.push(operationId);
				} else if (systcond === "0") {
					sysCond0Arr.push(operationId);
				}
			}
			var oResourceModel = this.oResourceModel;
			if (myWorkAr.length === 1) {
				operationId = myWorkAr.join("");
				oErrorMsg = oResourceModel.getText("plsentermyworkforoprn", [operationId]);
				bVal = false;
			} else if (myWorkAr.length > 1) {
				operationId = myWorkAr.join(", ");
				oErrorMsg = oResourceModel.getText("plsentermyworkforoprns", [operationId]);
				bVal = false;
			} else if (sysCondArr.length === 1) {
				operationId = sysCondArr.join("");
				oErrorMsg = oResourceModel.getText("syscondnstatcantbeemptyforoprn", [operationId]);
				bVal = false;
			} else if (sysCondArr.length > 1) {
				operationId = sysCondArr.join(", ");
				oErrorMsg = oResourceModel.getText("syscondnstatcantbeemptyforoprns", [operationId]);
				bVal = false;
			} else if (sysCond1Arr.length === 1) {
				operationId = sysCond1Arr.join("");
				// oErrorMsg = oResourceModel.getText("syscondnstatuscantbe1foroprn", [operationId]);
				bVal = true;
				// bVal = false;
			} else if (sysCond1Arr.length > 1) {
				operationId = sysCond1Arr.join(", ");
				// oErrorMsg = oResourceModel.getText("syscondnstatuscantbe1foroprns", [operationId]);
				// bVal = false;
				bVal = true;
			} else if (sysCond0Arr.length === 1) {
				operationId = sysCond0Arr.join("");
				// oErrorMsg = this.oResourceModel.getText("syscondnstatuscantbe0foroprn", [operationId]);
				// bVal = false;
				bVal = true;
			} else if (sysCond0Arr.length > 1) {
				operationId = sysCond0Arr.join(", ");
				// oErrorMsg = this.oResourceModel.getText("syscondnstatuscantbe0foroprns", [operationId]);
				// bVal = false;
				bVal = true;
			} else {
				bVal = true;
			}
			this.showMessage(oErrorMsg);
			return bVal;
			// return true;
		},

		//Function to open Notification list pop-up
		onOpenNotificationPopup: function () {
			if (!this.notificationsList) {
				this.notificationsList = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.notificationsList", this);
				this.getView().addDependent(this.notificationsList);
			}
			sap.ui.getCore().byId("WO_DETAIL_NOTIF_TBL").clearSelection();
			this.oWorkOrderDetailViewModel.setProperty("/selectedNotifications", []);
			this.notificationsList.open();
			this.getNotificationList("");
		},

		//Function to close Notification list pop-up
		onCloseNotificationPopup: function () {
			this.notificationsList.close();
			this.busy.close();
		},

		//Function to get selected notifications from Notifications popup
		onSelectNotifications: function (oEvent) {
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var rowContext = oEvent.getParameters().rowContext;
			if (!rowContext) {
				return;
			}
			var oSelectedNotifications = oWorkOrderDetailViewModel.getProperty("/selectedNotifications");
			if (!oSelectedNotifications) {
				oSelectedNotifications = [];
			}
			var oSelectedRow = rowContext.getPath();
			var bVal = this.isNotificationSelected(oSelectedRow, oSelectedNotifications);
			if (bVal[0]) {
				oSelectedNotifications.splice(bVal[1], 1);
			} else {
				var oTempObj = {
					sPath: oSelectedRow
				};
				oSelectedNotifications.push(oTempObj);
			}
			oWorkOrderDetailViewModel.setProperty("/selectedNotifications", oSelectedNotifications);
			oWorkOrderDetailViewModel.refresh();

		},

		//Function top check if an notification is already selected, else un-select the operation
		isNotificationSelected: function (oSelectedRow, selectedNotification) {
			var bVal = [false];
			selectedNotification.filter(function (obj, index) {
				if (obj.sPath === oSelectedRow) {
					bVal = [true, index];
				}
			});
			return bVal;
		},

		//Function to add selceted notifications to a Work Order
		onAddNotifications: function () {
			var oTempArr = [];
			var dupArrays = [];
			var oResourceModel = this.oResourceModel;
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var oNotifications = oWorkOrderDetailModel.getProperty("/HEADERTONOTIFNAV");
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var oSelectedNotifications = oWorkOrderDetailViewModel.getProperty("/selectedNotifications");
			for (var i = 0; i < oSelectedNotifications.length; i++) {
				var sPath = oSelectedNotifications[i].sPath;
				var oSelectedObj = oWorkOrderDetailViewModel.getProperty(sPath);

				var reqStartDate = oSelectedObj.Reqstartdate;
				var reqEndDate = oSelectedObj.Reqenddate;
				if ((reqStartDate === "00000000" && reqEndDate === "00000000") || (reqStartDate === "" && reqEndDate === "") || (reqStartDate ===
						undefined && reqEndDate === undefined) || (reqStartDate === null && reqEndDate === null)) {
					reqStartDate = new Date();
					reqEndDate = new Date();
				} else if (reqStartDate === "00000000" || reqStartDate === "" || reqStartDate === undefined || reqStartDate === null) {
					reqStartDate = reqEndDate;
					reqStartDate = formatter.formatReqStartEndDate(reqStartDate);
					reqEndDate = formatter.formatReqStartEndDate(reqEndDate);
				} else if (reqEndDate === "00000000" || reqEndDate === "" || reqEndDate === undefined || reqEndDate === null) {
					reqStartDate = formatter.formatReqStartEndDate(reqStartDate);
					reqEndDate = new Date();
				} else {
					reqStartDate = formatter.formatReqStartEndDate(reqStartDate);
					reqEndDate = formatter.formatReqStartEndDate(reqEndDate);
				}

				var obj = {};
				obj.NotifNo = oSelectedObj.NotifNo;
				obj.Reportedby = oSelectedObj.Reportedby;
				obj.ShortText = oSelectedObj.ShortText;
				obj.LongText = oSelectedObj.LongText;
				obj.Breakdown = oSelectedObj.Breakdown;
				obj.Desstdate = reqStartDate;
				obj.Desenddate = reqEndDate;
				obj.NotifStatus = "NEW";
				if (this.fnValidateDuplciateNotifs(oSelectedObj.NotifNo, oNotifications)) {
					oTempArr.push(obj);
				} else {
					dupArrays.push(oSelectedObj.NotifNo);
				}
			}

			if (dupArrays.length) {
				var oMessage = "";
				if (dupArrays.length === 1) {
					dupArrays = dupArrays.join("");
					oMessage = oResourceModel.getText("DUPLICATE_NOTIFICATION") + dupArrays + " " + oResourceModel.getText("NOT_ADDED");
				} else {
					dupArrays = dupArrays.join(",");
					oMessage = oResourceModel.getText("DUPLICATE_NOTIFICATION") + dupArrays + " " + oResourceModel.getText("NOT_ADDED");
				}
				this.showMessage(oMessage);
			}
			oNotifications = oNotifications.concat(oTempArr);
			oWorkOrderDetailModel.setProperty("/HEADERTONOTIFNAV", oNotifications);
			oWorkOrderDetailModel.refresh();
			this.onCloseNotificationPopup();
		},

		//Function to validte is duplicate Notifications are added
		fnValidateDuplciateNotifs: function (notifId, oNotifications) {
			var bVal = true;
			var length = oNotifications.length;
			for (var i = 0; i < length; i++) {
				var currNotifId = oNotifications[i].NotifNo;
				if (currNotifId === notifId) {
					bVal = false;
				}
			}
			return bVal;
		},

		//Function to open Notification list pop-up
		onOpenMassUpdatePopup: function () {
			var oResourceModel = this.oResourceModel;
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var selectedOps = oWorkOrderDetailViewModel.getProperty("/selectedOps");
			if (selectedOps) {
				if (selectedOps.length > 0) {
					var oTempArr = [];
					var unSavedOps = [];
					var confOpsArr = [];
					for (var i = 0; i < selectedOps.length; i++) {
						var obj = oWorkOrderDetailModel.getProperty(selectedOps[i].sPath);
						var isVal = this.fnCheckOperationIsChecked(obj);
						if (isVal[0] === true) {
							if (obj.OperCode !== "C") {
								obj.OperCode = "U";
							}
							oTempArr.push(obj);
						} else if (isVal[0] === false && isVal[2] === "CREATE") {
							unSavedOps.push(isVal[1]);
						} else if (isVal[0] === false && isVal[2] === "CNF") {
							confOpsArr.push(isVal[1]);
						}
					}
					if (unSavedOps.length > 0 && confOpsArr.length > 0) {
						this.fnShowUnsavedOpsMessage(unSavedOps, confOpsArr);
					} else if (unSavedOps.length > 0) {
						this.fnShowUnsavedOpsMessage(unSavedOps, "");
					} else if (confOpsArr.length > 0) {
						this.fnShowUnsavedOpsMessage("", confOpsArr);
					} else {
						if (!this.massUpdatePopup) {
							this.massUpdatePopup = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.operationMassUpdate", this);
							this.getView().addDependent(this.massUpdatePopup);
						}
						oWorkOrderDetailViewModel.refresh(true);
						this.massUpdatePopup.open();
					}
				} else {
					this.showMessage(oResourceModel.getText("plsselectoprnstomassupdate"));
				}
			} else {
				this.showMessage(oResourceModel.getText("plsselectoprnstomassupdate"));
			}
		},

		//Function to close mass operations pop-up
		onCloseMassUpdatePopup: function () {
			this.massUpdatePopup.close();
		},

		//Function to mass update operations
		onMassUpdateOperations: function () {
			var oResourceModel = this.oResourceModel;
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var selectedOps = oWorkOrderDetailViewModel.getProperty("/selectedOps");

			var completedOn = oWorkOrderDetailViewModel.getProperty("/currentDate");
			var totatlLbrHrs = oWorkOrderDetailViewModel.getProperty("/totalLabourHrs");
			var systemCondition = oWorkOrderDetailViewModel.getProperty("/systCondition");
			var opLongTxt = oWorkOrderDetailViewModel.getProperty("/updateOperationLongTxt");
			if (!totatlLbrHrs) {
				this.showMessage(oResourceModel.getText("plsentertotallabhrs"));
				return;
			}
			totatlLbrHrs = parseFloat(totatlLbrHrs);
			if (!systemCondition) {
				this.showMessage(oResourceModel.getText("plsselsyscondn"));
				return;
			}

			var individualHrs = totatlLbrHrs / selectedOps.length;
			individualHrs = parseFloat(individualHrs).toFixed(2);
			individualHrs = individualHrs.toString();

			for (var j = 0; j < selectedOps.length; j++) {
				var sPath = selectedOps[j].sPath;
				var obj = oWorkOrderDetailModel.getProperty(sPath);
				var previousSysCond = obj.Systcond;
				var confShortText = "";
				if (!previousSysCond) {
					previousSysCond = "Null";
				}
				confShortText = oResourceModel.getText("SC_CHANGED_FROM") + previousSysCond + " to " + systemCondition;
				obj.MyWork = individualHrs;
				obj.CompletedOn = completedOn;
				obj.Systcond = systemCondition;
				obj.ConfShortText = confShortText;
				if (opLongTxt) {
					obj.ConfLongText = opLongTxt;
				}
				oWorkOrderDetailModel.setProperty(sPath, obj);
			}
			oWorkOrderDetailModel.refresh();
			this.onCloseMassUpdatePopup();
		},

		//Function to open Issue/Return spare pop-up
		onIssueReturnSparesPopup: function (oEvent) {
			var selctSingleSpareMsg = "";
			//var selctMultipleSpareMsg = "";
			var oSource = oEvent.getSource();
			var oResourceModel = this.oResourceModel;
			var btnType = oSource.getCustomData()[0].getValue();
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var selectedSpares = oWorkOrderDetailViewModel.getProperty("/selectedSpareParts");
			switch (btnType) {
			case "ISSUE_PART":
				selctSingleSpareMsg = oResourceModel.getText("SEL_SP_TO_ISSUE");
				//selctMultipleSpareMsg = "Please select one Spare part to Issue";
				oWorkOrderDetailViewModel.setProperty("/issueBtnVisible", true);
				oWorkOrderDetailViewModel.setProperty("/returnBtnVisible", false);
				oWorkOrderDetailViewModel.setProperty("/issueReturnDialogHeader", "Issue Spares");
				break;
			case "RETURN_PART":
				selctSingleSpareMsg = oResourceModel.getText("SEL_SPARE_PART_TO_RETURN");
				//selctMultipleSpareMsg = "Please select one Spare part to Return";
				oWorkOrderDetailViewModel.setProperty("/issueBtnVisible", false);
				oWorkOrderDetailViewModel.setProperty("/returnBtnVisible", true);
				oWorkOrderDetailViewModel.setProperty("/issueReturnDialogHeader", "Return Spares");
				break;
			}
			if (selectedSpares.length === 0) {
				this.showMessage(selctSingleSpareMsg);
				return;
			} else {
				var bVal = this.fnCheckIssueMaterialsStatus(selectedSpares, btnType);
				if (bVal === false) {
					return;
				}
				var materialQuantities = [];
				oWorkOrderDetailViewModel.setProperty("/DocDate", new Date());
				oWorkOrderDetailViewModel.setProperty("/PstngDate", new Date());
				var orderid = oWorkOrderDetailModel.getProperty("/Orderid");
				for (var i = 0; i < selectedSpares.length; i++) {
					var sPath = selectedSpares[i].sPath;
					var material = oWorkOrderDetailModel.getProperty(sPath + "/Material");
					var storageLogic = oWorkOrderDetailModel.getProperty(sPath + "/StgeLoc");
					var requiredQty = oWorkOrderDetailModel.getProperty(sPath + "/RequirementQuantity");
					var userPlant = this.oUserDetailModel.getProperty("/userPlant");
					var obj = {
						"Plant": userPlant,
						"Orderid": orderid,
						"Material": material,
						"StgeLoc": storageLogic,
						"EntryQnt": requiredQty,
						"Quantity": requiredQty
					};
					materialQuantities.push(obj);
				}
				oWorkOrderDetailViewModel.setProperty("/materialQuantities", materialQuantities);
				oWorkOrderDetailViewModel.refresh();
				if (!this.issueReturnSparesPopUp) {
					this.issueReturnSparesPopUp = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.issueReturnSpares", this);
					this.getView().addDependent(this.issueReturnSparesPopUp);
				}
				this.issueReturnSparesPopUp.open();
			}
		},

		//Function to check if materials can be issued
		fnCheckIssueMaterialsStatus: function (selectedSpares, type) {
			var msg = "";
			var matId = "";
			var bVal = false;
			var issueMats = [];
			var returnMats = [];
			var unSavedMats = [];
			var oResourceModel = this.oResourceModel;
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			for (var i = 0; i < selectedSpares.length; i++) {
				var sPath = selectedSpares[i].sPath;
				var material = oWorkOrderDetailModel.getProperty(sPath + "/Material");
				var withDrawn = oWorkOrderDetailModel.getProperty(sPath + "/Withdrawn");
				var compCode = oWorkOrderDetailModel.getProperty(sPath + "/CompCode");
				if (compCode === "C") {
					unSavedMats.push(material);
				} else if (compCode === "N" || compCode === "U") {
					if (withDrawn === false) {
						issueMats.push(material);
					} else if (withDrawn === true) {
						returnMats.push(material);
					}
				}
			}

			if (unSavedMats.length > 0) {
				var btnType = "";
				if (type === "RETURN_PART") {
					btnType = "Returning";
				} else {
					btnType = "Issuing";
				}
				if (unSavedMats.length === 1) {
					matId = unSavedMats.join("");
					msg = oResourceModel.getText("SAVE_SPARE_PART") + matId + " for " + btnType;
				} else if (unSavedMats.length > 1) {
					matId = unSavedMats.join(", ");
					msg = oResourceModel.getText("SAVE_SPARE_PART") + matId + " for " + btnType;
				}
				this.showMessage(msg, "W");
				bVal = false;
			} else {
				bVal = true;
			}
			return bVal;
		},

		//Function to close Issue/Return spare pop-up
		onCloseIssueReturnSparesPopUp: function () {
			this.issueReturnSparesPopUp.close();
		},

		//Function to issue spare parts
		onIssueReturnSpareParts: function (oEvent) {
			var oSource = oEvent.getSource();
			var btnType = oSource.getCustomData()[0].getValue();
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var orderid = oWorkOrderDetailModel.getProperty("/Orderid");
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;

			var documentDate = oWorkOrderDetailViewModel.getProperty("/DocDate");
			var postingDate = oWorkOrderDetailViewModel.getProperty("/PstngDate");
			var selectedSpares = oWorkOrderDetailViewModel.getProperty("/materialQuantities");
			var bVal = this.fnMandateIssueParts(documentDate, postingDate, selectedSpares);

			if (bVal) {
				var moveType = "";
				documentDate = formatter.formatDateobjToString(documentDate);
				postingDate = formatter.formatDateobjToString(postingDate);
				var oTempObj = {
					"PstngDate": postingDate,
					"DocDate": documentDate
				};

				switch (btnType) {
				case "ISSUE_PART":
					moveType = "261";
					oTempObj.GoodsMoveCode = "03";
					break;
				case "RETURN_PART":
					moveType = "262";
					oTempObj.GoodsMoveCode = "06";
					break;
				}
				for (var i = 0; i < selectedSpares.length; i++) {
					selectedSpares[i].EntryQnt = selectedSpares[i].Quantity;
					selectedSpares[i].MoveType = moveType;
				}
				oTempObj.GOODSNAV = selectedSpares;
				this.fnCreateIssuePart(oTempObj, btnType, orderid);
			} else {
				return;
			}
		},

		//Function to post Issue spare part
		fnCreateIssuePart: function (issuedSparePart, btnType, orderid) {
			var that = this;
			var oResourceModel = this.oResourceModel;
			this.busy.open();
			var sUrl = "/GoodsMoveHeaderSet";
			var oPortalNotifOData = this.oPortalNotifOData;
			oPortalNotifOData.setHeaders({
				"X-Requested-With": "X"
			});
			oPortalNotifOData.create(sUrl, issuedSparePart, {
				success: function (oData, reponse) {
					var message = JSON.parse(reponse.headers["sap-message"]).message;
					if (message === "") {
						if (btnType === "ISSUE_PART") {
							message = oResourceModel.getText("SP_ISSUED_SUSSCESSFULLY");
						} else if (btnType === "RETURN_PART") {
							message = oResourceModel.getText("SP_RETURNED_SUCCESSFULLY");
						}
					}
					that.fnGetWOHeaderDetailsCreateWO(orderid);
					that.fnClearTblSelection();
					that.onCloseIssueReturnSparesPopUp();
					that.showMessage(message);
					that.busy.close();
				},
				error: function (oData) {
					var successErr = "";
					if (btnType === "ISSUE_PART") {
						successErr = oResourceModel.getText("errinissspart");
					} else if (btnType === "RETURN_PART") {
						successErr = oResourceModel.getText("errinretspart");
					}
					that.showMessage(successErr);
					that.busy.close();
				}
			});

		},

		//Function to validate mandatory fields on Issue parts
		fnMandateIssueParts: function (documentDate, postingDate, materials) {
			var oResourceModel = this.oResourceModel;
			if (!documentDate) {
				this.showMessage(oResourceModel.getText("ENTER_DOCU_DATE"));
				return false;
			}
			if (!postingDate) {
				this.showMessage(oResourceModel.getText("ENTER_POSTING_DATE"));
				return false;
			}
			var isQtyMats = [];
			for (var i = 0; i < materials.length; i++) {
				var quatity = materials[i].Quantity;
				var materilId = materials[i].Material;
				if (quatity === "") {
					isQtyMats.push(materilId);
				}
			}
			if (isQtyMats.length === 0) {
				return true;
			} else {
				var msg = "";
				var matId = "";
				if (isQtyMats.length === 1) {
					matId = isQtyMats.join("");
					msg = oResourceModel.getText("ENTER_QTY_FOR_SP", [matId]);
				} else if (isQtyMats.length > 1) {
					matId = isQtyMats.join(", ");
					msg = oResourceModel.getText("ENTER_QTY_FOR_SP", [matId]);
				}
				this.showMessage(msg, "W");
				return false;
			}
		},

		//Function to get Equipment List and show in a pop-up
		equipmentValueHelp: function (oEvent) {
			if (!this.woEquipmentsList) {
				this.woEquipmentsList = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.woEquipmentsList", this);
				this.getView().addDependent(this.woEquipmentsList);
			}
			this.woEquipmentsList.open();
		},

		onCancelDialogEquip: function (oEvent) {
			this.woEquipmentsList.close();
		},

		//Function to select a Equipment and auto-populate Functional location
		onEquipSelect: function (oEvent) {
			var mLookupModel = this.mLookupModel;
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var oSource = oEvent.getParameter("listItem");
			var sPath = oSource.getBindingContextPath();
			var iEqId = mLookupModel.getProperty(sPath + "/Equnr");
			var iFunLoc = mLookupModel.getProperty(sPath + "/Tplnr");
			var equipDesc = mLookupModel.getProperty(sPath + "/Eqktu");
			var technicalId = mLookupModel.getProperty(sPath + "/Tidnr");
			var sWorkCenterSel = mLookupModel.getProperty(sPath + "/Gewrk");
			var sPlanGrpSel = mLookupModel.getProperty(sPath + "/Ingrp");
			var sCatelogProf = mLookupModel.getProperty(sPath + "/Rbnr");
			oWorkOrderDetailModel.setProperty("/Equipment", iEqId);
			oWorkOrderDetailModel.setProperty("/EquipDesc", equipDesc);
			oWorkOrderDetailModel.setProperty("/FunctLoc", iFunLoc);
			oWorkOrderDetailModel.setProperty("/Plangroup", sPlanGrpSel);
			this.oWorkOrderDetailViewModel.setProperty("/AssetId", technicalId);
			mLookupModel.setProperty("/sCatelogProf", sCatelogProf);
			var workCenterId = this.setEquipWorkCenter(sWorkCenterSel, mLookupModel);
			oWorkOrderDetailModel.setProperty("/MnWkCtr", workCenterId);
			this.fnFilterSlectedDamageGroup();
			this.fnFilterSlectedCauseGroup();
			this.woEquipmentsList.close();
			this.getEquipsAssmebly(iEqId);
		},

		//Function to search Fav equipments
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

		//Function to set Work center for a selected 
		setEquipWorkCenter: function (sWorkCenterSel, mLookupModel) {
			var workCenterId = "";
			var aWorkCenterSet = mLookupModel.getProperty("/aWorkCenterSet");
			aWorkCenterSet.filter(function (obj, i) {
				if (obj.ObjectId === sWorkCenterSel) {
					workCenterId = obj.WorkcenterId;
				}
			});
			return workCenterId;
		},

		/////////////////////////////////Attachments/Links/////////////////////////////////
		//Function to open pop-up for attaching WO link
		onOpenAttchWOlinkPopup: function (oEvent) {
			if (!this.attachWOLink) {
				this.attachWOLink = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.attachWOLink", this);
				this.getView().addDependent(this.attachWOLink);
			}
			this.attachWOLink.open();
		},

		//Function to close pop-up  of attaching WO link
		onCloseAttachLinkPopup: function (oEvent) {
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			oWorkOrderDetailViewModel.setProperty("/linkTitle", "");
			oWorkOrderDetailViewModel.setProperty("/linkAddress", "");
			this.attachWOLink.close();
		},

		//Function to attach link address for a WO
		onAttachWOLink: function () {
			var that = this;
			var oResourceModel = this.oResourceModel;
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var linkTitle = oWorkOrderDetailViewModel.getProperty("/linkTitle");
			var linkAddress = oWorkOrderDetailViewModel.getProperty("/linkAddress");
			var orderid = this.oWorkOrderDetailModel.getProperty("/Orderid");
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
					"OrderId": orderid,
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
					that.fnGetWOAttachmentLinks(orderid);
					that.onCloseAttachLinkPopup();
					that.busy.close();
				},
				error: function (oData) {
					that.busy.close();
				}
			});
		},

		//Function to upload document in attachment section
		onUploadAttachment: function (oEvent) {
			this.busy.open();
			var oSource = oEvent.getSource();
			var oFile = oEvent.getParameter("files")[0];
			var fileName = oFile.name.split(".")[0];
			var fileType = oFile.name.split(".")[1];

			var oPortalDataModel = this.oPortalDataModel;
			var orderId = this.oWorkOrderDetailModel.getProperty("/Orderid");
			var slug = orderId + ":" + fileName + ":" + fileType + ":" + "W"; // To differentiate notification and Work order.
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

		//Function to handle Success/Error status on upload of file
		onUploadComplete: function (oEvent) {
			var oResourceModel = this.oResourceModel;
			var statusCode = oEvent.getParameters().status;
			var orderId = this.oWorkOrderDetailModel.getProperty("/Orderid");
			if (statusCode === 201) {
				this.fnGetWOAttachmentLinks(orderId);
				this.showMessage(oResourceModel.getText("docuploadsuccess"));
			} else {
				this.showMessage(oResourceModel.getText("errinuploadfile"));
			}
			var oFileUploader = this.getView().byId("MYLAN_CREATE_WO_FILEUPLOADER");
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

		//Function to download attachment by Document ID
		getAttachmentIdForDownload: function (oEvent) {
			var oSource = oEvent.getSource();
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var orderId = oWorkOrderDetailViewModel.getProperty("/Orderid");
			var sPath = oSource.getBindingContext("oWorkOrderDetailViewModel").getPath();
			var fileType = oWorkOrderDetailViewModel.getProperty(sPath + "/AttachmentType");
			var documentId = oWorkOrderDetailViewModel.getProperty(sPath + "/DocumentId");
			var relType = oWorkOrderDetailViewModel.getProperty(sPath + "/DocName");
			if (fileType === "DOC" && documentId) {
				var oPortalDataModel = this.oPortalDataModel;
				var sericeUrl = oPortalDataModel.sServiceUrl;
				sericeUrl = sericeUrl + "/AttachmentSet(DocumentId='" + documentId + "',MIME_TYPE='x',RelType='" + relType +
					"',OrderId='',NotifId='')/$value";
				sap.m.URLHelper.redirect(sericeUrl, true);
			}
		},

		//Function to delete Attachtment
		fnDeleteWOAttachmentLink: function (oEvent) {
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

			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var sPath = oSource.getBindingContext("oWorkOrderDetailViewModel").getPath();
			var type = oWorkOrderDetailViewModel.getProperty(sPath + "/AttachmentType");
			var documentId = oWorkOrderDetailViewModel.getProperty(sPath + "/DocumentId");
			var orderId = this.oWorkOrderDetailModel.getProperty("/Orderid");
			if (documentId) {
				var oPortalDataModel = this.oPortalDataModel;
				var sericeUrl = oPortalDataModel.sServiceUrl;
				sericeUrl = "/AttachmentListSet(DocumentId='" + documentId + "',OrderId='" + orderId + "',AttachmentType='" + type +
					"',NotifId='')";
				oPortalDataModel.setHeaders({
					"X-Requested-With": "X"
				});
				oPortalDataModel.remove(sericeUrl, {
					method: "DELETE",
					success: function (data, response) {
						that.fnGetWOAttachmentLinks(orderId);
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
		/////////////////////////////////Attachments/Links/////////////////////////////////

		//Function to open Task List and show in a pop-up
		fnOpenTaskListPopup: function () {
			var oResourceModel = this.oResourceModel;
			if (!this.taskListPopup) {
				this.taskListPopup = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.addTasks", this);
				this.getView().addDependent(this.taskListPopup);
			}
			var table = this.taskListPopup.getContent()[0];
			this.fnResetFilers(table, "oWorkOrderDetailViewModel");
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var planGrp = oWorkOrderDetailModel.getProperty("/Plangroup");
			var workCenter = oWorkOrderDetailModel.getProperty("/MnWkCtr");
			if (workCenter) {
				if (planGrp) {
					this.fnGetTaskHeaderList(planGrp);
					this.taskListPopup.open();
				} else {
					this.showMessage(oResourceModel.getText("SEL_PLANNER_GP"));
				}
			} else {
				this.showMessage(oResourceModel.getText("plsselworkcener"));
			}
		},

		//Function to close Task List pop-up
		onCloseTaskListPopup: function (oEvent) {
			this.taskListPopup.close();
		},

		//Function to get task list for a selected Operation header
		onSelectTaskHeader: function (oEvent) {
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var sPath = oEvent.getParameters().rowContext.getPath();
			var selectedTaskHeader = oWorkOrderDetailViewModel.getProperty(sPath);
			this.fnGetTaskList(selectedTaskHeader.Plnnr);
		},

		//Function to update WO operations with tasks list
		updateWOOperations: function (taskList) {
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var operations = oWorkOrderDetailModel.getProperty("/HEADERTOOPERATIONSNAV");
			var workCenter = oWorkOrderDetailModel.getProperty("/MnWkCtr");
			if (operations.length === 0) {
				taskList = this.formatOperationTasklist(taskList, [], workCenter);
			} else if (operations.length >= 1) {
				taskList = this.formatOperationTasklist(taskList, operations, workCenter);
			}
			oWorkOrderDetailModel.setProperty("/HEADERTOOPERATIONSNAV", taskList);
			oWorkOrderDetailModel.refresh();
			this.onCloseTaskListPopup();
		},

		//Function to get formatted Task list that is to be added on HeaderOperationsNav
		formatOperationTasklist: function (taskList, operations, workCenter) {
			var userPlant = this.oUserDetailModel.getProperty("/userPlant");
			for (var i = 0; i < taskList.length; i++) {
				var newOperationId = this.generateOperationId(operations);
				var oTempobj = {
					"Activity": newOperationId,
					"WorkCntr": workCenter,
					"LongText": taskList[i].OperationLtext, //Long text not available
					"Plant": userPlant,
					"Description": taskList[i].Ltxa1,
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
				operations.push(oTempobj);
			}
			return operations;
		},

		//Function to get damage code values
		getDamageGroupCode: function (oEvent, DamageCode) {
			var oSelectedKey = "";
			var mLookupModel = this.mLookupModel;
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			if (oEvent) {
				var oSource = oEvent.getSource();
				oSelectedKey = oSource.getSelectedKey();
			} else {
				oSelectedKey = DamageCode;
			}
			var damageCodes = mLookupModel.getProperty("/aDamageCode");
			if (damageCodes) {
				damageCodes.filter(function (obj) {
					if (obj.Code === oSelectedKey) {
						oWorkOrderDetailModel.setProperty("/Damagecode", obj.Code);
						oWorkOrderDetailModel.setProperty("/DamageGroup", obj.Codegruppe);
					}
				});
			}
		},

		//Function to get Cause code values
		getCauseGroupCode: function (oEvent, CauseCode) {
			var oSelectedKey = "";
			var mLookupModel = this.mLookupModel;
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			if (oEvent) {
				var oSource = oEvent.getSource();
				oSelectedKey = oSource.getSelectedKey();
			} else if (oEvent) {
				oSelectedKey = CauseCode;
			}
			var aCauseCode = mLookupModel.getProperty("/aCauseCode");
			if (aCauseCode) {
				aCauseCode.filter(function (obj) {
					if (obj.Code === oSelectedKey) {
						oWorkOrderDetailModel.setProperty("/Causecode", obj.Code);
						oWorkOrderDetailModel.setProperty("/CauseGroup", obj.Codegruppe);
					}
				});
			}
		},

		//Function to update Breakdown boolean status
		fnUpdateBreakDownStatus: function (oEvent) {
			var bVal = oEvent.getSource().getState();
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			if (bVal) {
				oWorkOrderDetailModel.setProperty("/Breakdown", bVal);
			} else {
				oWorkOrderDetailModel.setProperty("/Breakdown", bVal);
				oWorkOrderDetailModel.setProperty("/Downtime", "0");
			}
			oWorkOrderDetailModel.refresh();
		},

		//Function to open User search PopUp
		handleValueHelp: function (oEvent) {
			var oSource = oEvent.getSource();
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var assignUserFieldType = oSource.getCustomData()[0].getValue();
			oWorkOrderDetailViewModel.setProperty("/assignUserFieldType", assignUserFieldType);
			if (!this.usersListDialog) {
				this.usersListDialog = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.usersList", this);
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

		//Function to validate user entered Float values
		validateFloatValues: function (oEvent) {
			util.validateInputDataType(oEvent, this);
		},

		//Function to validate user entered Integer values
		validateIntegerValues: function (oEvent) {
			util.validateInputDataType(oEvent, this);
		},

		onAfterRendering: function () {
			this._setScreenHeights();
			sap.ui.Device.resize.attachHandler(function () {
				this._setScreenHeights();
			}.bind(this));
		},

		_setScreenHeights: function () {
			var mLookupModel = this.mLookupModel;
			var spRowCount = (sap.ui.Device.resize.height - 320) / 40;
			spRowCount = Math.floor(spRowCount - 3);
			mLookupModel.setProperty("/spRowCount", spRowCount);
		},

		//Function to filter operations without CNF status and Operations with only CNF status
		fnFilterCNFOperations: function (oEvent) {
			var aFilters = [];
			var tooltip = "";
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var state = oWorkOrderDetailViewModel.getProperty("/isOperationsFiltered");

			if (state) {
				tooltip = "Unconfirmed";
				var sFilter1 = new sap.ui.model.Filter("systemstatustext", "EQ", "");
				var sFilter2 = new sap.ui.model.Filter("systemstatustext", "EQ", "CRTD");
				var sFilter3 = new sap.ui.model.Filter("systemstatustext", "EQ", "REL");
				var sFilter4 = new sap.ui.model.Filter("systemstatustext", "EQ", "PCNF");
				aFilters.push(sFilter1);
				aFilters.push(sFilter2);
				aFilters.push(sFilter3);
				aFilters.push(sFilter4);
			} else {
				tooltip = "Unconfirmed";
			}

			var operationsTable = this.getView().byId("MYLAN_OPERATIONS_TABLE");
			var binding = operationsTable.getBinding("rows");
			binding.filter(aFilters, "Application");
			oWorkOrderDetailViewModel.setProperty("/switchTooltip", tooltip);
			oWorkOrderDetailViewModel.refresh(true);
		},

		//Function to view Superior WO detail
		onViewSuperiorWO: function (oEvent) {
				var oSource = oEvent.getSource();
				var supOrderId = oSource.getCustomData()[0].getValue();
				if (supOrderId) {
					var sHost = window.location.origin;
					var sBSPPath = "/sap/bc/ui5_ui5/sap/ZMYL_WOCREATE/index.html#/detailTabWO/";
					var sURL = sHost + sBSPPath + supOrderId;
					sap.m.URLHelper.redirect(sURL, true);
				}
			}
			/**
			 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
			 * (NOT before the first rendering! onInit() is used for that one!).
			 * @memberOf com.mylan.createWorkOrder.CreateWorkOrder
			 */
			//	onBeforeRendering: function() {
			//
			//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf com.mylan.createWorkOrder.CreateWorkOrder
		 */
		/*onAfterRendering: function () {
		
						}*/
		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf com.mylan.createWorkOrder.CreateWorkOrder
		 */
		//	onExit: function() {
		//
		//	}

	});
});