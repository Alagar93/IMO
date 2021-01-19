sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"com/sap/incture/IMO_PM/formatter/formatter",
	"sap/m/BusyDialog",
	"sap/ui/model/Filter",
	"com/sap/incture/IMO_PM/controller/BaseController",
	"sap/ui/model/FilterOperator",
	"com/sap/incture/IMO_PM/util/util"
], function (Controller, JSONModel, formatter, BusyDialog, Filter, BaseController, FilterOperator, util) {
	"use strict";

	return BaseController.extend("com.sap.incture.IMO_PM.controller.reviewWorkOrder", {
		formatter: formatter,
		util: util,
		onInit: function () {
			this._router = this.getOwnerComponent().getRouter();
			this.busy = new BusyDialog();
			var oPortalDataModel = this.getOwnerComponent().getModel("oPortalDataModel");
			this.oPortalDataModel = oPortalDataModel;

			var oLookupDataModel = this.getOwnerComponent().getModel("oLookupDataModel");
			this.oLookupDataModel = oLookupDataModel;

			var oWorkOrderOData = this.getOwnerComponent().getModel("oWorkOrderOData");
			this.oWorkOrderOData = oWorkOrderOData;

			var oPortalUserLoginOData = this.getOwnerComponent().getModel("oPortalUserLoginOData");
			this.oPortalUserLoginOData = oPortalUserLoginOData;

			//Application Model used only for Translation of texts
			var oResourceModel = this.getOwnerComponent().getModel("i18n");
			this.oResourceModel = oResourceModel.getResourceBundle();

			oWorkOrderOData.setHeaders({
				"Accept": "application/json",
				"Content-Type": "application/json"
			});
			var mLookupModel = this.getOwnerComponent().getModel("mLookupModel");
			this.mLookupModel = mLookupModel;
			mLookupModel.setSizeLimit(10000);
			var oViewSetting = {
				"iTop": 20,
				"iSkip": 0,
				"aSelectedRows": [],
				"aOprnLText": [],
				"sWorderIdDesFilter": "",
				"sAssignTechFilter": "",
				"sfnLocFilter": "",
				"sWOTypeFilter": "",
				"sWorkCenterFilter": ""

			};

			this.mLookupModel.setProperty("/", oViewSetting);
			this.getLoggedInUser();
			//nischal -- starts
			var that = this;
			this.router = sap.ui.core.UIComponent.getRouterFor(this);
			this.router.attachRoutePatternMatched(function (oEvent) {
				that.routePatternMatched(oEvent);
			});
			//nischal-- ends
		},

		onAfterRendering: function () {
			this._setScreenHeights();
			sap.ui.Device.resize.attachHandler(function () {
				this._setScreenHeights();
			}.bind(this));
		},

		_setScreenHeights: function () {
			var mLookupModel = this.mLookupModel;
			var rowCount = (sap.ui.Device.resize.height - 100) / 58;
			rowCount = Math.floor(rowCount - 2);
			mLookupModel.setProperty("/rowCount", rowCount);
		},

		onSearchWO: function (oEvent) {
			var mLookupModel = this.mLookupModel;
			mLookupModel.setProperty("/aWorkOrderListSet", []);
			this.fnFetchWOList();
		},

		//Function to get logged in user
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
					mLookupModel.refresh();
					that.fnFetchWOList();
					that.setColumnLayout(); //nischal-- Function Call to set Column layout to the screen.
				},
				error: function (oData) {
					mLookupModel.setProperty("/userName", "");
					mLookupModel.setProperty("/userRole", "");
					mLookupModel.getProperty("/userPlant", "");
					mLookupModel.refresh();
				}
			});
		},

		onHandleAdvFilterWO: function (oEvent) {
			if (!this._oDialogWOFilter) {
				this._oDialogWOFilter = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.advanceFilterReviewWO", this);
				this.getView().addDependent(this._oDialogWOFilter);
			}
			this._oDialogWOFilter.open();
		},

		onCancelDialogWO: function () {
			var mLookupModel = this.mLookupModel;
			mLookupModel.setProperty("/sAssignTechFilter", "");
			mLookupModel.setProperty("/sfnLocFilter", "");
			mLookupModel.setProperty("/sWOTypeFilter", "");
			mLookupModel.setProperty("/sWorkCenterFilter", "");
			this._oDialogWOFilter.close();
		},

		onApplyFilter: function () {
			var mLookupModel = this.mLookupModel;
			mLookupModel.setProperty("/sWorderIdDesFilter", ""); // clearing live search by id or desc
			mLookupModel.refresh();

			this.onCollapseAll();
			var sAssignTechFilter = mLookupModel.getProperty("/sAssignTechFilter").toUpperCase();
			var sfnLocFilter = mLookupModel.getProperty("/sfnLocFilter").toUpperCase();
			var sWOTypeFilter = mLookupModel.getProperty("/sWOTypeFilter").toUpperCase();
			var sWorkCenterFilter = mLookupModel.getProperty("/sWorkCenterFilter").toUpperCase();
			var oData = mLookupModel.getProperty("/aWorkOrderListSet");
			var aNewData = [];

			for (var i = 0; i < oData.length; i++) {

				var Technicianname = oData[i].Technicianname.toUpperCase();
				var FunctLoc = oData[i].FunctLoc.toUpperCase();
				var OrderType = oData[i].OrderType.toUpperCase();
				var WorkCenter = oData[i].MnWkCtr.toUpperCase();

				if (Technicianname.indexOf(sAssignTechFilter) !== -1 && FunctLoc.indexOf(sfnLocFilter) !== -1 && OrderType.indexOf(sWOTypeFilter) !==
					-1 && WorkCenter.indexOf(sWorkCenterFilter) !== -1) {
					aNewData.push(oData[i]);

				}

				this.getView().getModel().setData(aNewData);
				this.getView().getModel().refresh();

			}

			mLookupModel.setProperty("/sAssignTechFilter", "");
			mLookupModel.setProperty("/sfnLocFilter", "");
			mLookupModel.setProperty("/sWOTypeFilter", "");
			mLookupModel.setProperty("/sWorkCenterFilter", "");

			this._oDialogWOFilter.close();
		},

		//Function to open Digital signaure pop-up
		onOpenDigitalSignPopup: function () {

			var aDataSet = this.getView().byId("idreviewTreeTable").getModel().getData();
			var aSelectedWOs = [];

			for (var i = 0; i < aDataSet.length; i++) {
				if (aDataSet[i].checked) {
					aSelectedWOs.push(aDataSet[i]);
				}
			}

			if (aSelectedWOs.length) {
				/*if (!this.digitalSignaturePopUp) {
					this.digitalSignaturePopUp = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.digitalSignaturePopup", this);
					this.getView().addDependent(this.digitalSignaturePopUp);
				}
				this.digitalSignaturePopUp.open();*/
				this.onTeco();
			} else {
				this.showMessage(this.oResourceModel.getText("selectwos"));
			}
		},

		//Function to close Digital signaure pop-up
		onCloseDigitalSignPopUp: function () {
			this.digitalSignaturePopUp.close();
		},

		//Function to Validate User Id and Password for logged in user
		fnValidateLoggedInUser: function () {
			var that = this;
			var mLookupModel = this.mLookupModel;
			var oPortalUserLoginOData = this.oPortalUserLoginOData;
			var oUserName = mLookupModel.getProperty("/userName");
			var oDigitalSign = mLookupModel.getProperty("/digitalSign");
			var oResourceModel = this.oResourceModel;
			if (!oDigitalSign) {
				that.showMessage(oResourceModel.getText("passwordmsg"));
				return;
			}

			oDigitalSign = btoa(oDigitalSign); // encode to base64

			var sUrl = "/LOGIN_USER_CHECKSet(UserId='" + oUserName + "',Password='" + oDigitalSign + "')";
			oPortalUserLoginOData.read(sUrl, {
				urlParameters: {
					"$format": "json"
				},
				success: function (oData) {
					mLookupModel.setProperty("/digitalSign", "");
					var oMessage = oData.Message;
					var repsonseCode = oData.Message_type;
					if (repsonseCode === "success") {
						that.onTeco();
					} else {
						that.showMessage(oMessage);
						that.busy.close();
					}
					that.onCloseDigitalSignPopUp();
				},
				error: function (oData) {
					mLookupModel.setProperty("/digitalSign", "");
					that.showMessage(oResourceModel.getText("crederror"));
					that.busy.close();
				}
			});
		},

		fnFetchWOList: function (flag) {
			var that = this;
			var mLookupModel = this.mLookupModel;
			var iTop = mLookupModel.getProperty("/iTop");
			var iSkip = mLookupModel.getProperty("/iSkip");

			var aWorkOrderListSet = mLookupModel.getProperty("/aWorkOrderListSet");
			this.busy.open();
			var sUrl = "/WorkOrderListSet";
			var oPortalDataModel = this.oPortalDataModel;
			var oFilter = [];
			oFilter.push(new Filter("Orderid", "EQ", mLookupModel.getProperty("/sWorderIdDesFilter")));
			oFilter.push(new Filter("OrderType", "EQ", ""));
			oFilter.push(new Filter("SysStatus", "EQ", "REVIEW")); // Pick only final confirmed work orders for TECO
			oFilter.push(new Filter("WoDes", "EQ", ""));
			oFilter.push(new Filter("EnteredByName", "EQ", ""));
			oFilter.push(new Filter("Priority", "EQ", ""));
			oFilter.push(new Filter("AssignedTech", "EQ", ""));
			oFilter.push(new Filter("Equipment", "EQ", ""));
			var userPlant = mLookupModel.getProperty("/userPlant");
			oFilter.push(new Filter("Plant", "EQ", userPlant));
			var i = 0;
			oPortalDataModel.read(sUrl, {
				filters: oFilter,
				urlParameters: {
					"$top": iTop,
					"$skip": iSkip
				},
				success: function (oData) {
					aWorkOrderListSet = oData.results;
					if (iSkip !== 0) {
						aWorkOrderListSet = aWorkOrderListSet.concat(mLookupModel.getProperty("/aWorkOrderListSet"));
					}
					for (i = 0; i < aWorkOrderListSet.length; i++) {
						aWorkOrderListSet[i].oprns = [{}];
						aWorkOrderListSet[i].checked = false;
					}

					if (flag === "loadmore") { // to remove duplicates

						var aTemp = [];
						aTemp.push(aWorkOrderListSet[0]);
						var sCheckFlag = "";
						for (i = 0; i < aWorkOrderListSet.length; i++) {
							sCheckFlag = "";
							for (var j = 0; j < aTemp.length; j++) {
								if (aWorkOrderListSet[i].Orderid === aTemp[j].Orderid) {
									sCheckFlag = "X";
									break;
								}
							}
							if (sCheckFlag !== "X") {
								aTemp.push(aWorkOrderListSet[i]);
							}
						}
						aWorkOrderListSet = aTemp;
					}
					mLookupModel.setProperty("/aWorkOrderListSet", aWorkOrderListSet);
					mLookupModel.setProperty("/iDisplayedWOCount", aWorkOrderListSet.length);
					var oModel = new JSONModel(aWorkOrderListSet);
					that.getView().setModel(oModel);
					that.getView().getModel().refresh();
					that.busy.close();
				},
				error: function (oData) {
					mLookupModel.setProperty("/aWorkOrderListSet", []);
					mLookupModel.refresh();
					that.busy.close();
				}
			});
		},
		handleLoadMoreRecords: function () {
			var mLookupModel = this.mLookupModel;
			var iSkip = mLookupModel.getProperty("/iSkip") + 20;
			mLookupModel.setProperty("/iSkip", iSkip);
			mLookupModel.refresh(true);
			this.fnFetchWOList("loadmore");

		},
		onExpandCollapse: function (oEvent) {
			var that = this;
			if (oEvent.getParameter("expanded")) {
				var rowContext = oEvent.getParameter("rowContext").sPath;
				var oModel = oEvent.getSource().getModel();
				var contextData = oModel.getProperty(rowContext);
				var iSelectedWO = contextData.Orderid;
				if (!contextData.oprns[0].Activity) {
					this.busy.open();
					var sUrl = "/OperationListSet";
					var userPlant = this.mLookupModel.getProperty("/userPlant");
					var oFilter = [];
					oFilter.push(new Filter("Orderid", "EQ", iSelectedWO));
					oFilter.push(new Filter("Plant", "EQ", userPlant));

					var oPortalDataModel = this.oPortalDataModel;
					//fetch operations for the expanded wo
					oPortalDataModel.read(sUrl, {
						filters: oFilter,
						success: function (oData) {
							oModel.setProperty(rowContext + "/oprns", oData.results);
							that.busy.close();
							// that.fnUpdateOperationComments("oprns", iSelectedWO, oModel, rowContext, oData.results);
						},
						error: function (oData) {
							that.busy.close();
						}
					});

				}

			}

		},

		fnUpdateOperationComments: function (sCommentType, iSelectedWO, oModel, rowContext, operationlist) {

			//fetch operational confirmation comments

			var oTempObj = {
				woId: iSelectedWO
			};
			var that = this;
			var oFilter = [];
			var oPortalDataModel = this.oPortalDataModel;
			if (sCommentType === "oprns") {
				var aTempOperns = oModel.getProperty(rowContext + "/oprns");
			}
			oFilter.push(new Filter("REQUEST", "EQ", JSON.stringify(oTempObj)));
			oPortalDataModel.read("/OperationCommentsFetchSet", {
				filters: oFilter,
				success: function (oData) {
					var oComments = oData.results[0];
					if (oComments.RESPONSE !== "null") {
						oComments = JSON.parse(oComments.RESPONSE).operationCommentDto;
						if (!Array.isArray(oComments)) {
							oComments = [oComments];
						}
					} else {
						oComments = [];
					}
					if (sCommentType === "oprns") { //operation specific comments for each oprn
						for (var i = 0; i < aTempOperns.length; i++) {

							aTempOperns[i].oprnLText = [];

							for (var j = 0; j < oComments.length; j++) { //expected operation comments sorted by operation id descending from java service

								if (aTempOperns[i].Activity !== oComments[j].operationId && aTempOperns[i].Activity < oComments[j].operationId) {

									break;

								}

								if (aTempOperns[i].Activity === oComments[j].operationId) {
									aTempOperns[i].oprnLText.push({
										"name": oComments[j].userName,
										"CreatedDate": oComments[j].operationCreatedDateObj,
										"time": oComments[j].operationCreatedDateObj,
										"operationId": oComments[j].operationId,
										"woId": oComments[j].woId,
										"commnt": oComments[j].operationComments
									});

								}

							}
						}
						oModel.setProperty(rowContext + "/oprns", aTempOperns);
						oModel.refresh();

					} else { // wo all operations comments in single pop up onclick of wo
						that.mLookupModel.setProperty("/operationCommentDto", oComments);
						if (!that._oDialogWOOprns) {
							that._oDialogWOOprns = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.commentTimelineReviewWO", that);
							that.getView().addDependent(that._oDialogWOOprns);
						}
						that._oDialogWOOprns.open();

					}
					that.busy.close();

				},
				error: function (oData) {

					that.busy.close();
				}
			});

		},

		onLongTextPress: function (oEvent) {

			var sPath = oEvent.getSource().getBindingInfo("enabled").binding.aBindings[0].getContext().getPath();
			if (sPath.indexOf("oprns") !== -1) { // user looking for operation confirmation long text on pop up
				var oRowContext = oEvent.getSource().getBindingInfo("enabled").binding.aBindings[0].getContext().getModel().getProperty(sPath);
				this.mLookupModel.setProperty("/aOprnLText", oRowContext.oprnLText);
				if (!this._oDialogWO) {
					this._oDialogWO = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.operationLongText", this);
					this.getView().addDependent(this._oDialogWO);
				}
				this._oDialogWO.open();
			} else { // user looking for conf long texts of all the operations of a work order
				var oRowContext = oEvent.getSource().getBindingInfo("enabled").binding.aBindings[0].getContext().getModel().getProperty(sPath);
				this.fnUpdateOperationComments("WOOprnsComments", oRowContext.Orderid);
			}

		},

		onCancel: function () {
			this._oDialogWO.close();
		},
		onCloseWOOprnsComments: function () {
			this._oDialogWOOprns.close();
		},

		onCollapseAll: function () {
			var oTreeTable = this.byId("idreviewTreeTable");
			oTreeTable.collapseAll();
		},

		onExpandFirstLevel: function () {
			var oTreeTable = this.byId("idreviewTreeTable");
			oTreeTable.expandToLevel(1);
		},
		onViewWO: function (oEvent) {

			var sPath = oEvent.getSource().getBindingInfo("text").binding.getContext().getPath();
			var sWorkOrderSel = oEvent.getSource().getBindingInfo("text").binding.getContext().getModel().getProperty(sPath).Orderid;

			var sHost = window.location.origin;
			var sBSPPath = "/sap/bc/ui5_ui5/sap/ZMYL_WOCREATE/index.html#/detailWO/";
			// var sURL = sHost + sBSPPath + sWorkOrderSel;

			this._router.navTo("detailTabWO", {
				workOrderID: sWorkOrderSel
			});
			/*var sURL = "https://ub2qkdfhxg4ubmgqmta-imo-pm-imo-pm.cfapps.eu10.hana.ondemand.com/IMO_PM/index.html#/detailTabWO/" +
				sWorkOrderSel;
			sap.m.URLHelper.redirect(sURL, true);*/
		},

		onTeco: function (oEvent) {
			var that = this;
			var aDataSet = this.getView().byId("idreviewTreeTable").getModel().getData();
			var mLookupModel = this.mLookupModel;
			var messagesFinal = [];
			var oWorkOrderOData = this.oWorkOrderOData;
			var aSelectedWOs = [];
			var oResourceModel = this.oResourceModel;

			for (var i = 0; i < aDataSet.length; i++) {
				if (aDataSet[i].checked) {
					aSelectedWOs.push(aDataSet[i]);
				}
			}
			var iOdataCounter = 0;
			for (var j = 0; j < aSelectedWOs.length; j++) {
				var oPayload = {
					"Orderid": aSelectedWOs[j].Orderid,
					"OrderType": aSelectedWOs[j].OrderType,
					"Equipment": aSelectedWOs[j].Equipment,
					"FunctLoc": aSelectedWOs[j].FunctLoc,
					"Priority": aSelectedWOs[j].Priority,
					"ReportedBy": aSelectedWOs[j].EnteredByName,
					"Plant": aSelectedWOs[j].Plant,
					"Pmacttype": "001",
					"NotifNo": aSelectedWOs[j].NotifNo,
					"Systcond": aSelectedWOs[j].Systcond,
					"Maintplant": aSelectedWOs[j].Maintplant,
					"Planplant": aSelectedWOs[j].Planplant,
					"DateCreated": formatter.formatDateobjToString(aSelectedWOs[j].EnterDate),
					"PlanStartDate": formatter.formatDateobjToString(aSelectedWOs[j].StartDate),
					"PlanEndDate": formatter.formatDateobjToString(aSelectedWOs[j].FinishDate),
					"OrderStatus": "CNF",
					"SetOrderStatus": "TECO",
					"HEADERTOMESSAGENAV": [{
						"Message": "",
						"Status": ""
					}],
					"MnWkCtr": aSelectedWOs[j].MnWkCtr,
					"MalFunStartDate": formatter.formatDateobjToString(aSelectedWOs[j].EnterDate),
					"Plangroup": aSelectedWOs[j].Plangroup,
					"ShortText": aSelectedWOs[j].ShortText
				};

				oWorkOrderOData.setHeaders({
					"X-Requested-With": "X"
				});

				oWorkOrderOData.create("/WorkorderHeaderSet", oPayload, {
					async: false,
					success: function (sData, oResponse) {
						var messages = sData.HEADERTOMESSAGENAV.results;
						var msg = "";
						if (messages[0].Status === "S" && messages[0].Message === "Success") {
							msg = oResourceModel.getText("tecosuccess", [sData.Orderid]); // successfull
							messagesFinal.push({
								"Status": "S",
								"Message": msg
							});

						} else {
							messagesFinal.push(messages[0]);

							msg = oResourceModel.getText("tecoerror", [sData.Orderid]); // not successful
							messagesFinal.push({
								"Status": "E",
								"Message": msg
							});
						}

						iOdataCounter++;

						if (iOdataCounter === aSelectedWOs.length) {

							that.fnShowSuccessErrorMsg(messagesFinal);
							mLookupModel.refresh(true);
							that.fnFetchWOList();

						}

					},
					error: function (oResponse) {
						var msg = oResourceModel.getText("tecoorders");
						messagesFinal.push({
							"Status": "E",
							"Message": msg
						});
						iOdataCounter++;

						if (iOdataCounter === aSelectedWOs.length) {

							that.fnShowSuccessErrorMsg(messagesFinal);

							mLookupModel.refresh(true);
							that.fnFetchWOList();

						}

					}
				});
			}

		},

		//Function to show Success/Error message
		fnShowSuccessErrorMsg: function (messages) {
			var mLookupModel = this.mLookupModel;
			mLookupModel.setProperty("/messages", messages);

			if (!this.successErrorDialog) {
				this.successErrorDialog = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.statusMessages", this);
				this.getView().addDependent(this.successErrorDialog);
			}
			this.successErrorDialog.open();
		},
		//Function to close statusMessages popup
		closeSuccesErrPopup: function () {
			this.successErrorDialog.close();
		},
		reviewWOAdvFilterPanelOpen: function () {
			var oNotifWrapPanel = this.byId("filterWrapPanelReviewWO");
			oNotifWrapPanel.setExpanded(!oNotifWrapPanel.getExpanded());
		},
		//nischal-- starts
		routePatternMatched: function (oEvent) {
			if (oEvent.getParameter("name") === "reviewWO") {
				this.getLoggedInUser();
			}
		},
		//nischal -- ends
		setColumnLayout: function () {
			var mLookupModel = this.mLookupModel;
			var oTempObj = {
				sDate : true,
	            sAssTechName : true,
	            sFunctLoc : true,
	            sEquip : true,
	            sAssembly : true,
	            sMnWkCtr : true,
	            sPlant : false,
	            sOrderId : true,
	            sType : true,
	            sWoComments : false,
	            sOprn : true,
	            sSysCond : false,
	            sFC : false,
	            sCompOnTime :false,
	            sOprnShortText : false,
	            sOprnLtext :false,
	            sLText : false,
	            sBDown : false,
	            sBDHours :false,
	            sLabHours : false,
	            sSpareParts : false,
	            sSparePartsIss : false,
	            sSparePartsReturned : false,
	            sIsAttachment : false
			};
			mLookupModel.setProperty("/oReviewTecoColumnVisible",oTempObj);
			mLookupModel.refresh();
		},
		//nischal
		onPressColumnAdd: function (oEvent) {
			if (!this.addRemoveColumnDialog) {
				this.addRemoveColumnDialog = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.addRemoveColReviewTeco", this);
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
		//nischal --
		onSelectAll: function(){
			var mLookupModel = this.mLookupModel;
			var oTempObj = {
				sDate : true,
	            sAssTechName : true,
	            sFunctLoc : true,
	            sEquip : true,
	            sAssembly : true,
	            sMnWkCtr : true,
	            sPlant : true,
	            sOrderId : true,
	            sType : true,
	            sWoComments : true,
	            sOprn : true,
	            sSysCond : true,
	            sFC : true,
	            sCompOnTime :true,
	            sOprnShortText : true,
	            sOprnLtext :true,
	            sLText : true,
	            sBDown : true,
	            sBDHours :true,
	            sLabHours : true,
	            sSpareParts : true,
	            sSparePartsIss : true,
	            sSparePartsReturned : true,
	            sIsAttachment : true
			};
			mLookupModel.setProperty("/oReviewTecoColumnVisible",oTempObj);
			mLookupModel.refresh();
		}
	});
});