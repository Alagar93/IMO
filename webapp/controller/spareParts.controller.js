sap.ui.define([
	"com/sap/incture/IMO_PM/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"com/sap/incture/IMO_PM/util/util",
	"com/sap/incture/IMO_PM/formatter/formatter"
], function (BaseController, JSONModel, Filter, FilterOperator, util, formatter) {
	"use strict";

	return BaseController.extend("com.sap.incture.IMO_PM.controller.spareParts", {
		formatter: formatter,

		onInit: function () {
			var that = this;
			this.fnInitSparePartsApp();
			this.setAppInitData("SPARE_PARTS");
			this.router = sap.ui.core.UIComponent.getRouterFor(this);
			this.router.attachRoutePatternMatched(function (oEvent) {
				that.routePatternMatched(oEvent);
			});
			var oViewPropertyModel = this.oViewPropertyModel;
			oViewPropertyModel.setProperty("/iSelectedIndices", 0);
			oViewPropertyModel.setProperty("/iSelectedRadioIndex", 0);
			oViewPropertyModel.setProperty("/iTableVisibility", false);
			oViewPropertyModel.setProperty("/iEqTableVisibility", false);
			var mLookupModel = this.mLookupModel;
			mLookupModel.setProperty("/iSkip", 0);
			mLookupModel.setProperty("/iTop", 50);
			mLookupModel.setProperty("/Orderid", "");
			mLookupModel.setProperty("/selectedSpareParts", []);
			mLookupModel.setProperty("/selectedOperation", "");

			var oWOListModel = new JSONModel();
			oWOListModel.loadData("model/listWO.json");
			this.getView().setModel(oWOListModel, "oWOListModel");

		},

		routePatternMatched: function (oEvent) {

		},
		onAfterRendering: function () {
			this._setScreenHeights();
			sap.ui.Device.resize.attachHandler(function () {
				this._setScreenHeights();
			}.bind(this));
		},

		_setScreenHeights: function () {
			var mLookupModel = this.mLookupModel;
			var rowCount = (sap.ui.Device.resize.height - 380) / 40;
			rowCount = Math.floor(rowCount - 3);
			var woRowCount = (sap.ui.Device.resize.height - 180) / 40;
			woRowCount = Math.floor(woRowCount - 2);
			mLookupModel.setProperty("/rowCount", rowCount);
			mLookupModel.setProperty("/woRowCount", woRowCount);
		},
		onAddtoWO: function () {
			var mLookupModel = this.mLookupModel;
			var i18n = this.oResourceModel;
			mLookupModel.setProperty("/aWorkOrderListSet", []);
			mLookupModel.setProperty("/sWorderIdDesFilter", "");
			mLookupModel.setProperty("/Orderid", "");
			var fragmentId = "addToWoFragId";
			if (!this._oDialogAssignWODialog) {
				this._oDialogAssignWODialog = sap.ui.xmlfragment(fragmentId, "com.sap.incture.IMO_PM.fragment.addToWorkOrder", this);
				this.getView().addDependent(this._oDialogAssignWODialog);
			}
			sap.ui.core.Fragment.byId("addToWoFragId", "navContainer").to(sap.ui.core.Fragment.byId("addToWoFragId", "page1"));

			var isSelectedSparePart = mLookupModel.getProperty("/selectedSpareParts");
			if (isSelectedSparePart.length === 0) {
				// var sMsg = "Please select spare Part add to Work Order";
				var sMsg = i18n.getText("ADD_SP_ERR_MSG");
				this.showMessage(sMsg, "I");
			} else {
				for (var i = 0; i < isSelectedSparePart.length; i++) {
					if (!isSelectedSparePart[i].RequirementQuantity) {
						// sMsg = "Please enter required Quantity";
						sMsg = i18n.getText("REQ_QTY_ERROR_MSG");
						this.showMessage(sMsg, "I");
						return;
					}
				}
				this._oDialogAssignWODialog.open();
				this.onCreateOptionChange();

			}
		},

		onCancelDialogAddto: function (oEvent) {
			// sap.ui.core.Fragment.byId("addToWoFragId", "navContainer").to(sap.ui.core.Fragment.byId("addToWoFragId", "page1"));
			this._oDialogAssignWODialog.close();
		},

		onSearchWO: function (oEvent) {
			var mLookupModel = this.mLookupModel;
			mLookupModel.setProperty("/iSkip", 0);
			mLookupModel.setProperty("/aWorkOrderListSet", []);
			var Orderid = oEvent.getSource().getValue();
			Orderid = mLookupModel.setProperty("/Orderid", Orderid);
			this.onCreateOptionChange(Orderid);
		},

		/*load More functionality*/
		handleLoadMoreRecords: function () {
			var mLookupModel = this.mLookupModel;
			var iSkip = mLookupModel.getProperty("/iSkip") + 50;
			mLookupModel.setProperty("/iSkip", iSkip);
			mLookupModel.refresh(true);
			this.onCreateOptionChange();
		},

		//function to fetch data for work order list and notification list on change of create option(radio button)
		onCreateOptionChange: function (Orderid) {
			var that = this;
			this.busy.open();
			var mLookupModel = this.mLookupModel;
			var oPortalDataModel = this.oPortalDataModel;
			var iTop = mLookupModel.getProperty("/iTop");
			var iSkip = mLookupModel.getProperty("/iSkip");
			var oFilter = [];
			oFilter.push(new Filter("Orderid", "EQ", mLookupModel.getProperty("/Orderid")));
			oFilter.push(new Filter("OrderType", "EQ", ""));
			oFilter.push(new Filter("SysStatus", "EQ", ""));
			oFilter.push(new Filter("WoDes", "EQ", mLookupModel.getProperty("/Orderid")));
			oFilter.push(new Filter("EnteredBy", "EQ", ""));
			oFilter.push(new Filter("Priority", "EQ", ""));
			oFilter.push(new Filter("AssignedTech", "EQ", ""));

			var userPlant = this.oUserDetailModel.getProperty("/userPlant");
			oFilter.push(new Filter("Plant", "EQ", userPlant));

			oPortalDataModel.read("/WorkOrderListSet", {
				filters: oFilter,
				urlParameters: {
					"$top": iTop,
					"$skip": iSkip
				},
				success: function (oData) {
					var aWorkOrderListSet = [];
					var aData = oData.results;
					for (var i = 0; i < aData.length; i++) {
						if (aData[i].SysStatus.indexOf("TECO") === -1 && aData[i].SysStatus.indexOf("CLSD") === -1) { //remove clsd and teco status

							if (aData[i].SysStatus.indexOf("CNF") !== -1 && aData[i].SysStatus.indexOf("PCNF") === -1) { //remove cnf not pcnf

								continue; // if found CNF and not PCNF then do not push
							}
							aWorkOrderListSet.push(aData[i]);
						}

					}

					if (iSkip !== 0) {
						aWorkOrderListSet = aWorkOrderListSet.concat(mLookupModel.getProperty("/aWorkOrderListSet"));
					}
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

		onCancelDialogAssign: function () {
			this._oDialogAssignWO.close();
		},

		//Function to get Equipment List and show in a pop-up
		equipmentValueHelp: function (oEvent) {
			if (!this.equipmentsListDialog) {
				this.equipmentsListDialog = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.equipmentsListSpareparts", this);
				this.getView().addDependent(this.equipmentsListDialog);
			}
			this.equipmentsListDialog.open();
		},

		onCancelDialogEquip: function (oEvent) {
			this.equipmentsListDialog.close();
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

		//Function to select a Equipment and auto-populate Functional location
		onEquipSelect: function (oEvent) {
			var mLookupModel = this.mLookupModel;
			var oSource = oEvent.getParameter("listItem");
			var sPath = oSource.getBindingContextPath();
			var iEqId = mLookupModel.getProperty(sPath + "/Equnr");
			var iFunLoc = mLookupModel.getProperty(sPath + "/Tplnr");
			var equipDesc = mLookupModel.getProperty(sPath + "/Eqktu");
			mLookupModel.setProperty("/sEquip", iEqId);
			mLookupModel.setProperty("/sFunLoc", iFunLoc);
			mLookupModel.setProperty("/EquipDesc", equipDesc);
			this.equipmentsListDialog.close();
		},

		onShowBOM: function () {
			this._oDialogshowBOM = sap.ui.xmlfragment("com.sap.incture.IMO_PM.fragment.showBOM", this);
			this.getView().addDependent(this._oDialogshowBOM);
			this._oDialogshowBOM.setModel(this.getView().getModel("oWOListModel"), "oWOListModel");
			this._oDialogshowBOM.open();
			this.fnFetchBOM();
		},

		onCancelDialogBOM: function () {
			this._oDialogshowBOM.close();
		},

		/*function to show BOM*/
		fnFetchBOM: function (oEvent) {
			var that = this;
			// var oSparePartViewModel = this.oSparePartViewModel;
			var oFilter = [];
			this.busy.open();
			var oPortalDataModel = this.oPortalDataModel;
			var mLookupModel = this.mLookupModel;
			var sUrl = "/EquipBOMSet";
			var mEquipDetailModel = this.mEquipDetailModel;
			oFilter.push(new Filter("equipId", "EQ", mLookupModel.getProperty("/sEquip")));
			oFilter.push(new Filter("bomCategory", "EQ", "E"));
			oFilter.push(new Filter("bomCategory", "EQ", "M"));
			var userPlant = this.oUserDetailModel.getProperty("/userPlant");
			oFilter.push(new Filter("plant", "EQ", userPlant));

			oPortalDataModel.read(sUrl, {
				filters: oFilter,
				success: function (oData) {
					var aBOMSet = oData.results;
					$.each(aBOMSet, function (index, value) { //AN: #obxSearch
						if (value.validStartDate) {
							value.validStartDateString = that.fnDateConversion(value.validStartDate);
						}
						if (value.validEndDate) {
							value.validEndDateString = that.fnDateConversion(value.validEndDate);
						}
						if (value.EnterDate) {
							value.EnterDateString = that.fnDateConversion(value.EnterDate);
						}
					});
					mEquipDetailModel.setProperty("/aBOMSet", aBOMSet);
					mEquipDetailModel.refresh();
					that.busy.close();
				},
				error: function (oData) {
					mEquipDetailModel.setProperty("/aBOMSet", []);
					mEquipDetailModel.refresh();
					that.busy.close();
				}
			});
		},
		onSelectWordOrder: function (oEvent) {
			//	var navContainer = this.getView().byId("navContainer");
			var oRowdata = oEvent.getParameters().rowBindingContext.getObject();
			var orderId = oRowdata.Orderid;
			sap.ui.core.Fragment.byId("addToWoFragId", "navContainer").to(sap.ui.core.Fragment.byId("addToWoFragId", "page2"));
			sap.ui.core.Fragment.byId("addToWoFragId", "idOperationTable").removeSelections();
			this.fnGetWOHeaderDetails(orderId);

		},

		onCancelDialogOperns: function () {
			sap.ui.core.Fragment.byId("addToWoFragId", "navContainer").to(sap.ui.core.Fragment.byId("addToWoFragId", "page1"));
			// this.operationsListDialog.close();
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
		onSelectSparePart: function (oEvent) {
			var oSparePartViewModel = this.oSparePartViewModel;
			var mLookupModel = this.mLookupModel;
			// var bSelectAll = oEvent.getParameter("selected");
			oSparePartViewModel.getProperty("/aMaterialsList");
			var aSelLineItem = $.grep(oSparePartViewModel.getProperty("/aMaterialsList"), function (gRow) {
				return gRow.isSelected === true;
			});
			mLookupModel.setProperty("/selectedSpareParts", aSelLineItem);
		},
		onSelectAll: function (oEvent) {
			var mLookupModel = this.mLookupModel;
			var oSparePartViewModel = this.oSparePartViewModel;
			var bSelectAll = oEvent.getParameter("selected");
			var aSelLineItem = [];
			if (bSelectAll === true) {
				aSelLineItem = $.grep(oSparePartViewModel.getProperty("/aMaterialsList"), function (gRow) {
					gRow.isSelected = true;
					return gRow.isSelected === true;
				});
			} else {
				aSelLineItem = $.grep(oSparePartViewModel.getProperty("/aMaterialsList"), function (gRow) {
					gRow.isSelected = false;
					return gRow.isSelected === true;
				});
			}
			oSparePartViewModel.refresh();
			mLookupModel.setProperty("/selectedSpareParts", aSelLineItem);
		},

		// Function to check if same material is added to spare part
		// isMaterialAddedToSparepart: function (material, spareParts) {
		// 	var isMaterialExist = false;
		// 	spareParts.filter(function (obj, i) {
		// 		if (obj.Material === material.Material) {
		// 			isMaterialExist = true;
		// 		}
		// 	});
		// 	return isMaterialExist;
		// },
		isMaterialAddedToSparepart: function (material, spareParts, selOperation) {
			var isMaterialExist = false;
			for (var i = 0; i < spareParts.length; i++) {
				if (spareParts[i].ActivityOperation === selOperation.Activity && spareParts[i].Material === material.Material) {
					isMaterialExist = true;
					// 			if(spareParts.ActivityOperation == selOperation.Activity)
					// spareParts.filter(function (obj, i) {
					// 	if (obj.Material === material.Material) {
					// 		isMaterialExist = true;
					// 	}
					// });
				}
			}
			return isMaterialExist;
		},

		addSparePartstoWO: function () {
			var oArry = [];
			var duplicateParts = [];
			var i18n = this.oResourceModel;
			var mLookupModel = this.mLookupModel;
			// var oSparePartViewModel = this.oSparePartViewModel;
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			var selOperation = mLookupModel.getProperty("/selectedOperation");
			var spareParts = oWorkOrderDetailModel.getProperty("/HEADERTOCOMPONENTNAV");
			var oSelectedMaterials = mLookupModel.getProperty("/selectedSpareParts");

			if (!spareParts) {
				spareParts = [];
			}
			if (!oSelectedMaterials) {
				oSelectedMaterials = [];
				this.showMessage(i18n.getText("SP_ERROR"));
				return;
			}
			for (var i = 0; i < oSelectedMaterials.length; i++) {
				var bVal = this.isMaterialAddedToSparepart(oSelectedMaterials[i], spareParts, selOperation);
				var userPlant = this.oUserDetailModel.getProperty("/userPlant");
				if (!bVal) {
					var oTempObj = {
						"ReservNo": "",
						"ActivityOperation": selOperation.Activity,
						"Material": oSelectedMaterials[i].Material,
						"MatlDesc": oSelectedMaterials[i].MaterialDesc,
						"StgeLoc": oSelectedMaterials[i].StorLocId,
						"OutQtyOrd": oSelectedMaterials[i].OutstandingQty,
						"StockAvail": oSelectedMaterials[i].CurrentStock,
						"Plant": userPlant,
						"RequirementQuantity": oSelectedMaterials[i].RequirementQuantity,
						"RequirementQuantityUnit": oSelectedMaterials[i].Uom,
						"CompCode": "C"
					};
					oArry.push(oTempObj);
				} else {
					duplicateParts.push(oSelectedMaterials[i]);
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
			mLookupModel.setProperty("/otempArr", otempArr);
			// oWorkOrderDetailModel.setProperty("/HEADERTOCOMPONENTNAV", otempArr);
			// oWorkOrderDetailModel.refresh();
			// this.adSparePartsDialog.close();
		},

		onSelectOperation: function (oEvent) {
			var mLookupModel = this.mLookupModel;
			var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
			oWorkOrderDetailModel.getProperty("/HEADERTOCOMPONENTNAV");
			var selectedOperation = oEvent.getParameters().listItem.getBindingContext("mLookupModel").getObject();
			// var selectedOperation = oEvent.getSource().getBindingContext("mLookupModel").getObject();
			mLookupModel.setProperty("/selectedOperation", selectedOperation);
			this.addSparePartstoWO();
		},

		onUpdate: function () {
			var that = this;
			var mLookupModel = this.mLookupModel;
			var i18n = this.oResourceModel;
			var selectedOperation = mLookupModel.getProperty("/selectedOperation");
			var otempArr = mLookupModel.getProperty("/otempArr");
			if (selectedOperation.length === 0) {
				// var sMsg = "Please select operation";
				var sMsg = i18n.getText("OPERATION_ERR_MSG");
				this.showMessage(sMsg, "I");
				return;
			} else {
				this.busy.open();
				var oWorkOrderOData = this.oWorkOrderOData;
				var oWorkOrderDetailModel = this.oWorkOrderDetailModel;
				oWorkOrderDetailModel.setProperty("/HEADERTOCOMPONENTNAV", otempArr);
				oWorkOrderDetailModel.refresh();
				var oWorkOrderData = oWorkOrderDetailModel.getData();

				// var tem = oWorkOrderData.HEADERTOOPERATIONSNAV;
				// for (var i = 0; i < tem.length; i++) {
				// 	var val = tem[i];
				// 	delete val.isSelected;
				// }

				var operations = oWorkOrderData.HEADERTOOPERATIONSNAV;
				operations = this.fnDeleteOperationsFields(operations);
				oWorkOrderData.HEADERTOOPERATIONSNAV =
					operations;
				oWorkOrderData.SetOrderStatus = "";
				var headerMessage = [{
					"Message": "",
					"Status": ""
				}];
				oWorkOrderData.HEADERTOMESSAGENAV = headerMessage;
				this.fnFormatWODateObjectsToStr(oWorkOrderData);
				delete oWorkOrderData.HEADERTONOTIFNAV;
				oWorkOrderOData.setHeaders({
					"X-Requested-With": "X"
				});
				oWorkOrderOData.create("/WorkorderHeaderSet", oWorkOrderData, {
					success: function (sData, oResponse) {
						that.fnShowSuccessErrorMsg(sData.HEADERTOMESSAGENAV.results);
						that.busy.close();
					},
					error: function (error, oResponse) {
						// var errorMsg = "Error in Updating Work Order";
						var errorMsg = i18n.getText("UPADATE_WO_ERROR");
						that.showMessage(errorMsg);
						that.busy.close();
					}
				});
			}
		},

		//Function to remove Twork and Mywork fields during Create/Update/Release of WO
		fnDeleteOperationsFields: function (operations) {
			for (var i = 0; i < operations.length; i++) {
				delete operations[i].MyWork;
				delete operations[i].TWork;
			}
			return operations;
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
				completedDate = formatter.formatDateobjToString(completedDate);
				operations[i].CompletedOn = completedDate;
			}
			oData.HEADERTOOPERATIONSNAV = operations;
			return oData;
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
		showDuplicateMaterialsNotAdded: function (oArray) {
			var that = this;
			var i18n = this.oResourceModel;
			var oMessage = i18n.getText("ADD_MATERIAL_ERR_MSG");
			for (var i = 0; i < oArray.length; i++) {
				var material = oArray[i].Material;
				oMessage = oMessage + material;
				if (i !== oArray.length - 1) {
					oMessage = oMessage + ", ";
				}
			}
			// oMessage = oMessage + " as they have already been added";
			oMessage = oMessage + i18n.getText("DUPLICATE_MATERIAL_ERR_MSG");
			this.MessageBox.warning(oMessage, {
				icon: "WARNING",
				title: "Warning",
				actions: [sap.m.MessageBox.Action.OK],
				onClose: function (oAction) {
					that.adSparePartsDialog.close();
				}
			});
		},
		//Function to close statusMessages popup
		closeSuccesErrPopup: function (oEvent) {
			this.successErrorDialog.close();
			this._oDialogAssignWODialog.close();

		},
		//Function to validate user entered Float values
		validateFloatValues: function (oEvent) {
			util.validateInputDataType(oEvent, this);
		}
	});
});