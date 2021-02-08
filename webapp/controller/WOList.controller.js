sap.ui.define([
	"com/sap/incture/IMO_PM/controller/BaseController",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/BusyDialog",
	"com/sap/incture/IMO_PM/formatter/formatter",
	"com/sap/incture/IMO_PM/util/util",
	"sap/m/MessageBox",
	"sap/ui/core/util/Export",
	"sap/ui/core/util/ExportTypeCSV",
	"sap/ui/export/Spreadsheet"
], function (BaseController, Controller, JSONModel, Filter, FilterOperator, BusyDialog, formatter, util, MessageBox, Export,
	ExportTypeCSV, Spreadsheet) {
	"use strict";

	return BaseController.extend("com.sap.incture.IMO_PM.controller.WOList", {

		formatter: formatter,

		util: util,

		onInit: function () {
			//Application Model used only for Translation of texts
			this._router = this.getOwnerComponent().getRouter();
			var oResourceModel = this.getOwnerComponent().getModel("i18n");
			this.oResourceModel = oResourceModel.getResourceBundle();

			var oPortalDataModel = this.getOwnerComponent().getModel("oPortalDataModel");
			this.oPortalDataModel = oPortalDataModel;

			var oLookupDataModel = this.getOwnerComponent().getModel("oLookupDataModel");
			this.oLookupDataModel = oLookupDataModel;

			var oWorkOrderOData = this.getOwnerComponent().getModel("oWorkOrderOData");
			this.oWorkOrderOData = oWorkOrderOData;
			oWorkOrderOData.setHeaders({
				"Accept": "application/json",
				"Content-Type": "application/json"
			});

			var oPortalUserLoginOData = this.getOwnerComponent().getModel("oPortalUserLoginOData");
			this.oPortalUserLoginOData = oPortalUserLoginOData;

			var mLookupModel = this.getOwnerComponent().getModel("mLookupModel");
			this.mLookupModel = mLookupModel;
			mLookupModel.setSizeLimit(10000);

			var oViewSetting = {
				"iTop": 50,
				"iSkip": 0,
				"iWONumFilter": "",
				"sOrderTypeSelFilter": "",
				"sStatusSelFilter": "",
				"sWorderIdDesFilter": "",
				"sPriorSelFilter": "",
				"sAssignedTo": "",
				"sCreatedBy": "",
				"sEquipFilter": "",
				"sWorkCenterFilter": "",
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
				"iSelectedWOIndices": 0,
				"sWorkCenterSel": "",
				"sCreatedOnStart": formatter.GetMonthsBackDate(90), // Date Range for Enter Date
				"sCreatedOnEnd": new Date().toLocaleDateString()
			};
			this.mLookupModel.setProperty("/", oViewSetting);
			this.busy = new BusyDialog();
			this.getLoggedInUser();
			var that = this;
			this.router = sap.ui.core.UIComponent.getRouterFor(this);
			this.router.attachRoutePatternMatched(function (oEvent) {
				that.routePatternMatched(oEvent);
			});
		},

		//Function to initialize WO list view
		fnInitializeWO: function () {
			this.getOrderType();
			this.getWOPriorities();
			this.getFavEquips();
			this.getWorkCenters();
			this.fnFetchWOList();
			this.fnFetchKPIInfo();
			this.setTableVisibile(); //nischal -- Certain table columns are set visible initially
		},

		onAfterRendering: function () {
			this._setScreenHeights();
			sap.ui.Device.resize.attachHandler(function () {
				this._setScreenHeights();
			}.bind(this));

			//Attaching click event for the KPI tiles
			/*var that = this; //SH: Not needed - used GenericTile in view
			var oHbox = this.getView().byId("WO_LIST_KPI_TILES");
			var oItems = oHbox.getItems();
			for (var i = 0; i < oItems.length; i++) {
				var oVbox = oItems[i];
				oVbox.onclick = function (oEvent) {
					that.getKPIsWoList(oEvent);
				};
			}*/
		},

		//Function to get selected KPI tile and search WOs
		getKPIsWoList: function (oEvent) {
			var headerText = "";
			var serviceType = "";
			var oVbox = oEvent.srcControl;
			var oResourceModel = this.oResourceModel;
			// var selVBox = oVbox.getCustomData()[0].getValue();
			var selVBox = oEvent.getSource().getAriaLabel();

			switch (selVBox) {
			case "WO_LIST_PM_WORK_DUE":
				headerText = oResourceModel.getText("PMWODue");
				serviceType = "DUE_ORDERS";
				break;
			case "WO_LIST_OPEN_BD_ORDER":
				headerText = oResourceModel.getText("openBDOrder");
				serviceType = "BD_ORDERS";
				break;
			case "WO_LIST_ASSIGEND_TO_ME":
				headerText = oResourceModel.getText("asigned");
				serviceType = "ASSIGN_ORDERS";
				break;
			case "WO_LIST_SPARE_PART_RESERV":
				headerText = oResourceModel.getText("outstand");
				serviceType = "OUT_SP_ORDERS";
				break;
			case "WO_LIST_ASSIGNED_TO_WC":
				headerText = oResourceModel.getText("ASIGN_WORK_CENTER");
				serviceType = "WC_ORDERS";
				break;
			}
			this.fnGetKPIsWOs(serviceType, headerText);
		},

		_setScreenHeights: function () {
			var mLookupModel = this.mLookupModel;
			var rowCount = (sap.ui.Device.resize.height - 276) / 40;
			rowCount = Math.ceil(rowCount - 2);
			mLookupModel.setProperty("/rowCount", rowCount);
		},

		onCancelDialogEquip: function (oEvent) {
			this.equipmentsListDialog.close();
		},

		//Function to get Equiments List
		onSearchWOFilter: function (oEvent) {
			var that = this;
			this.busy.open();
			var mLookupModel = this.mLookupModel;
			var oPortalDataModel = this.oPortalDataModel;
			var userPlant = mLookupModel.getProperty("/userPlant");
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
					that.fnInitializeWO();
				},
				error: function (oData) {
					mLookupModel.setProperty("/userName", "");
				}
			});
		},

		getFavEquips: function () {
			var sUrl = "/FavEquipListSet";
			var oPortalDataModel = this.oPortalDataModel;
			var mLookupModel = this.mLookupModel;
			oPortalDataModel.read(sUrl, {
				success: function (oData) {
					mLookupModel.setProperty("/aFavEquipList", oData.results);
					mLookupModel.refresh();
				},
				error: function (oData) {
					mLookupModel.setProperty("/aFavEquipList", "");
					mLookupModel.refresh();
				}
			});
		},

		//Function to get Work Order type
		getOrderType: function () {
			var sUrl = "/WO_TYPESet";
			var mLookupModel = this.mLookupModel;
			var aOrderTypeSet = mLookupModel.getProperty("/aOrderTypeSet");
			if (!aOrderTypeSet) {
				var oLookupDataModel = this.oLookupDataModel;
				oLookupDataModel.read(sUrl, {
					success: function (oData) {
						aOrderTypeSet = oData.results;
						mLookupModel.setProperty("/aOrderTypeSet", aOrderTypeSet);
						mLookupModel.refresh();
					},
					error: function (oData) {
						mLookupModel.setProperty("/aOrderTypeSet", []);
						mLookupModel.refresh();
					}
				});
			}
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

		onEquipSelect: function (oEvent) {
			var mLookupModel = this.mLookupModel;
			var oSource = oEvent.getParameter("listItem");
			var sPath = oSource.getBindingContextPath();
			var iEqId = mLookupModel.getProperty(sPath + "/Equnr");
			var equipDesc = mLookupModel.getProperty(sPath + "/Eqktu");
			mLookupModel.setProperty("/sEquip", iEqId);
			mLookupModel.setProperty("/sEquipFilter", iEqId);
			mLookupModel.setProperty("/EquipDesc", equipDesc);
			this.equipmentsListDialog.close();
		},

		equipmentValueHelp: function (oEvent) {
			if (!this.equipmentsListDialog) {
				this.equipmentsListDialog = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.equipmentsListWoList", this);
				this.getView().addDependent(this.equipmentsListDialog);
			}
			this.equipmentsListDialog.open();
		},

		//Function to get Work order priorities
		getWOPriorities: function () {
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
					},
					error: function (oData) {
						mLookupModel.setProperty("/aPrioritySet", []);
						mLookupModel.refresh();
					}
				});
			}
		},

		//Function to get Work centers list
		getWorkCenters: function () {
			var sUrl = "/WorkcenterLookUpSet";
			var mLookupModel = this.mLookupModel;
			var oLookupDataModel = this.oLookupDataModel;
			var userPlant = mLookupModel.getProperty("/userPlant");
			var oFilter = [];
			oFilter.push(new Filter("Plant", "EQ", userPlant));
			oLookupDataModel.read(sUrl, {
				filters: oFilter,
				success: function (oData) {
					var aWorkCenterSet = oData.results;
					mLookupModel.setProperty("/aWorkCenterSet", aWorkCenterSet);
					mLookupModel.refresh();
				},
				error: function (oData) {
					mLookupModel.setProperty("/aWorkCenterSet", []);
					mLookupModel.refresh();
				}
			});
		},

		fnFetchKPIInfo: function () {
			var that = this;
			var mLookupModel = this.mLookupModel;
			var oPortalDataModel = this.oPortalDataModel;
			var sWorkCenterSel = mLookupModel.getProperty("/sWorkCenterSel");
			var userPlant = mLookupModel.getProperty("/userPlant");
			mLookupModel.setProperty("/bBusyworkcenter", true);
			if (sWorkCenterSel === undefined || sWorkCenterSel === null) {
				sWorkCenterSel = "";
			}

			var oFilter = [];
			oFilter.push(new Filter("Plant", "EQ", userPlant));
			oFilter.push(new Filter("WorkCenter", "EQ", sWorkCenterSel));
			oFilter.push(new Filter("Type", "EQ", "COUNT"));
			oPortalDataModel.read("/WorkOrderKPISet", {
				filters: oFilter,
				success: function (oData) {
					var oKPITilesCount = oData.results;
					that.fnGetKPICounts(oKPITilesCount);
					mLookupModel.setProperty("/bBusyworkcenter", false);
					mLookupModel.refresh();
					// that.getView().getContent()[0].getContent()[0].getFlexContent().rerender();
				},
				error: function (oData) {
					mLookupModel.setProperty("/bBusyworkcenter", false);
					mLookupModel.refresh();
				}
			});
		},

		//Function to Select/Un-select Work orders
		onSelectionChange: function (oEvent) {
			var mLookupModel = this.mLookupModel;
			var isSelectAll = oEvent.getParameters().selectAll;
			if (isSelectAll) {
				mLookupModel.setProperty("/selectedWOs", []);
				mLookupModel.setProperty("/iSelectedWOIndices", []);
				mLookupModel.refresh(true);
				return;
			}
			var rowContext = oEvent.getParameters().rowContext;
			if (!rowContext) {
				mLookupModel.setProperty("/selectedWOs", []);
				mLookupModel.setProperty("/iSelectedWOIndices", []);
				mLookupModel.refresh(true);
				return;
			}
			var oSelectedRow = rowContext.getPath();
			var selectedWOs = mLookupModel.getProperty("/selectedWOs");
			if (!selectedWOs) {
				selectedWOs = [];
			}
			var bVal = this.isWOSelected(oSelectedRow, selectedWOs);
			if (bVal[0]) {
				selectedWOs.splice(bVal[1], 1);
			} else {
				var oTempObj = {
					sPath: oSelectedRow
				};
				selectedWOs.push(oTempObj);
			}
			mLookupModel.setProperty("/selectedWOs", selectedWOs);
			mLookupModel.setProperty("/iSelectedWOIndices", selectedWOs.length);
			mLookupModel.refresh(true);
		},

		//Function top check if an WO is already selected, else un-select the operation
		isWOSelected: function (oSelectedRow, selectedWOs) {
			var bVal = [false];
			selectedWOs.filter(function (obj, index) {
				if (obj.sPath === oSelectedRow) {
					bVal = [true, index];
				}
			});
			return bVal;
		},

		onNavigatetoDetail: function (oEvent) {
			var mLookupModel = this.mLookupModel;
			var selectedWOs = mLookupModel.getProperty("/selectedWOs");
			var woNo = mLookupModel.getProperty(selectedWOs[0].sPath + "/Orderid");
			this._router.navTo("detailTabWO", {
				workOrderID: woNo
			});
			/*var sURL;
			var sHost = window.location.origin;
			var sBSPPath = "/sap/bc/ui5_ui5/sap/ZMYL_WOCREATE/index.html#/detailTabWO/";
			for (var i = 0; i < selectedWOs.length; i++) {
				var selWOOrderId = mLookupModel.getProperty(selectedWOs[i].sPath + "/Orderid");
				sURL = "https://lnvybdvpasstbo1j-imo-imo-pm.cfapps.eu10.hana.ondemand.com/IMO_PM/index.html#/detailTabWO/" + selWOOrderId;
				sap.m.URLHelper.redirect(sURL, true);
			}
			this.getView().byId("idWorkOrderList").clearSelection();
			mLookupModel.setProperty("/selectedWOs", []);
			mLookupModel.refresh();*/
		},
		handleLinkPress: function (oEvent) {
			//var sURL;
			var sNotifID = oEvent.getSource().getText();
			this._router.navTo("detailTabWO", {
				workOrderID: sNotifID
			});
			// sURL = "https://lnvybdvpasstbo1j-imo-imo-pm.cfapps.eu10.hana.ondemand.com/IMO_PM/index.html#/detailTabWO/" + sNotifID;
			// sap.m.URLHelper.redirect(sURL, true);

			/*var navUrl = "#/detailTabWO/" + sNotifID;
            var url = window.location.href.split('#')[0] + navUrl;
            window.open(url, '_blank');*/

		},

		onSaveWOFilter: function () {
			var that = this;
			var oResourceModel = this.oResourceModel;
			var sMsg;
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
				"refAssignedTo": mLookupModel.getProperty("/sAssignedTo"),
				"sCreatedOnStart": mLookupModel.getProperty("/sCreatedOnStart"), // Date Range for Enter Date
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
					var oComments = oData.results[0];
					if (oComments.RESPONSE !== "null") {
						sMsg = oResourceModel.getText("FILTER_SAVE_SUCCESS_MSG");
						that.showMessage(sMsg, "I");
					} else {
						sMsg = oResourceModel.getText("ERROR_SAVING_FILTER_MSG");
						that.showMessage(sMsg, "I");
					}
					that.busy.close();
				},
				error: function (oData) {
					sMsg = oResourceModel.getText("ERROR_SAVING_FILTER_MSG");
					that.showMessage(sMsg, "I");
					that.busy.close();
				}
			});
		},

		fnFetchWOList: function () {
			var that = this;
			var mLookupModel = this.mLookupModel;
			var iTop = mLookupModel.getProperty("/iTop");
			if (iTop === null || iTop === undefined) {
				iTop = 50;
			}
			var iSkip = mLookupModel.getProperty("/iSkip");
			if (iSkip === null || iSkip === undefined) {
				iSkip = 0;
			}
			var userPlant = mLookupModel.getProperty("/userPlant");
			var aWorkOrderListSet = mLookupModel.getProperty("/aWorkOrderListSet");
			var sCreatedOnStart = mLookupModel.getProperty("/sCreatedOnStart"); // Date Range for Enter Date
			var sCreatedOnEnd = mLookupModel.getProperty("/sCreatedOnEnd");
			if (!sCreatedOnStart) {
				sCreatedOnStart = formatter.GetMonthsBackDate(90);
			} else {
				sCreatedOnStart = new Date(sCreatedOnStart);
			}
			if (!sCreatedOnEnd) {
				sCreatedOnEnd = new Date();
			} else {
				sCreatedOnEnd = new Date(sCreatedOnEnd);
			}
			this.busy.open();
			var sUrl = "/WorkOrderListSet";
			var oPortalDataModel = this.oPortalDataModel;
			var oFilter = [];
			oFilter.push(new Filter("Orderid", "EQ", mLookupModel.getProperty("/iWONumFilter") === null || mLookupModel.getProperty(
				"/iWONumFilter") === undefined ? "" : mLookupModel.getProperty("/iWONumFilter")));

			oFilter.push(new Filter("OrderType", "EQ", mLookupModel.getProperty("/sOrderTypeSelFilter") === null || mLookupModel.getProperty(
				"/sOrderTypeSelFilter") === undefined ? "" : mLookupModel.getProperty("/sOrderTypeSelFilter")));

			oFilter.push(new Filter("SysStatus", "EQ", mLookupModel.getProperty("/sStatusSelFilter") === null || mLookupModel.getProperty(
				"/sStatusSelFilter") === undefined ? "" : mLookupModel.getProperty("/sStatusSelFilter")));

			oFilter.push(new Filter("WoDes", "EQ", mLookupModel.getProperty("/sWorderIdDesFilter") === null || mLookupModel.getProperty(
				"/sWorderIdDesFilter") === undefined ? "" : mLookupModel.getProperty("/sWorderIdDesFilter")));

			oFilter.push(new Filter("EnteredByName", "EQ", mLookupModel.getProperty("/sCreatedBy") === null || mLookupModel.getProperty(
				"/sCreatedBy") === undefined ? "" : mLookupModel.getProperty("/sCreatedBy")));

			oFilter.push(new Filter("Priority", "EQ", mLookupModel.getProperty("/sPriorSelFilter") === null || mLookupModel.getProperty(
				"/sPriorSelFilter") === undefined ? "" : mLookupModel.getProperty("/sPriorSelFilter")));

			oFilter.push(new Filter("AssignedTech", "EQ", mLookupModel.getProperty("/sAssignedTo") === null || mLookupModel.getProperty(
				"/sAssignedTo") === undefined ? "" : mLookupModel.getProperty("/sAssignedTo")));

			oFilter.push(new Filter("Equipment", "EQ", mLookupModel.getProperty("/sEquipFilter") === null || mLookupModel.getProperty(
				"/sEquipFilter") === undefined ? "" : mLookupModel.getProperty("/sEquipFilter")));

			oFilter.push(new Filter("MnWkCtr", "EQ", mLookupModel.getProperty("/sWorkCenterFilter") === null || mLookupModel.getProperty(
				"/sWorkCenterFilter") === undefined ? "" : mLookupModel.getProperty("/sWorkCenterFilter")));
			oFilter.push(new Filter("FunctLoc", "EQ", ""));
			oFilter.push(new Filter("Plant", "EQ", userPlant));
			oFilter.push(new Filter({
				filters: [new Filter("EnterDate", "GE", formatter.fnDatewithTimezoneoffset(sCreatedOnStart)),
					new Filter("EnterDate", "LE", formatter.fnDatewithTimezoneoffset(sCreatedOnEnd))
				],
				and: true
			}));
			oPortalDataModel.read(sUrl, {
				filters: oFilter,
				urlParameters: {
					"$top": iTop,
					"$skip": iSkip
				},
				success: function (oData) {
					aWorkOrderListSet = oData.results;
					if (iSkip !== 0) {
						aWorkOrderListSet = mLookupModel.getProperty("/aWorkOrderListSet").concat(aWorkOrderListSet);
					}
					$.each(aWorkOrderListSet, function (index, value) {
						value.PriorityDes = formatter.fnPriorityConversion(value.Priority);
						value.SysStatusDes = formatter.fnWOStatusConversion(value.SysStatus);
						if (value.StartDate) {
							value.StartDateString = that.fnDateConversionToSting(value.StartDate);
						}
						if (value.EnterDate) {
							value.EnterDateString = that.fnDateConversionToSting(value.EnterDate);
						}
						if (value.FinishDate) {
							value.FinishDateString = that.fnDateConversionToSting(value.FinishDate);
						}
					});
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
		},

		onCancelDialogWO: function () {
			this._oDialogWO.close();
		},

		onCreatebyRef: function () {
			this._oDialogOperns = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.operationsWOlist", this);
			this.getView().addDependent(this._oDialogOperns);
			this._oDialogOperns.setModel(this.getView().getModel("oWOListModel"));
			this._oDialogOperns.open();
		},

		onAssignWO: function () {
			this._oDialogAssignWO = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.assignWO", this);
			this.getView().addDependent(this._oDialogAssignWO);
			this._oDialogAssignWO.open();
		},

		// clearing live search by id or desc
		onApplyFilter: function () {
			var mLookupModel = this.mLookupModel;
			var sCreatedOnStart = mLookupModel.getProperty("/sCreatedOnStart");
			var sCreatedOnEnd = mLookupModel.getProperty("/sCreatedOnEnd");
			if (!sCreatedOnEnd || sCreatedOnEnd === "00000000" || sCreatedOnEnd === undefined || sCreatedOnEnd === null) {
				sCreatedOnEnd = new Date().toLocaleDateString();
			}
			var nDuration = formatter.getCreatedOnFilterDuration(sCreatedOnStart, sCreatedOnEnd);
			if (nDuration <= 90) {
				mLookupModel.setProperty("/sWorderIdDesFilter", "");
				mLookupModel.setProperty("/selectedWOs", []);
				mLookupModel.setProperty("/iSelectedWOIndices", 0);
				this.getView().byId("idWorkOrderList").clearSelection();
				mLookupModel.refresh();
				this.fnFetchWOList();
				// this._oDialogWO.close();
			} else {
				MessageBox.error("Please select Created on Date range within 90 days. ", {
					actions: [MessageBox.Action.OK],
					emphasizedAction: MessageBox.Action.OK
				});
			}

		},

		onHandleAdvFilterWO: function (oEvent) {
			if (!this._oDialogWO) {
				this._oDialogWO = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.advanceFilterWoList", this);
				this.getView().addDependent(this._oDialogWO);
			}

			//var that = this;
			// var mLookupModel = this.mLookupModel;
			// this.busy.open();
			// var sUrl = "/GetWorkOrderVariantSet";
			// var oPortalDataModel = this.oPortalDataModel;
			// var oFilter = [];
			// var oRequest = {
			// 	"userId": mLookupModel.getProperty("/userName"),
			// 	"filterType": "reference"
			// };
			// oFilter.push(new Filter("REQUEST", "EQ", JSON.stringify(oRequest)));
			// oPortalDataModel.read(sUrl, {
			// 	filters: oFilter,
			// 	success: function (oData) {
			// 		var oComments = oData.results[0];
			// 		if (oComments.RESPONSE) {
			// 			oComments = JSON.parse(oComments.RESPONSE);
			// 			mLookupModel.setProperty("/idwofilter", oComments.id);
			// 			mLookupModel.setProperty("/sOrderTypeSelFilter", oComments.refWOType);
			// 			mLookupModel.setProperty("/sPriorSelFilter", oComments.refPriority);
			// 			mLookupModel.setProperty("/sStatusSelFilter", oComments.refStatus);
			// 			mLookupModel.setProperty("/iWONumFilter", oComments.refWONumber);
			// 			mLookupModel.setProperty("/sEquipFilter", oComments.refEquipment);
			// 			mLookupModel.setProperty("/sCreatedBy", oComments.refCreatedBy);
			// 			mLookupModel.setProperty("/sAssignedTo", oComments.refAssignedTo);
			// 			mLookupModel.setProperty("/sWorkCenterFilter", "");
			// 			mLookupModel.refresh();
			// 		} else {
			// 			mLookupModel.setProperty("/idwofilter", "");
			// 			mLookupModel.setProperty("/sOrderTypeSelFilter", "");
			// 			mLookupModel.setProperty("/sPriorSelFilter", "");
			// 			mLookupModel.setProperty("/sStatusSelFilter", "");
			// 			mLookupModel.setProperty("/iWONumFilter", "");
			// 			mLookupModel.setProperty("/sEquipFilter", "");
			// 			mLookupModel.setProperty("/sCreatedBy", "");
			// 			mLookupModel.setProperty("/sAssignedTo", "");
			// 			mLookupModel.setProperty("/sWorkCenterFilter", "");
			// 			mLookupModel.refresh();
			// 		}
			// 		that.busy.close();
			// 	},
			// 	error: function (oData) {
			// 		mLookupModel.setProperty("/idwofilter", "");
			// 		mLookupModel.setProperty("/sOrderTypeSelFilter", "");
			// 		mLookupModel.setProperty("/sPriorSelFilter", "");
			// 		mLookupModel.setProperty("/sStatusSelFilter", "");
			// 		mLookupModel.setProperty("/iWONumFilter", "");
			// 		mLookupModel.setProperty("/sEquipFilter", "");
			// 		mLookupModel.setProperty("/sCreatedBy", "");
			// 		mLookupModel.setProperty("/sAssignedTo", "");
			// 		mLookupModel.setProperty("/sWorkCenterFilter", "");
			// 		mLookupModel.refresh();
			// 		that.busy.close();
			// 	}
			// });
			this._oDialogWO.open();
		},

		// to find selected user details from user list fragment
		onAssignTech: function () {
			var that = this;
			var oResourceModel = this.oResourceModel;
			this.busy.open();
			var msg;
			var mLookupModel = this.mLookupModel;
			var sUserSelected = mLookupModel.getProperty("/sUserSelected");
			var oWorkOrderOData = this.oWorkOrderOData;
			if (!sUserSelected) {
				var sMsg = oResourceModel.getText("SELECT_TECHNICIAN_MSG");
				that.showMessage(sMsg, "I");
				this.busy.close();
			} else {
				var oTable = this.getView().byId("idWorkOrderList");
				var aSelectedWOsContext = mLookupModel.getProperty("/selectedWOs");
				//to find selected WO details
				var iOdataCounter = 0;
				var messagesFinal = [];
				for (var i = 0; i < aSelectedWOsContext.length; i++) {
					var aWorkOrderList = oTable.getBindingInfo("rows").binding.getModel();
					var oSelectedWO = aWorkOrderList.getProperty(aSelectedWOsContext[i].sPath);
					var sFlag = "C";
					var sOldTech = "";
					if (oSelectedWO.Technicianname !== "") {
						sFlag = "U";
						sOldTech = oSelectedWO.AssignedTech;
					}
					var oPayload = {
						"Orderid": oSelectedWO.Orderid,
						"OrderType": oSelectedWO.OrderType,
						"Equipment": oSelectedWO.Equipment,
						"FunctLoc": oSelectedWO.FunctLoc,
						"Priority": oSelectedWO.Priority,
						"ReportedBy": oSelectedWO.EnteredBy, // missing available only in notification details
						"Plant": oSelectedWO.Maintplant,
						"Pmacttype": "",
						"NotifNo": oSelectedWO.NotifNo,
						"Systcond": oSelectedWO.Systcond,
						"Maintplant": oSelectedWO.Maintplant,
						"Planplant": oSelectedWO.Planplant,
						"DateCreated": formatter.formatDateobjToString(oSelectedWO.EnterDate),
						"PlanStartDate": formatter.formatDateobjToString(oSelectedWO.StartDate),
						"PlanEndDate": formatter.formatDateobjToString(oSelectedWO.FinishDate),
						"OrderStatus": formatter.fnWOStatusConversion(oSelectedWO.SysStatus),
						"HEADERTOPARTNERNAV": [{
							"Orderid": "",
							"PARTNERNAV": sFlag,
							"AssignedTo": sUserSelected,
							"PARTNEROLD": sOldTech
						}],
						"HEADERTOMESSAGENAV": [{
							"Message": "",
							"Status": ""
						}],
						"MnWkCtr": oSelectedWO.MnWkCtr,
						"MalFunStartDate": formatter.formatDateobjToString(oSelectedWO.EnterDate), // misssing
						"Plangroup": oSelectedWO.Plangroup,
						"ShortText": oSelectedWO.ShortText
					};

					oWorkOrderOData.setHeaders({
						"X-Requested-With": "X"
					});

					oWorkOrderOData.create("/WorkorderHeaderSet", oPayload, {
						success: function (sData, oResponse) {
							var messages = sData.HEADERTOMESSAGENAV.results;
							if (messages[0].Status === "S" && messages[0].Message === "Success") {
								msg = oResourceModel.getText("ASSIGN_TECH1_MSG") + sData.Orderid + " " + oResourceModel.getText("ASSIGN_TECH2_MSG");
								messagesFinal.push({
									"Status": "S",
									"Message": msg
								});
							} else {
								messagesFinal.push(messages[0]);
								msg = oResourceModel.getText("ASSIGN_TECH1_MSG") + sData.Orderid + " " + oResourceModel.getText("ASSIGN_TECH3_MSG");
								messagesFinal.push({
									"Status": "E",
									"Message": msg
								});
							}
							iOdataCounter++;
							if (iOdataCounter === aSelectedWOsContext.length) {
								that._oDialogAssignWO.close();
								mLookupModel.setProperty("/aUsers", []);
								that.getView().byId("idWorkOrderList").clearSelection();
								mLookupModel.setProperty("/selectedWOs", []);
								mLookupModel.refresh(true);
								that.busy.close();
								that.fnShowSuccessErrorMsg(messagesFinal);
								that.onSearchWO();
							}
						},
						error: function (oResponse) {
							msg = oResourceModel.getText("TECHNICIAN_SOME_ORDER_NOT_UPDATE_SUCCESSFULLY_MSG");
							messagesFinal.push({
								"Status": "E",
								"Message": msg
							});
							iOdataCounter++;
							if (iOdataCounter === aSelectedWOsContext.length) {
								that._oDialogAssignWO.close();
								mLookupModel.setProperty("/aUsers", []);
								that.getView().byId("idWorkOrderList").clearSelection();
								mLookupModel.setProperty("/selectedWOs", []);
								mLookupModel.refresh(true);
								that.busy.close();
								that.fnShowSuccessErrorMsg(messagesFinal);
								that.onSearchWO();
							}
						}
					});
				}
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

		onCancelDialogAssign: function () {
			this.mLookupModel.setProperty("/aUsers", []);
			this._oDialogAssignWO.close();
		},

		//Function to open Digital signaure pop-up
		onOpenDigitalSignPopup: function (oEvent) {

			var oUserTable = oEvent.getSource().getParent().getContent()[1].getContent()[0];
			var sPath = oUserTable.getSelectedContextPaths()[0];
			var oSelectedItem = oUserTable.getSelectedItem().getModel("mLookupModel").getProperty(sPath);
			var sUserIdSel = oSelectedItem.Bname;
			this.mLookupModel.setProperty("/sUserSelected", sUserIdSel);

			this.onAssignTech();

			//disable digitalsignaturepopup
			/*var oUserTable = oEvent.getSource().getParent().getContent()[1].getContent()[0];
			var sPath = oUserTable.getSelectedContextPaths()[0];
			var oSelectedItem = oUserTable.getSelectedItem().getModel("mLookupModel").getProperty(sPath);
			var sUserIdSel = oSelectedItem.Bname;
			this.mLookupModel.setProperty("/sUserSelected", sUserIdSel);

			if (!this.digitalSignaturePopUp) {
				this.digitalSignaturePopUp = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.digitalSignaturePopup", this);
				this.getView().addDependent(this.digitalSignaturePopUp);
			}
			this.digitalSignaturePopUp.open();*/
		},

		//Function to close Digital signaure pop-up
		onCloseDigitalSignPopUp: function () {
			this.digitalSignaturePopUp.close();
		},

		//Function to Validate User Id and Password for logged in user
		fnValidateLoggedInUser: function () {
			var that = this;
			var oResourceModel = this.oResourceModel;
			var mLookupModel = this.mLookupModel;
			var oPortalUserLoginOData = this.oPortalUserLoginOData;
			var oUserName = mLookupModel.getProperty("/userName");
			var oDigitalSign = mLookupModel.getProperty("/digitalSign");
			if (!oDigitalSign) {
				that.showMessage(oResourceModel.getText("ENTER_PASSWORD_MSG"));
				return;
			}

			oDigitalSign = btoa(oDigitalSign);
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
						that.onAssignTech();
					} else {
						that.showMessage(oMessage);
						that.busy.close();
					}
					that.onCloseDigitalSignPopUp();
				},
				error: function (oData) {
					mLookupModel.setProperty("/digitalSign", "");
					that.showMessage(oResourceModel.getText("VALIDATING_USER_ERROR_MSG"));
					that.busy.close();
				}
			});
		},

		//Function to search Users 
		onSearchUser: function (oEvent) {
			var oModel = this.oPortalDataModel;
			var mLookupModel = this.mLookupModel;
			var sUserId = oEvent.getSource().getValue();
			var oFilter = [];
			oFilter.push(new Filter("Bname", "EQ", sUserId.toUpperCase()));
			oModel.read("/UsersListSet", {
				filters: oFilter,
				success: function (oData, oResponse) {
					mLookupModel.setProperty("/aUsers", oData.results);
					mLookupModel.refresh();
				},
				error: function (oResponse) {
					mLookupModel.setProperty("/aUsers", []);
				}
			});
		},

		onCancelDialogOperns: function () {
			this._oDialogOperns.close();
		},

		onSearchWStations: function (oEvent) {
			var aFilters = [];
			var sQuery = oEvent.getSource().getValue();
			if (sQuery && sQuery.length > 0) {
				var oFilterWStaions = new Filter({
					filters: [new Filter("WID", FilterOperator.Contains, sQuery), new Filter("WNAME", FilterOperator.Contains, sQuery)],
					and: false
				});
				aFilters.push(oFilterWStaions);
			}
			var oTable = oEvent.getSource().getParent().getParent().getItems()[1].getContent()[1].getContent()[0];
			var oBinding = oTable.getBinding("items");
			oBinding.filter(aFilters);
		},

		handleLoadMoreRecords: function () {
			this.getView().byId("idWorkOrderList").clearSelection();
			var mLookupModel = this.mLookupModel;
			mLookupModel.setProperty("/selectedWOs", []);
			mLookupModel.setProperty("/iSelectedWOIndices", 0);
			var iSkip = mLookupModel.getProperty("/iSkip") + 50;
			mLookupModel.setProperty("/iSkip", iSkip);
			mLookupModel.refresh(true);
			this.fnFetchWOList();
		},

		onSearchWO: function (oEvent) {
			var mLookupModel = this.mLookupModel;
			mLookupModel.setProperty("/selectedWOs", []);
			mLookupModel.setProperty("/iSelectedWOIndices", 0);
			this.getView().byId("idWorkOrderList").clearSelection();
			mLookupModel.setProperty("/iSkip", 0);
			mLookupModel.setProperty("/aWorkOrderListSet", []);
			this.fnFetchWOList();
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
			mLookupModel.setProperty("/sCreatedOnStart", formatter.GetMonthsBackDate(90)); // Date Range for Enter Date
			mLookupModel.setProperty("/sCreatedOnEnd", new Date().toLocaleDateString());
		},
		woListAdvFilterPanelOpen: function (oEvent) {
			var oNotifWrapPanel = this.byId("filterWrapPanelWOList");
			oNotifWrapPanel.setExpanded(!oNotifWrapPanel.getExpanded());
		},
		routePatternMatched: function (oEvent) {
			if (oEvent.getParameter("name") === "WOList") {
				this.getLoggedInUser();
			}
			this.mLookupModel.setProperty("/sCreatedOnStart", formatter.GetMonthsBackDate(90)); // Date Range for Enter Date
			this.mLookupModel.setProperty("/sCreatedOnEnd", new Date().toLocaleDateString());
		},
		//nischal
		onPressColumnAdd: function (oEvent) {
			if (!this.addRemoveColumnDialog) {
				this.addRemoveColumnDialog = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.addRemoveColumn", this);
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
		//nischal
		setTableVisibile: function () {
			var mLookupModel = this.mLookupModel;
			mLookupModel.setProperty("/sTWoNum", true);
			mLookupModel.setProperty("/sTWoDesc", true);
			mLookupModel.setProperty("/sTFunctLoc", true);
			mLookupModel.setProperty("/sTmainWrkCtr", true);
			mLookupModel.setProperty("/sTWoType", true);
			mLookupModel.setProperty("/sTequip", true);
			mLookupModel.setProperty("/sTtechId", false);
			mLookupModel.setProperty("/sTequipDesc", false);
			mLookupModel.setProperty("/sTassignedTech", false);
			mLookupModel.setProperty("/sTsysStatus", true);
			mLookupModel.setProperty("/sTuserStatus", false);
			mLookupModel.setProperty("/sTmaintPlant", true);
			mLookupModel.setProperty("/sTbdFlag", false);
			mLookupModel.setProperty("/sTpriority", true);
			mLookupModel.setProperty("/sTcreatedBy", true);
			mLookupModel.setProperty("/sTCreatedDate", false);
		},
		//nischal --
		onExport: function (oEvent) {
			var mLookupModel = this.mLookupModel;
			if (!this._oTable) {
				this._oTable = this.byId('idWorkOrderList');
			}
			var oTable = this._oTable;
			var aIndices = oTable.getSelectedIndices();
			var oRowData = this.getDateSource(oTable, aIndices);
			var oColumns = this.getColumns(oTable);
			var oSettings = {
				workbook: {
					columns: oColumns
				},
				dataSource: oRowData,
				worker: false,
				fileName: "WorkOrder_List.xlsx",
				showProgress: true
			};
			if (aIndices.length > 0) {
				new Spreadsheet(oSettings).build();
			} else {
				MessageBox.warning("You have not selected any WorkOrder. Please Select WorkOrder from List.");
			}
		},
		//nischal -- function to form data source
		getDateSource: function (oTable, aIndices) {
			var mLookupModel = this.mLookupModel;
			var oRowData = new Array();
			var path = oTable.getBinding().sPath;
			for (var i = 0; i < aIndices.length; i++) {
				var sPath = path + "/" + aIndices[i];
				oRowData.push(mLookupModel.getProperty(sPath));
			}
			return oRowData;
		},
		//nischal
		getColumns: function (oTable) {
			var mLookupModel = this.mLookupModel;
			// var aColumns = oTable.getColumns();
			// var aItems = oTable.getRows();
			var aCols = [];
			if (mLookupModel.getProperty("/sTWoType")) {
				aCols.push({
					label: "WO Type",
					property: "OrderType"
				});
			}
			if (mLookupModel.getProperty("/sTWoNum")) {
				aCols.push({
					label: "Order",
					property: "Orderid"
				});
			}
			if (mLookupModel.getProperty("/sTWoDesc")) {
				aCols.push({
					label: "Description",
					property: "WoDes",
					width: 40
				});
			}
			if (mLookupModel.getProperty("/sTFunctLoc")) {
				aCols.push({
					label: "FunctLoc",
					property: "FunctLoc",
					width: 30
				});
			}
			if (mLookupModel.getProperty("/sTequip")) {
				aCols.push({
					label: "Equipment",
					property: "Equipment"
				});
			}
			if (mLookupModel.getProperty("/sTequipDesc")) {
				aCols.push({
					label: "Equip Description",
					property: "EquipDes",
					width: 30
				});
			}
			if (mLookupModel.getProperty("/sTtechId")) {
				aCols.push({
					label: "Tech Id",
					property: "TechId",
					width: 30
				});
			}
			if (mLookupModel.getProperty("/sTmainWrkCtr")) {
				aCols.push({
					label: "WorkCenter",
					property: "MnWkCtr"
				});
			}
			if (mLookupModel.getProperty("/sTmaintPlant")) {
				aCols.push({
					label: "Plant",
					property: "Planplant"
				});
			}

			if (mLookupModel.getProperty("/sTsysStatus")) {
				aCols.push({
					label: "System Status",
					property: "SysStatusDes"
				});
			}
			if (mLookupModel.getProperty("/sTuserStatus")) {
				aCols.push({
					label: "User Status",
					property: "Userstatus"
				});
			}
			if (mLookupModel.getProperty("/sTassignedTech")) {
				aCols.push({
					label: "Assigned Tech",
					property: "Technicianname"
				});
			}
			if (mLookupModel.getProperty("/sTbdFlag")) {
				aCols.push({
					label: "BD Flag",
					property: "Bdflag"
				});
			}
			if (mLookupModel.getProperty("/sTpriority")) {
				aCols.push({
					label: "Priority",
					property: "PriorityDes"
				});
			}
			if (mLookupModel.getProperty("/sTcreatedBy")) {
				aCols.push({
					label: "Created By",
					property: "EnteredByName"
				});
			}
			if (mLookupModel.getProperty("/sTCreatedDate")) {
				aCols.push({
					label: "Created Date",
					property: "EnterDateString"
				});
			}

			return aCols;
		},
		//nischal -- function to select all the checkbox value
		onSelectAll: function () {
			var mLookupModel = this.mLookupModel;
			mLookupModel.setProperty("/sTWoNum", true);
			mLookupModel.setProperty("/sTWoDesc", true);
			mLookupModel.setProperty("/sTFunctLoc", true);
			mLookupModel.setProperty("/sTmainWrkCtr", true);
			mLookupModel.setProperty("/sTWoType", true);
			mLookupModel.setProperty("/sTequip", true);
			mLookupModel.setProperty("/sTtechId", true);
			mLookupModel.setProperty("/sTequipDesc", true);
			mLookupModel.setProperty("/sTassignedTech", true);
			mLookupModel.setProperty("/sTsysStatus", true);
			mLookupModel.setProperty("/sTuserStatus", true);
			mLookupModel.setProperty("/sTmaintPlant", true);
			mLookupModel.setProperty("/sTbdFlag", true);
			mLookupModel.setProperty("/sTpriority", true);
			mLookupModel.setProperty("/sTcreatedBy", true);
			mLookupModel.setProperty("/sTCreatedDate", true);
		}
	});
});