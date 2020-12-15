sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"com/sap/incture/IMO_PM/formatter/formatter",
	"sap/m/BusyDialog",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/mvc/Controller",
	"com/sap/incture/IMO_PM/controller/BaseController"
], function (JSONModel, formatter, BusyDialog, Filter, FilterOperator, Controller, BaseController) {
	"use strict";

	return BaseController.extend("com.sap.incture.IMO_PM.controller.shiftReport", {
		formatter: formatter,
		onInit: function () {
			this.busy = new BusyDialog();
			var oPortalDataModel = this.getOwnerComponent().getModel("oPortalDataModel");
			this.oPortalDataModel = oPortalDataModel;

			var oLookupDataModel = this.getOwnerComponent().getModel("oLookupDataModel");
			this.oLookupDataModel = oLookupDataModel;

			var oWorkOrderOData = this.getOwnerComponent().getModel("oWorkOrderOData");
			this.oWorkOrderOData = oWorkOrderOData;

			var oPortalUserLoginOData = this.getOwnerComponent().getModel("oPortalUserLoginOData");
			this.oPortalUserLoginOData = oPortalUserLoginOData;

			this.shiftEndReportModel = this.getOwnerComponent().getModel("shiftEndReportModel");

			//Application Model used only for Translation of texts
			var oResourceModel = this.getOwnerComponent().getModel("i18n");
			this.oResourceModel = oResourceModel.getResourceBundle();

			var mLookupModel = this.getOwnerComponent().getModel("mLookupModel");
			this.mLookupModel = mLookupModel;
			mLookupModel.setSizeLimit(10000);

			var todayDate = new Date();
			var yesterdayDate = new Date();
			yesterdayDate = yesterdayDate.setDate(yesterdayDate.getDate() - 1);
			yesterdayDate = new Date(yesterdayDate);

			var oViewSetting = {
				"sFromDate": yesterdayDate, //new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days priori to current date
				"sToDate": todayDate,
				"aWorkSummaryTable": []
			};
			this.mLookupModel.setProperty("/", oViewSetting);
			this.getLoggedInUserShiftEnd();
			this.fnSetVisibleProperties();

			var oReportDataModel = this.getOwnerComponent().getModel("oReportDataModel");
			this.oReportDataModel = oReportDataModel;
		},

		onAfterRendering: function () {
			var that = this;
			var startDate = this.getView().byId("START_DATE");
			var endDate = this.getView().byId("END_DATE");
			startDate.attachBrowserEvent("click", that.setDatePickerDisabled);
			endDate.attachBrowserEvent("click", that.setDatePickerDisabled);
		},

		//Function to disable date picker's input field
		setDatePickerDisabled: function (evt, datePicker) {
			if (evt.target.id.search("icon") === -1) {
				var id = "#" + evt.target.id;
				$(id).attr("readonly", true);
				var iconId = "#" + evt.target.id.split("-inner")[0] + "-icon";
				$(iconId).trigger("click");
			}
		},

		//Function to set Visible property of UI fields
		fnSetVisibleProperties: function () {
			var mLookupModel = this.mLookupModel;
			mLookupModel.setProperty("/startDate", true);
			mLookupModel.setProperty("/endDate", true);
			mLookupModel.setProperty("/iconTabar", true);
			mLookupModel.setProperty("/graphTblVisible", false);
			mLookupModel.setProperty("/selectedIconTab", "WORK_SUMMARY");

			var searchType = [{
				text: "Functional Location",
				key: "FUNCTION"
			}, {
				text: "Equipment",
				key: "EQUIPMENT"
			}];
			mLookupModel.setProperty("/uiSearchType", searchType);
			mLookupModel.setProperty("/uiSearchTypeKey", "FUNCTION");
		},

		onIconbarSelect: function (oEvent) {
			var oSource = oEvent.getSource();
			var mLookupModel = this.mLookupModel;
			var selectedKey = oSource.getSelectedKey();
			if (selectedKey === "PLANNED_MAINTAIN") {
				mLookupModel.setProperty("/startDate", false);
				mLookupModel.setProperty("/endDate", false);
				mLookupModel.setProperty("/iconTabar", false);
				mLookupModel.setProperty("/graphTblVisible", true);
			} else if (selectedKey === "SPARE_PART") {
				mLookupModel.setProperty("/startDate", true);
				mLookupModel.setProperty("/endDate", true);
				mLookupModel.setProperty("/iconTabar", false);
				mLookupModel.setProperty("/graphTblVisible", true);
			} else if (selectedKey === "WORK_SUMMARY") {
				mLookupModel.setProperty("/startDate", true);
				mLookupModel.setProperty("/endDate", true);
				mLookupModel.setProperty("/iconTabar", true);
				mLookupModel.setProperty("/graphTblVisible", true);
			}
			mLookupModel.refresh();
		},

		onGenerateReport: function () {

			var that = this;
			this.busy.open();
			var shiftEndReportModel = this.shiftEndReportModel;
			var sURLWorkSummary = "/ReportHeaderSet";
			var mLookupModel = this.mLookupModel;
			var sFromDate = mLookupModel.getProperty("/sFromDate");
			var sToDate = mLookupModel.getProperty("/sToDate");
			var sPlantSel = mLookupModel.getProperty("/sPlantSel");
			var sWorkCenterSel = mLookupModel.getProperty("/sWorkCenterSel");
			var uiSearchTypeKey = mLookupModel.getProperty("/uiSearchTypeKey");

			if (sFromDate && sToDate && sPlantSel && sWorkCenterSel) {
				sFromDate = mLookupModel.getProperty("/sFromDate");
				sToDate = mLookupModel.getProperty("/sToDate");
				var iTimeDifference = sToDate.getTime() - sFromDate.getTime();
				var iDaysDifference = Math.ceil(iTimeDifference / (1000 * 3600 * 24));
				if (sToDate < sFromDate) {
					this.showMessage(this.oResourceModel.getText("datevalid"));
					this.busy.close();
					return;
				}
				/*else if (iDaysDifference > 7) {
					this.showMessage(this.oResourceModel.getText("periodvalid"));
					this.busy.close();
					return;
				}*/ else {

					mLookupModel.setProperty("/sFromDateLabel", sFromDate);
					mLookupModel.setProperty("/sToDateLabel", sToDate);

					/*	//convert local time to UTC and pass to back end 
						sFromDate = sFromDate.toUTCString();
						sToDate = sToDate.toUTCString();*/

					sFromDate = formatter.formatDateobjToStringShiftReport(sFromDate, "WORK_SUMMARY");
					sToDate = formatter.formatDateobjToStringShiftReport(sToDate, "WORK_SUMMARY");

					var sFromDatePM = new Date(new Date().getTime() - 14 * 24 * 60 * 60 * 1000); //less 14 days from today
					var sToDatePM = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000); // increase 7 days from today

					mLookupModel.setProperty("/sFromDatePM", sFromDatePM);
					mLookupModel.setProperty("/sToDatePM", sToDatePM);

					/*//convert local time to UTC and pass to back end 
					sFromDatePM = sFromDatePM.toUTCString();
					sToDatePM = sToDatePM.toUTCString();
*/
					sFromDatePM = formatter.formatDateobjToStringShiftReport(sFromDatePM);
					sToDatePM = formatter.formatDateobjToStringShiftReport(sToDatePM);

					var oFilter = [];
					oFilter.push(new Filter("Plant", "EQ", sPlantSel));
					oFilter.push(new Filter("GroupBy", "EQ", uiSearchTypeKey));
					oFilter.push(new Filter("WorkCenter", "EQ", sWorkCenterSel));
					oFilter.push(new Filter("Date", "GE", sFromDate));
					oFilter.push(new Filter("Date", "LE", sToDate));
					var sMainDimension = "";
					if (uiSearchTypeKey === "FUNCTION") {
						// show entire report based on fn loc
						sMainDimension = "FunctionalLocation";
					} else {
						// show entire report based on technical id(equipment)
						sMainDimension = "TechnicalId";
					}

					shiftEndReportModel.read(sURLWorkSummary, {
						filters: oFilter,
						urlParameters: {
							"$expand": "HeaderToWorkOrderNav/WorkOrderToOperationNav,HeaderToWorkOrderNav/WorkOrderToMaterialNav,HeaderToNotifNav"
						},
						success: function (oData, oResponse) {
							var aData = oData.results;
							that.fnGetPMTableData(sFromDatePM, sToDatePM);
							that.mLookupModel.setProperty("/aWorkSummaryTable", aData);
							for (var i = 0; i < aData.length; i++) {
								aData[i].sFunTechId = aData[i][sMainDimension];
							}
							// tree table and notificaiton table for each fun location icon tab
							that.fnGenerateGraphData(aData, sMainDimension);
							that.fnGenerateDynamicTablesData(aData, sMainDimension);
							that.fnGenerateSparePartSummary(aData, sMainDimension);
							if (aData.length) {
								mLookupModel.setProperty("/startDate", true);
								mLookupModel.setProperty("/endDate", true);
								mLookupModel.setProperty("/iconTabar", true);
								mLookupModel.setProperty("/graphTblVisible", true);
								mLookupModel.setProperty("/selectedIconTab", "WORK_SUMMARY");
							} else {
								mLookupModel.setProperty("/iconTabar", false);
								mLookupModel.setProperty("/graphTblVisible", false);
								mLookupModel.setProperty("/selectedIconTab", "WORK_SUMMARY");
								var oVizFrame = that.getView().byId("idStackedChart");
								oVizFrame.destroyFeeds();
								oVizFrame.getModel().setData("");
								oVizFrame.getModel().refresh();
							}
							mLookupModel.refresh();
						},
						error: function (oResponse) {
							mLookupModel.setProperty("/iconTabar", false);
							mLookupModel.setProperty("/graphTblVisible", false);
							mLookupModel.setProperty("/selectedIconTab", "WORK_SUMMARY");
							that.mLookupModel.setProperty("/aWorkSummaryTable", []);
							that.busy.close();
						}
					});
				}
			} else {
				this.busy.close();
				this.showMessage(this.oResourceModel.getText("fieldvalid"));
			}
		},

		fnGetPMTableData: function (sFromDatePM, sToDatePM) {
			var that = this;
			var mLookupModel = this.mLookupModel;
			var sURLPM = "/PlannedMaintenanceSet";
			var shiftEndReportModel = this.shiftEndReportModel;
			var sPlantSel = mLookupModel.getProperty("/sPlantSel");
			var sWorkCenterSel = mLookupModel.getProperty("/sWorkCenterSel");

			var oFilterPM = [];
			oFilterPM.push(new Filter("Plant", "EQ", sPlantSel));
			oFilterPM.push(new Filter("WorkCenter", "EQ", sWorkCenterSel));
			oFilterPM.push(new Filter("PlannedDate", "GE", sFromDatePM));
			oFilterPM.push(new Filter("PlannedDate", "LE", sToDatePM));

			shiftEndReportModel.read(sURLPM, {
				filters: oFilterPM,
				success: function (oData, oResponse) {
					var aData = oData.results;
					mLookupModel.setProperty("/aPMtable", aData);
					that.busy.close();
				},
				error: function (oResponse) {
					that.mLookupModel.setProperty("/aPMtable", []);
				}
			});
		},

		fnGenerateGraphData: function (oData, sMainDimension) {
			var aGraphData = [];
			var oTempObject = {};
			var aWorkOrder = [];
			var aWOListUnique = [];
			for (var i = 0; i < oData.length; i++) {
				oTempObject = {};
				if (oData[i][sMainDimension] === "") { // if functional loc is empty dont consider as there will be no wo's w/o fun loc
					continue;
				}
				oTempObject[sMainDimension] = oData[i][sMainDimension];
				aWorkOrder = oData[i].HeaderToWorkOrderNav.results;
				for (var j = 0; j < aWorkOrder.length; j++) {
					oTempObject[aWorkOrder[j]["WorkOrderNo"]] = aWorkOrder[j]["ActualHours"];
					if (aWOListUnique.indexOf(aWorkOrder[j]["WorkOrderNo"]) === -1) { // getting unique work orders
						aWOListUnique.push(aWorkOrder[j]["WorkOrderNo"]);
					}
				}
				aGraphData.push(oTempObject);
			}
			this.fnGenerateGraph(aGraphData, aWOListUnique, sMainDimension);
		},

		fnGenerateGraph: function (aGraphData, aWOListUnique, sMainDimension) {
			var aMeasures = [];
			var sWorkOrder = "";
			var oVizFrame = this.getView().byId("idStackedChart");
			oVizFrame.destroyFeeds();

			/*if (aWOListUnique.length === 0) {
				aMeasures.push({
					"name": "WorkOrderNo",
					"value": "",
					"unit": "Hour(s)"
				});
				oVizFrame.addFeed(new sap.viz.ui5.controls.common.feeds.FeedItem({
					"uid": "valueAxis",
					"type": "Measure",
					"values": ["WorkOrderNo"]
				}));
			}*/
			for (var i = 0; i < aWOListUnique.length; i++) {
				sWorkOrder = aWOListUnique[i].toString();
				aMeasures.push({
					"name": sWorkOrder,
					"value": "{" + sWorkOrder + "}",
					"unit": "Hour(s)"
				});
				oVizFrame.addFeed(new sap.viz.ui5.controls.common.feeds.FeedItem({
					"uid": "valueAxis",
					"type": "Measure",
					"values": [sWorkOrder]
				}));
			}

			var oLocalModel = new JSONModel(aGraphData);
			oVizFrame.setVizProperties({
				plotArea: {
					colorPalette: d3.scale.category20().range(),
					dataLabel: {
						showTotal: true
					}
				},
				legend: {
					visible: false
				},
				tooltip: {
					visible: true
				},
				title: {
					text: ""
				},
				valueAxis: {
					title: {
						visible: true, //set the title visibility to false
						text: "Hours"
					}
				}
			});

			var oDataset = new sap.viz.ui5.data.FlattenedDataset({
				dimensions: [{
					name: sMainDimension,
					value: "{" + sMainDimension + "}"
				}],
				measures: aMeasures,

				data: {
					path: "/"
				}
			});
			oVizFrame.setDataset(oDataset);
			oVizFrame.setModel(oLocalModel);
			sWorkOrder = "";
			oVizFrame.addFeed(new sap.viz.ui5.controls.common.feeds.FeedItem({
				"uid": "categoryAxis",
				"type": "Dimension",
				"values": [sMainDimension]
			}));

			if (aWOListUnique.length === 0) {
				oVizFrame.setVisible(false);
			} else {
				oVizFrame.setVisible(true);
			}
		},

		fnGenerateDynamicTablesData: function (aData, sMainDimension) {
			var aTableData = [];
			var oTempObj = {};
			var oTempObjTree = {};
			for (var i = 0; i < aData.length; i++) {
				oTempObj = {};
				oTempObj.sFunTechId = aData[i][sMainDimension];
				var aTreeDataTemp = aData[i].HeaderToWorkOrderNav.results;
				var aTreeData = [];
				var aOprns = [];
				for (var j = 0; j < aTreeDataTemp.length; j++) {
					oTempObjTree = {};
					aOprns = [];
					oTempObjTree.WorkOrderNo = aTreeDataTemp[j].WorkOrderNo;
					oTempObjTree.EquipDescription = aTreeDataTemp[j].EquipDescription;
					oTempObjTree.WODescription = aTreeDataTemp[j].WODescription;
					oTempObjTree.SystemStatus = aTreeDataTemp[j].SystemStatus;
					oTempObjTree.BDFlag = aTreeDataTemp[j].BDFlag;
					aOprns = aTreeDataTemp[j].WorkOrderToOperationNav.results;
					oTempObjTree.oprns = []; // child node
					for (var m = 0; m < aOprns.length; m++) {
						oTempObjTree.oprns.push({
							"SystemCondition": aOprns[m].SystemCondition,
							"OperationText": aOprns[m].OperationText,
							"OperationId": aOprns[m].OperationId
						});
					}
					oTempObjTree.oprns = this.fnUpdateOperationComments("oprns", oTempObjTree.WorkOrderNo, oTempObjTree.oprns);
					aTreeData.push(oTempObjTree);
				}

				oTempObj.Details = [{
					aNotifData: aData[i].HeaderToNotifNav.results,
					aTreeData: aTreeData
				}];
				aTableData.push(oTempObj);
			}

			var oLocalModel = new JSONModel(aTableData);
			this.getView().byId("idIconTabbar").setModel(oLocalModel);
			if (aTableData.length > 0) {
				this.onAssemblySelect("", aTableData[0].sFunTechId, sMainDimension);
			} else {
				this.onAssemblySelect("", "NA", sMainDimension);
			}
		},

		fnUpdateOperationComments: function (sCommentType, iSelectedWO, operationlist) {
			var oTempObj = {
				woId: iSelectedWO
			};
			var oFilter = [];
			var that = this;
			var oPortalDataModel = this.oPortalDataModel;
			var aTempOperns = operationlist;
			oFilter.push(new Filter("REQUEST", "EQ", JSON.stringify(oTempObj)));
			oPortalDataModel.read("/OperationCommentsFetchSet", {
				async: false,
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
								if (aTempOperns[i].OperationId !== oComments[j].operationId && aTempOperns[i].OperationId < oComments[j].operationId) {
									break;
								}
								if (aTempOperns[i].OperationId === oComments[j].operationId) {
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
						return aTempOperns;
					} else { // wo all operations comments in single pop up onclick of wo
						that.mLookupModel.setProperty("/operationCommentDto", oComments);
						if (!that._oDialogWOOprns) {
							that._oDialogWOOprns = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.commentTimeline", that);
							that.getView().addDependent(that._oDialogWOOprns);
						}
						that._oDialogWOOprns.open();
					}
				},
				error: function (oData) {
					if (sCommentType === "oprns") {
						return aTempOperns;
					} else {
						that.mLookupModel.setProperty("/operationCommentDto", []);
					}
				}
			});

			if (sCommentType === "oprns") {
				return aTempOperns;
			}

		},

		fnGenerateSparePartSummary: function (aData, sMainDimension) {
			var aSparePartsTable = [];
			var aWorkOrderNav = [];
			var aMaterialNav = [];

			for (var i = 0; i < aData.length; i++) {
				aWorkOrderNav = aData[i].HeaderToWorkOrderNav.results;
				for (var j = 0; j < aWorkOrderNav.length; j++) {
					aMaterialNav = aWorkOrderNav[j].WorkOrderToMaterialNav.results;
					for (var m = 0; m < aMaterialNav.length; m++) {
						aMaterialNav[m].sFunTechId = aMaterialNav[m][sMainDimension]; // get funloc or tech id
					}
					if (aSparePartsTable.length) {
						aSparePartsTable = aSparePartsTable.concat(aMaterialNav);
					} else {
						aSparePartsTable = aMaterialNav;
					}
				}
			}
			this.mLookupModel.setProperty("/aSparePartsTable", aSparePartsTable);
			this.busy.close();
		},

		onLongTextPress: function (oEvent) {
			var sNotifLongText = oEvent.getSource().getBindingInfo('enabled').binding.aValues[0];
			this.mLookupModel.setProperty("/NotifLText", sNotifLongText);
			if (!this._oDialogWO) {
				this._oDialogWO = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.NotifLongText", this);
				this.getView().addDependent(this._oDialogWO);
			}
			this._oDialogWO.open();
		},

		onCancel: function () {
			this._oDialogWO.close();

		},

		onOprnLongTextPress: function (oEvent) {
			var sPath = oEvent.getSource().getBindingInfo('enabled').binding.aBindings[0].getContext().getPath();
			if (sPath.indexOf("oprns") !== -1) { // user looking for operation confirmation long text on pop up
				var oRowContext = oEvent.getSource().getBindingInfo('enabled').binding.aBindings[0].getContext().getModel().getProperty(sPath);
				this.mLookupModel.setProperty("/aOprnLText", oRowContext.oprnLText);
				if (!this._oDialogOprn) {
					this._oDialogOprn = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.operationLongText", this);
					this.getView().addDependent(this._oDialogOprn);
				}
				this._oDialogOprn.open();
			} else {
				// user looking for conf long texts of all the operations of a work order
				var oRowContext = oEvent.getSource().getBindingInfo("enabled").binding.aBindings[0].getContext().getModel().getProperty(sPath);
				this.fnUpdateOperationComments("WOOprnsComments", oRowContext.WorkOrderNo);
			}
		},

		onClose: function () {
			this._oDialogOprn.close();
		},

		onAssemblySelect: function (oEvent, sFunTechId, sMainDimension) {
			if (!sFunTechId) { // fun location or tech id
				var oSource = oEvent.getSource();
				sFunTechId = oSource.getSelectedKey();
			}
			var iconTabBar = this.getView().byId("idIconTabbar");
			var oModel = iconTabBar.getModel();
			var data = oModel.getData();

			var selFunLocData = "";
			data.filter(function (obj, i) {
				if (obj.sFunTechId === sFunTechId) {
					selFunLocData = obj.Details; //may be funloc or tech id
				}
			});

			var oReportDataModel = this.oReportDataModel;
			if (selFunLocData.length > 0) {
				if (selFunLocData[0].hasOwnProperty("aTreeData")) {
					var aTreeData = selFunLocData[0].aTreeData;
					oReportDataModel.setProperty("/aTreeData", aTreeData);
				} else {
					oReportDataModel.setProperty("/aTreeData", []);
				}
				if (selFunLocData[0].hasOwnProperty("aNotifData")) {
					var notifData = selFunLocData[0].aNotifData;
					oReportDataModel.setProperty("/aNotifData", notifData);
				} else {
					oReportDataModel.setProperty("/aNotifData", []);
				}
				iconTabBar.setSelectedKey(sFunTechId);
			} else {
				oReportDataModel.setProperty("/aTreeData", []);
				oReportDataModel.setProperty("/aNotifData", []);
			}
			oReportDataModel.refresh();
		},
		onViewWO: function (oEvent) {

			var sPath = oEvent.getSource().getBindingInfo("text").binding.getContext().getPath();
			var sWorkOrderSel = oEvent.getSource().getBindingInfo("text").binding.getContext().getModel().getProperty(sPath).WorkOrderNo;
			var sHost = window.location.origin;
			var sBSPPath = "/sap/bc/ui5_ui5/sap/ZMYL_WOCREATE/index.html#/detailWO/";
			var sURL = sHost + sBSPPath + sWorkOrderSel;
			sap.m.URLHelper.redirect(sURL, true);
		},
		onCloseWOOprnsComments: function () {
			this._oDialogWOOprns.close();
		}

	});
});