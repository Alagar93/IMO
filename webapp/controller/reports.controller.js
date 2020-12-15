sap.ui.define([
	"com/sap/incture/IMO_PM/controller/BaseController",
	"com/sap/incture/IMO_PM/formatter/formatter",
	"com/sap/incture/IMO_PM/util/util",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/viz/ui5/controls/common/feeds/FeedItem",
	"sap/viz/ui5/data/FlattenedDataset"
], function (BaseController, formatter, util, JSONModel, Filter, FilterOperator, FeedItem, FlattenedDataset) {
	"use strict";

	return BaseController.extend("com.sap.incture.IMO_PM.controller.reports", {
		formatter: formatter,
		util: util,

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.mylan.Reports.view.reports
		 */
		onInit: function () {
			var that = this;
			this.fnInitCreateReportsApp();
			this.router = sap.ui.core.UIComponent.getRouterFor(this);
			this.router.attachRoutePatternMatched(function (oEvent) {
				that.routePatternMatched(oEvent);
			});
			this.fnShowSelectedReport("MAINTENANCE_REPORT");
		},

		routePatternMatched: function (oEvent) {

		},

		//Function to set Search and Graphs of all report to visible=false
		fnSetSearchGraphVisible: function (oViewPropertyModel, report) {
			oViewPropertyModel.setProperty("/pmComplianceRepVisible", false);
			oViewPropertyModel.setProperty("/pmComplianceGraphVisible", false);

			oViewPropertyModel.setProperty("/plannedReactiveRepVisible", false);
			oViewPropertyModel.setProperty("/plannedReactiveGraphVisible", false);

			oViewPropertyModel.setProperty("/labourHrsRepVisibile", false);
			oViewPropertyModel.setProperty("/labourHrsGraphVisibile", false);

			oViewPropertyModel.setProperty("/mtrRepVisibile", false);
			oViewPropertyModel.setProperty("/mtrGraphVisible", false);

			oViewPropertyModel.setProperty("/woStatusRepVisible", false);
			oViewPropertyModel.setProperty("/woStatusGraphVisible", false);

			oViewPropertyModel.setProperty("/spareCostRepVisibile", false);
			oViewPropertyModel.setProperty("/spareCostGraphVisibile", false);

			oViewPropertyModel.setProperty("/pmComplianceFunLoc", []);
			oViewPropertyModel.setProperty("/pmComplianceOptions", "");
			oViewPropertyModel.setProperty("/pmComplianceTimeBucket", "");
		},

		//Function to show selected report 
		fnShowSelectedReport: function (oEvent) {
			var selectedRep = oEvent;
			if (oEvent !== "MAINTENANCE_REPORT") {
				this.fnApplyCustomTileCSS();
				var oSource = oEvent.getSource();
				selectedRep = oSource.getCustomData()[0].getValue();
				oEvent.getSource().getContent()[0].removeStyleClass("sapVBoxClass");
				oEvent.getSource().getContent()[0].addStyleClass("sapSelectedReportTile");
			} else {
				this.fnApplyCustomTileCSS(true);
			}
			var oViewPropertyModel = this.oViewPropertyModel;
			var oUserPlant = this.oUserDetailModel.getProperty("/userPlant");
			this.fnSetSearchGraphVisible(oViewPropertyModel);
			switch (selectedRep) {
			case "MAINTENANCE_REPORT":
				oViewPropertyModel.setProperty("/pmComplianceRepVisible", true);
				oViewPropertyModel.setProperty("/pmCompliancePlant", oUserPlant);
				oViewPropertyModel.setProperty("/pmComplianceViewType", "FUNC_LOCATION");
				this.onSelComplianceSearchType("", "FUNC_LOCATION");
				break;
			case "PLANNED_WORK_REPORT":
				this.fnClrPlanRectiveRepParams(oUserPlant);
				oViewPropertyModel.setProperty("/plannedReactiveRepVisible", true);
				break;
			case "LABOUR_WORK_REPORT":
				this.fnClrLabourHrsRepParams(oUserPlant);
				oViewPropertyModel.setProperty("/labourHrsRepVisibile", true);
				oViewPropertyModel.setProperty("/labourHrPlant", oUserPlant);
				break;
			case "MTR_REPORT":
				this.fnClrMTRRepParams(oUserPlant);
				oViewPropertyModel.setProperty("/mtrRepVisibile", true);
				oViewPropertyModel.setProperty("/mtrPlant", oUserPlant);
				break;
			case "WORK_ORDER_STATUS_REPORT":
				this.fnClrWORepParams(oUserPlant);
				oViewPropertyModel.setProperty("/woStatusRepVisible", true);
				oViewPropertyModel.setProperty("/woStatusPlant", oUserPlant);
				break;
			case "SPARE_PART_COST_REPORT":
				this.fnClrSpareCostRepParams(oUserPlant);
				oViewPropertyModel.setProperty("/spareCostRepVisibile", true);
				break;
			}
			oViewPropertyModel.refresh();
		},

		//Function to apply border class for cusotm list tile
		fnApplyCustomTileCSS: function (init) {
			var oFlexBox = this.getView().byId("MYLAN_REPORTS_CUSTOM_TILES");
			var oItems = oFlexBox.getItems();
			for (var i = 0; i < oItems.length; i++) {
				var oVbox = oItems[i].getContent()[0];
				oVbox.removeStyleClass("sapSelectedReportTile");
				oVbox.addStyleClass("sapVBoxClass");
			}
			if (init === true) {
				var cVbox = oItems[0].getContent()[0];
				cVbox.addStyleClass("sapSelectedReportTile");
			}
		},

		///////////////////////////////////MAINTENANCE_REPORT///////////////////////////////////
		//Function to generate Planned Reactive report
		fnGenPMComplianceGraph: function () {
			var oReportsDataModel = this.oReportsDataModel;
			var oReportData = oReportsDataModel.getData();
			var oVizFrame = this.getView().byId("PM_COMPLIANCE_FL_GRAPH");
			oVizFrame.destroyFeeds();
			oVizFrame.setVizType("column");

			var oDataset = util.getPMComplianceFlattenedDataset(oReportData, FlattenedDataset);
			oDataset.setModel(oReportsDataModel);
			util.getPMComplianceFeedItem(oVizFrame, oReportData, FeedItem);
			oVizFrame.setDataset(oDataset);
		},

		//Function to generate Planned Reactive report
		fnGenPMComplianceWCGraph: function () {
			var oReportsDataModel = this.oReportsDataModel;
			var oReportData = oReportsDataModel.getData();
			var oVizFrame = this.getView().byId("PM_COMPLIANCE_FL_GRAPH");
			oVizFrame.destroyFeeds();
			oVizFrame.setVizType("line");

			var oDataset = util.getPMComplianceWCFlattenedDataset(oReportData, FlattenedDataset);
			oDataset.setModel(oReportsDataModel);
			util.getPMComplianceWCFeedItem(oVizFrame, oReportData, FeedItem);
			oVizFrame.setDataset(oDataset);
		},

		onSelComplianceSearchType: function (oEvent, type) {
			var selectedBtn = "";
			if (oEvent) {
				var oSource = oEvent.getSource();
				selectedBtn = oSource.getSelectedKey();
			} else if (type) {
				selectedBtn = type;
			}

			var oViewPropertyModel = this.oViewPropertyModel;
			this.fnSetSearchGraphVisible(oViewPropertyModel);
			if (selectedBtn === "FUNC_LOCATION") {
				oViewPropertyModel.setProperty("/pmComplianceWCVisible", false);
				oViewPropertyModel.setProperty("/pmComplianceFLVisible", true);
				oViewPropertyModel.setProperty("/pmComplianceTimeBucket", "12");
			} else if (selectedBtn === "ODER_TYPES") {
				oViewPropertyModel.setProperty("/pmComplianceWCVisible", true);
				oViewPropertyModel.setProperty("/pmComplianceFLVisible", false);
				oViewPropertyModel.setProperty("/pmComplianceTimeBucket", "12");
				oViewPropertyModel.setProperty("/pmComplianceWCs", []);
				oViewPropertyModel.setProperty("/pmComplianceOrders", []);
			}
			oViewPropertyModel.setProperty("/pmComplianceRepVisible", true);
			oViewPropertyModel.setProperty("/pmComplianceGraphVisible", false);
		},

		///////////////////////////////////MAINTENANCE_REPORT///////////////////////////////////

		///////////////////////////////////PLANNED_WORK_REPORT///////////////////////////////////
		//Function to clear search parameters in Planned Reactive report
		fnClrPlanRectiveRepParams: function (userPlant) {
			var oViewPropertyModel = this.oViewPropertyModel;
			oViewPropertyModel.setProperty("/plannedReactivePlant", userPlant);
			oViewPropertyModel.setProperty("/plannedReactiveDatePeriod", "12");
			oViewPropertyModel.setProperty("/plannedReactiveWCs", []);
			oViewPropertyModel.refresh();
		},

		//Function to generate Planned Reactive report
		fnGenPlanReactiveGraph: function () {
			var oReportsDataModel = this.oReportsDataModel;
			var oReportData = oReportsDataModel.getData();
			var oVizFrame = this.getView().byId("PLANNED_REACTIVE_GRAPH");
			oVizFrame.destroyFeeds();

			var oDataset = util.getFlattenedDataset(oReportData, FlattenedDataset);
			oDataset.setModel(oReportsDataModel);
			util.getFeedItem(oVizFrame, oReportData, FeedItem);
			oVizFrame.setDataset(oDataset);
		},
		///////////////////////////////////PLANNED_WORK_REPORT///////////////////////////////////

		///////////////////////////////////LABOUR_HRS_REPORT///////////////////////////////////
		//Function to clear search parameters in Labour Hours report
		fnClrLabourHrsRepParams: function (userPlant) {
			var oViewPropertyModel = this.oViewPropertyModel;
			oViewPropertyModel.setProperty("/labourHrPlant", userPlant);
			oViewPropertyModel.setProperty("/labourHrWorkCenter", []);
			oViewPropertyModel.setProperty("/labourHrWorkTeamLeads", []);
			oViewPropertyModel.setProperty("/labourHrDatePeriod", "12");
			oViewPropertyModel.refresh();
		},

		//Function to generate Labour Hours by Technician report
		fnFormatLbrHrRepData: function () {
			var oReportsDataModel = this.oReportsDataModel;
			var oReportData = oReportsDataModel.getData();
			var oVizFrame = this.getView().byId("LABOUR_HOUR_GRAPH");
			oVizFrame.destroyFeeds();

			var oDataset = util.getLbrHrFlattenedDataset(oReportData, FlattenedDataset);
			oDataset[0].setModel(oReportsDataModel);
			util.getLbrHrFeedItem(oVizFrame, oReportData, FeedItem, oDataset[1]);
			oVizFrame.setDataset(oDataset[0]);
		},

		//Function to show custom tooltip 
		showLabourCostCustomToolip: function (oEvent) {
			var odata;
			var aData = oEvent.getSource().getDataset().getModel().getData();
			var oSelectedData = oEvent.getParameters("data").data[0].data;
			var measureName = oSelectedData.measureNames;
			var mTechName = oSelectedData["Technician Name"];
			aData.filter(function (obj) {
				if (obj.TechName === mTechName) {
					odata = obj;
				}
			});

			var techName = odata.TechName;
			var labrCost = odata[measureName];
			var woCount = odata[measureName + "_WoCount"];
			var lbrCostLbl = "Labour Hours :";

			var popover = new sap.viz.ui5.controls.Popover({
				customDataControl: function () {
					var oVbox = new sap.m.VBox({
						class: "sapUiTinyMarginBeginEnd sapUiTinyMarginTopBottom"
					});
					var woTypeBox = new sap.m.HBox({
						items: [new sap.m.Label({
							design: "Bold",
							text: "WO Type : "
						}), new sap.m.Text({
							text: measureName,
							class: "sapUiTinyMarginBegin"
						})]
					});
					oVbox.addItem(woTypeBox);
					var woCountBox = new sap.m.HBox({
						items: [new sap.m.Label({
							design: "Bold",
							text: "WO Count : "
						}), new sap.m.Text({
							text: woCount,
							class: "sapUiTinyMarginBegin"
						})]
					});
					oVbox.addItem(woCountBox);
					var techNameBox = new sap.m.HBox({
						items: [new sap.m.Label({
							design: "Bold",
							text: "Tech Name : "
						}), new sap.m.Text({
							text: techName,
							class: "sapUiTinyMarginBegin"
						})]
					});
					oVbox.addItem(techNameBox);
					var labrCostBox = new sap.m.HBox({
						items: [new sap.m.Label({
							design: "Bold",
							text: lbrCostLbl
						}), new sap.m.Text({
							text: labrCost,
							class: "sapUiTinyMarginBegin"
						})]
					});
					oVbox.addItem(labrCostBox);
					return oVbox;
				}
			});
			var oVizFrame = this.getView().byId("LABOUR_HOUR_GRAPH");
			popover.connect(oVizFrame.getVizUid());
		},
		///////////////////////////////////LABOUR_HRS_REPORT///////////////////////////////////

		///////////////////////////////////MEAN_TIME_REPORT///////////////////////////////////
		//Function to clear search parameters in Mean Time Repair report
		fnClrMTRRepParams: function (userPlant) {
			var oViewPropertyModel = this.oViewPropertyModel;
			oViewPropertyModel.setProperty("/mtrPlant", userPlant);
			oViewPropertyModel.setProperty("/mtrWorkCenter", "");
			oViewPropertyModel.setProperty("/mtrFunLoc", []);
			oViewPropertyModel.setProperty("/mtrEquipments", []);
			oViewPropertyModel.setProperty("/mtrDatePeriod", "12");
			oViewPropertyModel.refresh();
		},

		//Function to set selected Functional location's equipments pre-selected
		setSelectedFuncLocEquips: function (oEvent) {
			var filteredEquips = [];
			var mLookupModel = this.mLookupModel;
			var oViewPropertyModel = this.oViewPropertyModel;
			var equipmentList = mLookupModel.getProperty("/aEuipSet");
			var mtrFunLoc = oViewPropertyModel.getProperty("/mtrFunLoc");
			for (var i = 0; i < mtrFunLoc.length; i++) {
				var tempArr = util.getFuncLocEquipments(equipmentList, mtrFunLoc[i]);
				filteredEquips = filteredEquips.concat(tempArr);
			}
			oViewPropertyModel.setProperty("/aEuipSet", filteredEquips);
			oViewPropertyModel.refresh();
		},

		//Function to generate Mean Time Repair report
		fnFormatMtrRepData: function () {
			var oReportsDataModel = this.oReportsDataModel;
			var oReportData = oReportsDataModel.getData();
			var oVizFrame = this.getView().byId("MTR_GRAPH");
			oVizFrame.destroyFeeds();

			var oDataset = util.getMtrFlattenedDataset(oReportData, FlattenedDataset);
			oDataset.setModel(oReportsDataModel);
			util.getMtrFeedItem(oVizFrame, oReportData, FeedItem);
			oVizFrame.setDataset(oDataset);
			// oDataset[0].setModel(oReportsDataModel);
			// util.getMtrFeedItem(oVizFrame, oReportData, FeedItem, oDataset[1]);
			// oVizFrame.setDataset(oDataset[0]);
		},
		///////////////////////////////////MEAN_TIME_REPORT///////////////////////////////////

		///////////////////////////////////WO_STATUS_REPORT///////////////////////////////////
		//Function to clear search parameters in WO Status report
		fnClrWORepParams: function (userPlant) {
			var oViewPropertyModel = this.oViewPropertyModel;
			oViewPropertyModel.setProperty("/woStatusPlant", userPlant);
			oViewPropertyModel.setProperty("/woStatusWorkCenter", []);
			oViewPropertyModel.setProperty("/woStatusWorkTeamLeads", []);
			oViewPropertyModel.setProperty("/woStatusDatePeriod", "12");
			oViewPropertyModel.refresh();
		},

		//Function to generate WO Status report
		fnFormatWOStatusRepData: function () {
			var oReportsDataModel = this.oReportsDataModel;
			var oReportData = oReportsDataModel.getData();
			var oVizFrame = this.getView().byId("WO_STATUS_GRAPH");
			oVizFrame.destroyFeeds();

			var oDataset = util.getWOFlattenedDataset(oReportData, FlattenedDataset);
			oDataset[0].setModel(oReportsDataModel);
			util.getWOFeedItem(oVizFrame, oReportData, FeedItem, oDataset[1]);
			oVizFrame.setDataset(oDataset[0]);

			// var aTempData = oReportData;

			/*	for (var m = 0; m < aTempData.length; m++) {

					var aKeys = Object.keys(aTempData[i]);
					var iTotal = 0;
					for (var n = 0; n < aKeys.length; n++) {

						if (aKeys[n] !== "TechName" && aKeys[n] !== "ROSS SHERIDAN") {

							iTotal = aTempData[i][aKeys[n]];
						}

					}
					aTempData[i]["TotalCount"] = iTotal;

				}*/

			var aMeasures = oVizFrame.getDataset().getMeasures();
			var aColorPalette = [];

			for (var i = 0; i < aMeasures.length; i++) {
				if (aMeasures[i].getName() === "OPEN-CNF") {
					aColorPalette.push("blue");
				} else if (aMeasures[i].getName() === "TECO-CNF") {
					aColorPalette.push("green");
				} else if (aMeasures[i].getName() === "OPEN-OPEN") {
					aColorPalette.push("#FF0000");
				} else if (aMeasures[i].getName() === "OPEN-PCNF") {
					aColorPalette.push("#FFBF00");
				} else if (aMeasures[i].getName() === "TECO-PCNF") {
					aColorPalette.push("#A52A2A");
				} else if (aMeasures[i].getName() === "TECO-OPEN") {
					aColorPalette.push("#00bac0");
				}
			}

			oVizFrame.setVizProperties({
				dataLabel: {
					visible: true,
					renderer: function (oEvent) {
						if (oEvent.val < 20) {
							oEvent.text = "";
						}
					}
				},
				plotArea: {
					colorPalette: aColorPalette
				}
			});
		},
		///////////////////////////////////WO_STATUS_REPORT///////////////////////////////////

		///////////////////////////////////SPARE_COST_REPORT///////////////////////////////////
		//Function to clear search parameters in Spare cost report
		fnClrSpareCostRepParams: function (userPlant) {
			var oViewPropertyModel = this.oViewPropertyModel;
			oViewPropertyModel.setProperty("/spareCostPlant", userPlant);
			oViewPropertyModel.setProperty("/spareCostFuncLoc", []);
			oViewPropertyModel.setProperty("/spareCostEquipments", []);
			oViewPropertyModel.setProperty("/spareCostFuncLocKey", "");
			oViewPropertyModel.setProperty("/spareCostEquipmentKey", "");
			oViewPropertyModel.setProperty("/spareCostDatePeriod", "12");
			oViewPropertyModel.refresh();
		},

		//Function to get Equipment list
		fnGetEquipmentList: function () {
			var oViewPropertyModel = this.oViewPropertyModel;
			var spareCostPlant = oViewPropertyModel.setProperty("/spareCostPlant");
			this.getFunctionalLocs(spareCostPlant);
		},

		//Function to open equipment list value help
		openEquipmentsList: function () {
			if (!this.equipmentsList) {
				this.equipmentsList = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.equipmentsList", this);
				this.getView().addDependent(this.equipmentsList);
			}
			this.equipmentsList.open();
		},

		//Function to close equipment list value help
		fnCloseEquipListValueHelp: function () {
			this.equipmentsList.close();
		},

		//Function to set selected Functional location's equipments pre-selected
		setSCSelectedFuncLocEquips: function (oEvent) {
			var oResourceModel = this.oResourceModel;
			var mLookupModel = this.mLookupModel;
			var oViewPropertyModel = this.oViewPropertyModel;
			var equipmentList = mLookupModel.getProperty("/aEuipSet");
			var spareCostFuncLoc = oViewPropertyModel.getProperty("/spareCostFuncLoc");
			var spareCostEquipments = oViewPropertyModel.getProperty("/spareCostEquipments");
			var spareCostFuncLocKey = oViewPropertyModel.getProperty("/spareCostFuncLocKey");
			if (spareCostEquipments.length < 100) {
				var filteredEquips = this.getFuncLocEquipments(equipmentList, spareCostFuncLocKey, spareCostEquipments);
				spareCostFuncLoc.push(spareCostFuncLocKey);
				oViewPropertyModel.setProperty("/spareCostFuncLocKey", "");
				oViewPropertyModel.setProperty("/spareCostFuncLoc", spareCostFuncLoc);
				oViewPropertyModel.setProperty("/spareCostEquipments", filteredEquips);
				oViewPropertyModel.setProperty("/spareCostEquipmentKey", "");
				oViewPropertyModel.refresh();
			} else {
				this.showMessage(oResourceModel.getText("DEL_EQUIP_TO_ADD_EQUIP"));
			}
		},

		//Function to get selected Func location's equipments
		getFuncLocEquipments: function (aEquipSet, spareCostFuncLoc, spareCostEquipments) {
			var uniqueArray = spareCostEquipments;
			aEquipSet.filter(function (obj) {
				if (uniqueArray.length < 100) {
					var tempObj = {};
					var equip = obj.Tplnr;
					if (equip === spareCostFuncLoc) {
						tempObj.Equnr = obj.Equnr;
						tempObj.Eqktu = obj.Eqktu;
						tempObj.Tidnr = obj.Tidnr;
						uniqueArray.push(tempObj);
					}
				}
			});
			return uniqueArray;
		},

		//Function to generate Spare cost report
		fnFormatSpareCostRepData: function () {
			var oReportsDataModel = this.oReportsDataModel;
			var oReportData = oReportsDataModel.getData();
			var oVizFrame = this.getView().byId("SPARE_COST_GRAPH");
			oVizFrame.destroyFeeds();

			var currency = this.oUserDetailModel.getProperty("/currency");
			var oDataset = util.getSpareCostFlattenedDataset(oReportData, FlattenedDataset, currency);
			oDataset[0].setModel(oReportsDataModel);
			util.getSpareCostFeedItem(oVizFrame, oReportData, FeedItem, oDataset[1], currency);
			oVizFrame.setDataset(oDataset[0]);
		},

		//Function to update deleted equipments from filteredEquips list
		fnDeleteSelectedEquip: function (oEvent) {
			var oViewPropertyModel = this.oViewPropertyModel;
			var selectedEquip = oEvent.getSource().getBindingContext("oViewPropertyModel");
			var sPath = selectedEquip.getPath();
			var index = parseInt(sPath.split("/")[2], 10);
			var spareCostEquipments = oViewPropertyModel.getProperty("/spareCostEquipments");
			spareCostEquipments.splice(index, 1);
			oViewPropertyModel.setProperty("/spareCostEquipments", spareCostEquipments);
			oViewPropertyModel.refresh(true);
		},

		//Function to update deleted Func Locations
		fnDeleteSelectedFnLoc: function (oEvent) {
			var oViewPropertyModel = this.oViewPropertyModel;
			var selectedEquip = oEvent.getSource().getBindingContext("oViewPropertyModel");
			var sPath = selectedEquip.getPath();
			var index = parseInt(sPath.split("/")[2], 10);
			var spareCostFuncLoc = oViewPropertyModel.getProperty("/spareCostFuncLoc");
			spareCostFuncLoc.splice(index, 1);
			oViewPropertyModel.setProperty("/spareCostFuncLoc", spareCostFuncLoc);
			oViewPropertyModel.refresh(true);
		},

		//Function to get selected Equipment from Suggestion list
		fnGetSuggestedEquipment: function (oEvent) {
			var oResourceModel = this.oResourceModel;
			var mLookupModel = this.mLookupModel;
			var oViewPropertyModel = this.oViewPropertyModel;
			var sPath = oEvent.getParameters()["selectedItem"].getBindingContext("mLookupModel").getPath();
			var oEquip = mLookupModel.getProperty(sPath);
			var spareCostEquipments = oViewPropertyModel.getProperty("/spareCostEquipments");
			var spareCostFuncLoc = oViewPropertyModel.getProperty("/spareCostFuncLoc");
			if (spareCostEquipments.length < 100) {
				var bVal = this.fnChckSameEquipAdded(oEquip.Equnr, spareCostEquipments);
				if (bVal) {
					this.showMessage(oResourceModel.getText("ADD_EQUIP_ERROR_MESSAGE"));
				} else {
					var funcLoc = oEquip.Tplnr;
					var isFunLocAlreadyExist = this.fnChckGrpSameFuncLoc(funcLoc, spareCostFuncLoc);
					if (!isFunLocAlreadyExist) {
						spareCostFuncLoc.push(funcLoc);
					}
					var oTempObj = {};
					oTempObj.Equnr = oEquip.Equnr;
					oTempObj.Eqktu = oEquip.Eqktu;
					oTempObj.Tidnr = oEquip.Tidnr;

					spareCostEquipments.push(oTempObj);
					oViewPropertyModel.setProperty("/spareCostEquipments", spareCostEquipments);
					oViewPropertyModel.setProperty("/spareCostFuncLoc", spareCostFuncLoc);
					oEvent.getSource().setValue();
				}
				oViewPropertyModel.setProperty("/spareCostFuncLocKey", "");
				oViewPropertyModel.setProperty("/spareCostEquipmentKey", "");
				oViewPropertyModel.refresh();
			} else {
				this.showMessage(oResourceModel.getText("ADD_EQUIP_ERROR_MESSAGE"));
			}
		},

		//Function to check if same equiment is already added
		fnChckSameEquipAdded: function (cEquip, spareCostEquipments) {
			var bVal = false;
			spareCostEquipments.filter(function (equip) {
				if (equip === cEquip) {
					bVal = true;
				}
			});
			return bVal;
		},

		//Function to group same func location for selected Equipments
		fnChckGrpSameFuncLoc: function (cFuncLoc, spareCostFuncLoc) {
			var bVal = false;
			spareCostFuncLoc.filter(function (funcLoc) {
				if (funcLoc === cFuncLoc) {
					bVal = true;
				}
			});
			return bVal;
		},

		//Function to show custom tooltip 
		showSparePartCustomToolip: function (oEvent) {
				var odata;
				var aData = oEvent.getSource().getDataset().getModel().getData();
				var oSelectedData = oEvent.getParameters("data").data[0].data;
				var mTechId = oSelectedData["Technical Id"];
				aData.filter(function (obj) {
					if (obj.TechId === mTechId) {
						odata = obj;
					}
				});
				var techId = odata.TechId;
				var funLoc = odata.Fnloc;
				var spareCost = odata.SpareCost;
				var labrCost = odata.LabrCost;
				var spareCount = odata.SpareCount;
				var measureName = oSelectedData.measureNames;

				var popover = new sap.viz.ui5.controls.Popover({
					customDataControl: function () {
						var oVbox = new sap.m.VBox({
							class: "sapUiTinyMarginBeginEnd sapUiTinyMarginTopBottom"
						});
						var funLocBox = new sap.m.HBox({
							items: [new sap.m.Label({
								design: "Bold",
								text: "Functional Loc : "
							}), new sap.m.Text({
								text: funLoc,
								class: "sapUiTinyMarginBegin"
							})]
						});
						oVbox.addItem(funLocBox);
						var techIdBox = new sap.m.HBox({
							items: [new sap.m.Label({
								design: "Bold",
								text: "Technical Id : "
							}), new sap.m.Text({
								text: techId,
								class: "sapUiTinyMarginBegin"
							})]
						});
						oVbox.addItem(techIdBox);
						if (measureName === "Spare cost in EUR") {
							var spareCostBox = new sap.m.HBox({
								items: [new sap.m.Label({
									design: "Bold",
									text: measureName + " : "
								}), new sap.m.Text({
									text: spareCost,
									class: "sapUiTinyMarginBegin"
								})]
							});
							oVbox.addItem(spareCostBox);
							var spareCountBox = new sap.m.HBox({
								items: [new sap.m.Label({
									design: "Bold",
									text: "Spare Count : "
								}), new sap.m.Text({
									text: spareCount,
									class: "sapUiTinyMarginBegin"
								})]
							});
							oVbox.addItem(spareCountBox);
						} else {
							var labrCostBox = new sap.m.HBox({
								items: [new sap.m.Label({
									design: "Bold",
									text: measureName + " : "
								}), new sap.m.Text({
									text: labrCost,
									class: "sapUiTinyMarginBegin"
								})]
							});
							oVbox.addItem(labrCostBox);
						}
						return oVbox;
					}
				});
				var oVizFrame = this.getView().byId("SPARE_COST_GRAPH");
				popover.connect(oVizFrame.getVizUid());
			}
			///////////////////////////////////SPARE_COST_REPORT///////////////////////////////////
			/**
			 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
			 * (NOT before the first rendering! onInit() is used for that one!).
			 * @memberOf com.mylan.Reports.view.reports
			 */
			//	onBeforeRendering: function() {
			//
			//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf com.mylan.Reports.view.reports
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf com.mylan.Reports.view.reports
		 */
		//	onExit: function() {
		//
		//	}
	});
});