sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/format/DateFormat",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/m/BusyDialog",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"com/sap/incture/IMO_PM/util/util",
	"com/sap/incture/IMO_PM/formatter/formatter",
	"sap/ui/core/routing/History",
	"sap/m/MessageToast"
], function (Controller, DateFormat, JSONModel, MessageBox, BusyDialog, Filter, FilterOperator, util, formatter, History, MessageToast) {

	"use strict";

	return Controller.extend("com.sap.incture.IMO_PM.controller.BaseController", {
		util: util,
		formatter: formatter,
		//"com/mylan/createWorkOrder/formatter/formatter",
		//  backButton logic start 
		getRouter: function () {
			return sap.ui.core.UIComponent.getRouterFor(this);
		},
		// back to notif list 
		onBackTo_Notif_list: function (oEvent) {
			var oHistory, sPreviousHash;
			oHistory = History.getInstance();
			sPreviousHash = oHistory.getPreviousHash();
			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				this.getRouter().navTo("notifList", {}, true /*no history*/ );

			}
		},
		// back to WO list 
		onBack_To_WO_list: function (oEvent) {
			var oHistory, sPreviousHash;
			oHistory = History.getInstance();
			sPreviousHash = oHistory.getPreviousHash();
			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				this.getRouter().navTo("WOList", {}, true /*no history*/ );

			}
		},
		//Function to show Message box/Toast message based on Success/Error statues
		showMessage: function (pMessage, pMsgTyp, pHandler, oTaskType, oSelectedObj) {

			if (pMessage.trim().length === 0) {
				return;
			}
			if (["A", "E", "I", "S", "W", "C"].indexOf(pMsgTyp) === -1) {
				sap.m.MessageToast.show(pMessage);
			} else {
				var sIcon = "";

				switch (pMsgTyp) {
				case "W":
					sIcon = "WARNING";
					break;
				case "E":
					sIcon = "ERROR";
					break;
				case "I":
					sIcon = "INFORMATION";
					break;
				case "S":
					sIcon = "SUCCESS";
					break;
				case "A":
					sIcon = "NONE";
					break;
				case "C":
					sIcon = "CONFIRM";
					break;
				default:
				}

				if (sIcon === "CONFIRM") {
					MessageBox.confirm(pMessage, {
						icon: "QUESTION",
						title: sIcon,
						actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
						onClose: function (oAction) {
							if (oAction === "OK") {
								//that.onConfirmTaskAction(oTaskType, oSelectedObj);
							}
						}
					});
				} else {
					MessageBox.show(pMessage, {
						icon: sIcon,
						title: sIcon,
						onClose: pHandler
					});
				}
			}
		},

		onPressHome: function (oEvent) {

			/*var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("Launch");*/
			var sURL = "https://lnvybdvpasstbo1j-imo-imo-pm.cfapps.eu10.hana.ondemand.com/IMO_PM/index.html";
			sap.m.URLHelper.redirect(sURL, false);
		},

		//Function to get KPI's tile count WOs
		fnGetKPIsWOs: function (serviceType, headerText) {
			var that = this;
			this.busy.open();
			var mLookupModel = this.mLookupModel;
			mLookupModel.setProperty("/kpiWOlist", []);
			var oPortalDataModel = this.oPortalDataModel;
			var userPlant = mLookupModel.getProperty("/userPlant");
			var sWorkCenterSel = mLookupModel.getProperty("/sWorkCenterSel");
			if (sWorkCenterSel === undefined || sWorkCenterSel === null) {
				sWorkCenterSel = "";
			}

			var oFilter = [];
			oFilter.push(new Filter("Plant", "EQ", userPlant));
			if (serviceType === "WC_ORDERS") {
				oFilter.push(new Filter("WorkCenter", "EQ", sWorkCenterSel));
			}
			oFilter.push(new Filter("Type", "EQ", serviceType));
			oPortalDataModel.read("/WorkOrderKPISet", {
				filters: oFilter,
				success: function (oData) {
					var kpiWOlist = oData.results;
					mLookupModel.setProperty("/kpiWOlist", kpiWOlist);
					mLookupModel.setProperty("/kpiWOHeader", headerText);
					mLookupModel.refresh();
					that.openKPIWOListPopover();
					that.busy.close();
				},
				error: function (oData) {
					mLookupModel.setProperty("/kpiWOlist", []);
					mLookupModel.refresh();
					that.busy.close();
				}
			});
		},

		//Function to open KPI WO list pop-over
		openKPIWOListPopover: function () {
			if (!this.kpiWOList) {
				this.kpiWOList = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.kpiWOList", this);
				this.getView().addDependent(this.kpiWOList);
			}
			this.kpiWOList.open();
		},

		//Function to close KPI WO list pop-over
		closeKPIWOListPopover: function () {
			this.kpiWOList.close();
			this.mLookupModel.setProperty("/selectedKPIWOs", []);
			sap.ui.getCore().byId("WO_KPI_LIST_TBL").clearSelection();
		},

		//FUnction to get selected WOs
		getSelectedKPIsWOs: function (oEvent) {
			var mLookupModel = this.mLookupModel;
			var rowContext = oEvent.getParameters().rowContext;
			if (!rowContext) {
				return;
			}
			var oSelectedRow = rowContext.getPath();
			var selectedObj = mLookupModel.getProperty(oSelectedRow);
			var oWoNo = selectedObj.Number;
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("detailTabWO", {
				workOrderID: oWoNo
			});
			/*var selectedWOs = mLookupModel.getProperty("/selectedKPIWOs");
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
			mLookupModel.setProperty("/selectedKPIWOs", selectedWOs);
			mLookupModel.refresh(true);*/
		},

		//Function to view KPIs WOs detail in new tab
		viewKPIWODetails: function (oEvent) {
			// var sURL;
			var sHost = window.location.origin;
			var mLookupModel = this.mLookupModel;
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var selectedWOs = mLookupModel.getProperty("/selectedKPIWOs");
			// var sBSPPath = "/sap/bc/ui5_ui5/sap/ZMYL_WOCREATE/index.html#/detailTabWO/";
			for (var i = 0; i < selectedWOs.length; i++) {
				var selWOOrderId = mLookupModel.getProperty(selectedWOs[i].sPath + "/Number");
				// sURL = sHost + sBSPPath + selWOOrderId;
				// sURL = "https://ub2qkdfhxg4ubmgqmta-imo-pm-imo-pm.cfapps.eu10.hana.ondemand.com/IMO_PM/index.html#/detailTabWO/" + selWOOrderId;
				// sap.m.URLHelper.redirect(sURL, true);
				oRouter.navTo("detailWO", {
					workOrderID: selWOOrderId
				});
			}
			sap.ui.getCore().byId("WO_KPI_LIST_TBL").clearSelection();
			mLookupModel.setProperty("/selectedKPIWOs", []);
			mLookupModel.refresh();
		},

		//Function to get KPI Tile counts on load
		fnGetKPICounts: function (oKPITilesCount) {
			var mLookupModel = this.mLookupModel;
			var oKPIInfo = mLookupModel.getProperty("/oKPIInfo");
			if (oKPIInfo === undefined) {
				oKPIInfo = {};
			}
			oKPIInfo.Assign_to_WC = "";
			for (var i = 0; i < oKPITilesCount.length; i++) {
				if (oKPITilesCount[i].Description === "BD_ORDERS") {
					oKPIInfo.Open_br_dn_order = oKPITilesCount[i].Number;
				}
				if (oKPITilesCount[i].Description === "ASSIGN_ORDERS") {
					oKPIInfo.Assign_to_me = oKPITilesCount[i].Number;
				}
				if (oKPITilesCount[i].Description === "DUE_ORDERS") {
					oKPIInfo.WO_due = oKPITilesCount[i].Number;
				}
				if (oKPITilesCount[i].Description === "OUT_SP_ORDERS") {
					oKPIInfo.Otstndng_spare_prt = oKPITilesCount[i].Number;
				}
				if (oKPITilesCount[i].Description === "WC_ORDERS") {
					oKPIInfo.Assign_to_WC = oKPITilesCount[i].Number;
				}
			}
			mLookupModel.setProperty("/oKPIInfo", oKPIInfo);
			mLookupModel.refresh();
		},
		//Function to initalize Spare Parts app
		fnInitSparePartsApp: function () {

			this.busy = new BusyDialog();
			this.MessageBox = MessageBox;

			this.DateFormat = DateFormat.getDateTimeInstance({
				pattern: "yyyy-MM-dd HH:mm:ss"
			});

			this.oHeader = {
				"Accept": "application/json",
				"Content-Type": "application/json"
			};

			//ODataModel holding metadata of Application's services
			var oPortalDataModel = this.getOwnerComponent().getModel("oPortalDataModel");
			this.oPortalDataModel = oPortalDataModel;

			//ODataModel holding metadata of Application's lookup services
			var oLookupDataModel = this.getOwnerComponent().getModel("oLookupDataModel");
			this.oLookupDataModel = oLookupDataModel;

			//Application Model used only for Translation of texts
			var oResourceModel = this.getOwnerComponent().getModel("i18n");
			this.oResourceModel = oResourceModel.getResourceBundle();

			//View Model used for configuring UI controls, and not for GET/POST [View:Spare Parts]
			var oSparePartViewModel = this.getOwnerComponent().getModel("oSparePartViewModel");
			this.oSparePartViewModel = oSparePartViewModel;

			//View Model used for configuring UI controls, and not for GET/POST [View:to set properties]
			var oViewPropertyModel = this.getOwnerComponent().getModel("oViewPropertyModel");
			this.oViewPropertyModel = oViewPropertyModel;

			// Application Model used only for storing of Application's lookups
			var mLookupModel = this.getOwnerComponent().getModel("mLookupModel");
			this.mLookupModel = mLookupModel;
			mLookupModel.setSizeLimit(10000);

			//View Model used for configuring UI controls, and not for GET/POST [View:to show BOM]
			var mEquipDetailModel = this.getOwnerComponent().getModel("mEquipDetailModel");
			this.mEquipDetailModel = mEquipDetailModel;

			//ODataModel holding metadata of Application's GET/POST of WorkOrder Detail only!!
			var oWorkOrderOData = this.getOwnerComponent().getModel("oWorkOrderOData");
			this.oWorkOrderOData = oWorkOrderOData;
			oWorkOrderOData.setHeaders({
				"Accept": "application/json",
				"Content-Type": "application/json"
			});

			//Data Model holding Work Order details, used to set only for GET/POST [View: Work Order Detail]
			var oWorkOrderDetailModel = this.getOwnerComponent().getModel("oWorkOrderDetailModel");
			this.oWorkOrderDetailModel = oWorkOrderDetailModel;

			//Data Model used for holding Application's logged in user details
			var oUserDetailModel = this.getOwnerComponent().getModel("oUserDetailModel");
			this.oUserDetailModel = oUserDetailModel;
			this.getLoggedInUserSpareparts();
		},
		//Function to get Application's initial lookups
		setAppInitData: function (fromView) {
			//this.getLoggedInUserSpareparts();
			this.getFavEquips();
		},
		/*		//Function to get Application's initial lookups from create notification
			setAppInitData: function () {
				this.resetUIFields();
				this.getNotificationType();
				this.getPlannerGroups();
				this.getDamageCode();
				this.getCauseCode();
				this.getFavEquips();
			},*/

		//Function to get logged in user
		getLoggedInUserSpareparts: function () {
			var that = this;
			this.busy.open();
			var sUrl = "/UserDetailsSet('')";
			var oPortalDataModel = this.oPortalDataModel;
			var oUserDetailModel = this.oUserDetailModel;
			oPortalDataModel.read(sUrl, {
				success: function (oData) {
					oUserDetailModel.setProperty("/firstName", oData.Firstname);
					oUserDetailModel.setProperty("/fullName", oData.Fullname);
					oUserDetailModel.setProperty("/secondName", oData.Secondname);
					oUserDetailModel.setProperty("/userName", oData.UserName);
					oUserDetailModel.setProperty("/userRole", oData.Role);
					oUserDetailModel.setProperty("/userPlant", oData.UserPlant);
					oUserDetailModel.refresh();
					util.fnSetUserName(oData.UserName, that.oWorkOrderDetailModel);
					that.busy.close();
				},
				error: function (oData) {
					oUserDetailModel.setProperty("/userName", "");
					oUserDetailModel.refresh();
					that.busy.close();
				}
			});
		},
		//Function to get Application's initial lookups
		setAppInitDataNotifList: function (viewType) {
			if (viewType === "NOTIF_LIST_VIEW") {
				this.fnFetchNotifList();
				this.getNotificationKPICount();
				this.setColumnsVisible();
			} else {
				this.getWOPriorities();
				this.fnFetchDetailNotifList();
				this.getOrderType();
			}
			this.getNotificationType();
			this.getPlannerGroupsNotifList();
			this.getDamageCode();
			this.getCauseCode();
			this.getFavEquips();
			this.getWorkCentersNotifList();
			this.getFnLocs();
		},
		//Function to get Work centers list
		getWorkCentersNotifList: function () {
			var sUrl = "/WorkcenterLookUpSet";
			var mLookupModel = this.mLookupModel;
			var oLookupDataModel = this.oLookupDataModel;
			var oFilter = [];
			var userPlant = this.oUserDetailModel.getProperty("/userPlant");
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

		//Function to get logged in user
		getLoggedInUserNotifList: function (viewType) {
			var that = this;
			var sUrl = "/UserDetailsSet('')";
			var oPortalDataModel = this.oPortalDataModel;
			var oUserDetailModel = this.oUserDetailModel;
			var mLookupModel = this.mLookupModel;
			oPortalDataModel.read(sUrl, {
				success: function (oData) {
					oUserDetailModel.setProperty("/firstName", oData.Firstname);
					oUserDetailModel.setProperty("/fullName", oData.Fullname);
					oUserDetailModel.setProperty("/secondName", oData.Secondname);
					oUserDetailModel.setProperty("/userName", oData.UserName);
					mLookupModel.setProperty("/userName", oData.UserName);
					oUserDetailModel.setProperty("/userRole", oData.Role);
					oUserDetailModel.setProperty("/userPlant", oData.UserPlant);
					that.setAppInitDataNotifList(viewType);
					oUserDetailModel.refresh();
				},
				error: function (oData) {
					oUserDetailModel.setProperty("/userName", "");
					oUserDetailModel.refresh();
				}
			});
		},
		//Function to get logged in user
		getLoggedInUserCreateWO: function (fromView) {
			var that = this;
			this.busy.open();
			var sUrl = "/UserDetailsSet('')";
			var mLookupModel = this.mLookupModel;
			var oPortalDataModel = this.oPortalDataModel;
			var oUserDetailModel = this.oUserDetailModel;
			oPortalDataModel.read(sUrl, {
				success: function (oData) {
					oUserDetailModel.setProperty("/firstName", oData.Firstname);
					oUserDetailModel.setProperty("/fullName", oData.Fullname);
					oUserDetailModel.setProperty("/secondName", oData.Secondname);
					oUserDetailModel.setProperty("/userName", oData.UserName);
					oUserDetailModel.setProperty("/userRole", oData.Role);
					oUserDetailModel.setProperty("/userPlant", oData.UserPlant);
					mLookupModel.setProperty("/userName", oData.UserName);
					oUserDetailModel.refresh();
					that.setAppInitDataCreateWO(fromView);
					util.fnSetUserName(oData.UserName, that.oWorkOrderDetailModel, that.oWorkOrderDetailViewModel);
					that.busy.close();
				},
				error: function (oData) {
					oUserDetailModel.setProperty("/userName", "");
					oUserDetailModel.refresh();
					that.busy.close();
				}
			});
		},

		//Function to get Application's initial lookups
		setAppInitDataCreateWO: function (fromView) {
			this.getOrderType();
			this.getWOPriorities();
			this.getWorkCentersCreateWO();
			this.getFavEquips();
			this.getFnLocs();
			this.getPlannerGroups();
			this.getShortTextKey();
			if (fromView === "WK_ORDER_DETAIL") {
				//this.getPlannerGroups();
				this.getDamageCode();
				this.getCauseCode();
				this.getSystemCondition();
				this.getNotificationType();
			}
		},
		//Function to get Application's initial lookups
		setAppInitDataCreateNotif: function () {
			this.resetUIFields();
			this.getNotificationType();
			this.getPlannerGroupsCreateNotif();
			this.getDamageCode();
			this.getCauseCode();
			this.getFavEquips();
			this.getWOPriorities();
			this.getWorkCentersCreateWO();
			this.getFnLocs();
			this.getOrderType();
			this.fnGetObjectPart();
			this.getItemKeyForCause();
		},
		//Function to get fnlocations List
		getFnLocs: function (oEvent) {
			var that = this;
			var oLookupDataModel = this.oLookupDataModel;
			var mLookupModel = this.mLookupModel;
			// var oPortalDataModel = this.oPortalDataModel;
			var userPlant = this.oUserDetailModel.getProperty("/userPlant");

			var oFilter = [];
			oFilter.push(new Filter("plant", "EQ", userPlant));
			// oFilter.push(new Filter("Tidnr", "EQ", TechId.toUpperCase()));
			// filters: oFilter,
			oLookupDataModel.read("/FuncLocationSet", {
				success: function (oData) {
					var aFnLocsList = oData.results;
					mLookupModel.setProperty("/aFnLocsList", aFnLocsList);
					mLookupModel.refresh();
					that.busy.close();
				},
				error: function (oData) {
					mLookupModel.setProperty("/aFnLocsList", []);
					mLookupModel.refresh();
					that.busy.close();
				}
			});
		},

		//Function to get logged in user
		getLoggedInUserCreateNotif: function () {
			var that = this;
			this.busy.open();
			var sUrl = "/UserDetailsSet('')";
			var oPortalDataModel = this.oPortalDataModel;
			var oUserDetailModel = this.oUserDetailModel;
			oPortalDataModel.read(sUrl, {
				success: function (oData) {
					oUserDetailModel.setProperty("/firstName", oData.Firstname);
					oUserDetailModel.setProperty("/fullName", oData.Fullname);
					oUserDetailModel.setProperty("/secondName", oData.Secondname);
					oUserDetailModel.setProperty("/userName", oData.UserName);
					oUserDetailModel.setProperty("/userPlant", oData.UserPlant);
					that.oNotificationDataModel.setProperty("/Reportedby", oData.UserName);
					that.setAppInitDataCreateNotif("CREATE_NOTIFCATION");
					oUserDetailModel.refresh();
					that.busy.close();
				},
				error: function (oData) {
					oUserDetailModel.setProperty("/userName", "");
					oUserDetailModel.refresh();
					that.busy.close();
				}
			});
		},
		//Function to get logged in user
		getLoggedInUserReports: function () {
			var that = this;
			var sUrl = "/UserDetailsSet('')";
			var oPortalDataModel = this.oPortalDataModel;
			var oUserDetailModel = this.oUserDetailModel;
			oPortalDataModel.read(sUrl, {
				success: function (oData) {
					if (oData.HasLabHrReport === "YES") {
						oData.HasLabHrReport = true;
					}
					oUserDetailModel.setProperty("/firstName", oData.Firstname);
					oUserDetailModel.setProperty("/fullName", oData.Fullname);
					oUserDetailModel.setProperty("/secondName", oData.Secondname);
					oUserDetailModel.setProperty("/userName", oData.UserName);
					oUserDetailModel.setProperty("/userPlant", oData.UserPlant);
					oUserDetailModel.setProperty("/hasLabHrReport", oData.HasLabHrReport);
					oUserDetailModel.setProperty("/currency", oData.currency);
					oUserDetailModel.refresh();
					that.setAppInitDataReports();
				},
				error: function (oData) {
					oUserDetailModel.setProperty("/firstName", "");
					oUserDetailModel.setProperty("/fullName", "");
					oUserDetailModel.setProperty("/secondName", "");
					oUserDetailModel.setProperty("/userName", "");
					oUserDetailModel.setProperty("/userPlant", "");
					oUserDetailModel.refresh();
					that.busy.close();
				}
			});
		},

		//Function to get Application's initial lookups
		setAppInitDataReports: function () {
			this.getSystemPlants();
			this.generateComplianceVals();
			this.generateTimeBucketVals();
			this.getFunctionalLocs();
			this.getOrderType();
		},
		//shiftend
		getLoggedInUserShiftEnd: function () {
			var that = this;
			this.busy.open();
			var sUrl = "/UserDetailsSet('')";
			var mLookupModel = this.mLookupModel;
			var oPortalDataModel = this.oPortalDataModel;
			oPortalDataModel.read(sUrl, {
				success: function (oData) {
					mLookupModel.setProperty("/sPlantSel", oData.UserPlant);
					mLookupModel.refresh();
					that.fnGetPlants();
					that.getWorkCentersShiftEnd();
					that.busy.close();
				},
				error: function (oData) {
					mLookupModel.setProperty("/sPlantSel", "");
					mLookupModel.refresh();
					that.busy.close();
				}
			});
		},
		//Function to search spare parts
		getMaterialsListSpareparts: function () {
			var that = this;
			this.busy.open();
			var sUrl = "/SparePartsListSet";
			var oPortalDataModel = this.oPortalDataModel;
			var oViewPropertyModel = this.oViewPropertyModel;
			var oSparePartViewModel = this.oSparePartViewModel;
			var sapId = oSparePartViewModel.getProperty("/sapId");
			var compDesc = oSparePartViewModel.getProperty("/compDesc");
			var supplier = oSparePartViewModel.getProperty("/supplier");
			var supplierPartno = oSparePartViewModel.getProperty("/supplierPartno");
			var mfgPartDesc = oSparePartViewModel.getProperty("/manufacturer");
			var MfgPartNo = oSparePartViewModel.getProperty("/mfgPartNo");

			var oFilter = [];
			if (sapId) {
				oFilter.push(new Filter("Material", "EQ", sapId));
			}
			if (compDesc) {
				oFilter.push(new Filter("MaterialDesc", "EQ", compDesc));
			}
			if (supplier) {
				oFilter.push(new Filter("SupplierName", "EQ", supplier));
			}
			if (supplierPartno) {
				oFilter.push(new Filter("SupplierPartNo", "EQ", supplierPartno));
			}
			if (MfgPartNo) {
				oFilter.push(new Filter("MfgPartNo", "EQ", MfgPartNo));
			}
			if (mfgPartDesc) {
				oFilter.push(new Filter("MfgName", "EQ", mfgPartDesc));
			}
			var userPlant = this.oUserDetailModel.getProperty("/userPlant");
			oFilter.push(new Filter("plant", "EQ", userPlant));
			oPortalDataModel.read(sUrl, {
				filters: oFilter,
				success: function (oData) {
					var aMaterialsList = oData.results;
					$.each(aMaterialsList, function (index, value) { //AN: #obxSearch
						if (value.QtyIssued === 0 || value.QtyIssued) {
							value.QtyIssuedStr = (value.QtyIssued).toString();
						}
						if (value.QtyReturned === 0 || value.QtyReturned) {
							value.QtyReturnedStr = (value.QtyReturned).toString();
						}
					});
					oSparePartViewModel.setProperty("/aMaterialsList", aMaterialsList);
					oViewPropertyModel.setProperty("/iTableVisibility", true);
					oSparePartViewModel.refresh();
					that.busy.close();
				},
				error: function (oData) {
					oSparePartViewModel.setProperty("/aMaterialsList", []);
					oSparePartViewModel.refresh();
					that.busy.close();
				}
			});
		},

		//Function to search spare parts FROM CREATE WO
		getMaterialsList: function (oEvent, equipId, isFrequent) {
			var that = this;
			this.busy.open();
			var sUrl = "/SparePartsListSet";
			var oPortalDataModel = this.oPortalDataModel;
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var sapId = oWorkOrderDetailViewModel.getProperty("/sapId");
			var supplier = oWorkOrderDetailViewModel.getProperty("/supplier");
			var supplierPartno = oWorkOrderDetailViewModel.getProperty("/supplierPartno");
			var mfgPartNo = oWorkOrderDetailViewModel.getProperty("/mfgPartNo");
			var mfgPartDesc = oWorkOrderDetailViewModel.getProperty("/mfgPartDesc");
			var oSearchTbl = sap.ui.getCore().byId("MYLAN_MATERIALS_SEARCH_TBL");
			var oFilter = [];
			if (isFrequent) {
				oFilter.push(new Filter("IsFrequent", "EQ", "X"));
				oFilter.push(new Filter("Equiipid", "EQ", equipId));
			} else if (equipId) {
				oFilter.push(new Filter("Equiipid", "EQ", equipId));
			} else {
				var aSearchMatList = oWorkOrderDetailViewModel.getProperty("/aSearchMatList");
				oWorkOrderDetailViewModel.setProperty("/aMaterialsList", aSearchMatList);
				oWorkOrderDetailViewModel.setProperty("/selectedMaterials", []);
				oWorkOrderDetailViewModel.setProperty("/setSearchLayVisible", true);
				sap.ui.getCore().byId("MYLAN_MATERIALS_SEARCH_TBL").clearSelection();
				if (sapId) {
					oFilter.push(new Filter("Material", "EQ", sapId));
				}
				if (supplier) {
					oFilter.push(new Filter("SupplierName", "EQ", supplier));
				}
				if (supplierPartno) {
					oFilter.push(new Filter("SupplierPartNo", "EQ", supplierPartno));
				}
				if (mfgPartNo) {
					oFilter.push(new Filter("MfgPartNo", "EQ", mfgPartNo));
				}
				if (mfgPartDesc) {
					oFilter.push(new Filter("MaterialDesc", "EQ", mfgPartDesc));
				}
			}
			var userPlant = this.oUserDetailModel.getProperty("/userPlant");
			oFilter.push(new Filter("plant", "EQ", userPlant));
			oPortalDataModel.read(sUrl, {
				filters: oFilter,
				success: function (oData) {
					var aMaterialsList = oData.results;
					if (isFrequent && equipId) {
						oWorkOrderDetailViewModel.setProperty("/prevEquipId", equipId);
						oWorkOrderDetailViewModel.setProperty("/aFrequentlyUsedList", aMaterialsList);
					} else if (!isFrequent && equipId) {
						oWorkOrderDetailViewModel.setProperty("/prevEquipId", equipId);
						//oWorkOrderDetailViewModel.setProperty("/aBOMsList", aMaterialsList);

					} else {
						oWorkOrderDetailViewModel.setProperty("/aSearchMatList", aMaterialsList);
					}
					oWorkOrderDetailViewModel.setProperty("/aMaterialsList", aMaterialsList);
					if (oSearchTbl) {
						sap.ui.getCore().byId("MYLAN_MATERIALS_SEARCH_TBL").clearSelection();
					}
					oWorkOrderDetailViewModel.refresh();
					that.busy.close();
				},
				error: function (oData) {
					oWorkOrderDetailViewModel.setProperty("/aMaterialsList", []);
					oWorkOrderDetailViewModel.refresh();
					that.busy.close();
				}
			});
		},
		//Function to Get BOM Table Material in Spare Parts 
		getBOMTableList: function () {
			var that = this;
			this.busy.open();
			var sUrl = "/EquipBOMSet";
			var oPortalDataModel = this.oPortalDataModel;
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var userPlant = this.oUserDetailModel.getProperty("/userPlant");
			var sEquipId = oWorkOrderDetailModel.getProperty("/Equipment");
			var oSearchTbl = sap.ui.getCore().byId("MYLAN_MATERIALS_SEARCH_TBL");
			var oFilter = [];
			oFilter.push(new Filter("plant", "EQ", userPlant));
			oFilter.push(new Filter("equipId", "EQ", sEquipId));
			oFilter.push(new Filter("bomCategory", "EQ", "E"));
			oPortalDataModel.read(sUrl, {
				filters: oFilter,
				success: function (oData) {
					var aMaterialsList = oData.results;

					oWorkOrderDetailViewModel.setProperty("/prevEquipId", sEquipId);
					oWorkOrderDetailViewModel.setProperty("/aBOMsList", aMaterialsList);

					if (oSearchTbl) {
						sap.ui.getCore().byId("MYLAN_MATERIALS_SEARCH_TBL").clearSelection();
					}
					oWorkOrderDetailViewModel.refresh();
					that.busy.close();
				},
				error: function (oData) {
					oWorkOrderDetailViewModel.setProperty("/aBOMsList", []);
					oWorkOrderDetailViewModel.refresh();
					that.busy.close();
				}
			});
		},

		//Function to get Equipment list based
		getEquipmentList: function () {
			var that = this;
			this.busy.open();
			var sUrl = "/SparePartsListSet";
			var mLookupModel = this.mLookupModel;
			var oPortalDataModel = this.oPortalDataModel;
			var oViewPropertyModel = this.oViewPropertyModel;
			var oSparePartViewModel = this.oSparePartViewModel;
			var EqipId = mLookupModel.getProperty("/sEquip");
			var oFilter = [];
			if (EqipId) {
				oFilter.push(new Filter("Equiipid", "EQ", EqipId));
			}
			oPortalDataModel.read(sUrl, {
				filters: oFilter,
				success: function (oData) {
					var aMaterialsList = oData.results;
					$.each(aMaterialsList, function (index, value) { //AN: #obxSearch
						if (value.QtyIssued === 0 || value.QtyIssued) {
							value.QtyIssuedStr = (value.QtyIssued).toString();
						}
						if (value.QtyReturned === 0 || value.QtyReturned) {
							value.QtyReturnedStr = (value.QtyReturned).toString();
						}
					});
					oSparePartViewModel.setProperty("/aMaterialsList", aMaterialsList);
					oViewPropertyModel.setProperty("/iEqTableVisibility", true);
					oSparePartViewModel.refresh();
					that.busy.close();
				},
				error: function (oData) {
					oSparePartViewModel.setProperty("/aMaterialsList", []);
					oSparePartViewModel.refresh();
					that.busy.close();
				}
			});
		},
		//Function to get Work Order details by WO ID
		fnGetWOHeaderDetails: function (Orderid, successErrMsg) {
			var that = this;
			this.busy.open();
			var mLookupModel = this.mLookupModel;
			var oWorkOrderOData = this.oWorkOrderOData;
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;

			var sUrl = "/WorkorderHeaderSet('" + Orderid + "')";
			oWorkOrderOData.read(sUrl, {
				urlParameters: {
					"$expand": "HEADERTOOPERATIONSNAV,HEADERTOPARTNERNAV,HEADERTOCOMPONENTNAV,HEADERTONOTIFNAV,HEADERTOCOSTNAV"
				},
				success: function (oData) {
					oData = that.fnFormatWODateObjects(oData);
					var operationList = oData.HEADERTOOPERATIONSNAV.results;
					var spareParts = oData.HEADERTOCOMPONENTNAV.results;
					if (!spareParts) {
						spareParts = [];
					}
					var messages = oData.HEADERTOMESSAGENAV.results;
					if (!messages) {
						messages = [{
							"Message": "",
							"Status": ""
						}];
					}
					var partner = oData.HEADERTOPARTNERNAV.results;
					if (!partner) {
						partner = [{
							"Orderid": "",
							"AssignedTo": ""
						}];
					}
					var notifications = oData.HEADERTONOTIFNAV.results;
					if (!notifications) {
						notifications = [];
					}
					oData.HEADERTOOPERATIONSNAV = operationList;
					oData.HEADERTOCOMPONENTNAV = spareParts;
					oData.HEADERTOMESSAGENAV = messages;
					oData.HEADERTOPARTNERNAV = partner;
					oData.HEADERTONOTIFNAV = notifications;
					oWorkOrderDetailModel.setProperty("/", oData);
					mLookupModel.setProperty("/aOperationListSet", oData.HEADERTOOPERATIONSNAV);
					oWorkOrderDetailModel.refresh();
					if (successErrMsg) {
						that.showMessage(successErrMsg);
					}
					that.busy.close();
				},
				error: function (oData) {
					oWorkOrderDetailModel.setProperty("/", {});
					oWorkOrderDetailModel.refresh();
					that.busy.close();
				}
			});
		},
		//Function to get Work Order details by WO ID
		fnGetWOHeaderDetailsnotiflist: function (Orderid, notifArry) {
			var that = this;
			this.busy.open();
			var oWorkOrderOData = this.oWorkOrderOData;
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;

			var sUrl = "/WorkorderHeaderSet('" + Orderid + "')";
			oWorkOrderOData.read(sUrl, {
				urlParameters: {
					"$expand": "HEADERTOOPERATIONSNAV,HEADERTOPARTNERNAV,HEADERTOCOMPONENTNAV,HEADERTONOTIFNAV,HEADERTOCOSTNAV"
				},
				success: function (oData) {
					var operationList = oData.HEADERTOOPERATIONSNAV.results;
					var spareParts = oData.HEADERTOCOMPONENTNAV.results;
					if (!spareParts) {
						spareParts = [];
					}
					var messages = oData.HEADERTOMESSAGENAV.results;
					if (!messages) {
						messages = [{
							"Message": "",
							"Status": ""
						}];
					}
					var partner = oData.HEADERTOPARTNERNAV.results;
					if (!partner) {
						partner = [{
							"Orderid": "",
							"AssignedTo": ""
						}];
					}
					var notifications = oData.HEADERTONOTIFNAV.results;
					if (!notifications) {
						notifications = [];
					}

					for (var i = 0; i < notifArry.length; i++) { // Clear Long text of assigned notifications - Sunanda
						notifArry[i].LongText = "";
					}

					var oTempArr = notifications.concat(notifArry);
					oData.HEADERTOOPERATIONSNAV = operationList;
					oData.HEADERTOCOMPONENTNAV = spareParts;
					oData.HEADERTOMESSAGENAV = messages;
					oData.HEADERTOPARTNERNAV = partner;
					oData.HEADERTONOTIFNAV = oTempArr;
					oWorkOrderDetailModel.setProperty("/", oData);
					oWorkOrderDetailModel.refresh();
					that.updateWorkOrder();
					var notifTbl = that.getView().byId("notifListId");
					that.fnResetFilers(notifTbl, "mLookupModel");
					that.busy.close();
				},
				error: function (oData) {
					oWorkOrderDetailModel.setProperty("/", {});
					oWorkOrderDetailModel.refresh();
					that.busy.close();
				}
			});
		},
		//Function to get Work Order details by WO ID
		fnGetWOHeaderDetailsCreateWO: function (Orderid, woCreateNavType, sData) {
			var that = this;
			this.busy.open();
			var oWorkOrderOData = this.oWorkOrderOData;
			var oWODetailFieldsModel = this.oWODetailFieldsModel;
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;

			var sUrl = "/WorkorderHeaderSet('" + Orderid + "')";
			oWorkOrderOData.read(sUrl, {
				urlParameters: {
					"$expand": "HEADERTOOPERATIONSNAV,HEADERTOPARTNERNAV,HEADERTOCOMPONENTNAV,HEADERTONOTIFNAV,HEADERTOCOSTNAV"
				},
				success: function (serviceData) {
					var oData = serviceData;
					oData = that.fnFormatWODateObjects(oData);
					var orderId = oData.Orderid;
					orderId = parseInt(orderId, 10);
					orderId = orderId.toString();
					oData.Orderid = orderId;
					var operationList = oData.HEADERTOOPERATIONSNAV.results;
					//refresh completed on date with current datetime after every confirmation
					for (var i = 0; i < operationList.length; i++) {

						operationList[i].CompletedOn = new Date();
					}
					//refresh completed on date with current datetime after every confirmation

					if (woCreateNavType === "WO_DETAIL_OPERATION_CONFIRM" || woCreateNavType === "WO_DETAIL_OPERATION_FINAL_CONFIRM") {
						var prevOperations = oWorkOrderDetailViewModel.getProperty("/HEADERTOOPERATIONSNAV");
						operationList = that.updateOperationList(operationList, prevOperations);

					}
					//oWorkOrderDetailViewModel.setProperty("/SavedOperations",operationList);//to get only saved operations for operations lookup.

					var notifications = oData.HEADERTONOTIFNAV.results;
					if (!notifications) {
						notifications = [];
						oData.ReportedBy = ""; //nischal - For Workorder without notification, Reported By is getting empty. So lets  override that with Workorder detail reported BY
					} else if (notifications.length >= 1) {
						oData.ReportedBy = notifications[0].Reportedby;
					}
					notifications = that.fnPopulateNotifDates(notifications);

					var spareParts = oData.HEADERTOCOMPONENTNAV.results;
					if (!spareParts) {
						spareParts = [];
					}
					var messages = oData.HEADERTOMESSAGENAV.results;
					if (!messages) {
						messages = [{
							"Message": "",
							"Status": ""
						}];
					}
					var partner = oData.HEADERTOPARTNERNAV.results;
					if (!partner || partner.length === 0) {
						var userName = that.oUserDetailModel.getProperty("/userName");
						partner = [{
							"Orderid": "",
							"AssignedTo": userName,
							"PARTNERNAV": "C",
							"PARTNEROLD": ""
						}];
						oData.ReportedBy = userName;
						oWorkOrderDetailViewModel.setProperty("/HEADERTOPARTNERNAV/0/AssignedTo", userName);
					}
					var CostList = oData.HEADERTOCOSTNAV.results;
					util.setRowItemsforCostOverview(oWorkOrderDetailViewModel, CostList);
					oData.HEADERTOOPERATIONSNAV = operationList;
					oData.HEADERTOCOMPONENTNAV = spareParts;
					oData.HEADERTOMESSAGENAV = messages;
					oData.HEADERTOPARTNERNAV = partner;
					oData.HEADERTONOTIFNAV = notifications;
					oData.HEADERTOCOSTNAV = CostList;

					if (oData.Assembly !== "") {
						oData.Assembly = parseInt(oData.Assembly, 10).toString();
					}
					if (oData.Equipment !== "") {
						that.getEquipsAssmebly(oData.Equipment);
						that.onSearchEquipments(oData.Equipment, true);
					}
					//nischal -- starts -- downtime was embedded with additional empty strings
					if (oData.Downtime) {
						var downTime = parseFloat(oData.Downtime).toFixed(2);
						oData.Downtime = downTime.toString();
					}
					if (notifications.length === 0) {
						oWorkOrderDetailViewModel.setProperty("/withNotificationCheck", false);
					} else {
						oWorkOrderDetailViewModel.setProperty("/withNotificationCheck", true);
					}
					//nischal -- ends
					oData.MalFunStartTime = formatter.getMalfunctionStTime(oData.MalFunStartTime.ms);
					oWorkOrderDetailModel.setProperty("/", oData);
					that.sortOperations();
					oWorkOrderDetailModel.refresh(true);
					//that.fnGetWOOperationsComments(Orderid);//There is no comments section
					that.fnGetWOAttachmentLinks(Orderid);
					that.getOperationIdLookup();
					//that.getSavedOperationIdLookup();//Saved Operations only Lookup.
					that.getShortTextKey(); //nischal -- function to get Short text key from service
					var partNav = jQuery.extend(true, [], partner);
					oWorkOrderDetailViewModel.setProperty("/HEADERTOPARTNERNAV", partNav);

					if (that.oUserDetailModel.getProperty("/userRole") === "REVIEWER") {
						var woStatus = oWorkOrderDetailModel.getProperty("/OrderStatus");
						that.oUserDetailModel.setProperty("/woStatus", woStatus);
						oWorkOrderDetailModel.setProperty("/OrderStatus", "TECO");
						oWorkOrderDetailModel.refresh(true);
						util.fnEnableTecoWOFields(oWODetailFieldsModel, oWorkOrderDetailViewModel);
						that.fnCreateUpdateBtnTxt("WO_TECO");
						that.busy.close();
						return;
					}
					that.fnOperTimerSetup();
					that.oWorkOrderDetailViewModel.setProperty("/bTimerStart", false);

					var orderStatus = oData.OrderStatus;
					that.fnUpdateWODetailButton(orderStatus);
					that.fnFilterCNFOperations(true);
					that.getDamageGroupCode("", oData.Damagecode);
					that.getCauseGroupCode("", oData.Causecode);
					oWorkOrderDetailModel.refresh(true);
					////////TO show PR num////

					if (woCreateNavType && woCreateNavType !== "WO_DETAIL_OPERATION_CONFIRM" && woCreateNavType !==
						"WO_DETAIL_OPERATION_FINAL_CONFIRM" && messages[0]
						.Message === "") {
						messages = that.mLookupModel.getProperty("/messages");
						var oObj;
						var operations = oData.HEADERTOOPERATIONSNAV;
						var Materials = [];
						if (oData.HEADERTOCOMPONENTNAV || operations) {
							if (oData.HEADERTOCOMPONENTNAV) {
								Materials = oData.HEADERTOCOMPONENTNAV;
							}
							var oMessages = formatter.fnGetPRandRESERVNO(operations, Materials);
							if (oMessages[0] !== "" && oMessages[0] !== undefined) {
								oObj = {
									"Message": "Reservation Number:" + oMessages[0],
									"Status": "S"
								};
								messages.push(oObj);
							}
							if (oMessages[1] !== []) {
								for (i = 0; i < oMessages[1].length; i++) {
									oObj = {
										"Message": "PR Number:" + oMessages[1][i].PreqNo + "for line item:" + oMessages[1][i].PreqItem,
										"Status": "S"
									};
									messages.push(oObj);
								}
							}
						}
						that.fnShowSuccessErrorMsg(messages);
					}

					that.busy.close();
				},
				error: function (oData) {
					oWorkOrderDetailModel.setProperty("/", {});
					oWorkOrderDetailModel.refresh();
					that.busy.close();
				}
			});
		},
		///function to start, stop and initiate timer for operation
		fnOperTimerSetup: function () {
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var startDate = new Date();
			var duration = (new Date() - startDate);
			oWorkOrderDetailViewModel.setProperty("/OperWrkStartTime", startDate);
			oWorkOrderDetailViewModel.setProperty("/nTimerDur", duration);

		},
		fnStartTimer: function () {
			//var duration = 0;
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			//var startDate = oWorkOrderDetailViewModel.getProperty("/OperWrkStartTime");
			var oOperations = oWorkOrderDetailViewModel.getProperty("/selectedOps");
			oWorkOrderDetailViewModel.setProperty("/operTimerOn", oOperations);
			var startDate = new Date();
			var duration = (new Date() - startDate);
			oWorkOrderDetailViewModel.setProperty("/OperWrkStartTime", startDate);
			oWorkOrderDetailViewModel.setProperty("/nTimerDur", duration);

			oWorkOrderDetailViewModel.setProperty("/bTimerRn", true);
			this.nowTime = setInterval(function () {
				var nowTime = new Date();
				duration = (nowTime - startDate);
				oWorkOrderDetailViewModel.setProperty("/nTimerDur", duration);
			}, 1000);
		},
		fnStopTimer: function (oButEvent) {
			clearInterval(this.nowTime);
			var sOpDetail, i;
			var that = this;
			var nDuration = this.oWorkOrderDetailViewModel.getProperty("/nTimerDur");
			var nDurationhrs = formatter.fnOperTimerhrsfloat(nDuration);
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var selOps = oWorkOrderDetailViewModel.getProperty("/operTimerOn");
			// var oSource = oButEvent.getSource();
			// var oBtnType = oSource.getCustomData()[0].getValue();
			MessageBox.warning("Would you like confirm the operation?", {
				actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
				onClose: function (sAction) {
					if (sAction === "OK") {
						for (i = 0; i < selOps.length; i++) {
							sOpDetail = oWorkOrderDetailModel.getProperty(selOps[i].sPath);
							sOpDetail.MyWork = nDurationhrs;
							sOpDetail.Systcond = "0";
							oWorkOrderDetailModel.setProperty(selOps[i].sPath, sOpDetail);
						}
						oWorkOrderDetailViewModel.setProperty("/sAutoCnfrmType", "WO_DETAIL_OPERATION_FINAL_CONFIRM");
						that.fnFullyConfirmOperation(oButEvent);
					} else {
						for (i = 0; i < selOps.length; i++) {
							sOpDetail = oWorkOrderDetailModel.getProperty(selOps[i].sPath);
							sOpDetail.MyWork = nDurationhrs;
							sOpDetail.Systcond = "1";
							oWorkOrderDetailModel.setProperty(selOps[i].sPath, sOpDetail);
						}

						oWorkOrderDetailViewModel.setProperty("/sAutoCnfrmType", "WO_DETAIL_OPERATION_CONFIRM");
						that.fnConfirmOperation(oButEvent);
					}
				}
			});

			oWorkOrderDetailViewModel.setProperty("/bTimerRn", false);
			this.oWorkOrderDetailViewModel.setProperty("/nTimerDur", 0);
			oWorkOrderDetailViewModel.setProperty("/operTimerOn", []);
			this.nowTime = null;

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

		fnDateConversion: function (date, gwdate) {
			if (date) {
				var iDate = date.getDate();
				var iMon = date.getMonth() + 1;
				var iYear = date.getFullYear();

				if (iMon < 10) {
					iMon = "0" + iMon;
				}

				if (iDate < 10) {
					iDate = "0" + iDate;
				}

				if (gwdate) {
					return iYear + "-" + iMon + "-" + iDate;
				}
				return iDate + "-" + iMon + "-" + iYear;
			}
		},

		//Function to close statusMessages popup
		closeSuccesErrPopup: function () {
			this.successErrorDialog.close();

		},

		//Function to reset the filtered columns in Add tasks list
		fnResetFilers: function (table, model) {
			var iColCounter = 0;
			table.clearSelection();
			var iTotalCols = table.getColumns().length;
			var oListBinding = table.getBinding();
			if (oListBinding) {
				oListBinding.aSorters = null;
				oListBinding.aFilters = null;
			}
			for (iColCounter = 0; iColCounter < iTotalCols; iColCounter++) {
				table.getColumns()[iColCounter].setSorted(false);
				table.getColumns()[iColCounter].setFilterValue("");
				table.getColumns()[iColCounter].setFiltered(false);
			}
			table.getModel(model).refresh(true);
		},
		//Function to initalize Create Work detail app
		fnInitCreateWOApp: function (fromView) {

			this.busy = new BusyDialog();
			this.MessageBox = MessageBox;

			this.DateFormat = DateFormat.getDateTimeInstance({
				pattern: "yyyy-MM-dd HH:mm:ss"
			});

			this.oHeader = {
				"Accept": "application/json",
				"Content-Type": "application/json"
			};

			//ODataModel holding metadata of Application's services
			var oPortalDataModel = this.getOwnerComponent().getModel("oPortalDataModel");
			this.oPortalDataModel = oPortalDataModel;

			//ODataModel holding metadata of Application's lookup services
			var oLookupDataModel = this.getOwnerComponent().getModel("oLookupDataModel");
			this.oLookupDataModel = oLookupDataModel;

			//ODataModel holding metadata of Application's GET/POST of WorkOrder Detail only!!
			var oWorkOrderOData = this.getOwnerComponent().getModel("oWorkOrderOData");
			this.oWorkOrderOData = oWorkOrderOData;
			oWorkOrderOData.setHeaders({
				"Accept": "application/json",
				"Content-Type": "application/json"
			});

			//Application Model used only for Translation of texts
			var oResourceModel = this.getOwnerComponent().getModel("i18n");
			this.oResourceModel = oResourceModel.getResourceBundle();

			//Application Model used only for storing of Application's lookups
			var mLookupModel = this.getOwnerComponent().getModel("mLookupModel");
			this.mLookupModel = mLookupModel;
			mLookupModel.setSizeLimit(10000);

			//Data Model holding Work Order details, used to set only for GET/POST [View: Work Order Detail]
			var oWorkOrderDetailModel = this.getOwnerComponent().getModel("oWorkOrderDetailModel");
			this.oWorkOrderDetailModel = oWorkOrderDetailModel;
			oWorkOrderDetailModel.setSizeLimit(10000);

			//View Model used for configuring UI controls, and not for GET/POST [View: Work Order Detail]
			var oWorkOrderDetailViewModel = this.getOwnerComponent().getModel("oWorkOrderDetailViewModel");
			this.oWorkOrderDetailViewModel = oWorkOrderDetailViewModel;
			oWorkOrderDetailViewModel.setSizeLimit(10000);

			//Data Model used for holding Application's logged in user details
			var oUserDetailModel = this.getOwnerComponent().getModel("oUserDetailModel");
			this.oUserDetailModel = oUserDetailModel;

			//View Model controlling enable/diable property [View: Work Order Detail]
			var oWODetailFieldsModel = this.getOwnerComponent().getModel("oWODetailFieldsModel");
			this.oWODetailFieldsModel = oWODetailFieldsModel;
			oWODetailFieldsModel.setSizeLimit(10000);

			var oPortalNotifOData = this.getOwnerComponent().getModel("oPortalNotifOData");
			this.oPortalNotifOData = oPortalNotifOData;
			oPortalNotifOData.setSizeLimit(10000);

			var oPortalUserLoginOData = this.getOwnerComponent().getModel("oPortalUserLoginOData");
			this.oPortalUserLoginOData = oPortalUserLoginOData;
			oPortalUserLoginOData.setSizeLimit(10000);
			this.getLoggedInUserCreateWO(fromView);
			this.getOrderType();
			this.getWOPriorities();
			this.getWorkCentersCreateWO();
			this.getFavEquips();
		},
		// /*			setAppInitData: function (fromView) {
		// 			this.getOrderType();
		// 			this.getWOPriorities();
		// 			this.getWorkCenters();
		// 			this.getFavEquips();
		// 			if (fromView === "WK_ORDER_DETAIL") {
		// 				this.getPlannerGroups();
		// 				this.getDamageCode();
		// 				this.getCauseCode();
		// 				this.getSystemCondition();
		// 				this.getNotificationType();
		// 			}
		// 		},*/

		//Function to get Work Order type
		getOrderType: function () {
			var that = this;
			this.busy.open();
			var sUrl = "/WO_TYPESet";
			var mLookupModel = this.mLookupModel;
			var oLookupDataModel = this.oLookupDataModel;
			oLookupDataModel.read(sUrl, {
				success: function (oData) {
					var aOrderTypeSet = oData.results;
					mLookupModel.setProperty("/aOrderTypeSet", aOrderTypeSet);
					mLookupModel.refresh();
					that.busy.close();
				},
				error: function (oData) {
					mLookupModel.setProperty("/aOrderTypeSet", []);
					mLookupModel.refresh();
					that.busy.close();
				}
			});

		},
		//Function to get Work order priorities
		getWOPriorities: function () {
			var that = this;
			this.busy.open();
			var sUrl = "/PrioritySet";
			var mLookupModel = this.mLookupModel;
			var oLookupDataModel = this.oLookupDataModel;
			oLookupDataModel.read(sUrl, {
				success: function (oData) {
					var aPrioritySet = oData.results;
					mLookupModel.setProperty("/aPrioritySet", aPrioritySet);
					mLookupModel.refresh();
					that.busy.close();
				},
				error: function (oData) {
					mLookupModel.setProperty("/aPrioritySet", []);
					mLookupModel.refresh();
					that.busy.close();
				}
			});
		},
		//Function to get Work centers list
		getWorkCentersCreateWO: function () {
			var that = this;
			this.busy.open();
			var sUrl = "/WorkcenterLookUpSet";
			var mLookupModel = this.mLookupModel;
			var oLookupDataModel = this.oLookupDataModel;
			var userPlant = this.oUserDetailModel.getProperty("/userPlant");
			var oFilter = [];
			oFilter.push(new Filter("Plant", "EQ", userPlant));
			oLookupDataModel.read(sUrl, {
				filters: oFilter,
				success: function (oData) {
					var aWorkCenterSet = oData.results;
					mLookupModel.setProperty("/aWorkCenterSet", aWorkCenterSet);
					mLookupModel.refresh();
					that.busy.close();
				},
				error: function (oData) {
					mLookupModel.setProperty("/aWorkCenterSet", []);
					mLookupModel.refresh();
					that.busy.close();
				}
			});
		},
		getWorkCentersShiftEnd: function () {
			var that = this;
			this.busy.open();
			var sUrl = "/WorkcenterLookUpSet";
			var mLookupModel = this.mLookupModel;
			var oLookupDataModel = this.oLookupDataModel;
			var sPlantSel = mLookupModel.getProperty("/sPlantSel");
			var oFilter = [];
			oFilter.push(new Filter("Plant", "EQ", sPlantSel));
			oLookupDataModel.read(sUrl, {
				filters: oFilter,
				success: function (oData) {
					var aWorkCenterSet = oData.results;
					mLookupModel.setProperty("/aWorkCenterSet", aWorkCenterSet);
					if (aWorkCenterSet.length) {
						mLookupModel.setProperty("/sWorkCenterSel", aWorkCenterSet[0].WorkcenterId);
					}
					mLookupModel.refresh();
					that.busy.close();
				},
				error: function (oData) {
					mLookupModel.setProperty("/aWorkCenterSet", []);
					mLookupModel.setProperty("");
					mLookupModel.refresh();
					that.busy.close();
				}
			});
		},
		//Function to get Work centers list based on Plant
		getWorkCentersReports: function (oEvent, plant) {
			var selecetdKey;
			var that = this;
			this.busy.open();

			var sUrl = "/WorkcenterLookUpSet";
			var mLookupModel = this.mLookupModel;
			var oLookupDataModel = this.oLookupDataModel;

			if (oEvent) {
				var oSource = oEvent.getSource();
				selecetdKey = oSource.getSelectedKey();
			} else if (plant) {
				selecetdKey = plant;
			}
			mLookupModel.setProperty("/aWorkCenterSet", []);

			var oFilter = [];
			oFilter.push(new Filter("Plant", "EQ", selecetdKey));
			oLookupDataModel.read(sUrl, {
				filters: oFilter,
				success: function (oData) {
					var aWorkCenterSet = oData.results;
					mLookupModel.setProperty("/aWorkCenterSet", aWorkCenterSet);
					mLookupModel.refresh();
					that.busy.close();
				},
				error: function (oData) {
					mLookupModel.setProperty("/aWorkCenterSet", []);
					mLookupModel.refresh();
					that.busy.close();
				}
			});
		},

		//Function to get Planner group list
		getPlannerGroups: function () {
			var that = this;
			this.busy.open();
			var sUrl = "/Planner_GruopSet";
			var mLookupModel = this.mLookupModel;
			var oLookupDataModel = this.oLookupDataModel;
			var oFilter = [];
			var userPlant = this.oUserDetailModel.getProperty("/userPlant");
			oFilter.push(new Filter("Plant", "EQ", userPlant));
			oLookupDataModel.read(sUrl, {
				filters: oFilter,
				success: function (oData) {
					var aPlannerGroupSet = oData.results;
					mLookupModel.setProperty("/aPlannerGroupSet", aPlannerGroupSet);
					mLookupModel.refresh();
					that.busy.close();
				},
				error: function (oData) {
					mLookupModel.setProperty("/aPlannerGroupSet", []);
					mLookupModel.refresh();
					that.busy.close();
				}
			});
		},
		//Function to get Planner group list
		getPlannerGroupsCreateNotif: function () {
			var that = this;
			this.busy.open();
			var sUrl = "/Planner_GruopSet";
			var mLookupModel = this.mLookupModel;
			var userPlant = this.oUserDetailModel.getProperty("/userPlant");
			var aPlannerGroupSet = mLookupModel.getProperty("/aPlannerGroupSet");
			var oFilter = [];
			oFilter.push(new Filter("Plant", "EQ", userPlant));

			if (!aPlannerGroupSet) {
				var oLookupDataModel = this.oLookupDataModel;
				oLookupDataModel.read(sUrl, {
					filters: oFilter,
					success: function (oData) {
						aPlannerGroupSet = oData.results;
						mLookupModel.setProperty("/aPlannerGroupSet", aPlannerGroupSet);
						mLookupModel.refresh();
						that.busy.close();
					},
					error: function (oData) {
						mLookupModel.setProperty("/aPlannerGroupSet", []);
						mLookupModel.refresh();
						that.busy.close();
					}
				});
			}
		},
		//Function to get Planner group list
		getPlannerGroupsNotifList: function () {
			// this.busy.open();
			var oFilter = [];
			var userPlant = this.oUserDetailModel.getProperty("/userPlant");
			oFilter.push(new Filter("Plant", "EQ", userPlant));

			var sUrl = "/Planner_GruopSet";
			var mLookupModel = this.mLookupModel;
			var aPlannerGroupSet = mLookupModel.getProperty("/aPlannerGroupSet");
			var oLookupDataModel = this.oLookupDataModel;
			oLookupDataModel.read(sUrl, {
				filters: oFilter,
				success: function (oData) {
					aPlannerGroupSet = oData.results;
					mLookupModel.setProperty("/aPlannerGroupSet", aPlannerGroupSet);
					mLookupModel.refresh();
					// that.busy.close();
				},
				error: function (oData) {
					mLookupModel.setProperty("/aPlannerGroupSet", []);
					mLookupModel.refresh();
					// that.busy.close();
				}
			});
		},
		//Function to get Notification type
		getNotificationType: function () {
			var that = this;
			this.busy.open();
			var sUrl = "/Notification_TypeSet";
			var mLookupModel = this.mLookupModel;
			var aOrderTypeSet = mLookupModel.getProperty("/aNotificationTypeSet");
			if (!aOrderTypeSet) {
				var oLookupDataModel = this.oLookupDataModel;
				oLookupDataModel.read(sUrl, {
					success: function (oData) {
						aOrderTypeSet = oData.results;
						mLookupModel.setProperty("/aNotificationTypeSet", aOrderTypeSet);
						mLookupModel.refresh();
						that.busy.close();
					},
					error: function (oData) {
						mLookupModel.setProperty("/aNotificationTypeSet", []);
						mLookupModel.refresh();
						that.busy.close();
					}
				});
			}
		},

		//Function to get Assembly for a selected Equipment
		getEquipsAssmebly: function (equipment) {
			var that = this;
			this.busy.open();
			var oFilter = [];
			var userPlant = this.oUserDetailModel.getProperty("/userPlant");
			oFilter.push(new Filter("Equnr", "EQ", equipment));
			oFilter.push(new Filter("plant", "EQ", userPlant));

			var mLookupModel = this.mLookupModel;
			var oPortalDataModel = this.oPortalDataModel;
			oPortalDataModel.read("/AssemblyListSet", {
				filters: oFilter,
				success: function (oData) {
					mLookupModel.setProperty("/aEquipAssemblyList", oData.results);
					mLookupModel.refresh();
					that.busy.close();
				},
				error: function (oData) {
					mLookupModel.setProperty("/aEquipAssemblyList", []);
					mLookupModel.refresh();
					that.busy.close();
				}
			});
		},
		//Function to search Users 
		onSearchUser: function (oEvent) {
			var that = this;
			this.busy.open();
			var oModel = this.oPortalDataModel;
			var mLookupModel = this.mLookupModel;
			var sUserId = oEvent.getSource().getValue();
			sUserId = sUserId.toUpperCase();
			if (!sUserId) {
				this.showMessage(this.oResourceModel.getText("pluidorname"));
				this.busy.close();
				return;
			}
			var oFilter = [];
			oFilter.push(new Filter("Bname", "EQ", sUserId));
			oModel.read("/UsersListSet", {
				filters: oFilter,
				success: function (oData, oResponse) {
					mLookupModel.setProperty("/aUsers", oData.results);
					that.busy.close();
				},
				error: function (oResponse) {
					mLookupModel.setProperty("/aUsers", []);
					mLookupModel.refresh(true);
					that.busy.close();
				}
			});
		},
		//Function to set UserId in reportedBy field
		onSetReportedbyUser: function (oEvent) {
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var assignUserFieldType = oWorkOrderDetailViewModel.getProperty("/assignUserFieldType");
			var selectedObj = oEvent.getSource().getSelectedItem().getCells()[0].getText();
			if (assignUserFieldType !== "/ReportedBy") {
				oWorkOrderDetailViewModel.setProperty(assignUserFieldType, selectedObj);
				this.onUpdateAssignedTo();
			} else {
				oWorkOrderDetailModel.setProperty(assignUserFieldType, selectedObj);
			}
			this.onCancelDialogAssignUser();
		},
		//Function to set UserId in reportedBy field
		onSetReportedbyUserNotif: function (oEvent) {
			var selectedObj = oEvent.getSource().getSelectedItem().getCells()[0].getText();
			this.oNotificationDataModel.setProperty("/Reportedby", selectedObj);
			this.onCancelDialogAssignUser();
		},
		//Function to get Damage code
		getDamageCode: function () {
			var that = this;
			this.busy.open();
			var sUrl = "/CauseDamageCodesSet";
			var mLookupModel = this.mLookupModel;
			var oLookupDataModel = this.oLookupDataModel;

			var oFilter = [];
			oFilter.push(new Filter("Katalogart", "EQ", "C"));
			oLookupDataModel.read(sUrl, {
				filters: oFilter,
				success: function (oData) {
					var aDamageCode = oData.results;
					mLookupModel.setProperty("/aDamageCode", aDamageCode);
					mLookupModel.refresh();
					that.busy.close();
				},
				error: function (oData) {
					mLookupModel.setProperty("/aDamageCode", []);
					mLookupModel.refresh();
					that.busy.close();
				}
			});
		},
		//Function to get Cause code
		getCauseCode: function () {
			var that = this;
			this.busy.open();
			var sUrl = "/CauseDamageCodesSet";
			var mLookupModel = this.mLookupModel;
			var oLookupDataModel = this.oLookupDataModel;

			var oFilter = [];
			oFilter.push(new Filter("Katalogart", "EQ", "5"));
			oLookupDataModel.read(sUrl, {
				filters: oFilter,
				success: function (oData) {
					var aCauseCode = oData.results;
					mLookupModel.setProperty("/aCauseCode", aCauseCode);
					mLookupModel.refresh();
					that.busy.close();
				},
				error: function (oData) {
					mLookupModel.setProperty("/aCauseCode", []);
					mLookupModel.refresh();
					that.busy.close();
				}
			});
		},
		//Function to get System Condition 
		getSystemCondition: function () {
			var that = this;
			this.busy.open();
			var sUrl = "/SysCondtionCodesSet";
			var mLookupModel = this.mLookupModel;
			var oLookupDataModel = this.oLookupDataModel;
			oLookupDataModel.read(sUrl, {
				success: function (oData) {
					var aSystemCondition = oData.results;
					mLookupModel.setProperty("/aSystemCondition", aSystemCondition);
					mLookupModel.refresh();
					that.busy.close();
				},
				error: function (oData) {
					mLookupModel.setProperty("/aSystemCondition", []);
					mLookupModel.refresh();
					that.busy.close();
				}
			});
		},
		//Function to get Notification list
		getNotificationList: function (searchNotifVal) {
			var oNotifVal = "";
			if (typeof (searchNotifVal) === "object") {
				oNotifVal = "";
			} else {
				oNotifVal = searchNotifVal;
			}
			var that = this;
			this.busy.open();
			var sUrl = "/NotificationListSet";
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var aNotificationsSet = oWorkOrderDetailViewModel.getProperty("/aNotificationsSet");
			if (aNotificationsSet.length === 0 || oNotifVal !== "") {
				var oFilter = [];
				var oPortalDataModel = this.oPortalDataModel;
				var userPlant = this.oUserDetailModel.getProperty("/userPlant");
				oFilter.push(new Filter("Descriptn", "EQ", oNotifVal));
				oFilter.push(new Filter("Userstatus", "EQ", true));
				oFilter.push(new Filter("plant", "EQ", userPlant));
				oPortalDataModel.read(sUrl, {
					filters: oFilter,
					urlParameters: {
						"$top": "20",
						"$skip": "0"
					},
					success: function (oData) {
						aNotificationsSet = oData.results;
						$.each(aNotificationsSet, function (index, value) { //AN: #obxSearch

							if (value.CreatedOn) {
								value.CreatedOnString = that.fnDateConversionToSting(value.CreatedOn);
							}

						});
						oWorkOrderDetailViewModel.setProperty("/aNotificationsSet", aNotificationsSet);
						oWorkOrderDetailViewModel.refresh();
						that.busy.close();
					},
					error: function (oData) {
						oWorkOrderDetailViewModel.setProperty("/aNotificationsSet", []);
						oWorkOrderDetailViewModel.refresh();
						that.busy.close();
					}
				});
			} else {
				that.notificationsList.open();
				this.busy.close();
			}
		},
		//Function to search Notification by Notificatio ID or Description
		onSearchNotif: function (oEvent) {
			this.busy.open();
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var searchNotifVal = oWorkOrderDetailViewModel.getProperty("/notifSearchVal");
			oWorkOrderDetailViewModel.setProperty("/iSkipNotif", 0);
			oWorkOrderDetailViewModel.setProperty("/aNotificationsSet", []);
			sap.ui.getCore().byId("WO_DETAIL_NOTIF_TBL").clearSelection();
			this.getNotificationList(searchNotifVal);
		},
		//Function to set UI view fields/button enable/disable or visible/invisible
		setUIFieldsProperty: function (operationStatus) {
			var that = this;
			var oWODetailFieldsModel = this.oWODetailFieldsModel;
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			switch (operationStatus) {
			case "CRTD":
				util.fnEnableUpdateWOFields(oWODetailFieldsModel, oWorkOrderDetailViewModel);
				that.fnCreateUpdateBtnTxt("UPDATE");
				break;
			case "REL":
				util.fnEnableReleaseWOFields(oWODetailFieldsModel, oWorkOrderDetailViewModel);
				that.fnCreateUpdateBtnTxt("WO_RELEASE");
				break;
			case "PCNF":
				util.fnEnableReleaseWOFields(oWODetailFieldsModel, oWorkOrderDetailViewModel);
				that.fnCreateUpdateBtnTxt("WO_RELEASE");
				break;
			case "CNF":
				util.fnEnableReleaseWOFields(oWODetailFieldsModel, oWorkOrderDetailViewModel);
				that.fnCreateUpdateBtnTxt("WO_RELEASE");
				break;
			case "TECO":
				util.fnEnableTecoWOFields(oWODetailFieldsModel, oWorkOrderDetailViewModel);
				that.fnCreateUpdateBtnTxt("WO_RELEASE");
				break;
			}
		},
		//Function to pre-populate Notification's required start date and end date
		fnPopulateNotifDates: function (notifications) {
			for (var i = 0; i < notifications.length; i++) {
				var currObj = notifications[i];
				var reqStartDate = currObj.Desstdate;
				var reqEndDate = currObj.Desenddate;
				if ((reqStartDate === "00000000" && reqEndDate === "00000000") || (reqStartDate === "" && reqEndDate === "") || (reqStartDate ===
						undefined && reqEndDate === undefined) || (reqStartDate === null && reqEndDate === null)) {
					reqStartDate = new Date();
					reqEndDate = new Date();
				} else if (reqStartDate === "00000000" || reqStartDate === "" || reqStartDate === undefined || reqStartDate === null) {
					reqStartDate = reqEndDate;
				} else if (reqEndDate === "00000000" || reqEndDate === "" || reqEndDate === undefined || reqEndDate === null) {
					reqEndDate = new Date();
				}
				currObj.Desstdate = reqStartDate;
				currObj.Desenddate = reqEndDate;
			}
			return notifications;
		},
		//Function to update WO Detail page buttons
		fnUpdateWODetailButton: function (orderStatus) {
			var that = this;
			var oWODetailFieldsModel = this.oWODetailFieldsModel;
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			switch (orderStatus) {
			case "":
				util.fnEnableUpdateWOFields(oWODetailFieldsModel, oWorkOrderDetailViewModel);
				that.fnCreateUpdateBtnTxt("UPDATE");
				break;
			case "CRTD":
				util.fnEnableUpdateWOFields(oWODetailFieldsModel, oWorkOrderDetailViewModel);
				that.fnCreateUpdateBtnTxt("UPDATE");
				break;
			case "REL":
				that.fnCreateUpdateBtnTxt("WO_RELEASE");
				util.fnEnableReleaseWOFields(oWODetailFieldsModel, oWorkOrderDetailViewModel);
				break;
			case "TECO":
				that.fnCreateUpdateBtnTxt("WO_TECO");
				util.fnEnableTecoWOFields(oWODetailFieldsModel, oWorkOrderDetailViewModel);
				break;
			case "PCNF":
				that.fnCreateUpdateBtnTxt("WO_RELEASE");
				util.fnEnableReleaseWOFields(oWODetailFieldsModel, oWorkOrderDetailViewModel);
				break;
			case "CNF":
				that.fnCreateUpdateBtnTxt("WO_RELEASE");
				util.fnEnableReleaseWOFields(oWODetailFieldsModel, oWorkOrderDetailViewModel);
				break;
			}
		},
		//Function to update operations list after operations confirmation
		updateOperationList: function (sOperationList, prevOperations) {
			if (prevOperations) {
				for (var i = 0; i < prevOperations.length; i++) {
					var operationId = prevOperations[i].Activity;
					for (var j = 0; j < sOperationList.length; j++) {
						var operId = sOperationList[j].Activity;
						if (operId === operationId) {
							prevOperations[i] = sOperationList[j];
						}
					}
				}
			} else {
				prevOperations = sOperationList;
			}
			return prevOperations;
		},

		//Function to get Work Order's Operations comments by WO id
		fnGetWOOperationsComments: function (Orderid) {
			var that = this;
			this.busy.open();
			var oPortalDataModel = this.oPortalDataModel;
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var oTempObj = {
				woId: Orderid
			};

			var oFilter = [];
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
					oWorkOrderDetailViewModel.setProperty("/operationCommentDto", oComments);
					oWorkOrderDetailViewModel.refresh();
				},
				error: function (oData) {
					oWorkOrderDetailViewModel.setProperty("/operationCommentDto", []);
					oWorkOrderDetailViewModel.refresh();
					that.busy.close();
				}
			});
		},

		//Function to get Equiments List
		onSearchEquipments: function (oEvent, isFromGetDetail) {
			var that = this;
			this.busy.open();
			var EqIdDes = "";
			var TechId = "";
			var mLookupModel = this.mLookupModel;
			var oPortalDataModel = this.oPortalDataModel;
			if (isFromGetDetail) {
				EqIdDes = oEvent;
			} else {
				TechId = mLookupModel.getProperty("/TechId");
				if (!TechId) {
					TechId = "";
				}
				EqIdDes = mLookupModel.getProperty("/EqIdDes");
				if (!EqIdDes) {
					EqIdDes = "";
				}
			}
			var userPlant = this.oUserDetailModel.getProperty("/userPlant");

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
					if (isFromGetDetail) {
						var oWorkOrderDetailViewModel = that.oWorkOrderDetailViewModel;
						if (aEquipmentsList.length > 0) {
							oWorkOrderDetailViewModel.setProperty("/AssetId", aEquipmentsList[0].Tidnr);
						} else {
							oWorkOrderDetailViewModel.setProperty("/AssetId", "");
						}
						oWorkOrderDetailViewModel.refresh();
					}
					that.busy.close();
				},
				error: function (oResponse) {
					mLookupModel.setProperty("/aEquipmentsList", []);
					that.busy.close();
				}
			});
		},

		//Function to get Attachments/Links for a WO
		fnGetWOAttachmentLinks: function (orderId) {
			var that = this;
			this.busy.open();
			var oFilter = [];
			var oPortalDataModel = this.oPortalDataModel;
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			oFilter.push(new Filter("OrderId", "EQ", orderId));

			oPortalDataModel.read("/AttachmentListSet", {
				filters: oFilter,
				success: function (oData) {
					var attachments = oData.results;
					oWorkOrderDetailViewModel.setProperty("/attachments", attachments);
					that.busy.close();
				},
				error: function (oData) {
					oWorkOrderDetailViewModel.setProperty("/attachments", []);
					that.showMessage(that.oResourceModel.getText("atterror"));
					that.busy.close();
				}
			});
		},

		//Function to get Tasks headers for a WO
		fnGetTaskHeaderList: function (plannerGrp) {
			var that = this;
			this.busy.open();
			var oFilter = [];
			var oPortalDataModel = this.oPortalDataModel;
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var userPlant = this.oUserDetailModel.getProperty("/userPlant");
			oFilter.push(new Filter("Werks", "EQ", userPlant));
			// oFilter.push(new Filter("Vagrp", "EQ", plannerGrp)); SH: changed as suggested by Gautham

			oPortalDataModel.read("/TaskHeaderSet", {
				filters: oFilter,
				success: function (oData) {
					var operHeaderSet = oData.results;
					oWorkOrderDetailViewModel.setProperty("/operHeaderSet", operHeaderSet);
					that.busy.close();
				},
				error: function (oData) {
					oWorkOrderDetailViewModel.setProperty("/operHeaderSet", []);
					that.showMessage(that.oResourceModel.getText("taskerror"));
					that.busy.close();
				}
			});
		},

		//Function to get Tasks list for a WO
		fnGetTaskList: function (operationHeader, Plnal, orderTypeFld) {
			var that = this;
			this.busy.open();
			var oFilter = [];
			var oPortalDataModel = this.oPortalDataModel;
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var userPlant = this.oUserDetailModel.getProperty("/userPlant");
			oFilter.push(new Filter("Werks", "EQ", userPlant));
			oFilter.push(new Filter("Plnnr", "EQ", operationHeader));
			if (Plnal !== null) { //SH: new filter for Plnal added
				oFilter.push(new Filter("Plnal", "EQ", Plnal));
			}

			oPortalDataModel.read("/TaskOperationsSet", {
				filters: oFilter,
				success: function (oData) {
					var operationTaskList = oData.results;
					if (orderTypeFld) {
						oWorkOrderDetailViewModel.setProperty("/orderTypeTasks", operationTaskList);
						if (orderTypeFld === "WO_DETAIL_ORDER_TYPE" || orderTypeFld === "CREATE_REF_WO") {
							var workCenter = oWorkOrderDetailModel.getProperty("/MnWkCtr");
							var operationsList = oWorkOrderDetailModel.getProperty("/HEADERTOOPERATIONSNAV");
							if (!operationsList && orderTypeFld === "WO_DETAIL_ORDER_TYPE") {
								operationsList = [];
							}
							that.setOrderTypeOperation(oWorkOrderDetailModel, oWorkOrderDetailViewModel, operationsList, workCenter);
						}
					} else {
						if (operationTaskList.length === 0) {
							that.showMessage(that.oResourceModel.getText("notaskfound"));
						} else {
							that.updateWOOperations(operationTaskList);
						}
					}
					that.busy.close();
				},
				error: function (oData) {
					oWorkOrderDetailViewModel.setProperty("/operationTaskList", []);
					that.showMessage(that.oResourceModel.getText("ERROR_IN_RETRIEVING_TASK_LIST"));
					that.busy.close();
				}
			});
		},
		//Function to set Order type Operations list
		setOrderTypeOperation: function (oWorkOrderDetailModel, oWorkOrderDetailViewModel, operations, workCenter) {
			var orderTypeTasks = oWorkOrderDetailViewModel.getProperty("/orderTypeTasks");
			if (orderTypeTasks) {
				operations = this.fbFormatOperationTasklist(orderTypeTasks, operations, workCenter);
				oWorkOrderDetailModel.setProperty("/HEADERTOOPERATIONSNAV", operations);
				oWorkOrderDetailModel.refresh();
				this.getTaskOperationIdLookup();
			}
		},
		//Function to generate Operations ID lookup
		getTaskOperationIdLookup: function () {
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

		//Function to generate Operation Id while adding new Operation for a WO
		fnGenerateOperationId: function (operations) {
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

		//Function to get formatted Task list that is to be added on HeaderOperationsNav
		fbFormatOperationTasklist: function (taskList, operations, workCenter) {
			var userPlant = this.oUserDetailModel.getProperty("/userPlant");
			for (var i = 0; i < taskList.length; i++) {
				var newOperationId = this.fnGenerateOperationId(operations);
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

		//Function to get Task list based on Order Type
		getOrderTypeTasks: function (oEvent) {
			var orderType = "";
			var orderTypeFld = "";
			if (typeof (oEvent) === "string") {
				orderType = oEvent;
				orderTypeFld = "CREATE_REF_WO";
			} else {
				var oSource = oEvent.getSource();
				orderType = oSource.getSelectedKey();
				orderTypeFld = oSource.getCustomData()[0].getValue();
			}
			if (!orderType) {
				return;
			}
			var that = this;
			this.busy.open();
			var mLookupModel = this.mLookupModel;
			var oPortalDataModel = this.oPortalDataModel;
			var userPlant = this.oUserDetailModel.getProperty("/userPlant");
			var sUrl = "/GetTaskSet(plant='" + userPlant + "',OrderType='" + orderType + "')";
			oPortalDataModel.read(sUrl, {
				success: function (oData) {
					that.fnGetTaskList(oData.Plnnr, null, orderTypeFld);
					that.busy.close();
				},
				error: function (oData) {
					mLookupModel.setProperty("/aOrderTypeTasksList", []);
					mLookupModel.refresh();
					that.busy.close();
				}
			});
		},

		//Function to clear Operation and Spare part table selection
		fnClearTblSelection: function () {
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var opertionTableFrag = this.getView().createId("idOperationsMaterialPanelWO");
			var opertionTbl = sap.ui.core.Fragment.byId(opertionTableFrag, "MYLAN_OPERATIONS_TABLE");
			opertionTbl.clearSelection();
			var componentTbl = sap.ui.core.Fragment.byId(opertionTableFrag, "MYLAN_OP_SPARE_PART_TBL");
			componentTbl.clearSelection();
			oWorkOrderDetailViewModel.setProperty("/selectedOps", []);
			oWorkOrderDetailViewModel.setProperty("/selectedSpareParts", []);
			oWorkOrderDetailViewModel.setProperty("/Activity", "");
			oWorkOrderDetailViewModel.setProperty("/operationLongTxt", "");
			oWorkOrderDetailViewModel.setProperty("/enableOperationComment", false);
			oWorkOrderDetailViewModel.setProperty("/enableOpCnfmLongText", false);
			oWorkOrderDetailViewModel.setProperty("/confirmationLongText", "");
			oWorkOrderDetailViewModel.refresh();
			//this.fnFilterSlectedOperationComment();//No comment section is present.
		},

		//Function to open Digital signaure pop-up
		onOpenDigitalSignPopup: function (oEvent) {
			if (!this.digitalSignaturePopUp) {
				this.digitalSignaturePopUp = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.digitalSignaturePopup", this);
				this.getView().addDependent(this.digitalSignaturePopUp);
			}

			this.digitalSignaturePopUp.open();
		},
		//Function to close Digital signaure pop-up
		onCloseDigitalSignPopUp: function () {
			this.digitalSignaturePopUp.close();
		},
		//Function to Validate User Id and Password for logged in user
		fnValidateLoggedInUser: function (oEvent) {
			var that = this;
			this.busy.open();
			var oUserDetailModel = this.oUserDetailModel;
			var oPortalUserLoginOData = this.oPortalUserLoginOData;
			var oUserName = oUserDetailModel.getProperty("/userName");
			var oDigitalSign = oUserDetailModel.getProperty("/digitalSign");
			if (!oDigitalSign) {
				that.showMessage(that.oResourceModel.getText("plenterpass"));
				return;
			}

			oDigitalSign = btoa(oDigitalSign); // encode to base 64
			var sUrl = "/LOGIN_USER_CHECKSet(UserId='" + oUserName + "',Password='" + oDigitalSign + "')";
			oPortalUserLoginOData.read(sUrl, {
				urlParameters: {
					"$format": "json"
				},
				success: function (oData) {
					oUserDetailModel.setProperty("/digitalSign", "");
					oUserDetailModel.refresh(true);
					var oMessage = oData.Message;
					var repsonseCode = oData.Message_type;
					if (repsonseCode === "success") {
						var oWorkOrderDetailViewModel = that.oWorkOrderDetailViewModel;
						var oBtnType = oWorkOrderDetailViewModel.getProperty("/digitalSignBtnTrigger");
						that.onCreateUpdateWO(oBtnType);
					} else {
						that.showMessage(oMessage);
						that.busy.close();
					}
					that.onCloseDigitalSignPopUp();
				},
				error: function (oData) {
					oUserDetailModel.setProperty("/digitalSign", "");
					oUserDetailModel.refresh(true);
					that.showMessage(that.oResourceModel.getText("validerrorusercred"));
					that.busy.close();
				}
			});
		},
		//Function to update Breakdown Duration
		fnGetBreakdownDurNotif: function () {
			var oNotificationDataModel = this.oNotificationDataModel;
			var oNotificationViewModel = this.oNotificationViewModel;
			var startTime = oNotificationViewModel.getProperty("/StartTime");
			var endTime = oNotificationViewModel.getProperty("/EndTime");
			var sStartDate = oNotificationDataModel.getProperty("/Startdate").toDateString();

			var sEnddate = oNotificationDataModel.getProperty("/Enddate");
			if (sEnddate && endTime !== "") {
				sEnddate = sEnddate.toDateString();
				var nDuration = formatter.fnGetBreakdownDur(sStartDate, startTime, sEnddate, endTime);
				if (nDuration >= 24) {
					MessageBox.warning("The Breakdown duration is greater than or equal to 24 hours");
					oNotificationDataModel.setProperty("/BreakdownDur", nDuration);
				} else if (nDuration < 0) {
					MessageBox.error("Please enter valid malfunction Date and Time");
					this.fnResetMalfnDateTimes();
				} else {
					oNotificationDataModel.setProperty("/BreakdownDur", nDuration);
				}
			} else if (sEnddate && endTime === "") {
				var oDate = new Date();
				endTime = oDate.getHours() + ":" + oDate.getMinutes();
				oNotificationViewModel.setProperty("/EndTime", endTime);
				sEnddate = sEnddate.toDateString();
				var nDuration = formatter.fnGetBreakdownDur(sStartDate, startTime, sEnddate, endTime);
				if (nDuration >= 24) {
					MessageBox.warning("The Breakdown duration is greater than or equal to 24 hours");
					oNotificationDataModel.setProperty("/BreakdownDur", nDuration);
				} else if (nDuration < 0) {
					MessageBox.error("Please enter valid malfunction Date and Time");
					this.fnResetMalfnDateTimes();
				} else {
					oNotificationDataModel.setProperty("/BreakdownDur", nDuration);
				}
			}

		},

		//Function to reset malfunction fields
		fnResetMalfnDateTimes: function () {
			var oNotificationDataModel = this.oNotificationDataModel;
			var oNotificationViewModel = this.oNotificationViewModel;
			oNotificationDataModel.setProperty("/Startdate", new Date());
			oNotificationDataModel.setProperty("/Enddate", null);
			oNotificationViewModel.setProperty("/StartTime", formatter.formatCurrentTime(new Date()));
			oNotificationViewModel.setProperty("/EndTime", "");
			oNotificationDataModel.setProperty("/BreakdownDur", "0");
		},

		//Function to update notification
		onUpdateNotifcationFields: function (sData, navType) {
			var reportedBy = sData.ReportedBy;
			var orderId = sData.Orderid;
			var causeCode = sData.Causecode;
			var causeGroup = sData.CauseGroup;
			var damageCode = sData.Damagecode;
			var damageGroup = sData.DamageGroup;
			var breakDown = sData.Breakdown;
			var breakDownDuration = sData.Downtime;
			if (!breakDownDuration) {
				breakDownDuration = 0;
			} else {
				breakDownDuration = parseFloat(breakDownDuration);
				if (breakDownDuration === "NaN") {
					breakDownDuration = 0;
				}
			}
			var oPlanStartDate = sData.PlanStartDate;
			var sPlanStartDate = formatter.formatDtTimeObjToTString(oPlanStartDate);
			var oPlanEndDate = sData.PlanEndDate;
			var sPlanEndDate = formatter.formatDtTimeObjToTString(oPlanEndDate);
			var malFnStartDate = new Date(sData.MalFunStartDate);
			var malfnStartTime = sData.MalFunStartTime.ms;
			var oMalFnStDateTime = formatter.getUTSHrsMins(malfnStartTime);
			var oNewDate = malFnStartDate.setHours(oMalFnStDateTime[0], oMalFnStDateTime[1]);
			var userPlant = this.oUserDetailModel.getProperty("/userPlant");
			oNewDate = new Date(oNewDate);
			var startDate = oNewDate;

			var endDate = jQuery.extend(true, new Date(oNewDate), oNewDate);
			endDate = endDate.setHours(endDate.getHours() + breakDownDuration);
			endDate = new Date(endDate);

			breakDownDuration = breakDownDuration.toString();
			var mins = "0." + breakDownDuration.split(".")[1];
			mins = 60 * parseFloat(mins);
			endDate = endDate.setMinutes(endDate.getMinutes() + mins);
			endDate = new Date(endDate);

			startDate = formatter.formatDtTimeObjToTString(startDate);
			endDate = formatter.formatDtTimeObjToTString(endDate);

			if (sData.HEADERTONOTIFNAV) { //++George-
				var oNotification = sData.HEADERTONOTIFNAV.results[0];
			}
			var oNewNotif = {};
			if (oNotification) {
				oNewNotif.Notifid = oNotification.NotifNo;
			}
			oNewNotif.Breakdown = breakDown;
			oNewNotif.BreakdownDur = breakDownDuration;
			oNewNotif.Startdate = startDate;
			oNewNotif.Enddate = endDate;
			oNewNotif.CauseCode = causeCode;
			oNewNotif.CauseGroup = causeGroup;
			oNewNotif.DamageCode = damageCode;
			oNewNotif.DamageGroup = damageGroup;
			oNewNotif.Reportedby = reportedBy;
			oNewNotif.ItemKey = "0001";
			oNewNotif.ItemSortNo = "0001";
			oNewNotif.PlanPlant = userPlant;
			oNewNotif.Notif_date = startDate;
			oNewNotif.ReqStartdate = sPlanStartDate;
			oNewNotif.ReqEnddate = sPlanEndDate;
			oNewNotif.ShortText = sData.ShortText;
			oNewNotif.Plangroup = sData.Plangroup;
			oNewNotif.Equipment = sData.Equipment;
			oNewNotif.Assembly = sData.Assembly;
			oNewNotif.FunctLoc = sData.FunctLoc;

			oNewNotif.Notify = [{
				"Type": "",
				"Message": ""
			}];
			this.updateNotificationToServer(oNewNotif, orderId, navType);
		},

		//Function to update Notification data object locally in UI
		updateNotificationToServer: function (oNotifData, orderId, navType) {
			var that = this;
			this.busy.open();
			var oPortalNotifOData = this.oPortalNotifOData;
			oNotifData.Type = "UPDATE";
			if (oNotifData.Breakdown === true) {
				oNotifData.Breakdown = "X";
			} else if (oNotifData.Breakdown === false) {
				oNotifData.Breakdown = " ";
			}
			oPortalNotifOData.setHeaders({
				"X-Requested-With": "X"
			});

			oPortalNotifOData.create("/NotificationSet", oNotifData, {
				success: function (sData, oResponse) {
					if (navType === "WO_DETAIL_UPDATE_EXIT" || navType === "WO_DETAIL_CREATE_EXIT") {
						that.checkWOSessionTab(navType);
					} else {
						that.fnGetWOHeaderDetailsCreateWO(orderId, navType);
					}
				},
				error: function (error, oResponse) {
					that.busy.close();
				}
			});
		},

		//Function to check if the WO is opened in New tab or same tab
		checkWOSessionTab: function (navType) {
			var sBSPPath, sURL;
			var hash = window.location.hash;
			var sHost = window.location.origin;
			if (navType === "WO_DETAIL_UPDATE_EXIT") {
				if (hash.includes("detailTabWO")) {
					window.close();
				} else if (hash.includes("detailWO")) {
					sBSPPath = "/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html";
					sURL = sHost + sBSPPath;
					sap.m.URLHelper.redirect(sURL);
				}
			} else if (navType === "WO_DETAIL_CREATE_EXIT") {
				sBSPPath = "/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html";
				sURL = sHost + sBSPPath;
				sap.m.URLHelper.redirect(sURL);
			}
		},

		fnDateSeperator: function (date) {
			var oDate = "";
			if (date) {
				var iYear = date.substr(0, 4);
				var iMon = date.substr(4, 2);
				var iDate = date.substr(6, 2);
				oDate = iDate + "-" + iMon + "-" + iYear;
			}
			return oDate;
		},

		//Function to initalize Create Work detail app
		fnInitCreateNotifApp: function () {
			this.busy = new BusyDialog();
			this.MessageBox = MessageBox;

			this.DateFormat = DateFormat.getDateTimeInstance({
				pattern: "yyyy-MM-dd HH:mm:ss"
			});

			this.oHeader = {
				"Accept": "application/json",
				"Content-Type": "application/json"
			};

			var oPortalDataModel = this.getOwnerComponent().getModel("oPortalDataModel");
			this.oPortalDataModel = oPortalDataModel;

			var oPortalNotifOData = this.getOwnerComponent().getModel("oPortalNotifOData");
			this.oPortalNotifOData = oPortalNotifOData;
			oPortalDataModel.setHeaders({
				"Accept": "application/json",
				"Content-Type": "application/json"
			});

			//ODataModel holding metadata of Application's lookup services
			var oLookupDataModel = this.getOwnerComponent().getModel("oLookupDataModel");
			this.oLookupDataModel = oLookupDataModel;

			//Application Model used only for Translation of texts
			var oResourceModel = this.getOwnerComponent().getModel("i18n");
			this.oResourceModel = oResourceModel.getResourceBundle();

			//Application Model used only for storing of Application's lookups
			var mLookupModel = this.getOwnerComponent().getModel("mLookupModel");
			this.mLookupModel = mLookupModel;
			mLookupModel.setSizeLimit(10000);

			var oNotificationDataModel = this.getOwnerComponent().getModel("oNotificationDataModel");
			this.oNotificationDataModel = oNotificationDataModel;

			var oNotificationViewModel = this.getOwnerComponent().getModel("oNotificationViewModel");
			this.oNotificationViewModel = oNotificationViewModel;

			//Data Model used for holding Application's logged in user details
			var oUserDetailModel = this.getOwnerComponent().getModel("oUserDetailModel");
			this.oUserDetailModel = oUserDetailModel;

			var oPortalUserLoginOData = this.getOwnerComponent().getModel("oPortalUserLoginOData");
			this.oPortalUserLoginOData = oPortalUserLoginOData;

			//ODataModel holding metadata of Application's GET/POST of WorkOrder Detail only!!
			var oWorkOrderOData = this.getOwnerComponent().getModel("oWorkOrderOData");
			this.oWorkOrderOData = oWorkOrderOData;
			oWorkOrderOData.setHeaders({
				"Accept": "application/json",
				"Content-Type": "application/json"
			});

			this.getLoggedInUserCreateNotif();
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
			oFilter.push(new Filter("EnteredByName", "EQ", ""));
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
		//Function to initalize Create Work detail app
		fnInitNotificationListApp: function (viewType) {
			this.busy = new BusyDialog();
			this.MessageBox = MessageBox;

			this.DateFormat = DateFormat.getDateTimeInstance({
				pattern: "yyyy-MM-dd HH:mm:ss"
			});

			this.oHeader = {
				"Accept": "application/json",
				"Content-Type": "application/json"
			};

			var oPortalDataModel = this.getOwnerComponent().getModel("oPortalDataModel");
			this.oPortalDataModel = oPortalDataModel;

			var oPortalNotifOData = this.getOwnerComponent().getModel("oPortalNotifOData");
			this.oPortalNotifOData = oPortalNotifOData;
			oPortalNotifOData.setHeaders({
				"Accept": "application/json",
				"Content-Type": "application/json"
			});

			//ODataModel holding metadata of Application's lookup services
			var oLookupDataModel = this.getOwnerComponent().getModel("oLookupDataModel");
			this.oLookupDataModel = oLookupDataModel;

			//Application Model used only for Translation of texts
			var oResourceModel = this.getOwnerComponent().getModel("i18n");
			this.oResourceModel = oResourceModel.getResourceBundle();

			//Application Model used only for storing of Application's lookups
			var mLookupModel = this.getOwnerComponent().getModel("mLookupModel");
			this.mLookupModel = mLookupModel;
			mLookupModel.setSizeLimit(10000);
			var oViewSetting = {
				"iSelectedIndices": 0,
				"iTopNotif": 100,
				"iSkipNotif": 0,
				"sNotifIDDesFilter": "",
				"oNotifDetail": {}
			};
			mLookupModel.setProperty("/", oViewSetting);

			var oNotificationDataModel = this.getOwnerComponent().getModel("oNotificationDataModel");
			this.oNotificationDataModel = oNotificationDataModel;

			var oNotificationViewModel = this.getOwnerComponent().getModel("oNotificationViewModel");
			this.oNotificationViewModel = oNotificationViewModel;

			//Data Model used for holding Application's logged in user details
			var oUserDetailModel = this.getOwnerComponent().getModel("oUserDetailModel");
			this.oUserDetailModel = oUserDetailModel;

			var oNotifCountOData = this.getOwnerComponent().getModel("oNotifCountOData");
			this.oNotifCountOData = oNotifCountOData;

			//ODataModel holding metadata of Application's GET/POST of WorkOrder Detail only!!
			var oWorkOrderOData = this.getOwnerComponent().getModel("oWorkOrderOData");
			this.oWorkOrderOData = oWorkOrderOData;
			oWorkOrderOData.setHeaders({
				"Accept": "application/json",
				"Content-Type": "application/json"
			});

			//Data Model holding Work Order details, used to set only for GET/POST [View: Work Order Detail]
			var oWorkOrderDetailModel = this.getOwnerComponent().getModel("oWorkOrderDetailModel");
			this.oWorkOrderDetailModel = oWorkOrderDetailModel;

			var oPortalUserLoginOData = this.getOwnerComponent().getModel("oPortalUserLoginOData");
			this.oPortalUserLoginOData = oPortalUserLoginOData;

			this.getLoggedInUserNotifList(viewType);
		},
		//Function to BreakDown notification count
		getNotificationKPICount: function () {
			var that = this;
			this.busy.open();
			var mLookupModel = this.mLookupModel;
			mLookupModel.setProperty("/bBusyworkcenter", true);
			var userPlant = this.oUserDetailModel.getProperty("/userPlant");
			var sWorkCenterSel = mLookupModel.getProperty("/sWorkCenterSel");
			if (sWorkCenterSel === null || sWorkCenterSel === undefined) {
				sWorkCenterSel = "";
			}
			var oFilter = [];
			oFilter.push(new Filter("Plant", "EQ", userPlant));
			oFilter.push(new Filter("WorkCenter", "EQ", sWorkCenterSel));
			oFilter.push(new Filter("Type", "EQ", "COUNT"));

			var oPortalDataModel = this.oPortalDataModel;
			oPortalDataModel.read("/KPISet", {
				filters: oFilter,
				success: function (oData) {
					that.fnGetKPICounts(oData.results);
					that.busy.close();
				},
				error: function (oData) {
					mLookupModel.setProperty("/bBusyworkcenter", false);
					mLookupModel.setProperty("/breakDownNotificationCount", "0");
					mLookupModel.setProperty("/notificationsDueCount", "0");
					mLookupModel.setProperty("/assignedtoMeCount", "0");
					mLookupModel.setProperty("/assignedtoWCCount", "0");
					mLookupModel.refresh();
					that.busy.close();
				}
			});
		},
		//Function to update WO's notifications
		updateWorkOrder: function () {
			var that = this;
			this.busy.open();
			var oWorkOrderOData = this.oWorkOrderOData;
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var oWorkOrderData = oWorkOrderDetailModel.getData();
			var headerMessage = [{
				"Message": "",
				"Status": ""
			}];
			oWorkOrderData.HEADERTOMESSAGENAV = headerMessage;
			this.fnGetNewNotifications(oWorkOrderData);
			oWorkOrderOData.setHeaders({
				"X-Requested-With": "X"
			});
			oWorkOrderOData.create("/WorkorderHeaderSet", oWorkOrderData, {
				success: function (sData, oResponse) {
					var messages = sData.HEADERTOMESSAGENAV.results;
					var orderId = sData.Orderid;
					var response = messages[0];
					var status = response.Status;
					sData = that.fnFormatWODateObjects(sData);
					if (status === "S" && orderId) {
						if (that._oDialogAssignWO) {
							that.onCancelDialogAssign();
						}
					}
					var SkipNotif = that.mLookupModel.getProperty("/iSkipNotif"); //Sunanda-to ensure the record with change is updated
					that.mLookupModel.setProperty("/iSkipNotif", 0);
					that.fnRefreshNotifListTable(SkipNotif);
					that.fnShowSuccessErrorMsg(messages);
					that.busy.close();
				},
				error: function (sData, oResponse) {
					that.busy.close();
				}
			});
		},

		//Function to reset Notification list table
		fnResetUItable: function () {
			var that = this;
			var mLookupModel = that.mLookupModel;
			var oNotifTbl = that.getView().byId("notifListId");
			that.fnResetFilers(oNotifTbl, "mLookupModel");
			mLookupModel.setProperty("/selectedNotifs", []);
			mLookupModel.setProperty("/iSelectedIndices", 0);
			mLookupModel.refresh(true);
			that.fnFetchNotifList();
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

		//Function to format Work Order data's Date format to string
		fnFormatWODateObjectsToStr: function (oData) {
			oData.DateCreated = formatter.formatDateobjToString(oData.DateCreated);
			oData.MalFunStartDate = formatter.formatDateobjToString(oData.MalFunStartDate);
			oData.PlanEndDate = formatter.formatDateobjToString(oData.PlanEndDate);
			oData.PlanStartDate = formatter.formatDateobjToString(oData.PlanStartDate);
			var i = 0;

			var operations = oData.HEADERTOOPERATIONSNAV;
			for (i = 0; i < operations.length; i++) {
				var completedDate = operations[i].CompletedOn;
				completedDate = formatter.formatDateobjToString(completedDate);
				operations[i].CompletedOn = completedDate;
			}
			oData.HEADERTOOPERATIONSNAV = operations;

			var notifications = oData.HEADERTONOTIFNAV;
			for (i = 0; i < notifications.length; i++) {
				var stDate = notifications[i].Desstdate;
				var endDate = notifications[i].Desenddate;
				stDate = formatter.formatDateobjToString(stDate);
				endDate = formatter.formatDateobjToString(endDate);
				notifications[i].Desstdate = stDate;
				notifications[i].Desenddate = endDate;
			}
			oData.HEADERTONOTIFNAV = notifications;
			return oData;
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
			var i = 0;
			for (i = 0; i < operations.length; i++) {
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

			var notifications = oData.HEADERTONOTIFNAV.results;
			for (i = 0; i < notifications.length; i++) {
				var startDate = notifications[i].Desstdate;
				var endDate = notifications[i].Desenddate;
				if (startDate) {
					startDate = new Date(startDate);
				} else if (startDate === "" || startDate === null) {
					startDate = new Date();
				}
				if (endDate) {
					endDate = new Date(endDate);
				} else if (endDate === "" || endDate === null) {
					endDate = new Date();
				}
				notifications[i].Desstdate = startDate;
				notifications[i].Desenddate = endDate;
			}
			oData.HEADERTONOTIFNAV.results = notifications;
			return oData;
		},
		fnDateConversionToSting: function (date, gwdate) {
			if (date) {
				var iDate = date.getDate();
				var iMon = date.getMonth() + 1;
				var iYear = date.getFullYear();
				if (iMon < 10) {
					iMon = "0" + iMon;
				}
				if (iDate < 10) {
					iDate = "0" + iDate;
				}
				if (gwdate) {
					return iYear + "-" + iMon + "-" + iDate;
				}
				return iDate + "-" + iMon + "-" + iYear;
			}
			return "";
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
		//Function to initalize Create Work detail app
		fnInitCreateReportsApp: function () {

			this.busy = new BusyDialog();
			this.MessageBox = MessageBox;

			this.DateFormat = DateFormat.getDateTimeInstance({
				pattern: "yyyy-MM-dd HH:mm:ss"
			});

			this.oHeader = {
				"Accept": "application/json",
				"Content-Type": "application/json"
			};

			//ODataModel holding metadata of Application's services
			var oPortalDataModel = this.getOwnerComponent().getModel("oPortalDataModel");
			this.oPortalDataModel = oPortalDataModel;

			//ODataModel holding metadata of Application's lookup services
			var oLookupDataModel = this.getOwnerComponent().getModel("oLookupDataModel");
			this.oLookupDataModel = oLookupDataModel;

			//Application Model used only for storing of Application's lookups
			var mLookupModel = this.getOwnerComponent().getModel("mLookupModel");
			this.mLookupModel = mLookupModel;
			mLookupModel.setSizeLimit(10000);

			//Application Model used only for Translation of texts
			var oResourceModel = this.getOwnerComponent().getModel("i18n");
			this.oResourceModel = oResourceModel.getResourceBundle();

			//Data Model used for holding Application's logged in user details
			var oUserDetailModel = this.getOwnerComponent().getModel("oUserDetailModel");
			this.oUserDetailModel = oUserDetailModel;

			//View Model used for configuring UI controls, and not for GET/POST [View:to set properties]
			var oViewPropertyModel = this.getOwnerComponent().getModel("oViewPropertyModel");
			this.oViewPropertyModel = oViewPropertyModel;
			oViewPropertyModel.setSizeLimit(5000);

			//Data Model holding Reports Data, used to set only for GET/POST [View:Reports]
			var oReportsDataModel = this.getOwnerComponent().getModel("oReportsDataModel");
			this.oReportsDataModel = oReportsDataModel;

			this.getLoggedInUserReports();
		},
		//Function to get Plant lookup
		getSystemPlants: function () {
			var that = this;
			this.busy.open();
			var sUrl = "/plantsSet";
			var mLookupModel = this.mLookupModel;
			var oPortalDataModel = this.oPortalDataModel;
			var oUserPlant = this.oUserDetailModel.getProperty("/userPlant");
			this.fnShowSelectedReport("MAINTENANCE_REPORT");

			oPortalDataModel.read(sUrl, {
				success: function (oData) {
					var aPlantSet = oData.results;
					mLookupModel.setProperty("/aPlantSet", aPlantSet);
					that.getWorkCentersReports("", oUserPlant);
					mLookupModel.refresh();
					that.busy.close();
				},
				error: function (oData) {
					mLookupModel.setProperty("/aPlantSet", []);
					mLookupModel.refresh();
					that.busy.close();
				}
			});
		},
		//Function to get Functional location list based on Plant
		getFunctionalLocs: function (oEvent, repPlant) {
			var plant = "";
			var workCenter = "";
			var oResourceModel = this.oResourceModel;
			var oViewPropertyModel = this.oViewPropertyModel;
			if (oEvent) {
				plant = oViewPropertyModel.getProperty("/mtrPlant");
				workCenter = oViewPropertyModel.getProperty("/mtrWorkCenter");
			} else if (repPlant) {
				plant = repPlant;
			} else {
				plant = oViewPropertyModel.getProperty("/pmCompliancePlant");
				if (plant === "" || plant === undefined) {
					this.showMessage(oResourceModel.getText("PLEASE_SELECT_PLANT"));
					return;
				}
			}

			var that = this;
			this.busy.open();
			var sUrl = "/EquipmentDetailsSet";
			var mLookupModel = this.mLookupModel;
			var oPortalDataModel = this.oPortalDataModel;
			mLookupModel.setProperty("/aFuncLocSet", []);
			this.oViewPropertyModel.setProperty("/aEuipSet", []);

			var oFilter = [];
			oFilter.push(new Filter("plant", "EQ", plant));
			oFilter.push(new Filter("Tplnr", "EQ", ""));
			if (workCenter) {
				oFilter.push(new Filter("WorkCenter", "EQ", workCenter));
			}

			oPortalDataModel.read(sUrl, {
				filters: oFilter,
				success: function (oData) {
					var aFuncLocSet = oData.results;
					aFuncLocSet = util.removeDuplicateFunLocs(aFuncLocSet);
					mLookupModel.setProperty("/aFuncLocSet", aFuncLocSet);
					//if (workCenter) {
					var aEuipSet = util.removeDuplicateEquipments(oData.results);
					mLookupModel.setProperty("/aEuipSet", aEuipSet);
					//}
					oViewPropertyModel.refresh();
					mLookupModel.refresh();
					that.busy.close();
				},
				error: function (oData) {
					mLookupModel.setProperty("/aFuncLocSet", []);
					mLookupModel.refresh();
					that.busy.close();
				}
			});
		},
		//Function to get Work centers list based on Plant
		getTeamLeads: function (oEvent) {
			var oPlant = "",
				selWCs = [];
			var that = this;
			this.busy.open();

			var oSource = oEvent.getSource();
			var oSelectedRep = oSource.getCustomData()[0].getValue();

			var mLookupModel = this.mLookupModel;
			var oPortalDataModel = this.oPortalDataModel;
			var oViewPropertyModel = this.oViewPropertyModel;
			mLookupModel.setProperty("/aTeamLeadSet", []);

			if (oSelectedRep === "WO_STATUS_WORKCENTER") {
				oPlant = oViewPropertyModel.getProperty("/woStatusPlant");
				selWCs = oViewPropertyModel.getProperty("/woStatusWorkCenter");
			} else if (oSelectedRep === "LBR_HR_WORKCENTER") {
				oPlant = oViewPropertyModel.getProperty("/labourHrPlant");
				selWCs = oViewPropertyModel.getProperty("/labourHrWorkCenter");
			}

			var oFilter = [];
			oFilter.push(new Filter("Plant", "EQ", oPlant));
			for (var i = 0; i < selWCs.length; i++) {
				oFilter.push(new Filter("WorkCenter", "EQ", selWCs[i]));
			}
			oPortalDataModel.read("/TeamLeadListSet", {
				filters: oFilter,
				success: function (oData) {
					var aTeamLeadSet = oData.results;
					mLookupModel.setProperty("/aTeamLeadSet", aTeamLeadSet);
					mLookupModel.refresh();
					that.busy.close();
				},
				error: function (oData) {
					mLookupModel.setProperty("/aTeamLeadSet", []);
					mLookupModel.refresh();
					that.busy.close();
				}
			});
		},
		//Function generate PM Complicane report Compliance options dropdown values
		generateComplianceVals: function () {
			var oCompliance = [{
				text: "Work Started",
				key: "01"
			}, {
				text: "Work Completed",
				key: "02"
			}];
			var oViewPropertyModel = this.oViewPropertyModel;
			oViewPropertyModel.setProperty("/complicanceOptions", oCompliance);
		},
		//Function generate Time buckets range dropdown values
		generateTimeBucketVals: function () {
			var oTimeBucket = [{
				text: "Last 1 month",
				key: "01"
			}, {
				text: "Last 3 months",
				key: "03"
			}, {
				text: "Last 6 months",
				key: "06"
			}, {
				text: "Last 12 months",
				key: "12"
			}];
			var oViewPropertyModel = this.oViewPropertyModel;
			oViewPropertyModel.setProperty("/timeBucket", oTimeBucket);
		},
		//Function to search PM Compliance Report based on Functional Location
		fnSearchFLComplianceRep: function () {
			var oPortalDataModel = this.oPortalDataModel;
			var oReportsDataModel = this.oReportsDataModel;
			var oViewPropertyModel = this.oViewPropertyModel;
			var bVal = util.validateComplianceFLFields(oViewPropertyModel, this);
			if (bVal) {
				var that = this;
				this.busy.open();
				var plant = oViewPropertyModel.getProperty("/pmCompliancePlant");
				var funcLoc = oViewPropertyModel.getProperty("/pmComplianceFunLoc");
				var compliancOption = oViewPropertyModel.getProperty("/pmComplianceOptions");
				var datePeriod = oViewPropertyModel.getProperty("/pmComplianceTimeBucket");

				var oFilter = [];
				oFilter.push(new Filter("Plant", "EQ", plant));
				oFilter.push(new Filter("CompOption", "EQ", compliancOption));
				oFilter.push(new Filter("TimeBucket", "EQ", datePeriod));
				for (var i = 0; i < funcLoc.length; i++) {
					oFilter.push(new Filter("FnLoc", "EQ", funcLoc[i]));
				}
				oPortalDataModel.read("/PMCompReportSet", {
					filters: oFilter,
					success: function (oData) {
						var pmComplianceRep = oData.results;
						pmComplianceRep = util.fnFormatPMComplianceFLRepData(pmComplianceRep);
						oReportsDataModel.setData(pmComplianceRep);
						oReportsDataModel.refresh(true);
						if (pmComplianceRep.length >= 1) {
							oViewPropertyModel.setProperty("/pmComplianceGraphVisible", true);
							that.fnGenPMComplianceGraph();
						} else {
							oViewPropertyModel.setProperty("/pmComplianceGraphVisible", false);
						}
						that.busy.close();
					},
					error: function (oData) {
						oReportsDataModel.setProperty([]);
						oViewPropertyModel.setProperty("/pmComplianceGraphVisible", true);
						oReportsDataModel.refresh();
						that.busy.close();
					}
				});
			}
		},
		//Function to search PM Compliance Report based on Work center
		fnSearchWOComplianceRep: function () {
			var oPortalDataModel = this.oPortalDataModel;
			var oReportsDataModel = this.oReportsDataModel;
			var oViewPropertyModel = this.oViewPropertyModel;
			var bVal = util.validateComplianceWCFields(oViewPropertyModel, this);
			if (bVal) {
				var that = this;
				this.busy.open();
				var plant = oViewPropertyModel.getProperty("/pmCompliancePlant");
				var workCenters = oViewPropertyModel.getProperty("/pmComplianceWCs");
				var orderTypes = oViewPropertyModel.getProperty("/pmComplianceOrders");
				var compliancOption = oViewPropertyModel.getProperty("/pmComplianceOptions");
				var datePeriod = oViewPropertyModel.getProperty("/pmComplianceTimeBucket");

				var oFilter = [];
				oFilter.push(new Filter("Plant", "EQ", plant));
				oFilter.push(new Filter("CompOption", "EQ", compliancOption));
				oFilter.push(new Filter("TimeBucket", "EQ", datePeriod));
				for (var i = 0; i < orderTypes.length; i++) {
					oFilter.push(new Filter("OrderType", "EQ", orderTypes[i]));
				}
				for (var j = 0; j < workCenters.length; j++) {
					oFilter.push(new Filter("WorkCenter", "EQ", workCenters[j]));
				}
				oPortalDataModel.read("/PMCompRepWCenterSet", {
					filters: oFilter,
					success: function (oData) {
						var pmComplianceRep = oData.results;
						pmComplianceRep = util.fnFormatPMComplianceWCRepData(pmComplianceRep);
						oReportsDataModel.setData(pmComplianceRep);
						oReportsDataModel.refresh(true);
						if (pmComplianceRep.length >= 1) {
							oViewPropertyModel.setProperty("/pmComplianceGraphVisible", true);
							that.fnGenPMComplianceWCGraph();
						} else {
							oViewPropertyModel.setProperty("/pmComplianceGraphVisible", false);
						}
						that.busy.close();
					},
					error: function (oData) {
						oReportsDataModel.setProperty([]);
						oViewPropertyModel.setProperty("/pmComplianceGraphVisible", true);
						oReportsDataModel.refresh();
						that.busy.close();
					}
				});
			}
		},
		//Function to search Planned Reactive report data
		fnSearchPlannedRectiveRep: function () {
			var oResourceModel = this.oResourceModel;
			var oPortalDataModel = this.oPortalDataModel;
			var oReportsDataModel = this.oReportsDataModel;
			var oViewPropertyModel = this.oViewPropertyModel;
			var plant = oViewPropertyModel.getProperty("/plannedReactivePlant");
			var datePeriod = oViewPropertyModel.getProperty("/plannedReactiveDatePeriod");
			var workCenters = oViewPropertyModel.getProperty("/plannedReactiveWCs");
			if (plant === "" || plant === undefined) {
				this.showMessage(oResourceModel.getText("PLEASE_SELECT_PLANT"));
				return;
			}
			if (workCenters.length >= 6) {
				this.showMessage(oResourceModel.getText("PLEASE_SEL_MAX_5_WC"));
				return;
			} else if (workCenters.length === 0) {
				this.showMessage(oResourceModel.getText("SEL_ATLEAST_1_WC"));
				return;
			}
			if (datePeriod === "" || datePeriod === undefined) {
				this.showMessage(oResourceModel.getText("SEL_DATE_PERIOD"));
				return;
			}

			var that = this;
			this.busy.open();
			var oFilter = [];
			oFilter.push(new Filter("Plant", "EQ", plant));
			oFilter.push(new Filter("TimeBucket", "EQ", datePeriod));
			for (var i = 0; i < workCenters.length; i++) {
				oFilter.push(new Filter("WorkCenter", "EQ", workCenters[i]));
			}
			oPortalDataModel.read("/PlannedWOReportSet", {
				filters: oFilter,
				success: function (oData) {
					var plannedReactiveRep = oData.results;
					plannedReactiveRep = util.fnFormatPlanReactiveRepData(plannedReactiveRep, datePeriod, workCenters);
					oReportsDataModel.setData(plannedReactiveRep);
					oReportsDataModel.refresh(true);
					if (plannedReactiveRep.length >= 1) {
						oViewPropertyModel.setProperty("/plannedReactiveGraphVisible", true);
						that.fnGenPlanReactiveGraph();
					} else {
						oViewPropertyModel.setProperty("/plannedReactiveGraphVisible", false);
					}
					that.busy.close();
				},
				error: function (oData) {
					oReportsDataModel.setProperty("/plannedReactiveRep", []);
					oViewPropertyModel.setProperty("/plannedReactiveGraphVisible", true);
					oReportsDataModel.refresh();
					that.busy.close();
				}
			});
		},
		//Function to search Planned Reactive report data
		fnSearchLabourHrsRep: function () {
			var oPortalDataModel = this.oPortalDataModel;
			var oReportsDataModel = this.oReportsDataModel;
			var oViewPropertyModel = this.oViewPropertyModel;
			var bVal = util.fnValidateLabourHrRep(oViewPropertyModel, this);
			if (bVal) {
				var sUrl = "/LabHrsByTechReportSet";
				var that = this;
				this.busy.open();
				var labourHrPlant = oViewPropertyModel.getProperty("/labourHrPlant");
				var labourHrDatePeriod = oViewPropertyModel.getProperty("/labourHrDatePeriod");
				var labourHrWorkCenter = oViewPropertyModel.getProperty("/labourHrWorkCenter");
				var labourHrWorkTeamLeads = oViewPropertyModel.getProperty("/labourHrWorkTeamLeads");

				var oFilter = [];
				oFilter.push(new Filter("Plant", "EQ", labourHrPlant));
				for (var i = 0; i < labourHrWorkCenter.length; i++) {
					oFilter.push(new Filter("WorkCenter", "EQ", labourHrWorkCenter[i]));
				}
				for (var j = 0; j < labourHrWorkTeamLeads.length; j++) {
					oFilter.push(new Filter("EquipId", "EQ", labourHrWorkTeamLeads[j]));
				}
				oFilter.push(new Filter("TimeBucket", "EQ", labourHrDatePeriod));

				oPortalDataModel.read(sUrl, {
					filters: oFilter,
					success: function (oData) {
						var labourHrRep = oData.results;
						labourHrRep = util.fnFormatLbrHrRepData(labourHrRep);
						oReportsDataModel.setData(labourHrRep);
						oReportsDataModel.refresh(true);
						if (labourHrRep.length >= 1) {
							oViewPropertyModel.setProperty("/labourHrsGraphVisibile", true);
							that.fnFormatLbrHrRepData();
						} else {
							oViewPropertyModel.setProperty("/labourHrsGraphVisibile", false);
						}
						that.busy.close();
					},
					error: function (oData) {
						oReportsDataModel.setProperty("/", []);
						oViewPropertyModel.setProperty("/labourHrsGraphVisibile", true);
						oReportsDataModel.refresh();
						that.busy.close();
					}
				});
			}
		},
		//Function to search Planned Reactive report data
		fnSearchMTRRep: function () {
			var oPortalDataModel = this.oPortalDataModel;
			var oReportsDataModel = this.oReportsDataModel;
			var oViewPropertyModel = this.oViewPropertyModel;
			var bVal = util.fnValidateMtrRep(oViewPropertyModel, this);
			if (bVal) {
				var that = this;
				this.busy.open();
				var mtrEquipments = oViewPropertyModel.getProperty("/mtrEquipments");
				var mtrDatePeriod = oViewPropertyModel.getProperty("/mtrDatePeriod");

				var oFilter = [];
				for (var i = 0; i < mtrEquipments.length; i++) {
					oFilter.push(new Filter("EquipId", "EQ", mtrEquipments[i]));
				}
				oFilter.push(new Filter("TimeBucket", "EQ", mtrDatePeriod));

				oPortalDataModel.read("/MeanTTRReportSet", {
					filters: oFilter,
					success: function (oData) {

						var mtrRep = oData.results;
						mtrRep = util.fnFormatMtrRepData(mtrRep);
						oReportsDataModel.setData(mtrRep);
						oReportsDataModel.refresh(true);
						if (mtrRep.length >= 1) {
							oViewPropertyModel.setProperty("/mtrGraphVisible", true);
							that.fnFormatMtrRepData();
						} else {
							oViewPropertyModel.setProperty("/mtrGraphVisible", false);
						}
						that.busy.close();
					},
					error: function (oData) {
						oReportsDataModel.setProperty("/", []);
						oViewPropertyModel.setProperty("/mtrGraphVisible", true);
						oReportsDataModel.refresh();
						that.busy.close();
					}
				});
			}
		},
		//Function to search Work Order status report data
		fnSearchWOStatusRep: function () {
			var oPortalDataModel = this.oPortalDataModel;
			var oReportsDataModel = this.oReportsDataModel;
			var oViewPropertyModel = this.oViewPropertyModel;
			var bVal = util.fnValidateWOStatusRep(oViewPropertyModel, this);
			if (bVal) {
				var that = this;
				this.busy.open();
				var woStatusPlant = oViewPropertyModel.getProperty("/woStatusPlant");
				var woStatusWorkTeamLeads = oViewPropertyModel.getProperty("/woStatusWorkTeamLeads");
				var woStatusDatePeriod = oViewPropertyModel.getProperty("/woStatusDatePeriod");

				var oFilter = [];
				oFilter.push(new Filter("Plant", "EQ", woStatusPlant));
				for (var i = 0; i < woStatusWorkTeamLeads.length; i++) {
					oFilter.push(new Filter("EquipId", "EQ", woStatusWorkTeamLeads[i]));
				}
				oFilter.push(new Filter("TimeBucket", "EQ", woStatusDatePeriod));

				oPortalDataModel.read("/WOStatusReportSet", {
					filters: oFilter,
					success: function (oData) {
						var woStatusRep = oData.results;
						woStatusRep = util.fnFormatWOStatusRepData(woStatusRep);
						oReportsDataModel.setData(woStatusRep);
						oReportsDataModel.refresh(true);
						if (woStatusRep.length >= 1) {
							oViewPropertyModel.setProperty("/woStatusGraphVisible", true);
							that.fnFormatWOStatusRepData();
						} else {
							oViewPropertyModel.setProperty("/woStatusGraphVisible", false);
						}
						that.busy.close();
					},
					error: function (oData) {
						oReportsDataModel.setProperty("/", []);
						oViewPropertyModel.setProperty("/woStatusGraphVisible", true);
						oReportsDataModel.refresh();
						that.busy.close();
					}
				});
			}
		},
		//Function to search Spare Cost data
		fnSearchSpareCostRep: function () {
			var oPortalDataModel = this.oPortalDataModel;
			var oReportsDataModel = this.oReportsDataModel;
			var oViewPropertyModel = this.oViewPropertyModel;
			var bVal = util.fnValidateSpareCostRep(oViewPropertyModel, this);
			if (bVal) {
				var that = this;
				this.busy.open();
				var spareCostPlant = oViewPropertyModel.getProperty("/spareCostPlant");
				var spareCostFuncLoc = oViewPropertyModel.getProperty("/spareCostFuncLoc");
				var spareCostEquipments = oViewPropertyModel.getProperty("/spareCostEquipments");
				var spareCostDatePeriod = oViewPropertyModel.getProperty("/spareCostDatePeriod");

				var oFilter = [];
				oFilter.push(new Filter("Plant", "EQ", spareCostPlant));
				for (var i = 0; i < spareCostEquipments.length; i++) {
					oFilter.push(new Filter("EquipId", "EQ", spareCostEquipments[i].Equnr));
				}
				for (var j = 0; j < spareCostFuncLoc.length; j++) {
					oFilter.push(new Filter("Fnloc", "EQ", spareCostFuncLoc[j]));
				}
				oFilter.push(new Filter("TimeBucket", "EQ", spareCostDatePeriod));

				oPortalDataModel.read("/EquipCostReportSet", {
					filters: oFilter,
					success: function (oData) {
						var spareCostRep = oData.results;
						spareCostRep = util.fnFormatSpareCostRepData(spareCostRep);
						oReportsDataModel.setData(spareCostRep);
						oReportsDataModel.refresh(true);
						if (spareCostRep.length >= 1) {
							oViewPropertyModel.setProperty("/spareCostGraphVisibile", true);
							that.fnFormatSpareCostRepData();
						} else {
							oViewPropertyModel.setProperty("/spareCostGraphVisibile", false);
						}
						that.busy.close();
					},
					error: function (oData) {
						oReportsDataModel.setProperty("/", []);
						oViewPropertyModel.setProperty("/spareCostGraphVisibile", true);
						oReportsDataModel.refresh();
						that.busy.close();
					}
				});
			}
		},
		fnGetPlants: function () {
			var sUrl = "/plantsSet";
			var oPortalDataModel = this.oPortalDataModel;
			var mLookupModel = this.mLookupModel;
			oPortalDataModel.read(sUrl, {
				success: function (oData) {
					mLookupModel.setProperty("/aPlantSet", oData.results);
					mLookupModel.refresh();
				},
				error: function (oData) {
					mLookupModel.setProperty("/aPlantSet", "");
					mLookupModel.refresh();
				}
			});
		},
		fnCreateWorkOrderForNotif: function (sData, btnType) {
			var that = this;
			var oResourceModel = this.oResourceModel;
			var oWorkOrderOData = this.oWorkOrderOData;
			var oNotificationViewModel = this.oNotificationViewModel;

			var mLookupModel = this.mLookupModel;
			var oNotificationDataModel = this.oNotificationDataModel;
			util.fetchDataToWOPayload(sData, mLookupModel, oNotificationDataModel, oNotificationViewModel, this);
			var oWorkOrderPayload = oNotificationViewModel.getProperty("/oPayLoadWO");
			oWorkOrderOData.setHeaders({
				"X-Requested-With": "X"
			});

			oWorkOrderOData.create("/WorkorderHeaderSet", oWorkOrderPayload, {
				async: false,
				success: function (sData, oResponse) {
					var successErrMsg = "";
					var confirmationTexts = "";
					var orderId = sData.Orderid;
					var sNotifID = sData.HEADERTONOTIFNAV.results[0].NotifNo;
					if (orderId) {
						orderId = parseInt(orderId, 10);
						orderId = orderId.toString();
						if (btnType === "CREATE_ORDER") {
							MessageBox.success("Work Order Created with Order ID : " + orderId + "\n Notification Created With Notification ID : " +
								sNotifID, {
									actions: [MessageBox.Action.OK],
									emphasizedAction: MessageBox.Action.OK,
									onClose: function (sAction) {
										that.onCancelWoDialog();
										that.resetUIFields();
										that.fnNavLaunchpadHome();
									}
								});
						} else if (btnType === "NOTIF_DETAIL") {
							MessageBox.success("Work Order Created with Order ID : " + orderId + "\n For Notification ID : " +
								sNotifID, {
									actions: [MessageBox.Action.OK],
									emphasizedAction: MessageBox.Action.OK,
									onClose: function (sAction) {
										that.busy.close();
										that.fnFetchDetailNotifList();
									}
								});
						} else if (btnType === "NOTIF_LIST_MULTINOTIF") { // To create work order to multiple notifications in NotificationList
							that.AssignNotiftoCreatedWO(orderId);
						} else if (btnType === "NOTIF_LIST_SINGLENOTIF") {
							MessageBox.success("Work Order Created with Order ID : " + orderId + "\n For Notification ID : " +
								sNotifID, {
									actions: [MessageBox.Action.OK],
									emphasizedAction: MessageBox.Action.OK,
									onClose: function (sAction) {
										that.busy.close();
										var SkipNotif = that.mLookupModel.getProperty("/iSkipNotif"); //Sunanda-to ensure the record with change is updated
										that.mLookupModel.setProperty("/iSkipNotif", 0);
										that.fnRefreshNotifListTable(SkipNotif);
									}
								});
						}
					}
				},
				error: function (error, oResponse) {
					var errorMsg = that.oResourceModel.getText("errorcreatewo");
					that.showMessage(errorMsg);
					// that.busy.close();
				}
			});

		},
		//Function to reload the the Notification table with more records
		fnRefreshNotifListTable: function (nSkipNotif) {
			this.busy.open();
			var nSkip = 0;
			var mLookupModel = this.mLookupModel;
			mLookupModel.setProperty("/aNotificationListSet", []);
			this.fnFetchNotifList();
			while (nSkip < nSkipNotif) {
				this.handleLoadMoreNotif();
				nSkip = this.mLookupModel.getProperty("/iSkipNotif");
			}
			mLookupModel.setProperty("/selectedNotifs", []);
			mLookupModel.setProperty("/iSelectedIndices", 0);
			//mLookupModel.refresh(true);
			this.busy.close();
		},
		_setNotificationPanelHeights: function () {
			var notificationPanelHeight = this.getView().$().height() - 40 + "px";
			this.getOwnerComponent().getModel("mLookupModel").setProperty("/notificationPanelHeight", notificationPanelHeight);
			this.getOwnerComponent().getModel("mLookupModel").refresh(true);
		},
		//nischal--
		setColumnsVisible: function () {
			var mLookupModel = this.mLookupModel;
			mLookupModel.setProperty("/snType", true);
			mLookupModel.setProperty("/snNumber", true);
			mLookupModel.setProperty("/snDescription", true);
			mLookupModel.setProperty("/snOrder", true);
			mLookupModel.setProperty("/snFunctLoc", true);
			mLookupModel.setProperty("/snFunct_Desc", false);
			mLookupModel.setProperty("/snEquip", true);
			mLookupModel.setProperty("/snEquip_Desc", false);
			mLookupModel.setProperty("/snWrkCtr", true);
			mLookupModel.setProperty("/snPlanPlant", false);
			mLookupModel.setProperty("/snTechId", false);
			mLookupModel.setProperty("/snSysStatus", true);
			mLookupModel.setProperty("/snUserStatus", false);
			mLookupModel.setProperty("/snReqStDate", false);
			mLookupModel.setProperty("/snReqEndDate", false);
			mLookupModel.setProperty("/snBdFlag", true);
			mLookupModel.setProperty("/snMalStDate", false);
			mLookupModel.setProperty("/snMalEndDate", false);
			mLookupModel.setProperty("/snPriority", true);
			mLookupModel.setProperty("/snCreatedDate", false);
			mLookupModel.setProperty("/snCreatedBy", false);
			mLookupModel.setProperty("/snAction", true);
		},
		//nischal --
		getShortTextKey: function () {
			var that = this;
			// this.busy.open();
			var sUrl = "/StandardTextSet";
			var mLookupModel = this.mLookupModel;
			var oLookupDataModel = this.oLookupDataModel;
			// var userPlant = this.oUserDetailModel.getProperty("/userPlant");
			// var oFilter = [];
			// oFilter.push(new Filter("Plant", "EQ", userPlant));
			oLookupDataModel.read(sUrl, {
				success: function (oData) {
					var aShortTextKey = oData.results;
					mLookupModel.setProperty("/aShortTextKey", aShortTextKey);
					mLookupModel.refresh();
					// that.busy.close();
				},
				error: function (oData) {
					mLookupModel.setProperty("/aShortTextKey", []);
					mLookupModel.refresh();
					// that.busy.close();
				}
			});
		},
		//nischal -- 
		onSearchPersonResp: function (oEvent) {
			var that = this;
			this.busy.open();

			var mLookupModel = this.mLookupModel;
			var oLookupDataModel = this.oLookupDataModel;
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var sUserId = oEvent.getSource().getValue();
			sUserId = sUserId.toUpperCase();
			// if (!sUserId) {
			// 	MessageToast.show("Please Enter Person Responsible Id");
			// 	this.busy.close();
			// 	return;
			// }
			var sPlant = this.oUserDetailModel.getProperty("/userPlant");
			var sPlant1 = "'" + sPlant.replace(/['"]+/g, '') + "'";
			var sWrkCtr = oWorkOrderDetailModel.getProperty("/MnWkCtr");
			var sWrkCtr1 = "'" + sWrkCtr.replace(/['"]+/g, '') + "'";
			// var sUserId1 = "'" + sUserId.replace(/['"]+/g, '') + "'";
			var oFilter = [];
			oFilter.push(new Filter("Werks", "EQ", sPlant1.replace(/['"]+/g, '') + "'"));
			oFilter.push(new Filter("Arbpl", "EQ", sWrkCtr1.replace(/['"]+/g, '') + "'"));
			// oFilter.push(new Filter("Pernr", "EQ", "00000129"));
			oLookupDataModel.read("/Pm02Set", {
				filters: oFilter,
				success: function (oData, oResponse) {
					mLookupModel.setProperty("/aUsers", oData.results);
					that.busy.close();
				},
				error: function (oResponse) {
					mLookupModel.setProperty("/aUsers", []);
					mLookupModel.refresh(true);
					that.busy.close();
				}
			});
		},
		onSelectPersonResponsible: function (oEvent) {
			var mLookupModel = this.mLookupModel;
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var assignUserFieldType = oWorkOrderDetailViewModel.getProperty("/assignUserFieldType");
			var sPath = oEvent.getSource().getSelectedContextPaths()[0];
			var oData = mLookupModel.getProperty(sPath);
			var selectedObj = oEvent.getSource().getSelectedItem().getCells()[0].getText();
			if (assignUserFieldType !== "/ReportedBy") {
				oWorkOrderDetailViewModel.setProperty(assignUserFieldType, selectedObj);
				oWorkOrderDetailViewModel.setProperty("/ReportedByName", oData.Stext);
				this.onUpdateAssignedTo();
			} else {
				oWorkOrderDetailModel.setProperty(assignUserFieldType, selectedObj);

			}
			this.onCancelDialogAssignUser();
		},
		//nischal -- Function to get
		fnGetObjectPart: function () {
			var that = this;
			this.busy.open();
			var sUrl = "/CauseDamageCodesSet";
			var mLookupModel = this.mLookupModel;
			var oLookupDataModel = this.oLookupDataModel;

			var oFilter = [];
			oFilter.push(new Filter("Katalogart", "EQ", "B"));
			oLookupDataModel.read(sUrl, {
				filters: oFilter,
				success: function (oData) {
					var aObjectCode = oData.results;
					mLookupModel.setProperty("/aObjectCode", aObjectCode);
					mLookupModel.refresh();
					that.busy.close();
				},
				error: function (oData) {
					mLookupModel.setProperty("/aObjectCode", []);
					mLookupModel.refresh();
					that.busy.close();
				}
			});
		},
		objectCodeValueHelp: function (oEvent) {
			// this.fnGetObjectPart();
			var oNotificationViewModel = this.oNotificationViewModel;
			var sPath = oEvent.getSource().getBindingContext("oNotificationDataModel").getPath();
			oNotificationViewModel.setProperty("/sObjCodePath", sPath);
			if (!this.objectCodeDialog) {
				this.objectCodeDialog = sap.ui.xmlfragment("com/sap/incture/IMO_PM.fragment.objectCodeDialog", this);
				this.getView().addDependent(this.objectCodeDialog);
			}
			this.objectCodeDialog.open();
		},
		onCancelDialogObjectCode: function () {
			this.objectCodeDialog.close();
			this.objectCodeDialog.destroy();
			this.objectCodeDialog = null;

		},
		onSelectObjectCode: function (oEvent) {
			var mLookupModel = this.mLookupModel;
			var oNotificationDataModel = this.oNotificationDataModel;
			var oNotificationViewModel = this.oNotificationViewModel;
			var sSelectedItemPath = oEvent.getSource().getSelectedContextPaths()[0];
			var sRowPath = oNotificationViewModel.getProperty("/sObjCodePath");
			var oSelectedItemData = mLookupModel.getProperty(sSelectedItemPath);
			var sCode = oSelectedItemData.Code;
			var sCodeGroup = oSelectedItemData.Codegruppe;
			var sCodeText = oSelectedItemData.Codetext;
			oNotificationDataModel.setProperty(sRowPath + "/DlCodegrp", sCodeGroup);
			oNotificationDataModel.setProperty(sRowPath + "/DlCode", sCode);
			oNotificationDataModel.setProperty(sRowPath + "/TxtObjptcd", sCodeText);
			this.onCancelDialogObjectCode();
		},
		damageCodeValueHelp: function (oEvent) {
			var oNotificationViewModel = this.oNotificationViewModel;
			var sPath = oEvent.getSource().getBindingContext("oNotificationDataModel").getPath();
			oNotificationViewModel.setProperty("/sDamageCodePath", sPath);
			if (!this.damageCodeDialog) {
				this.damageCodeDialog = sap.ui.xmlfragment("com/sap/incture/IMO_PM.fragment.damageCodeDialog", this);
				this.getView().addDependent(this.damageCodeDialog);
			}
			this.damageCodeDialog.open();
		},
		onCancelDialogDamageCode: function () {
			this.damageCodeDialog.close();
			this.damageCodeDialog.destroy();
			this.damageCodeDialog = null;

		},
		onSelectDamageCode: function (oEvent) {
			var mLookupModel = this.mLookupModel;
			var oNotificationDataModel = this.oNotificationDataModel;
			var oNotificationViewModel = this.oNotificationViewModel;
			var sSelectedItemPath = oEvent.getSource().getSelectedContextPaths()[0];
			var sRowPath = oNotificationViewModel.getProperty("/sDamageCodePath");
			var oSelectedItemData = mLookupModel.getProperty(sSelectedItemPath);
			var sCode = oSelectedItemData.Code;
			var sCodeGroup = oSelectedItemData.Codegruppe;
			var sCodeText = oSelectedItemData.Codetext;
			oNotificationDataModel.setProperty(sRowPath + "/DCodegrp", sCodeGroup);
			oNotificationDataModel.setProperty(sRowPath + "/DCode", sCode);
			oNotificationDataModel.setProperty(sRowPath + "/TxtProbcd", sCodeText);
			this.onCancelDialogDamageCode();
		},
		onAddItems: function (oEvent) {
			var oNotificationDataModel = this.oNotificationDataModel;
			var aTempArr = oNotificationDataModel.getProperty("/NavNoticreateToNotiItem");
			var oTempItemObj = {
				"ItemKey": "1",
				"ItemSortNo": "0001",
				"Descript": "",
				"DCodegrp": "",
				"DCode": "",
				"TxtObjptcd": "",
				"DlCodegrp": "",
				"DlCode": "",
				"TxtProbcd": ""
			};
			if (aTempArr === null || aTempArr.length === 0) {

				if (aTempArr === null) {
					aTempArr = [];
				}
				aTempArr.push(oTempItemObj);
				oNotificationDataModel.setProperty("/NavNoticreateToNotiItem", aTempArr);
				oNotificationDataModel.refresh();
			} else {
				var lastItemKey = aTempArr[aTempArr.length - 1].ItemKey;
				var currentItemKey = parseInt(lastItemKey, 10) + 1;
				var sItemSortNo = this.getItemSortNumber(currentItemKey);
				var oTempItemObj1 = {
					"ItemKey": currentItemKey.toString(),
					"ItemSortNo": sItemSortNo,
					"Descript": "",
					"DCodegrp": "",
					"DCode": "",
					"TxtObjptcd": "",
					"DlCodegrp": "",
					"DlCode": "",
					"TxtProbcd": ""
				};
				aTempArr.push(oTempItemObj1);
				oNotificationDataModel.setProperty("/NavNoticreateToNotiItem", aTempArr);
				oNotificationDataModel.refresh();
			}
			this.getItemKeyForCause();
		},
		getItemSortNumber: function (key) {
			var sItemSortNo;
			if (key < 9) {
				sItemSortNo = "000" + key;
			} else if (key > 9) {
				sItemSortNo = "00" + key;
			} else if (key > 99) {
				sItemSortNo = "0" + key;
			}
			return sItemSortNo;
		},
		onDeleteItem: function (oEvent) {
			var oNotificationDataModel = this.oNotificationDataModel;
			// if (!this._oTable) {
			// 	this._oTable = this.byId("NOTIF_ITEM_TABLE");
			// }
			// var oTable = this._oTable;
			var oTable = this.byId("NOTIF_ITEM_TABLE");
			var aIndices = oTable.getSelectedIndices();
			if (aIndices.length === 0) {
				MessageToast.show("Please select the Item to be deleted");
				return;
			}
			var aItemNo = [];
			var aTempArr = oNotificationDataModel.getProperty("/NavNoticreateToNotiItem");
			for (var i = 0; i < aIndices.length; i++) {
				var temp = aTempArr[aIndices[i]].ItemKey;
				aItemNo.push(temp);
			}
			for (var q = 0; q < aItemNo.length; q++) {
				var sKey = aItemNo[q];
				for (var j = 0; j < aTempArr.length; j++) {
					if (aTempArr[j].ItemKey === sKey) {
						aTempArr.splice(j, 1);
						break;
					}
				}
			}
			oTable.clearSelection();
			oTable.rerender();
			if (this.isItemArrayEmpty(aTempArr)) {
				oNotificationDataModel.setProperty("/NavNoticreateToNotifcause", []);
			}
			oNotificationDataModel.setProperty("/NavNoticreateToNotiItem", aTempArr);
			oNotificationDataModel.refresh();
			this.onRemoveCauseforItem(aItemNo);
			this.getItemKeyForCause();
		},
		causeCodeValueHelp: function (oEvent) {
			var oNotificationViewModel = this.oNotificationViewModel;
			var sPath = oEvent.getSource().getBindingContext("oNotificationDataModel").getPath();
			oNotificationViewModel.setProperty("/sCauseCodePath", sPath);
			if (!this.causeCodeDialog) {
				this.causeCodeDialog = sap.ui.xmlfragment("com/sap/incture/IMO_PM.fragment.CauseCodeDialog", this);
				this.getView().addDependent(this.causeCodeDialog);
			}
			this.causeCodeDialog.open();
		},
		onCancelDialogCauseCode: function () {
			this.causeCodeDialog.close();
			this.causeCodeDialog.destroy();
			this.causeCodeDialog = null;

		},
		onSelectCauseCode: function (oEvent) {
			var mLookupModel = this.mLookupModel;
			var oNotificationDataModel = this.oNotificationDataModel;
			var oNotificationViewModel = this.oNotificationViewModel;
			var sSelectedItemPath = oEvent.getSource().getSelectedContextPaths()[0];
			var sRowPath = oNotificationViewModel.getProperty("/sCauseCodePath");
			var oSelectedItemData = mLookupModel.getProperty(sSelectedItemPath);
			var sCode = oSelectedItemData.Code;
			var sCodeGroup = oSelectedItemData.Codegruppe;
			var sCodeText = oSelectedItemData.Codetext;
			oNotificationDataModel.setProperty(sRowPath + "/CauseCodegrp", sCodeGroup);
			oNotificationDataModel.setProperty(sRowPath + "/CauseCode", sCode);
			oNotificationDataModel.setProperty(sRowPath + "/TxtCausecd", sCodeText);
			this.onCancelDialogCauseCode();
		},
		onAddCauses: function () {
			var oNotificationDataModel = this.oNotificationDataModel;
			var aTempArr = oNotificationDataModel.getProperty("/NavNoticreateToNotifcause");
			var aItemArr = oNotificationDataModel.getProperty("/NavNoticreateToNotiItem");
			var oTempCauseObj = {
				"CauseKey": "0001",
				"CauseSortNo": "0001",
				"ItemKey": "",
				"Causetext": "",
				"CauseCodegrp": "",
				"CauseCode": "",
				"TxtCausecd": ""
			};
			if (aItemArr === null || aItemArr === undefined || aItemArr.length === 0) {
				MessageToast.show("Please add Items to add Cause");
				return;
			}
			if (aTempArr === null || aTempArr === undefined || aTempArr.length === 0) {
				if (aTempArr === null || aTempArr === undefined) {
					aTempArr = [];
				}
				aTempArr.push(oTempCauseObj);
				oNotificationDataModel.setProperty("/NavNoticreateToNotifcause", aTempArr);
				oNotificationDataModel.refresh();
			} else {
				var lastCauseKey = aTempArr[aTempArr.length - 1].CauseKey;
				var currentCauseKey = parseInt(lastCauseKey, 10) + 1;
				var sCauseSortNo = this.getItemSortNumber(currentCauseKey);
				var oTempCauseObj1 = {
					"CauseKey": sCauseSortNo,
					"CauseSortNo": sCauseSortNo,
					"ItemKey": "",
					"Causetext": "",
					"CauseCodegrp": "",
					"CauseCode": "",
					"TxtCausecd": ""
				};
				aTempArr.push(oTempCauseObj1);
				oNotificationDataModel.setProperty("/NavNoticreateToNotifcause", aTempArr);
				oNotificationDataModel.refresh();
			}
		},
		onDeleteCauses: function () {
			var oNotificationDataModel = this.oNotificationDataModel;
			// if (!this._oTable) {
			// 	this._oTable = this.byId("CREATE_NOTIF_CAUSES_TABLE");
			// }
			// var oTable = this._oTable;
			var oTable = this.byId("CREATE_NOTIF_CAUSES_TABLE");
			var aIndices = oTable.getSelectedIndices();
			if (aIndices.length === 0) {
				MessageToast.show("Please select the Row to be deleted");
				return;
			}
			var aCauseNo = [];
			var aTempArr = oNotificationDataModel.getProperty("/NavNoticreateToNotifcause");
			for (var i = 0; i < aIndices.length; i++) {
				var temp = aTempArr[aIndices[i]].CauseKey;
				aCauseNo.push(temp);
			}
			for (var q = 0; q < aCauseNo.length; q++) {
				var sKey = aCauseNo[q];
				for (var j = 0; j < aTempArr.length; j++) {
					if (aTempArr[j].CauseKey === sKey) {
						aTempArr.splice(j, 1);
						break;
					}
				}
			}
			oTable.clearSelection();
			oTable.rerender();
			oNotificationDataModel.setProperty("/NavNoticreateToNotifcause", aTempArr);
			oNotificationDataModel.refresh();
		},
		getItemKeyForCause: function () {
			var oNotificationDataModel = this.oNotificationDataModel;
			// var oNotificationViewModel = this.oNotificationViewModel;
			var mLookupModel = this.mLookupModel;
			var aArr = oNotificationDataModel.getProperty("/NavNoticreateToNotiItem");
			var aItemKey = [];
			for (var i = 0; i < aArr.length; i++) {
				var temp = aArr[i].ItemSortNo;
				var oObj = {
					sItemKey: temp
				};
				aItemKey.push(oObj);
			}
			mLookupModel.setProperty("/aItemKeyForCause", aItemKey);
		},
		isItemArrayEmpty: function (arr) {
			if (arr.length === 0) {
				return true;
			} else {
				return false;
			}
		},
		onRemoveCauseforItem: function (itemNo) {
			var oNotificationDataModel = this.oNotificationDataModel;
			var aCauseArr = oNotificationDataModel.getProperty("/NavNoticreateToNotifcause");
			//var aItemArr = oNotificationDataModel.getProperty("/NavNoticreateToNotiItem");
			if (aCauseArr === null || aCauseArr === undefined || aCauseArr.length === 0) {
				return;
			}
			for (var i = 0; i < itemNo.length; i++) {
				for (var j = 0; j < aCauseArr.length; j++) {
					if (parseInt(aCauseArr[j].ItemKey, 10) === parseInt(itemNo[i], 10)) {
						aCauseArr.splice(j, 1);
						j = (-1);
					}
				}
			}
			oNotificationDataModel.setProperty("/NavNoticreateToNotifcause", aCauseArr);
			oNotificationDataModel.refresh();
		},
		fnGetComponentsList: function (operationHeader, Plnal) {
			var that = this;
			this.busy.open();
			var oFilter = [];
			var oPortalDataModel = this.oPortalDataModel;
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var oWorkOrderDetailViewModel = this.oWorkOrderDetailViewModel;
			var userPlant = this.oUserDetailModel.getProperty("/userPlant");
			oFilter.push(new Filter("Werks", "EQ", userPlant));
			oFilter.push(new Filter("Plnnr", "EQ", operationHeader));
			if (Plnal !== null) { //SH: new filter for Plnal added
				oFilter.push(new Filter("Plnal", "EQ", Plnal));
			}

			oPortalDataModel.read("/TaskComponentsSet", {
				filters: oFilter,
				success: function (oData) {
					var componentsTaskList = oData.results;
					oWorkOrderDetailViewModel.setProperty("/componentsTaskList", componentsTaskList);
					if (componentsTaskList.length === 0) {
						that.showMessage(that.oResourceModel.getText("No Components Found"));
					} else {
						var components = oWorkOrderDetailModel.getProperty("/HEADERTOCOMPONENTNAV");
						var formattedComponents;
						if (components.length === 0) {
							formattedComponents = that.formatComponents([], componentsTaskList);
						} else {
							formattedComponents = that.formatComponents(components, componentsTaskList);
						}
						oWorkOrderDetailModel.setProperty("/HEADERTOCOMPONENTNAV", formattedComponents);
						oWorkOrderDetailModel.refresh();
					}

					that.busy.close();
				},
				error: function (oData) {
					oWorkOrderDetailViewModel.setProperty("/componentsTaskList", []);
					that.showMessage(that.oResourceModel.getText("ERROR_IN_RETRIEVING_TASK_LIST"));
					that.busy.close();
				}
			});
		}

	});
});