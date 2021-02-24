jQuery.sap.declare("com.sap.incture.IMO_PM.util.util");
com.sap.incture.IMO_PM.util.util = {
	//Function to validate input fields from FO table based on data type [View: WorkOrder Detail]
	validateInputDataType: function (oEvent, oController) {
		var regex = "";
		var oErrorMsg = "";
		var oInput = oEvent.getSource();
		var oFldValue = oInput.getValue();
		var oResourceModel = oController.oResourceModel;
		var oFldType = oInput.getCustomData()[0].getValue();
		switch (oFldType) {
		case "FLOAT":
			regex = "[+-]?([0-9]*[.])?[0-9]+";
			//oErrorMsg = oResourceModel.getText("INVALID_DECIMAL_VALUE");
			oErrorMsg = "Please enter valid Float number";
			break;
		case "INTEGER":
			regex = "^[0-9]([0-9]*)$";
			//oErrorMsg = oResourceModel.getText("INVALID_INTEGER_VALUE");
			oErrorMsg = "Please enter valid Intger number";
			break;
		case "ALPHA_NUM":
			regex = /[^a-z\d\s]/i;
			oErrorMsg = oResourceModel.getText("INVALID_ALPHA_NUM_VALUE");
			break;
		case "STRING":
			regex = /^[a-zA-Z]+$/;
			oErrorMsg = oResourceModel.getText("INVALID_STRING_VALUE");
			break;
		case "HYPER_LINK":
			regex = /^((https?):\/\/)?([w|W]{3}\.)+[a-zA-Z0-9\-\.]{3,}\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?$/;
			oErrorMsg = oResourceModel.getText("INVALID_STRING_VALUE");
			break;
		}
		if (oFldType === "ALPHA_NUM" || oFldType === "STRING") {
			var isValid = !(regex.test(oFldValue));
			if (isValid) {
				oInput.setValue(oFldValue);
			} else {
				oInput.setValue("");
				oController.showMessage(oErrorMsg);
			}
		} else {
			if (!oFldValue.match(regex)) {
				if (oFldValue === "") {
					oInput.setValue("");
				} else {
					oInput.setValue("");
					oController.showMessage(oErrorMsg);
				}
			} else {
				var oValInt = oFldValue.replace(/,/g, "");
				if (!isNaN(oValInt)) {
					if (oFldType === "FLOAT") {
						oFldValue = parseFloat(oFldValue).toFixed(2);
					}
					oInput.setValue(oFldValue);
					return true;
				} else {
					oInput.setValue("");
					oController.showMessage(oErrorMsg);
					return false;
				}
			}
		}
	},
	//nischal-- function to fetch workcenter desc from workcenter array
	fetchWorkCtrDesc: function (mLookupModel, oWorkOrderDetailModel, key) {
		var arr = mLookupModel.getData().aWorkCenterSet;
		for (var i = 0; i < arr.length; i++) {
			if (arr[i].WorkcenterId === key) {
				return arr[i].WorkcenterDesc;
			}
		}
	},
	fetchAssemblyDesc: function (mLookupModel, key) {
		var arr = mLookupModel.getData().aEquipAssemblyList;
		for (var i = 0; i < arr.length; i++) {
			if (arr[i].Idnrk === key) {
				return arr[i].MAKTX;
			}
		}
	},
	//nischal-- function to validate BreakDown Duration is Greater than or Equal to Syatem Date so that Pop-up would be shown
	validateBreakDownDate: function (oDate, oTime) {
		var dd = oDate.getDate();
		var MM = oDate.getMonth() + 1;
		var yy = oDate.getFullYear();
		var sTemp = oTime.split(":");
		// var hh = sTemp[0];
		// var mm = sTemp[1];
		var newDate = yy + "/" + MM + "/" + dd;
		newDate = newDate + " " + oTime;
		var oDateObj1 = new Date(newDate);
		var oDateObj2 = new Date();
		var diffDate = this.timeDiffCalc(oDateObj2, oDateObj1);
		return diffDate;
	},
	timeDiffCalc: function (dateFuture, dateNow) {
		var diffInSeconds = Math.abs(dateFuture - dateNow) / 1000;
		var days = Math.floor(diffInSeconds / 60 / 60 / 24);
		var hours = Math.floor(diffInSeconds / 60 / 60 % 24);
		var minutes = Math.floor(diffInSeconds / 60 % 60);
		// var seconds = Math.floor(diffInSeconds % 60);
		// var milliseconds = Math.round((diffInSeconds - Math.floor(diffInSeconds)) * 1000);
		var s = days * 24;
		s = s + hours;
		if (minutes < 10) {
			minutes = "0" + minutes;
		}
		var p = s.toString() + "." + minutes.toString();
		return p;
	},

	//Function to initalize WO detail fields
	initializeWODetailFields: function (oWorkOrderDetailModel, oWorkOrderDetailViewModel) {
		oWorkOrderDetailModel.setData({});
		oWorkOrderDetailViewModel.setData({});
	},
	//Function to Set/Reset fields in WO Detail view [View: WorkOrder Detail]
	resetDetailWOFields: function (oUserDetailModel, oWorkOrderDetailModel, oWorkOrderDetailViewModel, viewType) {
		var headerPartner = [{
			"Orderid": "",
			"AssignedTo": "",
			"PARTNERNAV": "C",
			"PARTNEROLD": ""
		}];
		var headerMessage = [{
			"Message": "",
			"Status": ""
		}];

		var oCurrentTime = com.sap.incture.IMO_PM.formatter.formatter.formatCurrentTime(new Date());
		var userPlant = oUserDetailModel.getProperty("/userPlant");
		//nischal -- Fetch required Start Date and End Datefrom oWorkOrderDetailViewModel that was set in Create Workorder controller
		var oReqStartDate = oWorkOrderDetailViewModel.getProperty("/oRequiredStartDate");
		var oReqEndDate = oWorkOrderDetailViewModel.getProperty("/oRequiredEndDate");

		oWorkOrderDetailModel.setProperty("/Plant", userPlant);
		oWorkOrderDetailModel.setProperty("/Pmacttype", "001");
		oWorkOrderDetailModel.setProperty("/NotifNo", "");
		oWorkOrderDetailModel.setProperty("/Systcond", "");
		oWorkOrderDetailModel.setProperty("/Maintplant", "");
		oWorkOrderDetailModel.setProperty("/Planplant", userPlant);
		oWorkOrderDetailModel.setProperty("/DateCreated", new Date());
		oWorkOrderDetailModel.setProperty("/PlanStartDate", oReqStartDate);
		oWorkOrderDetailModel.setProperty("/PlanEndDate", oReqEndDate);
		oWorkOrderDetailModel.setProperty("/MalFunStartDate", new Date());
		oWorkOrderDetailModel.setProperty("/MalFunStartTime", oCurrentTime);
		oWorkOrderDetailModel.setProperty("/OrderStatus", "");
		oWorkOrderDetailModel.setProperty("/UserStatus", "INIT"); //nischal -- User Status is added
		oWorkOrderDetailModel.setProperty("/SetOrderStatus", "");
		oWorkOrderDetailModel.setProperty("/Breakdown", false);
		oWorkOrderDetailModel.setProperty("/Downtime", "0");
		oWorkOrderDetailModel.setProperty("/Damagecode", "");
		oWorkOrderDetailModel.setProperty("/Causecode", "");
		oWorkOrderDetailModel.setProperty("/DamageGroup", "");
		oWorkOrderDetailModel.setProperty("/CauseGroup", "");
		oWorkOrderDetailModel.setProperty("/SuperOrder", "");
		oWorkOrderDetailModel.setProperty("/HEADERTONOTIFNAV", []);
		oWorkOrderDetailModel.setProperty("/HEADERTOOPERATIONSNAV", []);
		oWorkOrderDetailModel.setProperty("/HEADERTOPARTNERNAV", headerPartner);
		oWorkOrderDetailModel.setProperty("/HEADERTOMESSAGENAV", headerMessage);

		oWorkOrderDetailViewModel.setProperty("/withNotificationCheck", false);
		oWorkOrderDetailViewModel.setProperty("/Activity", "");
		oWorkOrderDetailViewModel.setProperty("/MalFunStartTime", oCurrentTime);
		oWorkOrderDetailViewModel.setProperty("/operationComment", "");
		oWorkOrderDetailViewModel.setProperty("/headerDetails", true);
		oWorkOrderDetailViewModel.setProperty("/enableOperationComment", false);
		oWorkOrderDetailViewModel.setProperty("/enableOpCnfmLongText", false);
		oWorkOrderDetailViewModel.setProperty("/enableIssuePartBtn", false);
		oWorkOrderDetailViewModel.setProperty("/enableReturnPartBtn", false);
		oWorkOrderDetailViewModel.setProperty("/visibleOperationComment", true);
		oWorkOrderDetailViewModel.setProperty("/currentDate", new Date());
		oWorkOrderDetailViewModel.setProperty("/confirmOperations", []);
		oWorkOrderDetailViewModel.setProperty("/notifSearchVal", "");
		oWorkOrderDetailViewModel.setProperty("/aNotificationsSet", []);
		oWorkOrderDetailViewModel.setProperty("/selectedSpareParts", []);
		oWorkOrderDetailViewModel.setProperty("/aBOMsList", []);
		oWorkOrderDetailViewModel.setProperty("/aSearchMatList", []);
		oWorkOrderDetailViewModel.setProperty("/operationCommentDto", []);
		oWorkOrderDetailViewModel.setProperty("/listOperationCommentsDto", []);
		oWorkOrderDetailViewModel.setProperty("/materialQuantities", []);
		oWorkOrderDetailViewModel.setProperty("/isOperationsFiltered", true);
		oWorkOrderDetailViewModel.setProperty("/isPanelExpandable", false); //nischal -- property to store panel expandabel field
		var partNav = jQuery.extend(true, [], headerPartner);
		oWorkOrderDetailViewModel.setProperty("/HEADERTOPARTNERNAV", partNav);
		this.setCommentsVisibleLayout("WORK_ORDER_CMTS", oWorkOrderDetailViewModel);

		var userName = oUserDetailModel.getProperty("/userName");
		this.fnSetUserName(userName, oWorkOrderDetailModel, oWorkOrderDetailViewModel);
	},
	//Function to setRows For Cost Overview table
	setRowItemsforCostOverview: function (oWorkOrderDetailViewModel, aCostList) {
		var CosttblItems = [{
			"CatDesc": "External Services",
			"EstCost": aCostList[0].EstExtSer,
			"PlanCost": aCostList[0].PlaExtSer,
			"ActCost": aCostList[0].ActExtSer,
			"Cur": "EUR"
		}, {
			"CatDesc": "External Procurement",
			"EstCost": aCostList[0].EstExtPro,
			"PlanCost": aCostList[0].PlaExtPro,
			"ActCost": aCostList[0].ActExtPro,
			"Cur": "EUR"
		}, {
			"CatDesc": "Internal Activities",
			"EstCost": aCostList[0].EstIntAct,
			"PlanCost": aCostList[0].PlaIntAct,
			"ActCost": aCostList[0].ActIntAct,
			"Cur": "EUR"
		}, {
			"CatDesc": "Stock material",
			"EstCost": aCostList[0].EstStoMat,
			"PlanCost": aCostList[0].PlaStoMat,
			"ActCost": aCostList[0].ActStoMat,
			"Cur": "EUR"
		}, {
			"CatDesc": "Total Cost",
			"EstCost": aCostList[0].TotalEstCost,
			"PlanCost": aCostList[0].TotalPlanCost,
			"ActCost": aCostList[0].TotalActCost,
			"Cur": "EUR"
		}];
		oWorkOrderDetailViewModel.setProperty("/CostTBl", CosttblItems);

	},
	//Function to set visible/enable of comments section [View: WorkOrder Detail]
	setCommentsVisibleLayout: function (oEvent, oWorkOrderDetailViewModel) {
		var oSelctedBtn = "";
		if (oEvent === "WORK_ORDER_CMTS") {
			oSelctedBtn = oEvent;
		} else {
			oSelctedBtn = oEvent.getSource().getSelectedKey();
		}
		if (oSelctedBtn === "OPERATIONS_CMTS") {
			oWorkOrderDetailViewModel.setProperty("/isWordOrderCommentVisible", false);
			oWorkOrderDetailViewModel.setProperty("/isOperationsCommentVisible", true);
		} else if (oSelctedBtn === "WORK_ORDER_CMTS") {
			oWorkOrderDetailViewModel.setProperty("/isWordOrderCommentVisible", true);
			oWorkOrderDetailViewModel.setProperty("/isOperationsCommentVisible", false);
		}
		oWorkOrderDetailViewModel.refresh();
	},
	//Function to set userName on fetching user details
	fnSetUserName: function (userName, oWorkOrderDetailModel, oWorkOrderDetailViewModel) {
		oWorkOrderDetailModel.setProperty("/ReportedBy", userName);
		//oWorkOrderDetailModel.setProperty("/HEADERTOPARTNERNAV/0/AssignedTo", userName);
		//oWorkOrderDetailViewModel.setProperty("/HEADERTOPARTNERNAV/0/AssignedTo", userName);
	},

	//FUnction to validate Header details sections of a WO
	fnValidateWODetails: function (oWorkOrderDetailModel, oController, navType) {
		var oErrorMsg = "";
		var oResourceModel = oController.oResourceModel;
		var orderType = oWorkOrderDetailModel.getProperty("/OrderType");
		if (!orderType) {

			oErrorMsg = oResourceModel.getText("SEL_ORDER_TYPE");
			return [true, oErrorMsg];
		}
		var shortDesc = oWorkOrderDetailModel.getProperty("/ShortText");
		if (!shortDesc) {
			oErrorMsg = oResourceModel.getText("ENTER_ORDER_SHORT_DESC");
			return [true, oErrorMsg];
		}
		var equipment = oWorkOrderDetailModel.getProperty("/Equipment");
		if (!equipment) {
			oErrorMsg = oResourceModel.getText("CREATE_SELECT_EQUIPMENT");
			return [true, oErrorMsg];
		}
		var functLoc = oWorkOrderDetailModel.getProperty("/FunctLoc");
		if (!functLoc) {
			oErrorMsg = oResourceModel.getText("ENTER_FUN_LOC");
			// oErrorMsg = "Please enter a Functional Location";
			return [true, oErrorMsg];
		}
		var assignedTo = oWorkOrderDetailModel.getProperty("/HEADERTOPARTNERNAV/0/AssignedTo");
		if (!assignedTo) {
			oErrorMsg = oResourceModel.getText("SEL_ASSIGNED_TO");
			// oErrorMsg = "Please select Assigned To";
			return [true, oErrorMsg];
		}
		var priority = oWorkOrderDetailModel.getProperty("/Priority");
		if (!priority) {
			oErrorMsg = oResourceModel.getText("SEL_PRIORITY");
			// oErrorMsg = "Please select a Priority";
			return [true, oErrorMsg];
		}
		var workCntr = oWorkOrderDetailModel.getProperty("/MnWkCtr");
		if (!workCntr) {
			oErrorMsg = oResourceModel.getText("SEL_WORK_CENTER");
			// oErrorMsg = "Please select an Work Center";
			return [true, oErrorMsg];
		}
		var planStartDate = oWorkOrderDetailModel.getProperty("/PlanStartDate");
		if (!planStartDate) {
			oErrorMsg = oResourceModel.getText("SEL_PLANNED_START_DATE");
			// oErrorMsg = "Please select Planned Start Date";
			return [true, oErrorMsg];
		}
		var planEndDate = oWorkOrderDetailModel.getProperty("/PlanEndDate");
		if (!planEndDate) {
			oErrorMsg = oResourceModel.getText("SEL_PLANNED_END_DATE");
			// oErrorMsg = "Please select Planned End Date";
			return [true, oErrorMsg];
		}

		if (navType === "WO_DETAIL_TECHO" || navType === "WO_DETAIL_OPERATION_FINAL_CONFIRM") {
			var breakDown = oWorkOrderDetailModel.getProperty("/Breakdown");
			if (breakDown) {
				var downTime = oWorkOrderDetailModel.getProperty("/Downtime");
				if (!downTime) {
					oErrorMsg = oResourceModel.getText("ENTER_BREAK_DOWN_DURATION");
					// oErrorMsg = "Please enter Breakdown duration";
					return [true, oErrorMsg];
				}
			}
		}

		var plangroup = oWorkOrderDetailModel.getProperty("/Plangroup");
		if (!plangroup) {
			oErrorMsg = oResourceModel.getText("SEL_PLANNER_GP");
			// oErrorMsg = "Please select Planner Group";
			return [true, oErrorMsg];
		}
		var reportedBy = oWorkOrderDetailModel.getProperty("/ReportedBy");
		if (!reportedBy) {
			oErrorMsg = oResourceModel.getText("SEL_REPORTED_BY");
			// oErrorMsg = "Please select Reported By";
			return [true, oErrorMsg];
		}
		return false;
	},

	//Function to check mandatory fields are filled on Create of Word Order [View: WorkOrder Detail]
	fnMandateDetailWOFields: function (oWorkOrderDetailModel, oController, navType) {
		var oErrorMsg = "";
		var oResourceModel = oController.oResourceModel;
		var bTVal = this.fnValidateWODetails(oWorkOrderDetailModel, oController, navType);
		if (bTVal === false) {
			var operations = oWorkOrderDetailModel.getProperty("/HEADERTOOPERATIONSNAV");
			var Materials = oWorkOrderDetailModel.getProperty("/HEADERTOCOMPONENTNAV");
			var bMVal = this.fnValidateMaterials(Materials);
			if (!operations || operations.length === 0) {
				oErrorMsg = oResourceModel.getText("ADD_OPERATION_TO_CREATE_WO");
				// oErrorMsg = "Please add an operation to create a Work Order";
				return [true, oErrorMsg];
			} else if (!bMVal) {
				oErrorMsg = oResourceModel.getText("ADD_SAP_ID_STOCK_MATERIAL");
				return [true, oErrorMsg];
			} else {
				if (navType === "WO_DETAIL_CREATE" || navType !== "WO_DETAIL_CREATE_EXIT" ||
					navType === "WO_DETAIL_UPDATE" || navType !== "WO_DETAIL_UPDATE_EXIT" ||
					navType === "WO_DETAIL_RELEASE" || navType === "WO_DETAIL_CREATE_NOTIF") {
					var bVal = this.fnValidateOperationsTbl(oWorkOrderDetailModel, oController);
					if (bVal[0] === false) {
						var spareParts = oWorkOrderDetailModel.getProperty("/HEADERTOCOMPONENTNAV");
						if (spareParts) {
							var spareBVal = this.fnValidateSparesTbl(oWorkOrderDetailModel, oController);
							return spareBVal;
						}
						return [false, ""];
					} else {
						return bVal;
					}
				} else {
					return [false, ""];
				}
			}
		} else {
			return bTVal;
		}
	},
	//Function to check SAPID if Category is L
	fnValidateMaterials: function (aMaterials) {
		var bFlag = true;
		if (aMaterials !== undefined) {
			for (var i = 0; i < aMaterials.length; i++) {
				if (aMaterials[i].Material === "" && aMaterials[i].ItemCat === "L") {
					bFlag = false;
				}
			}
		}
		return bFlag;
	},

	//Function to check if mandatory fields are entered in Operartions table
	fnValidateOperationsTbl: function (oWorkOrderDetailModel, oController) {
		var operSTArr = [];
		var operations = oWorkOrderDetailModel.getProperty("/HEADERTOOPERATIONSNAV");
		for (var i = 0; i < operations.length; i++) {
			var currentOp = operations[i];
			var operId = currentOp.Activity;
			var shortDesc = currentOp.Description;
			if (!shortDesc) {
				operSTArr.push(operId);
			}
		}
		if (operSTArr.length > 0) {
			this.fnShowWarningOnOperUpdate(operSTArr, "SHORT_DESC", oController);
			return [true, ""];
		} else {
			return [false, ""];
		}
	},

	//Function to show warning  message on update of Operations
	fnShowWarningOnOperUpdate: function (operations, type, oController) {
		var message = "";
		var operationsId = "";
		var oResourceModel = oController.oResourceModel;
		if (operations.length === 1) {
			operationsId = operations.join("");
			if (type === "SHORT_DESC") {
				message = oResourceModel.getText("PROVIDE_SHORT_DESC_FOR_OPERATION") + operationsId;
				// message = "Please provide Short description for operation " + operationsId;
			} else if (type === "MY_WORK") {
				message = oResourceModel.getText("ENTER_MY_WORK_FOR_OPERATION ") + operationsId;
			} else if (type === "SYS_COND") {
				message = oResourceModel.getText("PROV_SHORT_SYS_FOR_OPERATION") + operationsId;
			}
		} else if (operations.length > 1) {
			operationsId = operations.join(", ");
			if (type === "SHORT_DESC") {
				message = oResourceModel.getText("PROVIDE_SHORT_DESC_FOR_OPERATION") + operationsId;
			} else if (type === "MY_WORK") {
				message = oResourceModel.getText("ENTER_MY_WORK_FOR_OPERATION") + operationsId;
			} else if (type === "SYS_COND") {
				message = oResourceModel.getText("PROV_SHORT_SYS_FOR_OPERATION") + operationsId;
			}
		}
		oController.showMessage(message);
	},

	//Function to check if Mandatory fields are entrered in Spare Parts table on Create
	fnValidateSparesTbl: function (oWorkOrderDetailModel, oController) {
		var oSpares = "";
		var operationIds = "";
		var oResourceModel = oController.oResourceModel;
		var spareParts = oWorkOrderDetailModel.getProperty("/HEADERTOCOMPONENTNAV");
		for (var i = 0; i < spareParts.length; i++) {
			var activity = spareParts[i].ActivityOperation;
			var materialId = spareParts[i].Material;
			if (!activity) {
				if (operationIds) {
					operationIds = operationIds + ", " + materialId;
				} else {
					operationIds = oResourceModel.getText("SEL_OPERATIONS_FOR_SP_WITH_SAPID") + materialId;
				}
			}
		}
		if (operationIds) {
			return [true, operationIds];
		}

		for (var j = 0; j < spareParts.length; j++) {
			var materialid = spareParts[j].Material;
			var reqQty = spareParts[j].RequirementQuantity;
			if (!reqQty) {
				if (oSpares) {
					oSpares = oSpares + ", " + materialid;
				} else {
					oSpares = oResourceModel.getText("ENTER_REQ_QTY_FOR_SP_WITH_SAPID") + materialid;
				}
			}
		}
		if (oSpares) {
			return [true, oSpares];
		} else {
			return [false, ""];
		}
	},

	//Function to enable WO detail fields during Create [View: WorkOrder Detail]
	fnEnableCreateWOFields: function (oWODetailFieldsModel) {
		oWODetailFieldsModel.setProperty("/orderType", true);
		oWODetailFieldsModel.setProperty("/equipment", true);
		oWODetailFieldsModel.setProperty("/orderShortDesc", true);
		oWODetailFieldsModel.setProperty("/assembly", true);
		oWODetailFieldsModel.setProperty("/assetId", true);
		oWODetailFieldsModel.setProperty("/workCenter", true);
		oWODetailFieldsModel.setProperty("/planStartDate", true);
		oWODetailFieldsModel.setProperty("/planEndDate", true);
		oWODetailFieldsModel.setProperty("/assignedTo", true);
		oWODetailFieldsModel.setProperty("/priority", true);
		oWODetailFieldsModel.setProperty("/plannerGrp", true);
		oWODetailFieldsModel.setProperty("/malFnStartDate", true);
		oWODetailFieldsModel.setProperty("/malFnStartTime", true);
		oWODetailFieldsModel.setProperty("/breakdown", true);
		oWODetailFieldsModel.setProperty("/damageCode", true);
		oWODetailFieldsModel.setProperty("/causeCode", true);
		oWODetailFieldsModel.setProperty("/workOrderComments", true);
		oWODetailFieldsModel.setProperty("fileUpload", true);
		oWODetailFieldsModel.setProperty("attachLink", true);
		oWODetailFieldsModel.setProperty("/releaseBtnVisible", false);
		oWODetailFieldsModel.setProperty("/tecoVisible", false);
		oWODetailFieldsModel.setProperty("/addTasksVisible", true);
		oWODetailFieldsModel.setProperty("/addNotificationVisible", true);
		oWODetailFieldsModel.refresh();
	},

	//Function to enable WO detail fields during Update [View: WorkOrder Detail]
	fnEnableUpdateWOFields: function (oWODetailFieldsModel, oWorkOrderDetailViewModel) {
		oWODetailFieldsModel.setProperty("/orderType", true);
		oWODetailFieldsModel.setProperty("/equipment", true);
		oWODetailFieldsModel.setProperty("/orderShortDesc", true);
		oWODetailFieldsModel.setProperty("/assembly", true);
		oWODetailFieldsModel.setProperty("/assetId", true);
		oWODetailFieldsModel.setProperty("/workCenter", true);
		oWODetailFieldsModel.setProperty("/planStartDate", true);
		oWODetailFieldsModel.setProperty("/planEndDate", true);
		oWODetailFieldsModel.setProperty("/assignedTo", true);
		oWODetailFieldsModel.setProperty("/priority", true);
		oWODetailFieldsModel.setProperty("/plannerGrp", true);
		oWODetailFieldsModel.setProperty("/malFnStartDate", true);
		oWODetailFieldsModel.setProperty("/malFnStartTime", true);
		oWODetailFieldsModel.setProperty("/breakdown", true);
		oWODetailFieldsModel.setProperty("/damageCode", true);
		oWODetailFieldsModel.setProperty("/causeCode", true);
		oWODetailFieldsModel.setProperty("/workOrderComments", true);
		oWODetailFieldsModel.setProperty("fileUpload", true);
		oWODetailFieldsModel.setProperty("attachLink", true);
		oWODetailFieldsModel.setProperty("/releaseBtnVisible", true);
		oWODetailFieldsModel.setProperty("/tecoVisible", false);
		oWODetailFieldsModel.setProperty("/addTasksVisible", true);
		oWODetailFieldsModel.setProperty("/addNotificationVisible", true);
		oWODetailFieldsModel.refresh();
	},

	//Function to enable WO detail fields during Release [View: WorkOrder Detail]
	fnEnableReleaseWOFields: function (oWODetailFieldsModel, oWorkOrderDetailViewModel) {
		oWODetailFieldsModel.setProperty("/orderType", true);
		oWODetailFieldsModel.setProperty("/equipment", true);
		oWODetailFieldsModel.setProperty("/orderShortDesc", true);
		oWODetailFieldsModel.setProperty("/assembly", true);
		oWODetailFieldsModel.setProperty("/assetId", true);
		oWODetailFieldsModel.setProperty("/workCenter", true);
		oWODetailFieldsModel.setProperty("/planStartDate", true);
		oWODetailFieldsModel.setProperty("/planEndDate", true);
		oWODetailFieldsModel.setProperty("/assignedTo", true);
		oWODetailFieldsModel.setProperty("/priority", true);
		oWODetailFieldsModel.setProperty("/plannerGrp", true);
		oWODetailFieldsModel.setProperty("/malFnStartDate", true);
		oWODetailFieldsModel.setProperty("/malFnStartTime", true);
		oWODetailFieldsModel.setProperty("/breakdown", true);
		oWODetailFieldsModel.setProperty("/damageCode", true);
		oWODetailFieldsModel.setProperty("/causeCode", true);
		oWODetailFieldsModel.setProperty("/workOrderComments", false);
		oWODetailFieldsModel.setProperty("fileUpload", true);
		oWODetailFieldsModel.setProperty("attachLink", true);
		oWODetailFieldsModel.setProperty("/releaseBtnVisible", false);
		oWODetailFieldsModel.setProperty("/tecoVisible", true);
		oWODetailFieldsModel.setProperty("/addTasksVisible", false);
		oWODetailFieldsModel.setProperty("/addNotificationVisible", true);
		oWODetailFieldsModel.refresh();

		oWorkOrderDetailViewModel.setProperty("/createVisible", false);
		oWorkOrderDetailViewModel.setProperty("/createExitVisible", false);
		oWorkOrderDetailViewModel.setProperty("/updateVisible", true);
		oWorkOrderDetailViewModel.setProperty("/updateExitVisible", true);
		oWorkOrderDetailViewModel.refresh();
	},

	//Function to enable WO detail fields during TECO [View: WorkOrder Detail]
	fnEnableTecoWOFields: function (oWODetailFieldsModel) {
		oWODetailFieldsModel.setProperty("/orderType", false);
		oWODetailFieldsModel.setProperty("/equipment", false);
		oWODetailFieldsModel.setProperty("/orderShortDesc", false);
		oWODetailFieldsModel.setProperty("/assembly", false);
		oWODetailFieldsModel.setProperty("/assetId", false);
		oWODetailFieldsModel.setProperty("/workCenter", false);
		oWODetailFieldsModel.setProperty("/planStartDate", false);
		oWODetailFieldsModel.setProperty("/planEndDate", false);
		oWODetailFieldsModel.setProperty("/assignedTo", false);
		oWODetailFieldsModel.setProperty("/priority", false);
		oWODetailFieldsModel.setProperty("/plannerGrp", false);
		oWODetailFieldsModel.setProperty("/malFnStartDate", false);
		oWODetailFieldsModel.setProperty("/malFnStartTime", false);
		oWODetailFieldsModel.setProperty("/breakdown", false);
		oWODetailFieldsModel.setProperty("/damageCode", false);
		oWODetailFieldsModel.setProperty("/causeCode", false);
		oWODetailFieldsModel.setProperty("/workOrderComments", false);
		oWODetailFieldsModel.setProperty("fileUpload", false);
		oWODetailFieldsModel.setProperty("attachLink", false);
		oWODetailFieldsModel.setProperty("/releaseBtnVisible", false);
		oWODetailFieldsModel.setProperty("/tecoVisible", false);
		oWODetailFieldsModel.setProperty("/addTasksVisible", false);
		oWODetailFieldsModel.setProperty("/addNotificationVisible", false);
		oWODetailFieldsModel.refresh();
	},

	//Function to format Date Object to String Date
	fnFormatDateObject: function (date) {
		var oDate = date;
		if (typeof (oDate) === "string") {
			oDate = oDate;
		} else {
			oDate = com.sap.incture.IMO_PM.formatter.formatter.fnDateConversion(oDate);
			oDate = oDate + "T00:00:00";
		}
		return oDate;
	},
	//Function to set/reset fields in Create Notification
	resetCreateNotificationFields: function (oNotificationDataModel, oNotificationViewModel, mLookupModel, oUserDetailModel) {
		var oNotifMsg = [{
			"Type": "",
			"Message": ""
		}];
		//nischal -- Starts
		var aItems = [{
			"ItemKey": "1",
			"ItemSortNo": "0001",
			"Descript": "",
			"DCodegrp": "",
			"DCode": "",
			"TxtObjptcd": "",
			"DlCodegrp": "",
			"DlCode": "",
			"TxtProbcd": ""
		}];

		// var aCause = [{
		// 	"CauseKey": "0001",
		// 	"CauseSortNo": "0001",
		// 	"ItemKey": "0001",
		// 	"Causetext": "",
		// 	"CauseCodegrp": "",
		// 	"CauseCode": "",
		// 	"ItemSortNo": "0001"
		// }];
		//nischal -- Ends
		var userName = oUserDetailModel.getProperty("/userName");
		var oCurrentTime = com.sap.incture.IMO_PM.formatter.formatter.formatCurrentTime(new Date());
		var userPlant = oUserDetailModel.getProperty("/userPlant");

		oNotificationDataModel.setData({});
		oNotificationDataModel.setProperty("/Notifid", "");
		oNotificationDataModel.setProperty("/NotifType", "");
		oNotificationDataModel.setProperty("/Orderid", "");
		oNotificationDataModel.setProperty("/Equipment", "");
		oNotificationDataModel.setProperty("/Assembly", "");
		oNotificationDataModel.setProperty("/FunctLoc", "");
		oNotificationDataModel.setProperty("/PlanPlant", userPlant);
		oNotificationDataModel.setProperty("/Maintplant", userPlant);
		oNotificationDataModel.setProperty("/Plangroup", "");
		oNotificationDataModel.setProperty("/Startdate", new Date());
		oNotificationDataModel.setProperty("/Enddate", new Date());
		oNotificationDataModel.setProperty("/ReqStartdate", new Date());
		// oNotificationDataModel.setProperty("/ReqEnddate", new Date("2020-12-20")); 
		oNotificationDataModel.setProperty("/ShortText", "");
		oNotificationDataModel.setProperty("/Breakdown", " ");
		oNotificationDataModel.setProperty("/BreakdownDur", "0");
		oNotificationDataModel.setProperty("/DamageCode", "");
		oNotificationDataModel.setProperty("/CauseCode", "");
		oNotificationDataModel.setProperty("/Notify", oNotifMsg);
		oNotificationDataModel.setProperty("/DamageCode", "");
		oNotificationDataModel.setProperty("/DamgeText", "");
		oNotificationDataModel.setProperty("/DamageGroup", "");
		oNotificationDataModel.setProperty("/ItemKey", "0001");
		oNotificationDataModel.setProperty("/ItemSortNo", "0001");
		oNotificationDataModel.setProperty("/CauseCode", "");
		oNotificationDataModel.setProperty("/CauseGroup", "");
		oNotificationDataModel.setProperty("/CauseText", "");
		oNotificationDataModel.setProperty("/Reportedby", userName);
		oNotificationDataModel.setProperty("/WorkCenter", ""); //nischal - workcenter previously was not there
		oNotificationDataModel.setProperty("/NavNoticreateToNotiItem", aItems); //nischal - Array to carry Item Objects
		// oNotificationDataModel.setProperty("/NavNoticreateToNotifcause", aCause); //nischal - Array to carry Cause Objects
		oNotificationDataModel.refresh();

		oNotificationViewModel.setProperty("/StartTime", oCurrentTime);
		oNotificationViewModel.setProperty("/EndTime", oCurrentTime);
		oNotificationViewModel.setProperty("/EqIdDes", "");
		oNotificationViewModel.setProperty("/TechId", "");
		oNotificationViewModel.refresh();

		mLookupModel.setProperty("/aEquipmentsList", []);
		mLookupModel.setProperty("/assignedToHardCode", "");
		mLookupModel.setProperty("/sRefnotif", ""); //SH: Clear reference notification field
		mLookupModel.refresh();
	},
	resetCreateNotificationFieldsNotifList: function (oNotificationDataModel, oNotificationViewModel, mLookupModel, oSelectedRow, oController) {
		if (!oSelectedRow) {
			oNotificationDataModel.setData({});
			oNotificationDataModel.refresh();
			return;
		}
		var oNotifMsg = [{
			"Type": "",
			"Message": ""
		}];
		mLookupModel.setProperty("/assignedToHardCode", "John Smith"); //nischal  ---  Hard Coded value for demo
		if (oSelectedRow.Downtime !== "" || oSelectedRow.DownTime !== undefined) {
			oSelectedRow.Downtime = parseFloat(oSelectedRow.Downtime);
			oSelectedRow.Downtime = oSelectedRow.Downtime.toString();
		}

		//Validation to pre-populate if dates are empty or recieved as 00000000
		var ReqStartdate = oSelectedRow.Reqstartdate;
		var ReqEnddate = oSelectedRow.Reqenddate;
		if ((ReqStartdate === "00000000" && ReqEnddate === "00000000") || (ReqStartdate === "" && ReqEnddate === "") || (ReqStartdate ===
				undefined && ReqEnddate === undefined)) {
			ReqStartdate = new Date();
			ReqEnddate = new Date();
		} else if (ReqStartdate === "00000000" || ReqStartdate === "" || ReqStartdate === undefined) {
			ReqStartdate = this.fnFormatUIDates(ReqEnddate);
			ReqEnddate = this.fnFormatUIDates(ReqEnddate);
		} else if (ReqEnddate === "00000000" || ReqEnddate === "" || ReqEnddate === undefined) {
			ReqStartdate = this.fnFormatUIDates(ReqStartdate);
			ReqEnddate = new Date();
		} else {
			ReqStartdate = this.fnFormatUIDates(ReqStartdate);
			ReqEnddate = this.fnFormatUIDates(ReqEnddate);
		}
		//Validation to pre-populate if dates are empty or recieved as 00000000
		var iAssemblyConv = parseInt(oSelectedRow.Assembly);
		var sAssembly = iAssemblyConv.toString();
		oNotificationDataModel.setData({});
		oNotificationDataModel.setProperty("/Notifid", oSelectedRow.NotifNo);
		oNotificationDataModel.setProperty("/NotifType", oSelectedRow.NotifType);
		oNotificationDataModel.setProperty("/Orderid", oSelectedRow.Orderid);
		oNotificationDataModel.setProperty("/Equipment", oSelectedRow.Equipment);
		oNotificationDataModel.setProperty("/Assembly", sAssembly); // Data type of assembly is changed
		oNotificationDataModel.setProperty("/FunctLoc", oSelectedRow.FunctLoc);
		oNotificationDataModel.setProperty("/PlanPlant", oSelectedRow.Planplant);
		oNotificationDataModel.setProperty("/Maintplant", oSelectedRow.Maintplant);
		oNotificationDataModel.setProperty("/Plangroup", oSelectedRow.Plangroup);
		oNotificationDataModel.setProperty("/Startdate", new Date(oSelectedRow.Strmlfndate));
		oNotificationDataModel.setProperty("/Enddate", new Date(oSelectedRow.Endmlfndate));
		oNotificationDataModel.setProperty("/ReqStartdate", ReqStartdate);
		oNotificationDataModel.setProperty("/ReqEnddate", ReqEnddate);
		oNotificationDataModel.setProperty("/Notif_date", new Date(oSelectedRow.NotifDate));
		oNotificationDataModel.setProperty("/ShortText", oSelectedRow.Descriptn); //nischal - Since short text is coming as empty from backend, Descriptn field is having short text value, Descriptn is assigned to short text
		oNotificationDataModel.setProperty("/Breakdown", oSelectedRow.Breakdown);
		oNotificationDataModel.setProperty("/BreakdownDur", oSelectedRow.Downtime);
		oNotificationDataModel.setProperty("/DamageCode", oSelectedRow.FECOD);
		oNotificationDataModel.setProperty("/CauseCode", oSelectedRow.URCOD);
		oNotificationDataModel.setProperty("/Reportedby", oSelectedRow.Reportedby);
		oNotificationDataModel.setProperty("/Longtext", oSelectedRow.LongText);
		oNotificationDataModel.setProperty("/Notify", oNotifMsg);
		oNotificationDataModel.setProperty("/ItemKey", "0001");
		oNotificationDataModel.setProperty("/ItemSortNo", "0001");
		oNotificationDataModel.setProperty("/Priority", oSelectedRow.Priority); //nischal - Priority is not defined in the model
		oNotificationDataModel.setProperty("/WorkCenter", oSelectedRow.WorkCntr); //nischal - WorkCenter was not defined
		// oNotificationDataModel.setProperty("/SysStatus", oSelectedRow.SysStatus); //nischal -- This feature is still not yet supported by post payload
		mLookupModel.setProperty("/SysStatus", oSelectedRow.SysStatus); //nischal - system status was not present
		mLookupModel.setProperty("/Userstatus", oSelectedRow.Userstatus); //nischal -- user status was not pesent
		oNotificationDataModel.refresh();
		// Malfunction Enddate verification
		// if (oSelectedRow.Endmlfndate.getFullYear() === 9999) {
		// 	oNotificationDataModel.setProperty("/Enddate", null);
		// }

		mLookupModel.setProperty("/sCatelogProf", oSelectedRow.Rbnr);
		// oController.fnFilterSlectedDamageGroup();
		// oController.fnFilterSlectedCauseGroup();
		oController.getEquipsAssmebly(oSelectedRow.Equipment);

		oController.getDamageGroupCode("", oSelectedRow.FECOD);
		oController.getCauseGroupCode("", oSelectedRow.URCOD);

		var strmlfntime = oSelectedRow.Strmlfntime.ms;
		var milliseconds = parseInt(strmlfntime, 10);
		var hours = Math.floor(milliseconds / 3600000);
		if (hours < 10) {
			hours = "0" + hours;
		}
		var minutes = Math.floor((milliseconds - (hours * 3600000)) / 60000);
		if (minutes < 10) {
			minutes = "0" + minutes;
		}
		if (hours === "00" && minutes === "00") {
			strmlfntime = "00:00";
		} else {
			strmlfntime = hours + ":" + minutes;
		}

		// If the malfunction end date is not present
		var endmlfntime = oSelectedRow.Endmlfntime.ms;
		if (endmlfntime !== 0) {
			var milliseconds = parseInt(endmlfntime, 10);
			var hours = Math.floor(milliseconds / 3600000);
			if (hours < 10) {
				hours = "0" + hours;
			}
			var minutes = Math.floor((milliseconds - (hours * 3600000)) / 60000);
			if (minutes < 10) {
				minutes = "0" + minutes;
			}
			if (hours === "00" && minutes === "00") {
				endmlfntime = "00:00";
			} else {
				endmlfntime = hours + ":" + minutes;
			}
		} else {
			endmlfntime = "";
		}

		if (oSelectedRow.Breakdown) {
			oNotificationViewModel.setProperty("/enableBreakDur", true);
		} else {
			oNotificationViewModel.setProperty("/enableBreakDur", false);
		}

		var longTextHistory = oNotificationDataModel.getProperty("/Longtext");
		longTextHistory = longTextHistory.split("* ----------------------------------------*");
		var aLongTextHistory = oSelectedRow.LongText.split("---------------------------------------- ");
		var aLatestLongText = aLongTextHistory[aLongTextHistory.length - 1];
		oNotificationViewModel.setProperty("/longTextHistory", longTextHistory);
		oNotificationViewModel.setProperty("/Longtext", aLatestLongText); // to update long text in notification detail view
		oNotificationViewModel.setProperty("/StartTime", strmlfntime);
		oNotificationViewModel.setProperty("/EndTime", endmlfntime);
		oNotificationViewModel.setProperty("/EqIdDes", "");
		oNotificationViewModel.setProperty("/TechId", "");
		oNotificationViewModel.setProperty("/BreakdownDur", oSelectedRow.Downtime);
		oNotificationViewModel.setProperty("/attachmentSet", []); //Sunanda for attachments in notifDetail
		oNotificationViewModel.refresh();

		mLookupModel.setProperty("/aEquipmentsList", []);
		mLookupModel.refresh();
	},

	//Function to check if mandatory fields are entered during Create Notification
	checkMandatoryFields: function (oNotificationDataModel, oNotificationViewModel, oResourceModel) {
		var oErrorMsg = "";
		//  validation Notif .
		var notifType = oNotificationDataModel.getProperty("/NotifType");
		if (!notifType) {
			// oErrorMsg = oResourceModel.getText("SEL_NOTIF_TYPE");
			oErrorMsg = "Please select Notification type";
			return [true, oErrorMsg];
		}
		//  validation function location .
		var oFunLocation = oNotificationDataModel.getProperty("/FunctLoc");
		if (!oFunLocation) {
			// oErrorMsg = oResourceModel.getText("SEL_NOTIF_TYPE");
			oErrorMsg = "Please select Function Location";
			return [true, oErrorMsg];
		}
		//  validation Equipment	
		var equipment = oNotificationDataModel.getProperty("/Equipment");
		if (!equipment) {
			// oErrorMsg = oResourceModel.getText("SEL_EQUIPMENT");
			oErrorMsg = "Please select an Equipment";
			return [true, oErrorMsg];
		}

		//  validation Priority	
		var OPriority = oNotificationDataModel.getProperty("/Priority");
		if (!OPriority) {
			// oErrorMsg = oResourceModel.getText("SEL_EQUIPMENT");
			oErrorMsg = "Please select an Priority";
			return [true, oErrorMsg];
		}
		//  validation planner Group
		var plannerGrp = oNotificationDataModel.getProperty("/Plangroup");
		if (!plannerGrp) {
			// oErrorMsg = oResourceModel.getText("SEL_PLANNER_GRP");
			oErrorMsg = "Please select Planner Group";
			return [true, oErrorMsg];
		}
		//  validation planning Plant
		var OPlantPlan = oNotificationDataModel.getProperty("/PlanPlant");
		if (!OPlantPlan) {
			// oErrorMsg = oResourceModel.getText("SEL_PLANNER_GRP");
			oErrorMsg = "Please select Planning Plant";
			return [true, oErrorMsg];
		}
		//  validation main WorkCenter 
		var OMianWorkCenter = oNotificationDataModel.getProperty("/WorkCenter");
		if (!OMianWorkCenter) {
			// oErrorMsg = oResourceModel.getText("SEL_PLANNER_GRP");
			oErrorMsg = "Please select Main Workcenter";
			return [true, oErrorMsg];
		}
		//  validation maintenance Plant
		var OMaintenancePlant = oNotificationDataModel.getProperty("/PlanPlant");
		if (!OMaintenancePlant) {
			// oErrorMsg = oResourceModel.getText("SEL_PLANNER_GRP");
			oErrorMsg = "Please select Main maintenance Plant";
			return [true, oErrorMsg];
		}

		var breakdown = oNotificationDataModel.getProperty("/Breakdown");
		if (breakdown === "X" || breakdown === true) {
			var malStartdate = oNotificationDataModel.getProperty("/Startdate");
			if (!malStartdate) {
				// oErrorMsg = oResourceModel.getText("SEL_MAL_STRT_DATE");
				oErrorMsg = "Please select Malfunction start date";
				return [true, oErrorMsg];
			}
			var malStartime = oNotificationViewModel.getProperty("/StartTime");
			if (!malStartime) {
				// oErrorMsg = oResourceModel.getText("SEL_MAL_STRT_TIME");
				oErrorMsg = "Please select Malfunction start time";
				return [true, oErrorMsg];
			}
			/*var malEndDate = oNotificationDataModel.getProperty("/Enddate");
			if (!malEndDate) {
				// oErrorMsg = oResourceModel.getText("SEL_MAL_END_DATE");
				oErrorMsg = "Please select Malfunction end date";
				return [true, oErrorMsg];
			}
			var malEndtime = oNotificationViewModel.getProperty("/EndTime");
			if (!malEndtime) {
				// oErrorMsg = oResourceModel.getText("SEL_MAL_STRT_TIME");
				oErrorMsg = "Please select Malfunction end time";
				return [true, oErrorMsg];
			}*/
		}
		//  validation Short Description
		var shortTxt = oNotificationDataModel.getProperty("/ShortText");
		if (!shortTxt) {
			// oErrorMsg = oResourceModel.getText("SEL_DESC");
			oErrorMsg = "Please enter Description";
			return [true, oErrorMsg];
		}
		//nischal - validation for Required End Date
		var reqEndDate = oNotificationDataModel.getProperty("/ReqEnddate");
		if (!reqEndDate) {
			oErrorMsg = "Please select Required End Date";
			return [true, oErrorMsg];
		}
		return [false];
	},
	//Function to Odata format dates to Date Object format
	fnFormatUIDates: function (date) {
		var oDate = "";
		var dd = date.substring(0, 4);
		var mm = date.substring(4, 6);
		var yy = date.substring(6, 8);
		oDate = new Date(dd + "-" + mm + "-" + yy);
		return oDate;
	},
	//Function to format data set for PM Compliance report based on Functional Location
	fnFormatPMComplianceFLRepData: function (oDataset) {
		oDataset.sort(function (obj1, obj2) {
			return obj1.YearMonth === obj2.YearMonth ? 0 : obj1.YearMonth < obj2.YearMonth ? -1 : 1;
		});
		return oDataset;
	},
	//Function to get Flattened Data set for PM Compliance report based on Functional Location
	getPMComplianceFlattenedDataset: function (oData, FlattenedDataset) {
		var measures = [];
		var obj = {
			name: "WO Percentage",
			value: "{WOCompPercntg}"
		};
		measures.push(obj);

		var dataset = {
			dimensions: [{
				name: "Functional Location",
				value: "{FnLoc}"
			}, {
				name: "Date",
				value: "{path:'YearMonth', formatter:'com.sap.incture.IMO_PM.formatter.formatter.formatUIDate'}"
			}],
			measures: measures,
			data: {
				path: "/"
			}
		};
		return new FlattenedDataset(dataset);
	},
	//Function to get Feed Items for PM Compliance report based on Functional Location
	getPMComplianceFeedItem: function (oVizFrame, oData, FeedItem) {
		var feedPrimaryValues = {
			uid: "valueAxis",
			type: "Measure",
			values: ["WO Percentage"]
		};
		feedPrimaryValues = new FeedItem(feedPrimaryValues);
		oVizFrame.addFeed(feedPrimaryValues);
		var feedAxisLabels = {
			uid: "categoryAxis",
			type: "Dimension",
			values: ["Date", "Functional Location"]
		};
		feedAxisLabels = new FeedItem(feedAxisLabels);
		oVizFrame.addFeed(feedAxisLabels);
	},
	//Function to validate mandatory fields for PM Compliance report based on FL	
	validateComplianceFLFields: function (oViewPropertyModel, oController) {
		var oResourceModel = oController.oResourceModel;
		var plant = oViewPropertyModel.getProperty("/pmCompliancePlant");
		if (plant === undefined || plant === "") {
			oController.showMessage(oResourceModel.getText("PLEASE_SELECT_PLANT"));
			return false;
		}
		var funcLoc = oViewPropertyModel.getProperty("/pmComplianceFunLoc");
		if (funcLoc === undefined || funcLoc === [] || funcLoc.length === 0) {
			oController.showMessage(oResourceModel.getText("SEL_ATLEAST_1_FL"));
			return false;
		} else if (funcLoc.length >= 6) {
			oController.showMessage("SEL_MAX_5_FL");
			return false;
		}
		var compliancOption = oViewPropertyModel.getProperty("/pmComplianceOptions");
		if (compliancOption === undefined || compliancOption === "") {
			oController.showMessage(oResourceModel.getText("SEL_COMPLIANCE_TYPE"));
			return false;
		}
		var datePeriod = oViewPropertyModel.getProperty("/pmComplianceTimeBucket");
		if (datePeriod === undefined || datePeriod === "") {
			oController.showMessage(oResourceModel.getText("SEL_DATE_PERIOD"));
			return false;
		}
		return true;
	},
	//Function to format data set for PM Compliance report data set based on WC
	fnFormatPMComplianceWCRepData: function (oDataset) {
		var oTempArr = [];
		oDataset.sort(function (obj1, obj2) {
			return obj1.YearMonth === obj2.YearMonth ? 0 : obj1.YearMonth < obj2.YearMonth ? -1 : 1;
		});
		var oDateSepArr = this.fnGroupSameDatePeriod(oDataset);
		for (var i = 0; i < oDateSepArr.length; i++) {
			var oTempObj = {};
			var sameDateObj = oDateSepArr[i];
			oTempObj.YearMonth = sameDateObj[0].YearMonth;
			for (var j = 0; j < sameDateObj.length; j++) {
				var key = sameDateObj[j].WorkCenter + "_" + sameDateObj[j].OrderType;
				oTempObj[key] = parseFloat(sameDateObj[j].WOCompPercntg);
			}
			oTempArr.push(oTempObj);
		}
		return oTempArr;
	},
	//Function to get flattened data set for PM Compliance report based on WC
	getPMComplianceWCFlattenedDataset: function (oData, FlattenedDataset) {
		var measures = [];
		var index = this.fnFindLargestArr(oData);
		var objKeys = Object.keys(oData[index]);
		objKeys.splice(0, 1);
		for (var i = 0; i < objKeys.length; i++) {
			var obj = {
				name: objKeys[i],
				value: "{" + objKeys[i] + "}"
			};
			measures.push(obj);
		}
		var dataset = {
			dimensions: [{
				name: "Date",
				value: "{path:'YearMonth', formatter:'com.sap.incture.IMO_PM.formatter.formatter.formatUIDate'}"
			}],
			measures: measures,
			data: {
				path: "/"
			}
		};
		return new FlattenedDataset(dataset);
	},
	//Function to get Feed Items for PM Compliance report based on WC
	getPMComplianceWCFeedItem: function (oVizFrame, oData, FeedItem) {
		var index = this.fnFindLargestArr(oData);
		var objKeys = Object.keys(oData[index]);
		objKeys.splice(0, 1);
		for (var i = 0; i < objKeys.length; i++) {
			var feedPrimaryValues = {
				uid: "valueAxis",
				type: "Measure",
				values: [objKeys[i]]
			};
			feedPrimaryValues = new FeedItem(feedPrimaryValues);
			oVizFrame.addFeed(feedPrimaryValues);
		}
		var feedAxisLabels = {
			uid: "categoryAxis",
			type: "Dimension",
			values: ["Date"]
		};
		feedAxisLabels = new FeedItem(feedAxisLabels);
		oVizFrame.addFeed(feedAxisLabels);
	},
	//Function to validate mandatory fields for PM Compliance report based on WC	
	validateComplianceWCFields: function (oViewPropertyModel, oController) {
		var oResourceModel = oController.oResourceModel;
		var plant = oViewPropertyModel.getProperty("/pmCompliancePlant");
		if (plant === undefined || plant === "") {
			oController.showMessage(oResourceModel.getText("PLEASE_SELECT_PLANT"));
			return false;
		}
		var workCenters = oViewPropertyModel.getProperty("/pmComplianceWCs");
		if (workCenters === undefined || workCenters === []) {
			oController.showMessage(oResourceModel.getText("SEL_ATLEAST_1_WC"));
			return false;
		}

		var orderTypes = oViewPropertyModel.getProperty("/pmComplianceOrders");
		if (orderTypes === undefined || orderTypes === []) {
			oController.showMessage(oResourceModel.getText("SEL_ATLEAST_1_ORDER_TYPE"));
			return false;
		}

		var workCenterslen = parseInt(workCenters.length, 10);
		var orderTypeslen = parseInt(orderTypes.length, 10);
		var count = workCenterslen * orderTypeslen;
		if (count >= 11) {
			oController.showMessage(oResourceModel.getText("SEL_WC_AND_OT_COMB_LESSTHAN_10"));
			return false;
		}

		var compliancOption = oViewPropertyModel.getProperty("/pmComplianceOptions");
		if (compliancOption === undefined || compliancOption === "") {
			oController.showMessage(oResourceModel.getText("SEL_COMPLIANCE_TYPE"));
			return false;
		}
		var datePeriod = oViewPropertyModel.getProperty("/pmComplianceTimeBucket");
		if (datePeriod === undefined || datePeriod === "") {
			oController.showMessage(oResourceModel.getText("SEL_DATE_PERIOD"));
			return false;
		}
		return true;
	},
	//Function to check for duplicate Func location
	fnCheckIfDuplicates: function (uniqueArray, currFuncLoc) {
		var bVal = false;
		uniqueArray.filter(function (obj) {
			var funcLoc = obj.Tplnr;
			if (funcLoc === currFuncLoc) {
				bVal = true;
			}
		});
		return bVal;
	},
	//Function to remvoe dulplicate Function locations values
	removeDuplicateFunLocs: function (aFuncLocSet) {
		var uniqueArray = [];
		for (var i = 0; i < aFuncLocSet.length; i++) {
			var bVal = false;
			var currFuncLoc = aFuncLocSet[i].Tplnr;
			bVal = this.fnCheckIfDuplicates(uniqueArray, currFuncLoc);
			if (bVal === false) {
				uniqueArray.push(aFuncLocSet[i]);
			}
		}
		return uniqueArray;
	},
	//Function to check for duplicate Func location
	fnCheckIfDuplicatesEquip: function (uniqueArray, currEquip) {
		var bVal = false;
		uniqueArray.filter(function (obj) {
			var funcLoc = obj.Equnr;
			if (funcLoc === currEquip) {
				bVal = true;
			}
		});
		return bVal;
	},
	//Function to remvoe dulplicate Equipments values
	removeDuplicateEquipments: function (aFuncLocSet) {
		var uniqueArray = [];
		for (var i = 0; i < aFuncLocSet.length; i++) {
			var bVal = false;
			var currEquip = aFuncLocSet[i].Equnr;
			bVal = this.fnCheckIfDuplicatesEquip(uniqueArray, currEquip);
			if (bVal === false) {
				uniqueArray.push(aFuncLocSet[i]);
			}
		}
		return uniqueArray;
	},
	//Function to get selected Functional locations Equipments
	getFuncLocEquipments: function (aEquipSet, mtrFunLoc) {
		var uniqueArray = [];
		aEquipSet.filter(function (obj) {
			var tempObj = {};
			var equip = obj.Tplnr;
			if (equip === mtrFunLoc) {
				tempObj.Equnr = obj.Equnr;
				tempObj.Eqktu = obj.Eqktu;
				tempObj.Tidnr = obj.Tidnr;
				uniqueArray.push(tempObj);
			}
		});
		return uniqueArray;
	},
	//Function to validate mandatory feilds on Search for Labour Hours Report
	fnValidateLabourHrRep: function (oViewPropertyModel, oController) {
		var oResourceModel = oController.oResourceModel;
		var labourHrPlant = oViewPropertyModel.getProperty("/labourHrPlant");
		var labourHrLeads = oViewPropertyModel.getProperty("/labourHrWorkTeamLeads");
		var labourHrDatePeriod = oViewPropertyModel.getProperty("/labourHrDatePeriod");
		var labourHrWorkCenter = oViewPropertyModel.getProperty("/labourHrWorkCenter");
		if (labourHrPlant === "") {
			oController.showMessage(oResourceModel.getText("PLEASE_SELECT_PLANT"));
			return false;
		}
		if (labourHrWorkCenter.length === 0) {
			oController.showMessage(oResourceModel.getText("SEL_ATLEAST_1_WC"));
			return false;
		}
		if (labourHrLeads.length === 0) {
			oController.showMessage(oResourceModel.getText("SEL_ATLEAST_1_TEAM_LEAD"));
			return false;
		}
		if (labourHrDatePeriod === "") {
			oController.showMessage(oResourceModel.getText("SEL_DATE_PERIOD"));
			return false;
		}
		return true;
	},
	//Function to format Planed Reactive report data set
	fnFormatPlanReactiveRepData: function (oDataset, datePeriod, workCenters) {
		var oTempArr = [];
		oDataset.sort(function (obj1, obj2) {
			return obj1.YearMonth === obj2.YearMonth ? 0 : obj1.YearMonth < obj2.YearMonth ? -1 : 1;
		});
		var oDateSepArr = this.fnGroupSameDatePeriod(oDataset);
		for (var i = 0; i < oDateSepArr.length; i++) {
			var oTempObj = {};
			var sameDateObj = oDateSepArr[i];
			oTempObj.YearMonth = sameDateObj[0].YearMonth;
			for (var j = 0; j < sameDateObj.length; j++) {
				oTempObj["WorkCenter" + j] = sameDateObj[j].WorkCenter;
				oTempObj["PlanWorkPercntge" + j] = parseFloat(sameDateObj[j].PlanWorkPercntge);
			}
			oTempArr.push(oTempObj);
		}
		return oTempArr;
	},
	//Function to check if same MonthYear exist in Planed Reactive report data set
	fnGroupSameDatePeriod: function (oDataset) {
		var oDateArr = [];
		for (var i = 0; i < oDataset.length; i++) {
			var oTemArr = [];
			var currDate = oDataset[i].YearMonth;
			var bVal = this.fnCheckIsDatePeriodExist(oDateArr, currDate);
			if (bVal[0] === true) {
				oTemArr.push(oDataset[i]);
				oDateArr.push(oTemArr);
			} else if (bVal[0] === false) {
				oDateArr[bVal[1]].push(oDataset[i]);
			}
		}
		return oDateArr;
	},
	//Function to check if same MonthYear exist in Planed Reactive report data set
	fnCheckIsDatePeriodExist: function (oDateArr, currDate) {
		for (var i = 0; i < oDateArr.length; i++) {
			var currArr = oDateArr[i];
			if (currArr[0].YearMonth === currDate) {
				return [false, i];
			}
		}
		return [true];
	},

	//Function to get Flattened Data set for Planned Reactive report
	getFlattenedDataset: function (oData, FlattenedDataset) {
		var measures = [];
		var oCurrObj = oData[0];
		if (oCurrObj.hasOwnProperty("WorkCenter0")) {
			var obj0 = {
				name: oCurrObj.WorkCenter0,
				value: "{PlanWorkPercntge0}"
			};
			measures.push(obj0);
		}
		if (oCurrObj.hasOwnProperty("WorkCenter1")) {
			var obj1 = {
				name: oCurrObj.WorkCenter1,
				value: "{PlanWorkPercntge1}"
			};
			measures.push(obj1);
		}
		if (oCurrObj.hasOwnProperty("WorkCenter2")) {
			var obj2 = {
				name: oCurrObj.WorkCenter2,
				value: "{PlanWorkPercntge2}"
			};
			measures.push(obj2);
		}
		if (oCurrObj.hasOwnProperty("WorkCenter3")) {
			var obj3 = {
				name: oCurrObj.WorkCenter3,
				value: "{PlanWorkPercntge3}"
			};
			measures.push(obj3);
		}
		if (oCurrObj.hasOwnProperty("WorkCenter4")) {
			var obj4 = {
				name: oCurrObj.WorkCenter4,
				value: "{PlanWorkPercntge4}"
			};
			measures.push(obj4);
		}

		var dataset = {
			dimensions: [{
				name: "Date",
				value: "{path:'YearMonth', formatter:'com.sap.incture.IMO_PM.formatter.formatter.formatUIDate'}"
			}],
			measures: measures,
			data: {
				path: "/"
			}
		};
		return new FlattenedDataset(dataset);
	},

	//Function to get Feed Items for Planned Reactive report
	getFeedItem: function (oVizFrame, oData, FeedItem) {
		var oCurrObj = oData[0];
		if (oCurrObj.hasOwnProperty("WorkCenter0")) {
			var feedPrimaryValues0 = {
				uid: "valueAxis",
				type: "Measure",
				values: [oCurrObj.WorkCenter0]
			};
			feedPrimaryValues0 = new FeedItem(feedPrimaryValues0);
			oVizFrame.addFeed(feedPrimaryValues0);
		}
		if (oCurrObj.hasOwnProperty("WorkCenter1")) {
			var feedPrimaryValues1 = {
				uid: "valueAxis",
				type: "Measure",
				values: [oCurrObj.WorkCenter1]
			};
			feedPrimaryValues1 = new FeedItem(feedPrimaryValues1);
			oVizFrame.addFeed(feedPrimaryValues1);
		}
		if (oCurrObj.hasOwnProperty("WorkCenter2")) {
			var feedPrimaryValues2 = {
				uid: "valueAxis",
				type: "Measure",
				values: [oCurrObj.WorkCenter2]
			};
			feedPrimaryValues2 = new FeedItem(feedPrimaryValues2);
			oVizFrame.addFeed(feedPrimaryValues2);
		}
		if (oCurrObj.hasOwnProperty("WorkCenter3")) {
			var feedPrimaryValues3 = {
				uid: "valueAxis",
				type: "Measure",
				values: [oCurrObj.WorkCenter3]
			};
			feedPrimaryValues3 = new FeedItem(feedPrimaryValues3);
			oVizFrame.addFeed(feedPrimaryValues3);
		}
		if (oCurrObj.hasOwnProperty("WorkCenter4")) {
			var feedPrimaryValues4 = {
				uid: "valueAxis",
				type: "Measure",
				values: [oCurrObj.WorkCenter4]
			};
			feedPrimaryValues4 = new FeedItem(feedPrimaryValues4);
			oVizFrame.addFeed(feedPrimaryValues4);
		}

		var feedAxisLabels = {
			uid: "categoryAxis",
			type: "Dimension",
			values: ["Date"]
		};
		feedAxisLabels = new FeedItem(feedAxisLabels);
		oVizFrame.addFeed(feedAxisLabels);
	},

	//Function to find the largest array in an array
	fnFindLargestArr: function (oDataSet) {
		var index = 0;
		var count = 0;
		for (var i = 0; i < oDataSet.length; i++) {
			var currObj = oDataSet[i];
			var length = Object.keys(currObj).length;
			if (length > count) {
				count = length;
				index = i;
			}
		}
		return index;
	},

	//Function to check if same Tech Lead in Labour Hour Report
	fnGroupSameTechLeads: function (oDataset) {
		var oTempArr = [];
		for (var i = 0; i < oDataset.length; i++) {
			var oTemArr = [];
			var currLead = oDataset[i].LeadName;
			var bVal = this.fnCheckIfTechLeadExist(oTempArr, currLead);
			if (bVal[0] === true) {
				oTemArr.push(oDataset[i]);
				oTempArr.push(oTemArr);
			} else if (bVal[0] === false) {
				oTempArr[bVal[1]].push(oDataset[i]);
			}
		}
		return oTempArr;
	},

	//Function to check if same MonthYear exist in Planed Reactive report data set
	fnCheckIfTechLeadExist: function (oTempArr, currLead) {
		for (var i = 0; i < oTempArr.length; i++) {
			var currArr = oTempArr[i];
			if (currArr[0].LeadName === currLead) {
				return [false, i];
			}
		}
		return [true];
	},

	//Function to format data set for Labour Hour Report
	fnFormatLbrHrRepData: function (oDataset) {
		var oTempArr = [];
		oDataset = this.fnGroupSameTechnicians(oDataset);
		for (var i = 0; i < oDataset.length; i++) {
			var oTempObj = {};
			var sameDateObj = oDataset[i];
			oTempObj.TechName = sameDateObj[0].TechName;
			for (var j = 0; j < sameDateObj.length; j++) {
				var currObj = sameDateObj[j];
				var key = currObj.OrderType;
				var woCount = key + "_WoCount";
				oTempObj[key] = parseFloat(currObj.TotalLabHr);
				oTempObj[woCount] = parseFloat(currObj.WoCount);
				oTempObj.LeadName = currObj.LeadName;
			}
			oTempArr.push(oTempObj);
		}
		return oTempArr;
	},

	//Function to array keys
	getLabHrArrayKeys: function (objKeys) {
		var keysArr = [];
		objKeys.filter(function (obj) {
			if (!obj.includes("TechName") && !obj.includes("LeadName") && !obj.includes("WoCount")) {
				keysArr.push(obj);
			}
		});
		return keysArr;
	},

	//Function to get Flattened Data set for Labour Hour Report
	getLbrHrFlattenedDataset: function (oData, FlattenedDataset) {
		var measures = [];
		for (var i = 0; i < oData.length; i++) {
			var currObj = (oData[i]);
			var objKeys = Object.keys(currObj);
			var keysArr = this.getLabHrArrayKeys(objKeys);
			for (var j = 0; j < keysArr.length; j++) {
				var obj = {
					name: keysArr[j],
					value: "{" + keysArr[j] + "}"
				};
				var bVal = this.fnCheckDuplicateWOStatuses(measures, keysArr[j]);
				if (bVal) {
					measures.push(obj);
				}
			}
		}

		var dataset = {
			dimensions: [{
				name: "Technician Name",
				value: "{TechName}"
			}, {
				name: "Lead Name",
				value: "{LeadName}"
			}],
			measures: measures,
			data: {
				path: "/"
			}
		};
		return [new FlattenedDataset(dataset), measures];
	},

	//Function to get Feed Items for Labour Hour Report
	getLbrHrFeedItem: function (oVizFrame, oData, FeedItem, measures) {
		var feedPrimaryValues = {
			uid: "valueAxis",
			type: "Measure",
			values: []
		};
		for (var j = 0; j < measures.length; j++) {
			feedPrimaryValues.values.push(measures[j].name);
		}
		feedPrimaryValues = new FeedItem(feedPrimaryValues);
		oVizFrame.addFeed(feedPrimaryValues);

		var feedAxisLabels = {
			uid: "categoryAxis",
			type: "Dimension",
			values: ["Lead Name", "Technician Name"]
		};
		feedAxisLabels = new FeedItem(feedAxisLabels);
		oVizFrame.addFeed(feedAxisLabels);
	},

	//Function to validate mandatory feilds on Search for MTR Report
	fnValidateMtrRep: function (oViewPropertyModel, oController) {
		var oResourceModel = oController.oResourceModel;
		var mtrPlant = oViewPropertyModel.getProperty("/mtrPlant");
		var mtrWorkCenter = oViewPropertyModel.getProperty("/mtrWorkCenter");
		var mtrFunLoc = oViewPropertyModel.getProperty("/mtrFunLoc");
		var mtrEquipments = oViewPropertyModel.getProperty("/mtrEquipments");
		var mtrDatePeriod = oViewPropertyModel.getProperty("/mtrDatePeriod");
		if (mtrPlant === "") {
			oController.showMessage(oResourceModel.getText("PLEASE_SELECT_PLANT"));
			return false;
		}
		if (mtrWorkCenter === "") {
			oController.showMessage(oResourceModel.getText("SEL_WC"));
			return false;
		}
		if (mtrFunLoc.length === 0) {
			/*oController.showMessage("Please select at least one Team Lead");
			return false;*/
		}
		if (mtrEquipments.length === 0) {
			oController.showMessage(oResourceModel.getText("SEL_ATLEAST_ONE_EQUIP"));
			return false;
		}
		if (mtrDatePeriod === 0) {
			oController.showMessage(oResourceModel.getText("SEL_DATE_PERIOD"));
			return false;
		}
		return true;
	},

	//Function to get Meant time repair dataset
	fnFormatMtrRepData: function (oDataset) {
		var oTempArr = [];
		oDataset.sort(function (obj1, obj2) {
			return obj1.YearMonth === obj2.YearMonth ? 0 : obj1.YearMonth < obj2.YearMonth ? -1 : 1;
		});
		var oDateSepArr = this.fnGroupSameDatePeriod(oDataset);
		for (var i = 0; i < oDateSepArr.length; i++) {
			var oTempObj = {};
			var sameDateObj = oDateSepArr[i];
			oTempObj.YearMonth = sameDateObj[0].YearMonth;
			for (var j = 0; j < sameDateObj.length; j++) {
				var key = sameDateObj[j].TechId;
				oTempObj[key] = parseFloat(sameDateObj[j].MeanTTR);
			}
			oTempArr.push(oTempObj);
		}
		return oTempArr;
	},

	//Function to get Flattened Data set for Mean time repair Report
	getMtrFlattenedDataset: function (oData, FlattenedDataset) {
		var keysArr = [];
		var measures = [];
		var index = this.fnFindLargestArr(oData);
		var objKeys = Object.keys(oData[index]);
		var objvalues = Object.values(oData[index])[1];
		objKeys.filter(function (obj) {
			if (!obj.includes("YearMonth")) {
				keysArr.push(obj);
			}
		});
		for (var j = 0; j < oData.length; j++) {
			for (var i = 0; i < keysArr.length; i++) {
				var obj = {
					name: keysArr[i],
					value: oData[j][keysArr[i]]
						// value: "{" + keysArr[i] + "}"
				};
				measures.push(obj);
			}
		}
		var dataset = {
			dimensions: [{
				name: "Date",
				value: "{path:'YearMonth', formatter:'com.sap.incture.IMO_PM.formatter.formatter.formatUIDate'}"
			}],
			measures: measures,
			data: {
				path: "/"
			}
		};
		return new FlattenedDataset(dataset);
		// return [new FlattenedDataset(dataset), measures];
	},

	//Function to get Feed Items for MTR Report
	// getMtrFeedItem: function (oVizFrame, oData, FeedItem, measures) {

	// 		var feedPrimaryValues = {
	// 			uid: "valueAxis",
	// 			type: "Measure",
	// 			values: []
	// 		};
	// 	for (var i = 0; i < measures.length; i++) {
	// 		feedPrimaryValues.values.push(measures[i].name);
	// 		}
	// 	feedPrimaryValues = new FeedItem(feedPrimaryValues);
	// 	oVizFrame.addFeed(feedPrimaryValues);

	// 	var feedAxisLabels = {
	// 		uid: "categoryAxis",
	// 		type: "Dimension",
	// 		values: ["Date"]
	// 	};
	// 	feedAxisLabels = new FeedItem(feedAxisLabels);
	// 	oVizFrame.addFeed(feedAxisLabels);
	// },
	getMtrFeedItem: function (oVizFrame, oData, FeedItem) {
		var keysArr = [];
		var index = this.fnFindLargestArr(oData);
		var objKeys = Object.keys(oData[index]);
		objKeys.filter(function (obj) {
			if (!obj.includes("YearMonth")) {
				keysArr.push(obj);
			}
		});
		for (var i = 0; i < keysArr.length; i++) {
			var feedPrimaryValues = {
				uid: "valueAxis",
				type: "Measure",
				values: [keysArr[i]]
			};
			feedPrimaryValues = new FeedItem(feedPrimaryValues);
			oVizFrame.addFeed(feedPrimaryValues);
		}

		var feedAxisLabels = {
			uid: "categoryAxis",
			type: "Dimension",
			values: ["Date"]
		};
		feedAxisLabels = new FeedItem(feedAxisLabels);
		oVizFrame.addFeed(feedAxisLabels);
	},

	//Function to validate mandatory feilds on Search for WO Status  Report
	fnValidateWOStatusRep: function (oViewPropertyModel, oController) {
		var oResourceModel = oController.oResourceModel;
		var woStatusPlant = oViewPropertyModel.getProperty("/woStatusPlant");
		var woStatusWorkCenter = oViewPropertyModel.getProperty("/woStatusWorkCenter");
		var woStatusWorkTeamLeads = oViewPropertyModel.getProperty("/woStatusWorkTeamLeads");
		var woStatusDatePeriod = oViewPropertyModel.getProperty("/woStatusDatePeriod");
		if (woStatusPlant === "") {
			oController.showMessage(oResourceModel.getText("PLEASE_SELECT_PLANT"));
			return false;
		}
		if (woStatusWorkCenter.length === 0) {
			oController.showMessage(oResourceModel.getText("SEL_ATLEAST_1_WC"));
			return false;
		}
		if (woStatusWorkTeamLeads.length === 0) {
			oController.showMessage(oResourceModel.getText("SEL_ATLEAST_1_TEAM_LEAD"));
			return false;
		}
		if (woStatusDatePeriod === "") {
			oController.showMessage(oResourceModel.getText("SEL_DATE_PERIOD"));
			return false;
		}
		return true;
	},

	//Function to get WO Status dataset
	fnFormatWOStatusRepData: function (oDataset) {
		var oTempArr = [];
		oDataset = this.fnGroupSameTechnicians(oDataset);
		for (var i = 0; i < oDataset.length; i++) {
			var oTempObj = {};
			var sameDateObj = oDataset[i];
			oTempObj.TechName = sameDateObj[0].TechName;
			for (var j = 0; j < sameDateObj.length; j++) {
				var currObj = sameDateObj[j];
				var key = currObj.WOStatus;
				oTempObj[key] = parseFloat(currObj.WoCount);
				oTempObj.LeadName = currObj.LeadName;
			}
			oTempArr.push(oTempObj);
		}
		return oTempArr;
	},

	//Function to group same Technician in WO Status Report
	fnGroupSameTechnicians: function (oDataset) {
		var oTempArr = [];
		for (var i = 0; i < oDataset.length; i++) {
			var oTemArr = [];
			var currLead = oDataset[i].TechName;
			var bVal = this.fnCheckIfTechniciansExist(oTempArr, currLead);
			if (bVal[0] === true) {
				oTemArr.push(oDataset[i]);
				oTempArr.push(oTemArr);
			} else if (bVal[0] === false) {
				oTempArr[bVal[1]].push(oDataset[i]);
			}
		}
		return oTempArr;
	},

	//Function to check if same Technician exist in WO Status Report
	fnCheckIfTechniciansExist: function (oTempArr, currLead) {
		for (var i = 0; i < oTempArr.length; i++) {
			var currArr = oTempArr[i];
			if (currArr[0].TechName === currLead) {
				return [false, i];
			}
		}
		return [true];
	},

	//Function to array keys
	getArrayKeys: function (objKeys) {
		var keysArr = [];
		objKeys.filter(function (obj) {
			if (!obj.includes("TechName") && !obj.includes("LeadName")) {
				keysArr.push(obj);
			}
		});
		return keysArr;
	},

	//Function to get Flattened Data set for WO Status Report
	getWOFlattenedDataset: function (oData, FlattenedDataset) {
		var measures = [];
		for (var i = 0; i < oData.length; i++) {
			var currObj = (oData[i]);
			var objKeys = Object.keys(currObj);
			var keysArr = this.getArrayKeys(objKeys);
			for (var j = 0; j < keysArr.length; j++) {
				var obj = {
					name: keysArr[j],
					value: "{" + keysArr[j] + "}"
				};
				var bVal = this.fnCheckDuplicateWOStatuses(measures, keysArr[j]);
				if (bVal) {
					measures.push(obj);
				}
			}
		}

		var dataset = {
			dimensions: [{
				name: "Technician Name",
				value: "{TechName}"
			}, {
				name: "Lead Name",
				value: "{LeadName}"
			}],
			measures: measures,
			data: {
				path: "/"
			}
		};
		return [new FlattenedDataset(dataset), measures];
	},

	//Function to get Feed Items for WO Status Report
	getWOFeedItem: function (oVizFrame, oData, FeedItem, measures) {
		var feedPrimaryValues = {
			uid: "valueAxis",
			type: "Measure",
			values: []
		};
		for (var j = 0; j < measures.length; j++) {
			feedPrimaryValues.values.push(measures[j].name);
		}
		feedPrimaryValues = new FeedItem(feedPrimaryValues);
		oVizFrame.addFeed(feedPrimaryValues);

		var feedAxisLabels = {
			uid: "categoryAxis",
			type: "Dimension",
			values: ["Lead Name", "Technician Name"]
		};
		feedAxisLabels = new FeedItem(feedAxisLabels);
		oVizFrame.addFeed(feedAxisLabels);
	},

	//Function to remvoe dulplicate WO statuses
	fnCheckDuplicateWOStatuses: function (measures, key) {
		for (var i = 0; i < measures.length; i++) {
			var currArr = measures[i];
			if (currArr.name === key) {
				return false;
			}
		}
		return true;
	},

	//Function to validate mandatory feilds on Search for Spare Cost Report
	fnValidateSpareCostRep: function (oViewPropertyModel, oController) {
		var oResourceModel = oController.oResourceModel;
		var spareCostPlant = oViewPropertyModel.getProperty("/spareCostPlant");
		var spareCostFuncLoc = oViewPropertyModel.getProperty("/spareCostFuncLoc");
		var spareCostEquipments = oViewPropertyModel.getProperty("/spareCostEquipments");
		var spareCostDatePeriod = oViewPropertyModel.getProperty("/spareCostDatePeriod");
		if (spareCostPlant === "") {
			oController.showMessage(oResourceModel.getText("PLEASE_SELECT_PLANT"));
			return false;
		}
		if (spareCostFuncLoc.length === 0) {
			oController.showMessage(oResourceModel.getText("SEL_ATLEAST_1_FL"));
			return false;
		}
		if (spareCostEquipments.length === 0) {
			oController.showMessage(oResourceModel.getText("SEL_ATLEAST_ONE_EQUIP"));
			return false;
		}
		if (spareCostDatePeriod === "") {
			oController.showMessage(oResourceModel.getText("SEL_DATE_PERIOD"));
			return false;
		}
		return true;
	},

	//Function to get Spare Part Cost dataset
	fnFormatSpareCostRepData: function (oDataset) {
		var oTempArr = [];
		oDataset = this.fnGroupSameEquipments(oDataset);
		for (var i = 0; i < oDataset.length; i++) {
			var oTempObj = {};
			var sameDateObj = oDataset[i];
			oTempObj.EquipId = sameDateObj[0].EquipId;
			oTempObj.TechId = sameDateObj[0].TechId;
			for (var j = 0; j < sameDateObj.length; j++) {
				var currObj = sameDateObj[j];
				oTempObj.Fnloc = currObj.Fnloc;
				oTempObj.SpareCost = parseFloat(currObj.SpareCost);
				oTempObj.LabrCost = parseFloat(currObj.LabrCost);
				oTempObj.SpareCount = parseFloat(currObj.SpareCount);
			}
			oTempArr.push(oTempObj);
		}
		return oTempArr;
	},

	//Function to group same Equipments in Spare Part Cost Report
	fnGroupSameEquipments: function (oDataset) {
		var oTempArr = [];
		for (var i = 0; i < oDataset.length; i++) {
			var oTemArr = [];
			var currEquipId = oDataset[i].EquipId;
			var bVal = this.fnCheckIfEqiupsExist(oTempArr, currEquipId);
			if (bVal[0] === true) {
				oTemArr.push(oDataset[i]);
				oTempArr.push(oTemArr);
			} else if (bVal[0] === false) {
				oTempArr[bVal[1]].push(oDataset[i]);
			}
		}
		return oTempArr;
	},

	//Function to check if same Equipments exist in Spare Part Cost Report
	fnCheckIfEqiupsExist: function (oTempArr, currEquipId) {
		for (var i = 0; i < oTempArr.length; i++) {
			var currArr = oTempArr[i];
			if (currArr.EquipId === currEquipId) {
				return [false, i];
			}
		}
		return [true];
	},

	//Function to get Flattened Data set for Spare Part Cost Report
	getSpareCostFlattenedDataset: function (oData, FlattenedDataset, currency) {
		var measures = [];
		measures.push({
			name: "Spare cost in " + currency,
			value: "{SpareCost}"
		});
		measures.push({
			name: "Labour cost in " + currency,
			value: "{LabrCost}"
		});

		var dataset = {
			dimensions: [{
				name: "Technical Id",
				value: "{TechId}"
			}, {
				name: "Functional Location",
				value: "{Fnloc}"
			}],
			measures: measures,
			data: {
				path: "/"
			}
		};
		return [new FlattenedDataset(dataset), measures];
	},

	//Function to get Feed Items for Spare Part Cost Report
	getSpareCostFeedItem: function (oVizFrame, oData, FeedItem, measures) {
		var feedPrimaryValues = {
			uid: "valueAxis",
			type: "Measure",
			values: []
		};
		for (var j = 0; j < measures.length; j++) {
			feedPrimaryValues.values.push(measures[j].name);
		}
		feedPrimaryValues = new FeedItem(feedPrimaryValues);
		oVizFrame.addFeed(feedPrimaryValues);

		var feedAxisLabels = {
			uid: "categoryAxis",
			type: "Dimension",
			values: ["Functional Location", "Technical Id"]
		};
		feedAxisLabels = new FeedItem(feedAxisLabels);
		oVizFrame.addFeed(feedAxisLabels);
	},
	// nischal -- function to Set Create Notification Payload from WorkOrderDetailModel
	fnSetPayLoadForCreateNotif: function (oWorkOrderDetailModel, oWorkOrderDetailViewModel, oController) {
		var sAssembly = oWorkOrderDetailModel.getProperty("/Assembly");
		var sBreakdown = oWorkOrderDetailModel.getProperty("/Breakdown");
		var sNotifType;
		if (sBreakdown == true) {
			sBreakdown = "X";
			sNotifType = "M2";
		} else {
			sBreakdown = " ";
			sNotifType = "M1";
		}
		var sBreakdownDur = oWorkOrderDetailModel.getProperty("/Downtime");
		// var sCauseCode = oWorkOrderDetailModel.getProperty("/");
		// var sCauseGroup = oWorkOrderDetailModel.getProperty("/");
		// var sCauseText = oWorkOrderDetailModel.getProperty("/");
		// var sDamageCode = oWorkOrderDetailModel.getProperty("/");
		// var sDamageGroup = oWorkOrderDetailModel.getProperty("/");

		var sEquipment = oWorkOrderDetailModel.getProperty("/Equipment");
		var sFunctLoc = oWorkOrderDetailModel.getProperty("/FunctLoc");
		// var sNotifType = oWorkOrderDetailModel.getProperty("/");

		// var sNotifId = oWorkOrderDetailModel.getProperty("/");
		var sPlanPlant = oWorkOrderDetailModel.getProperty("/Planplant");
		var sPlanGroup = oWorkOrderDetailModel.getProperty("/Plangroup");
		var sPriority = oWorkOrderDetailModel.getProperty("/Priority");
		var sReportedby = oWorkOrderDetailModel.getProperty("/ReportedBy");

		var sShortText = oWorkOrderDetailModel.getProperty("/ShortText");
		var sWorkCenter = oWorkOrderDetailModel.getProperty("/MnWkCtr");

		var oStartDate = new Date();
		var sStartdate = this.formatDateobjToString(oStartDate, true);

		var oEnddate = new Date();
		var sEnddate = this.formatDateobjToString(oEnddate, true);

		var oNotifDate = new Date();
		var sNotifDate = this.formatDateobjToString(oNotifDate, true);

		var oReqEndDate = oWorkOrderDetailModel.getProperty("/PlanEndDate");
		var sReqEndDate = this.formatDateobjToString(oReqEndDate, true);

		var oReqStartDate = oWorkOrderDetailModel.getProperty("/PlanStartDate");
		var sReqStartDate = this.formatDateobjToString(oReqStartDate, true);

		var oObj = {
			"Assembly": sAssembly,
			"Breakdown": sBreakdown,
			"BreakdownDur": sBreakdownDur,
			"CauseCode": "",
			"CauseGroup": "",
			"CauseText": "",
			"DamageCode": "",
			"DamageGroup": "",
			"DamgeText": "",
			"Enddate": sEnddate,
			"Equipment": sEquipment,
			"FunctLoc": sFunctLoc,
			"ItemKey": "0001",
			"ItemSortNo": "0001",
			"Longtext": "",
			"NotifType": sNotifType,
			"Notif_date": sNotifDate,
			"Notifid": "",
			"Notify": [{
				"Type": "",
				"Message": ""

			}],
			"Orderid": "",
			"PlanPlant": sPlanPlant,
			"Plangroup": sPlanGroup,
			"Priority": sPriority,
			"Reportedby": sReportedby,
			"ReqEnddate": sReqEndDate,
			"ReqStartdate": sReqStartDate,
			"ShortText": sShortText,
			"Startdate": sStartdate,
			"Type": "CREATE",
			"WorkCenter": sWorkCenter
		};
		oWorkOrderDetailViewModel.setProperty("/oNotifPayLoad", oObj);
	},
	formatDateobjToString: function (oDate, isTimeRequired) {
		if (typeof (oDate) === "string") {
			return oDate;
		}

		var dd = oDate.getDate();
		var MM = oDate.getMonth() + 1;
		var yy = oDate.getFullYear();
		var hh = oDate.getHours();
		var mm = oDate.getMinutes();
		if (dd < 10) {
			dd = "0" + dd;
		}
		if (MM < 10) {
			MM = "0" + MM;
		}

		if (isTimeRequired) {
			if (hh < 10) {
				hh = "0" + hh;
			}
			if (mm < 10) {
				mm = "0" + mm;
			}
		} else {
			hh = "00";
			mm = "00";
		}
		var newDate = yy + "-" + MM + "-" + dd;
		newDate = newDate + "T" + hh + ":" + mm + ":00";
		return newDate;
	},
	fetchDataToWOPayload: function (sData, mLookupModel, oNotificationDataModel, oNotificationViewModel, oController) {
		var oNotifData = oNotificationDataModel.getData();
		var iNotifId = parseInt(sData.Notifid, 10);
		var sNotifId = iNotifId.toString();
		var sAssembly = sData.Assembly;
		var sBreakdown = sData.Breakdown;
		if (sBreakdown === "X") {
			sBreakdown = true;
		} else {
			sBreakdown = false;
		}
		var sBreakdownDur = sData.BreakdownDur;
		var sEnddate = sData.Enddate;
		var sEquipment = sData.Equipment;
		var sFunctLoc = sData.FunctLoc;
		var sNotifType = sData.NotifType;
		// var Notif_date = oNotificationDataModel.getProperty("/Notif_date");
		var sPlanPlant = sData.PlanPlant;
		var sPlangroup = sData.Plangroup;
		var sPriority = sData.Priority;
		var sReportedby = sData.Reportedby;
		var sReqEnddate = sData.ReqEnddate;
		var sReqStartdate = sData.ReqStartdate;
		var sShortText = sData.ShortText;
		var sStartdate = sData.Startdate;
		var sWorkCenter = sData.WorkCenter;
		var sOrderType = mLookupModel.getProperty("/sOrderTypeSel");
		var sStartdate = this.formatDateobjToString(oNotifData.Startdate, true);

		var sEnddate = oNotifData.Enddate;
		if (sEnddate) {
			sEnddate = this.formatDateobjToString(oNotifData.Enddate, true);
		}
		var sReqStartdate = this.formatDateobjToString(oNotifData.ReqStartdate);
		var sReqEnddate = this.formatDateobjToString(oNotifData.ReqEnddate);
		var sNotif_date = this.formatDateobjToString(new Date());
		var oObj = {
			"Assembly": sAssembly,
			"Breakdown": sBreakdown,
			"CauseGroup": "",
			"Causecode": "",
			"DamageGroup": "",
			"Damagecode": "",
			"DateCreated": sNotif_date,
			"Downtime": "0",
			"EquipDesc": "500KVA DG SET",
			"Equipment": sEquipment,
			"FunctLoc": sFunctLoc,
			"HEADERTOMESSAGENAV": [{
				"Message": "",
				"Status": ""
			}],
			"HEADERTONOTIFNAV": [{
				"Breakdown": sBreakdown,
				"Desenddate": sReqEnddate,
				"Desstdate": sReqStartdate,
				"LongText": "",
				"NotifNo": sNotifId,
				"Reportedby": sReportedby,
				"ShortText": sShortText
			}],
			"HEADERTOOPERATIONSNAV": [{
				"Activity": "0010",
				"Acttype": "",
				"Assembly": "",
				"BusArea": "",
				"CalcKey": "",
				"CompletedOn": sNotif_date,
				"ControlKey": "PM01",
				"Description": sShortText,
				"Equipment": "",
				"LongText": "",
				"MatlGroup": "",
				"OperCode": "C",
				"Plant": sPlanPlant,
				"ProfitCtr": "",
				"PurGroup": "",
				"PurchOrg": "",
				"SubActivity": "",
				"Systcond": "",
				"T": "",
				"VendorNo": "",
				"WbsElem": "",
				"WorkCntr": "ELECT001",
				"systemstatustext": ""
			}],
			"HEADERTOPARTNERNAV": [{
				"AssignedTo": "00000125",
				"Orderid": "",
				"PARTNERNAV": "C",
				"PARTNEROLD": ""
			}],
			"Maintplant": "",
			"MalFunStartDate": sNotif_date,
			"MalFunStartTime": "PT09H48M51S",
			"MnWkCtr": sWorkCenter,
			"NotifNo": "",
			"OrderStatus": "",
			"OrderType": sOrderType,
			"PlanEndDate": sReqEnddate,
			"PlanStartDate": sReqStartdate,
			"Plangroup": sPlangroup,
			"Planplant": sPlanPlant,
			"Plant": sPlanPlant,
			"Pmacttype": "001",
			"Priority": sPriority,
			"ReportedBy": sReportedby,
			"ShortText": sShortText,
			"SuperOrder": "",
			"Systcond": ""

		};
		oNotificationViewModel.setProperty("/oPayLoadWO", oObj);

	},
	fetchPurchanseReqNo: function (sVal) {
		if (sVal.length > 0) {
			for (var i = 0; i < sVal.length; i++) {
				if (sVal[i].PreqNo) {
					return sVal[i].PreqNo;
				}
			}
			return "";
		} else {
			return "";
		}
	},
	fetchReservNo: function (sVal) {
		if (sVal.length > 0) {
			return sVal[0].ReservNo;
		} else {
			return "";
		}
	}

};